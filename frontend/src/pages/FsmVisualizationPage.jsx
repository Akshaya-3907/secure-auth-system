import React, { useState, useEffect } from 'react';
import { fsmService } from '../services/api';
import {
  GitCommit,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Code,
  Layers,
  ArrowRight,
} from 'lucide-react';
import FsmGraph from '../components/FsmGraph';
import RegexValidator from '../components/RegexValidator';

export default function FsmVisualizationPage() {
  const [definition, setDefinition] = useState(null);
  const [simCurrentState, setSimCurrentState] = useState('LOGGED_OUT');
  const [simEvent, setSimEvent] = useState('SUBMIT_CREDENTIALS');
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);

  const fetchFsmData = async () => {
    try {
      const [defRes, histRes] = await Promise.all([
        fsmService.getDefinition(),
        fsmService.getHistory(30),
      ]);
      if (defRes.data?.formalModel) setDefinition(defRes.data.formalModel);
      if (histRes.data?.history) setHistory(histRes.data.history);
    } catch (err) {
      console.error('Failed to load FSM metadata:', err);
    }
  };

  useEffect(() => {
    fetchFsmData();
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    setSimResult(null);
    setSimError(null);

    try {
      const res = await fsmService.simulateTransition({
        currentState: simCurrentState,
        event: simEvent,
        metadata: { trigger: 'Manual FLAT Lab Simulator' },
      });

      if (res.data?.success) {
        setSimResult(res.data);
        setSimCurrentState(res.data.currentState);
        fetchFsmData();
      }
    } catch (err) {
      const errorData = err.response?.data || {};
      setSimError(errorData);
      fetchFsmData();
    } finally {
      setLoading(false);
    }
  };

  const handleResetSimulator = () => {
    setSimCurrentState('LOGGED_OUT');
    setSimEvent('SUBMIT_CREDENTIALS');
    setSimResult(null);
    setSimError(null);
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="cyber-card p-4 mb-4">
        <div className="d-flex align-items-center mb-2">
          <GitCommit size={26} className="text-cyan me-2" />
          <h3 className="fw-bold text-white mb-0">
            Formal Languages &amp; Automata Theory (FLAT) Laboratory
          </h3>
        </div>
        <p className="text-muted small mb-0">
          Deterministic Finite Automaton (DFA) state engine enforcing mathematical validity on authentication lifecycles.
        </p>
      </div>

      {/* Formal Definition 5-Tuple Card */}
      <div className="cyber-card cyber-card-purple p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <BookOpen size={18} className="text-purple me-2" />
            <h5 className="fw-bold text-white mb-0">Formal Mathematical Specification</h5>
          </div>
          <span className="badge bg-purple font-monospace" style={{ backgroundColor: '#7c3aed' }}>
            5-Tuple Definition
          </span>
        </div>
        <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 font-monospace">
          <div className="fs-5 text-cyan fw-bold mb-2">M = (Q, Σ, δ, q₀, F)</div>
          <div className="row g-2 text-muted small" style={{ fontSize: '0.8rem' }}>
            <div className="col-md-6">
              <strong className="text-white">Q (States):</strong> &#123; S0: LOGGED_OUT, S1: AUTHENTICATING, S2: AUTHENTICATED, S3: ACTIVE_SESSION, S4: FAILED_LOGIN, S5: ACCOUNT_LOCKED, S6: SESSION_EXPIRED, S7: LOGGED_OUT_SUCCESS &#125;
            </div>
            <div className="col-md-6">
              <strong className="text-white">Σ (Alphabet):</strong> &#123; SUBMIT_CREDENTIALS, CREDENTIALS_VALID, CREDENTIALS_INVALID, SESSION_CREATED, LOCKOUT_TRIGGERED, TIMEOUT_TRIGGERED, LOGOUT_REQUESTED, ACKNOWLEDGE_RESET, UNLOCK_TRIGGERED &#125;
            </div>
            <div className="col-md-6">
              <strong className="text-white">q₀ (Initial State):</strong> <span className="text-cyan">S0 (LOGGED_OUT)</span>
            </div>
            <div className="col-md-6">
              <strong className="text-white">F (Accepting States):</strong> <span className="text-success">&#123; S3: ACTIVE_SESSION &#125;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Automata Canvas & Simulator */}
      <div className="row g-4 mb-4">
        {/* Left: SVG FSM Graph */}
        <div className="col-lg-7">
          <div className="cyber-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-white mb-0">Interactive Automata Graph</h5>
                <span className="text-muted small">Click any node to view state properties</span>
              </div>
              <span className={`state-badge ${simCurrentState}`}>Current: {simCurrentState}</span>
            </div>

            <FsmGraph
              activeState={simCurrentState}
              onSelectNode={(node) => setSelectedNodeDetails(node)}
            />

            {selectedNodeDetails && (
              <div className="mt-3 p-3 rounded bg-dark border border-cyan border-opacity-25 font-monospace small">
                <div className="d-flex justify-content-between">
                  <span className="text-cyan fw-bold">Node Inspector: {selectedNodeDetails.label}</span>
                  <span className="badge bg-secondary">{selectedNodeDetails.type}</span>
                </div>
                <div className="text-muted mt-1" style={{ fontSize: '0.78rem' }}>
                  Coordinates: ({selectedNodeDetails.x}, {selectedNodeDetails.y}) | Color code: {selectedNodeDetails.color}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: State Transition Simulator */}
        <div className="col-lg-5">
          <div className="cyber-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-white mb-0">Interactive Transition Simulator</h5>
              <button onClick={handleResetSimulator} className="btn btn-sm btn-cyber-outline py-0 px-2" title="Reset to S0">
                <RotateCcw size={13} className="me-1" /> Reset
              </button>
            </div>
            <p className="text-muted small">
              Test transition validity: Select current state <span className="text-cyan">q</span> and input symbol <span className="text-purple">σ</span> to evaluate <span className="text-white">δ(q, σ)</span>.
            </p>

            {/* Current State Select */}
            <div className="mb-3">
              <label className="form-label text-muted small">Current State (q ∈ Q):</label>
              <select
                className="form-select cyber-input"
                value={simCurrentState}
                onChange={(e) => setSimCurrentState(e.target.value)}
              >
                {definition?.Q?.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Symbol / Event Select */}
            <div className="mb-3">
              <label className="form-label text-muted small">Input Event Symbol (σ ∈ Σ):</label>
              <select
                className="form-select cyber-input"
                value={simEvent}
                onChange={(e) => setSimEvent(e.target.value)}
              >
                {definition?.Sigma?.map((evt) => (
                  <option key={evt} value={evt}>
                    {evt}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSimulate}
              className="btn btn-cyber-primary w-100 py-2 d-flex justify-content-center align-items-center mb-3"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" />
              ) : (
                <Play size={16} className="me-2" />
              )}
              Evaluate Transition δ(q, σ)
            </button>

            {/* Simulator Output Feedback */}
            {simResult && (
              <div className="p-3 rounded bg-success bg-opacity-10 border border-success mb-3 font-monospace">
                <div className="d-flex align-items-center text-success fw-bold small mb-1">
                  <CheckCircle size={16} className="me-2" /> VALID TRANSITION ACCEPTED
                </div>
                <div className="text-white small">
                  <strong>Transition Function:</strong> {simResult.transitionMatrixEntry}
                </div>
                <div className="text-dim small mt-1" style={{ fontSize: '0.75rem' }}>
                  Next operational state: <span className="text-cyan fw-bold">{simResult.currentState}</span>
                </div>
              </div>
            )}

            {simError && (
              <div className="p-3 rounded bg-danger bg-opacity-10 border border-danger mb-3 font-monospace">
                <div className="d-flex align-items-center text-danger fw-bold small mb-1">
                  <XCircle size={16} className="me-2" /> AUTOMATA REJECTION (ILLEGAL TRANSITION)
                </div>
                <div className="text-warning small mb-1">
                  Code: {simError.code || 'FSM_TRANSITION_REJECTED'}
                </div>
                <div className="text-dim small" style={{ fontSize: '0.75rem' }}>
                  {simError.formalRejection?.explanation || simError.message}
                </div>
              </div>
            )}

            {/* Transition Matrix delta breakdown */}
            <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 font-monospace text-dim" style={{ fontSize: '0.72rem' }}>
              <strong>Rule:</strong> In deterministic automata, any unmapped pair (q, σ) has no valid transition and must be strictly rejected with HTTP 400.
            </div>
          </div>
        </div>
      </div>

      {/* Lexical Analysis and Regex Validation */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <RegexValidator />
        </div>

        {/* Global Transition History Log */}
        <div className="col-lg-6">
          <div className="cyber-card p-4 h-100">
            <h5 className="fw-bold text-white mb-3">Global State Transition Audit Log</h5>
            <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Source</th>
                    <th>Transition</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h._id || i}>
                      <td className="font-monospace text-dim" style={{ fontSize: '0.72rem' }}>
                        {new Date(h.createdAt).toLocaleTimeString()}
                      </td>
                      <td>
                        <span className="badge bg-dark text-cyan font-monospace" style={{ fontSize: '0.65rem' }}>
                          {h.source || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="font-monospace text-white" style={{ fontSize: '0.75rem' }}>
                        {h.fromState} &rarr; {h.toState || 'REJECTED'}
                      </td>
                      <td>
                        {h.valid ? (
                          <span className="badge bg-success bg-opacity-20 text-success" style={{ fontSize: '0.65rem' }}>
                            VALID
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-20 text-danger" style={{ fontSize: '0.65rem' }}>
                            REJECTED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
