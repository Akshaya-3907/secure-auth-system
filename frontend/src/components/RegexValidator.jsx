import React, { useState } from 'react';
import { CheckCircle2, XCircle, Code, Info } from 'lucide-react';

const PATTERNS = {
  USERNAME: {
    name: 'Username Grammar (Chomsky Type-3)',
    pattern: '^[a-zA-Z0-9_]{3,20}$',
    regex: /^[a-zA-Z0-9_]{3,20}$/,
    description: 'Accepts 3 to 20 alphanumeric characters or underscores.',
    grammar: 'G = ({S, A}, {a-z, A-Z, 0-9, _}, P, S)',
    example: 'cyber_admin99',
  },
  EMAIL: {
    name: 'Email RFC Grammar (DFA)',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    description: 'Validates local-part, @ domain delimiter, and top-level domain.',
    grammar: 'L = { u@d.t | u ∈ Σ_local+, d ∈ Σ_domain+, t ∈ Σ_alpha{2,} }',
    example: 'researcher@university.edu',
  },
  PASSWORD_COMPLEXITY: {
    name: 'Password Complexity (Intersection of 5 Regular Languages)',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    description: 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special symbol.',
    grammar: 'L_pass = L_len ∩ L_lower ∩ L_upper ∩ L_digit ∩ L_special',
    example: 'Cyber#Secure2026!',
  },
};

export default function RegexValidator() {
  const [selectedType, setSelectedType] = useState('PASSWORD_COMPLEXITY');
  const [testInput, setTestInput] = useState('Cyber#Secure2026!');

  const activePattern = PATTERNS[selectedType];
  const isAccepted = activePattern.regex.test(testInput);

  return (
    <div className="cyber-card p-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center">
          <Code size={18} className="text-cyan me-2" />
          <h6 className="mb-0 text-white fw-bold">FLAT Regular Expression & Lexical Analysis</h6>
        </div>
        <span className="badge bg-purple px-2 py-1" style={{ backgroundColor: '#7c3aed', fontSize: '0.7rem' }}>
          Type-3 Automata
        </span>
      </div>

      {/* Pattern Selector Tabs */}
      <div className="btn-group btn-group-sm w-100 mb-3" role="group">
        {Object.entries(PATTERNS).map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={`btn ${selectedType === key ? 'btn-cyber-primary' : 'btn-cyber-outline'}`}
            onClick={() => {
              setSelectedType(key);
              setTestInput(item.example);
            }}
          >
            {key.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Grammar & Definition */}
      <div className="p-2 mb-3 rounded bg-dark border border-secondary border-opacity-25" style={{ fontSize: '0.82rem' }}>
        <div className="text-cyan fw-bold font-monospace mb-1">{activePattern.name}</div>
        <div className="text-muted mb-1">{activePattern.description}</div>
        <div className="font-monospace text-warning p-1 bg-black rounded" style={{ fontSize: '0.75rem', overflowX: 'auto' }}>
          Pattern: <code>{activePattern.pattern}</code>
        </div>
        <div className="font-monospace text-dim mt-1" style={{ fontSize: '0.72rem' }}>
          Formal Grammar: {activePattern.grammar}
        </div>
      </div>

      {/* Interactive Input */}
      <div className="mb-3">
        <label className="form-label text-muted small mb-1">Interactive Input String Testbed:</label>
        <div className="input-group">
          <input
            type="text"
            className="form-control cyber-input font-monospace"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type a test string..."
          />
          <button
            className="btn btn-cyber-outline"
            type="button"
            onClick={() => setTestInput(activePattern.example)}
            title="Load sample valid string"
          >
            Load Sample
          </button>
        </div>
      </div>

      {/* Result Status */}
      <div className={`p-2 rounded d-flex align-items-center justify-content-between ${isAccepted ? 'bg-success bg-opacity-10 border border-success' : 'bg-danger bg-opacity-10 border border-danger'}`}>
        <div className="d-flex align-items-center">
          {isAccepted ? (
            <CheckCircle2 size={18} className="text-success me-2" />
          ) : (
            <XCircle size={18} className="text-danger me-2" />
          )}
          <span className={`fw-bold font-monospace ${isAccepted ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.85rem' }}>
            {isAccepted ? 'ACCEPTED BY DFA (Valid Token)' : 'REJECTED BY DFA (Lexical Error)'}
          </span>
        </div>
        <span className="badge bg-dark font-monospace" style={{ fontSize: '0.75rem' }}>
          |w| = {testInput.length} chars
        </span>
      </div>
    </div>
  );
}
