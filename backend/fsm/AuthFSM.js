const {
  FSM_STATES,
  FSM_EVENTS,
  STATE_METADATA,
  TRANSITION_TABLE,
  FLAT_REGEX_PATTERNS,
} = require('./fsmDefinitions');

/**
 * AuthFSM: Finite State Machine Implementation
 * Manages discrete state transitions for authentication lifecycles.
 */
class AuthFSM {
  constructor(initialState = FSM_STATES.S0, history = []) {
    this.currentState = initialState;
    this.history = Array.isArray(history) ? [...history] : [];
    if (this.history.length === 0) {
      this.history.push({
        fromState: null,
        toState: this.currentState,
        event: 'INITIALIZE',
        timestamp: new Date().toISOString(),
        valid: true,
        reason: 'FSM Initialized',
      });
    }
  }

  /**
   * Get current state identifier (e.g. S0, S1) and name
   */
  getState() {
    return {
      state: this.currentState,
      metadata: STATE_METADATA[this.currentState] || {},
    };
  }

  /**
   * Check if an event transition is valid from current state
   */
  canTransition(event) {
    const validNextState = TRANSITION_TABLE[this.currentState]?.[event];
    return Boolean(validNextState);
  }

  /**
   * Attempt transition δ(Current_State, Event) -> Next_State
   * Rejects invalid transitions with formal FLAT error details.
   */
  transition(event, metadata = {}) {
    const fromState = this.currentState;
    const validNextState = TRANSITION_TABLE[fromState]?.[event];

    if (!validNextState) {
      const errorRecord = {
        fromState,
        toState: null,
        attemptedEvent: event,
        timestamp: new Date().toISOString(),
        valid: false,
        reason: `INVALID TRANSITION: δ(${fromState}, ${event}) is undefined in Transition Table. Rejection enforced by FLAT validation rule.`,
        metadata,
      };

      this.history.push(errorRecord);

      const err = new Error(
        `Automata Rejection: State transition from '${fromState}' via event '${event}' is disallowed by the FSM grammar.`
      );
      err.code = 'FSM_TRANSITION_REJECTED';
      err.details = errorRecord;
      err.statusCode = 400;
      throw err;
    }

    // Apply valid state transition
    this.currentState = validNextState;

    const transitionRecord = {
      fromState,
      toState: validNextState,
      event,
      timestamp: new Date().toISOString(),
      valid: true,
      reason: `Valid transition: δ(${fromState}, ${event}) → ${validNextState}`,
      metadata,
    };

    this.history.push(transitionRecord);

    return {
      success: true,
      previousState: fromState,
      currentState: validNextState,
      event,
      metadata: STATE_METADATA[validNextState],
      record: transitionRecord,
    };
  }

  /**
   * Force reset to LOGGED_OUT (e.g., after session purge or admin unlock)
   */
  reset(reason = 'Reset to initial state') {
    const fromState = this.currentState;
    this.currentState = FSM_STATES.S0;
    const record = {
      fromState,
      toState: FSM_STATES.S0,
      event: FSM_EVENTS.ACKNOWLEDGE_RESET,
      timestamp: new Date().toISOString(),
      valid: true,
      reason,
    };
    this.history.push(record);
    return record;
  }

  /**
   * Return full transition audit log
   */
  getHistory() {
    return this.history;
  }

  /**
   * Static helper: Run Lexical Analysis regex test
   */
  static testRegex(type, inputString) {
    const patternDef = FLAT_REGEX_PATTERNS[type];
    if (!patternDef) {
      return { valid: false, error: 'Unknown regex pattern definition.' };
    }
    const isValid = patternDef.regex.test(inputString);
    return {
      type,
      input: inputString,
      isValid,
      pattern: patternDef.pattern,
      grammar: patternDef.grammar,
      description: patternDef.description,
    };
  }
}

module.exports = AuthFSM;
