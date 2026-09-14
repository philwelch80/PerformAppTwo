import { produce } from 'immer'
import { uid } from '../lib/id'
import { emptySessionData } from '../lib/taxonomy'
import { expandedFromPlan } from '../lib/seed'
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

function sessionAt(draft, path) {
  return locatePath(draft.plan, path).session
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
        draft.sessionBlocks = action.payload.sessionBlocks
        draft.expanded = expandedFromPlan(action.payload.plan)
        draft.selectedPath = null
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
        draft.exercises = draft.exercises.filter((e) => e.id !== action.id)
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
        session.data.groups.push({ id: uid('grp'), label: '', items: [] })
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
      case 'GROUP_SAVE_AS_BLOCK': {
        const session = sessionAt(draft, action.path)
        const group = session.data.groups.find((g) => g.id === action.groupId)
        draft.sessionBlocks.push({
          id: uid('sb'),
          name: action.name,
          items: JSON.parse(JSON.stringify(group.items)),
        })
        break
      }
      case 'SESSION_BLOCK_INSERT': {
        const session = sessionAt(draft, action.path)
        const block = draft.sessionBlocks.find((b) => b.id === action.sessionBlockId)
        if (!block) break
        session.data.groups.push({ id: uid('grp'), label: block.name, items: JSON.parse(JSON.stringify(block.items)) })
        break
      }
      case 'SESSION_BLOCK_DELETE': {
        draft.sessionBlocks = draft.sessionBlocks.filter((b) => b.id !== action.id)
        break
      }

      // conditioning
      case 'CONDITIONING_UPDATE': {
        const session = sessionAt(draft, action.path)
        session.data[action.field] = action.value
        break
      }

      // mobility
      case 'MOBILITY_ITEM_ADD': {
        const session = sessionAt(draft, action.path)
        session.data.items.push({ label: '', note: '' })
        break
      }
      case 'MOBILITY_ITEM_UPDATE': {
        const session = sessionAt(draft, action.path)
        session.data.items[action.index][action.field] = action.value
        break
      }
      case 'MOBILITY_ITEM_DELETE': {
        const session = sessionAt(draft, action.path)
        session.data.items.splice(action.index, 1)
        break
      }
      case 'MOBILITY_ITEMS_REORDER': {
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
