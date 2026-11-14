import React from 'react';
import { ShieldCheck, Cpu, Radio, Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto py-3 px-4 border-top border-secondary border-opacity-25" style={{ background: '#070b14' }}>
      <div className="container-fluid d-flex flex-wrap justify-content-between align-items-center text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
        <div className="d-flex align-items-center mb-2 mb-md-0">
          <ShieldCheck size={16} className="text-cyan me-2" />
          <span className="text-white fw-bold">SECURE WEB AUTHENTICATION &amp; FSM STATE SYSTEM</span>
        </div>

        <div className="d-flex flex-wrap gap-3">
          <span>
            <Layers size={13} className="text-cyan me-1 inline" /> Full Stack: React &bull; Node.js &bull; Mongo
          </span>
          <span>
            <Radio size={13} className="text-info me-1 inline" /> Networks: HTTP &bull; Cookies &bull; Status Codes
          </span>
          <span>
            <Cpu size={13} className="text-purple me-1 inline" /> Automata: 8-State DFA &bull; Type-3 Grammar
          </span>
        </div>

        <div className="text-dim">
          &copy; 2026 Academic Engineering Capstone
        </div>
      </div>
    </footer>
  );
}
