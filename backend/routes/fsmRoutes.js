const express = require('express');
const router = express.Router();
const AuthFSM = require('../fsm/AuthFSM');
const {
  FSM_STATES,
  FSM_EVENTS,
  STATE_METADATA,
  TRANSITION_TABLE,
  FLAT_REGEX_PATTERNS,
} = require('../fsm/fsmDefinitions');
const FsmStateHistory = require('../models/FsmStateHistory');

/**
 * GET /api/fsm/definition
 * Returns the formal FLAT mathematical specification: M = (Q, Σ, δ, q0, F)
 */
router.get('/definition', (req, res) => {
  return res.json({
    success: true,
    formalModel: {
      title: 'Deterministic Finite Automaton (DFA) for Secure Authentication',
      mathematicalTuple: 'M = (Q, Σ, δ, q0, F)',
      description:
        'A formal state automaton controlling user authentication lifecycle, session provisioning, lockout enforcement, and termination.',
      Q: Object.values(FSM_STATES),
      statesMetadata: STATE_METADATA,
      Sigma: Object.values(FSM_EVENTS),
      delta: TRANSITION_TABLE,
      q0: 'LOGGED_OUT',
      F: ['ACTIVE_SESSION'],
    },
    regexGrammars: FLAT_REGEX_PATTERNS,
  });
});

/**
 * POST /api/fsm/simulate
 * Simulates a transition δ(currentState, event) using the real AuthFSM engine
 * Demonstrates valid transitions vs rejected invalid transitions
 */
router.post('/simulate', async (req, res) => {
  const { currentState, event, metadata = {} } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!currentState || !event) {
    return res.status(400).json({
      success: false,
      message: 'Both currentState and event are required for FSM simulation.',
    });
  }

  const fsm = new AuthFSM(currentState);

  try {
    const result = fsm.transition(event, metadata);

    // Save simulation transition to database history
    await FsmStateHistory.create({
      userEmail: req.session?.user?.email || 'simulation-user',
      userId: req.session?.user?.id || null,
      fromState: currentState,
      toState: result.currentState,
      event,
      valid: true,
      reason: result.record.reason,
      source: 'SIMULATION',
      ipAddress: clientIp,
    });

    return res.json({
      success: true,
      valid: true,
      previousState: result.previousState,
      currentState: result.currentState,
      metadata: result.metadata,
      event,
      transitionMatrixEntry: `δ(${result.previousState}, ${event}) = ${result.currentState}`,
      history: fsm.getHistory(),
    });
  } catch (error) {
    // FLAT Rejection Enforced
    const details = error.details || {
      fromState: currentState,
      attemptedEvent: event,
      valid: false,
      reason: `Automata rejection: δ(${currentState}, ${event}) is undefined in transition table δ.`,
    };

    await FsmStateHistory.create({
      userEmail: req.session?.user?.email || 'simulation-user',
      userId: req.session?.user?.id || null,
      fromState: currentState,
      toState: null,
      event,
      valid: false,
      reason: details.reason,
      source: 'SIMULATION',
      ipAddress: clientIp,
    });

    return res.status(400).json({
      success: false,
      valid: false,
      code: error.code || 'FSM_TRANSITION_REJECTED',
      message: error.message,
      formalRejection: {
        currentState,
        attemptedEvent: event,
        validTransitionsFromCurrentState: TRANSITION_TABLE[currentState] || {},
        explanation: `Under FLAT rules, state '${currentState}' does not accept input '${event}'. Transition rejected by DFA language monitor.`,
      },
      history: fsm.getHistory(),
    });
  }
});

/**
 * GET /api/fsm/history
 * Returns global state transition history log
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const history = await FsmStateHistory.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ success: true, history });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/fsm/regex-test
 * Module 2: Regular Expression and Lexical Analysis Validation Tool
 */
router.post('/regex-test', (req, res) => {
  const { type, input } = req.body;
  if (!type || input === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Provide both pattern type (USERNAME, EMAIL, PASSWORD_COMPLEXITY) and test input.',
    });
  }

  const result = AuthFSM.testRegex(type, input);
  return res.json({ success: true, result });
});

module.exports = router;
