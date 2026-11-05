import { produce } from 'immer'
import { uid } from '../lib/id'
import { emptySessionData } from '../lib/taxonomy'
import { expandedFromPlan } from '../lib/seed'
import { isExerciseInUse } from '../lib/exercises'
import {
  getPhase,
  getSub,
  getBlock,
  getWeek,
  locatePath,
  resolveNode,
  deleteNode,
  cloneWeekWithFreshIds,
  moveWithinArray,
} from '../lib/planTree'

// A path either locates a session in the plan tree, or (for editing a saved
// session template from the Library) names a savedSessions entry directly.
function sessionAt(draft, path) {
  if (path.savedSessionId) return draft.savedSessions.find((s) => s.id === path.savedSessionId)
  return locatePath(draft.plan, path).session
}

// Whether a selection still has something to point at after a hydrate —
// checked only down to the deepest level the path actually names, so e.g. a
// phase-only selection isn't invalidated by a change deeper in the tree.
function pathResolves(plan, path) {
  const { phase, sub, block, week, session } = locatePath(plan, path)
  if (path.sessionId) return !!session
  if (path.weekId) return !!week
  if (path.blockId) return !!block
  if (path.subId) return !!sub
  if (path.phaseId) return !!phase
  return true
}

export function reducer(state, action) {
  return produce(state, (draft) => {
    switch (action.type) {
      // ---------------- Sync ----------------
      // Replaces the shared data fields with what another coach's browser
      // most recently saved. selectedPath/expanded stay local — each
      // viewer's tree navigation is their own, not something to sync.
      case 'HYDRATE': {
        draft.exercises = action.payload.exercises
        draft.plan = action.payload.plan
        draft.savedSessions = action.payload.savedSessions
        draft.exerciseGroups = action.payload.exerciseGroups

        // Add expand state for anything new (e.g. a week someone else just
        // added), but never touch this viewer's own expand/collapse choices.
        const freshExpanded = expandedFromPlan(action.payload.plan)
        for (const id in freshExpanded) {
          if (!(id in draft.expanded)) draft.expanded[id] = freshExpanded[id]
        }

        // selectedPath is this viewer's own navigation, not shared state —
        // only clear it if the node it names is actually gone.
        if (draft.selectedPath && !pathResolves(draft.plan, draft.selectedPath)) {
          draft.selectedPath = null
        }
        break
      }

      // ---------------- Exercise library ----------------
      case 'EXERCISE_ADD': {
        draft.exercises.push({ id: uid('ex'), ...action.payload })
        break
      }
      case 'EXERCISE_UPDATE': {
        const ex = draft.exercises.find((e) => e.id === action.id)
        if (ex) Object.assign(ex, action.payload)
        break
      }
      case 'EXERCISE_DELETE': {
        if (isExerciseInUse(draft, action.id)) break
        draft.exercises = draft.exercises.filter((e) => e.id !== action.id)
        break
      }
      case 'EXERCISE_ARCHIVE': {
        const ex = draft.exercises.find((e) => e.id === action.id)
        if (ex) ex.archived = true
        break
      }
      case 'EXERCISE_RESTORE': {
        const ex = draft.exercises.find((e) => e.id === action.id)
        if (ex) ex.archived = false
        break
      }

      // ---------------- Selection / expansion ----------------
      case 'SELECT': {
        draft.selectedPath = action.path
        break
      }
      case 'TOGGLE_EXPAND': {
        draft.expanded[action.id] = !draft.expanded[action.id]
        break
      }

      // ---------------- Plan structure ----------------
      case 'PLAN_RENAME': {
        draft.plan.name = action.name
        break
      }
      case 'PHASE_ADD': {
        const phase = { id: uid('phase'), name: 'New Phase', subphases: [] }
        draft.plan.phases.push(phase)
        draft.expanded[phase.id] = true
        draft.selectedPath = { phaseId: phase.id }
        break
      }
      case 'SUB_ADD': {
        const phase = getPhase(draft.plan, action.phaseId)
        const sub = { id: uid('sub'), name: 'New Subphase', blocks: [] }
        phase.subphases.push(sub)
        draft.expanded[sub.id] = true
        draft.selectedPath = { phaseId: phase.id, subId: sub.id }
        break
      }
      case 'BLOCK_ADD': {
        const sub = getSub(getPhase(draft.plan, action.phaseId), action.subId)
        const block = { id: uid('block'), name: 'New Block', weeks: [] }
        sub.blocks.push(block)
        draft.expanded[block.id] = true
        draft.selectedPath = { phaseId: action.phaseId, subId: action.subId, blockId: block.id }
        break
      }
      case 'WEEK_ADD': {
        const block = getBlock(getSub(getPhase(draft.plan, action.phaseId), action.subId), action.blockId)
        const week = { id: uid('week'), name: `Week ${block.weeks.length + 1}`, focus: '', sessions: [] }
        block.weeks.push(week)
        draft.expanded[week.id] = true
        draft.selectedPath = { phaseId: action.phaseId, subId: action.subId, blockId: action.blockId, weekId: week.id }
        break
      }
      case 'WEEK_COPY': {
        const block = getBlock(getSub(getPhase(draft.plan, action.phaseId), action.subId), action.blockId)
        const week = getWeek(block, action.weekId)
        const copy = cloneWeekWithFreshIds(week)
        copy.name = `${week.name} copy`
        const idx = block.weeks.findIndex((w) => w.id === week.id)
        block.weeks.splice(idx + 1, 0, copy)
        draft.expanded[copy.id] = true
        draft.selectedPath = { phaseId: action.phaseId, subId: action.subId, blockId: action.blockId, weekId: copy.id }
        break
      }
      case 'SESSION_ADD': {
        const week = getWeek(getBlock(getSub(getPhase(draft.plan, action.phaseId), action.subId), action.blockId), action.weekId)
        const session = { id: uid('sess'), name: 'New Session', type: 'strength', data: emptySessionData('strength') }
        week.sessions.push(session)
        draft.selectedPath = { ...action, sessionId: session.id }
        break
      }
      case 'SAVED_SESSION_INSERT': {
        const week = getWeek(getBlock(getSub(getPhase(draft.plan, action.phaseId), action.subId), action.blockId), action.weekId)
        const saved = draft.savedSessions.find((s) => s.id === action.savedSessionId)
        if (!saved) break
        const session = { id: uid('sess'), name: saved.name, type: saved.type, data: JSON.parse(JSON.stringify(saved.data)) }
        if (session.data.groups) session.data.groups.forEach((g) => { g.id = uid('grp') })
        week.sessions.push(session)
        draft.selectedPath = {
          phaseId: action.phaseId,
          subId: action.subId,
          blockId: action.blockId,
          weekId: action.weekId,
          sessionId: session.id,
        }
        break
      }
      case 'NODE_RENAME': {
        const node = resolveNode(draft.plan, action.kind, action.parts)
        if (node) node.name = action.name
        break
      }
      case 'NODE_DELETE': {
        deleteNode(draft.plan, action.kind, action.parts)
        const idKey = { phase: 'phaseId', sub: 'subId', block: 'blockId', week: 'weekId', session: 'sessionId' }[action.kind]
        const lastId = action.parts[action.parts.length - 1]
        if (draft.selectedPath && draft.selectedPath[idKey] === lastId) draft.selectedPath = null
        break
      }
      case 'WEEKS_REORDER': {
        const block = getBlock(getSub(getPhase(draft.plan, action.phaseId), action.subId), action.blockId)
        moveWithinArray(block.weeks, action.fromWeekId, action.toWeekId)
        break
      }
      case 'SESSIONS_REORDER': {
        const week = getWeek(getBlock(getSub(getPhase(draft.plan, action.phaseId), action.subId), action.blockId), action.weekId)
        moveWithinArray(week.sessions, action.fromSessionId, action.toSessionId)
        break
      }
      case 'WEEK_FOCUS_UPDATE': {
        const block = getBlock(getSub(getPhase(draft.plan, action.phaseId), action.subId), action.blockId)
        const week = getWeek(block, action.weekId)
        week.focus = action.focus
        break
      }

      // ---------------- Session builder ----------------
      case 'SESSION_RENAME': {
        const session = sessionAt(draft, action.path)
        if (session) session.name = action.name
        break
      }
      case 'SESSION_SET_TYPE': {
        const session = sessionAt(draft, action.path)
        if (session) {
          session.type = action.sessionType
          session.data = emptySessionData(action.sessionType)
        }
        break
      }

      // strength
      case 'GROUP_ADD': {
        const session = sessionAt(draft, action.path)
        session.data.groups.push({ id: uid('grp'), label: '', items: [], isSuperset: false })
        break
      }
      case 'GROUP_RENAME': {
        const session = sessionAt(draft, action.path)
        const group = session.data.groups.find((g) => g.id === action.groupId)
        if (group) group.label = action.label
        break
      }
      case 'GROUP_DELETE': {
        const session = sessionAt(draft, action.path)
        session.data.groups = session.data.groups.filter((g) => g.id !== action.groupId)
        break
      }
      case 'GROUP_ITEM_ADD': {
        const session = sessionAt(draft, action.path)
        const group = session.data.groups.find((g) => g.id === action.groupId)
        group.items.push({ exerciseId: action.exerciseId, sets: 3, reps: 10, startingWeight: '' })
        break
      }
      case 'GROUP_ITEM_UPDATE': {
        const session = sessionAt(draft, action.path)
        const group = session.data.groups.find((g) => g.id === action.groupId)
        group.items[action.itemIndex][action.field] = action.value
        break
      }
      case 'GROUP_ITEM_DELETE': {
        const session = sessionAt(draft, action.path)
        const group = session.data.groups.find((g) => g.id === action.groupId)
        group.items.splice(action.itemIndex, 1)
        break
      }
      case 'GROUP_SAVE_AS_GROUP': {
        const session = sessionAt(draft, action.path)
        const group = session.data.groups.find((g) => g.id === action.groupId)
        if (!group || group.items.length < 2) break
        draft.exerciseGroups.push({
          id: uid('xg'),
          name: action.name,
          items: JSON.parse(JSON.stringify(group.items)),
          tags: [],
          isSuperset: true,
        })
        break
      }
      case 'EXERCISE_GROUP_INSERT': {
        const session = sessionAt(draft, action.path)
        const exerciseGroup = draft.exerciseGroups.find((g) => g.id === action.exerciseGroupId)
        if (!exerciseGroup) break
        session.data.groups.push({
          id: uid('grp'),
          label: exerciseGroup.name,
          items: JSON.parse(JSON.stringify(exerciseGroup.items)),
          isSuperset: exerciseGroup.isSuperset,
        })
        break
      }
      case 'EXERCISE_GROUP_DELETE': {
        draft.exerciseGroups = draft.exerciseGroups.filter((g) => g.id !== action.id)
        break
      }
      case 'EXERCISE_GROUP_UPDATE': {
        const group = draft.exerciseGroups.find((g) => g.id === action.id)
        if (group) Object.assign(group, action.payload)
        break
      }
      case 'EXERCISE_GROUP_DUPLICATE': {
        const group = draft.exerciseGroups.find((g) => g.id === action.id)
        if (!group) break
        draft.exerciseGroups.push({ ...JSON.parse(JSON.stringify(group)), id: uid('xg'), name: `${group.name} copy` })
        break
      }
      case 'EXERCISE_GROUP_ITEM_ADD': {
        const group = draft.exerciseGroups.find((g) => g.id === action.id)
        group.items.push({ exerciseId: action.exerciseId, sets: 3, reps: 10, startingWeight: '' })
        break
      }
      case 'EXERCISE_GROUP_ITEM_UPDATE': {
        const group = draft.exerciseGroups.find((g) => g.id === action.id)
        group.items[action.itemIndex][action.field] = action.value
        break
      }
      case 'EXERCISE_GROUP_ITEM_DELETE': {
        const group = draft.exerciseGroups.find((g) => g.id === action.id)
        group.items.splice(action.itemIndex, 1)
        break
      }

      // conditioning
      case 'CONDITIONING_UPDATE': {
        const session = sessionAt(draft, action.path)
        session.data[action.field] = action.value
        break
      }

      // routines
      case 'ROUTINE_ITEM_ADD': {
        const session = sessionAt(draft, action.path)
        session.data.items.push({ label: '', note: '' })
        break
      }
      case 'ROUTINE_ITEM_UPDATE': {
        const session = sessionAt(draft, action.path)
        session.data.items[action.index][action.field] = action.value
        break
      }
      case 'ROUTINE_ITEM_DELETE': {
        const session = sessionAt(draft, action.path)
        session.data.items.splice(action.index, 1)
        break
      }
      case 'ROUTINE_ITEMS_REORDER': {
        const session = sessionAt(draft, action.path)
        const [moved] = session.data.items.splice(action.fromIndex, 1)
        session.data.items.splice(action.toIndex, 0, moved)
        break
      }

      // saved session templates
      case 'SESSION_SAVE_AS_TEMPLATE': {
        const session = sessionAt(draft, action.path)
        draft.savedSessions.push({
          id: uid('tpl'),
          name: action.name,
          type: session.type,
          data: JSON.parse(JSON.stringify(session.data)),
        })
        break
      }
      case 'SAVED_SESSION_DELETE': {
        draft.savedSessions = draft.savedSessions.filter((s) => s.id !== action.id)
        break
      }

      default:
        break
    }
  })
}
