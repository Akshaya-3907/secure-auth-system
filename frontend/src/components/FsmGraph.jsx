import React, { useState } from 'react';

const NODES = [
  { id: 'S0', name: 'LOGGED_OUT', x: 80, y: 190, label: 'S0: LOGGED_OUT', type: 'initial', color: '#64748b' },
  { id: 'S1', name: 'AUTHENTICATING', x: 250, y: 190, label: 'S1: AUTHENTICATING', type: 'transient', color: '#38bdf8' },
  { id: 'S2', name: 'AUTHENTICATED', x: 440, y: 100, label: 'S2: AUTHENTICATED', type: 'transient', color: '#a855f7' },
  { id: 'S3', name: 'ACTIVE_SESSION', x: 650, y: 190, label: 'S3: ACTIVE_SESSION', type: 'accepting', color: '#10b981' },
  { id: 'S4', name: 'FAILED_LOGIN', x: 250, y: 310, label: 'S4: FAILED_LOGIN', type: 'error', color: '#f59e0b' },
  { id: 'S5', name: 'ACCOUNT_LOCKED', x: 100, y: 340, label: 'S5: ACCOUNT_LOCKED', type: 'locked', color: '#ef4444' },
  { id: 'S6', name: 'SESSION_EXPIRED', x: 440, y: 220, label: 'S6: SESSION_EXPIRED', type: 'warning', color: '#ec4899' },
  { id: 'S7', name: 'LOGGED_OUT_SUCCESSFULLY', x: 650, y: 340, label: 'S7: LOGGED_OUT_SUCCESS', type: 'terminal', color: '#06b6d4' },
];

const EDGES = [
  { from: 'S0', to: 'S1', label: 'SUBMIT_CREDENTIALS', curvature: 0 },
  { from: 'S1', to: 'S2', label: 'CREDENTIALS_VALID', curvature: -25 },
  { from: 'S2', to: 'S3', label: 'SESSION_CREATED', curvature: -20 },
  { from: 'S1', to: 'S4', label: 'CREDENTIALS_INVALID', curvature: 0 },
  { from: 'S4', to: 'S1', label: 'RETRY_LOGIN', curvature: 25 },
  { from: 'S4', to: 'S5', label: 'FAILED_ATTEMPTS ≥ 5', curvature: 0 },
  { from: 'S5', to: 'S0', label: 'ADMIN_UNLOCK / EXPIRE', curvature: 40 },
  { from: 'S3', to: 'S6', label: 'TTL_TIMEOUT (30m)', curvature: 20 },
  { from: 'S3', to: 'S7', label: 'USER_LOGOUT', curvature: 0 },
  { from: 'S7', to: 'S0', label: 'SESSION_DESTROYED', curvature: 45 },
  { from: 'S6', to: 'S0', label: 'RESET_STATE', curvature: 25 },
];

export default function FsmGraph({ activeState = 'LOGGED_OUT', onSelectNode }) {
  const [selectedNode, setSelectedNode] = useState(null);

  // Map state name to S0-S7
  const activeNode = NODES.find(
    (n) => n.name === activeState || n.id === activeState
  ) || NODES[0];

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="w-100 position-relative">
      <svg
        viewBox="0 0 760 410"
        className="w-100"
        style={{
          background: '#060a14',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.6)',
        }}
      >
        <defs>
          {/* Arrow markers */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" opacity="0.8" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#00f5ff" />
          </marker>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Directed Edges */}
        {EDGES.map((edge, index) => {
          const fromNode = NODES.find((n) => n.id === edge.from);
          const toNode = NODES.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const isEdgeActive =
            fromNode.name === activeState || toNode.name === activeState;

          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2 + edge.curvature;

          const pathD = `M ${fromNode.x} ${fromNode.y} Q ${midX} ${midY} ${toNode.x} ${toNode.y}`;

          return (
            <g key={index}>
              <path
                d={pathD}
                fill="none"
                stroke={isEdgeActive ? '#00f5ff' : '#1e293b'}
                strokeWidth={isEdgeActive ? '2.5' : '1.5'}
                strokeDasharray={isEdgeActive ? 'none' : '4 3'}
                markerEnd={isEdgeActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                opacity={isEdgeActive ? 0.95 : 0.6}
              />
              <text
                x={midX}
                y={midY - 4}
                fill={isEdgeActive ? '#38bdf8' : '#64748b'}
                fontSize="8"
                fontFamily="monospace"
                textAnchor="middle"
                opacity={0.85}
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* State Nodes */}
        {NODES.map((node) => {
          const isActive = node.name === activeState || node.id === activeState;
          const isSelected = selectedNode?.id === node.id;

          return (
            <g
              key={node.id}
              onClick={() => handleNodeClick(node)}
              style={{ cursor: 'pointer' }}
            >
              {/* Pulsing Aura if Active */}
              {isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="34"
                  fill="none"
                  stroke={node.color}
                  strokeWidth="2"
                  opacity="0.6"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="r"
                    values="28;36;28"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0.2;0.8"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Double circle for Accepting State (S3: ACTIVE_SESSION) */}
              {node.type === 'accepting' && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="29"
                  fill="none"
                  stroke={node.color}
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* Main Node Circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r="24"
                fill={isActive ? '#0f172a' : '#090e1a'}
                stroke={isActive ? node.color : isSelected ? '#38bdf8' : '#334155'}
                strokeWidth={isActive ? '3' : '1.5'}
                filter={isActive ? 'url(#glow)' : 'none'}
              />

              {/* Node ID Label */}
              <text
                x={node.x}
                y={node.y + 4}
                fill={isActive ? '#ffffff' : '#94a3b8'}
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {node.id}
              </text>

              {/* State Name Label Below */}
              <text
                x={node.x}
                y={node.y + 36}
                fill={isActive ? node.color : '#64748b'}
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight={isActive ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mt-2 px-2 text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
        <div className="d-flex gap-3">
          <span><span className="text-secondary">&bull;</span> Initial: S0</span>
          <span><span className="text-info">&bull;</span> Transient: S1, S2</span>
          <span><span className="text-success">&bull;</span> Accepting (Double Ring): S3</span>
          <span><span className="text-danger">&bull;</span> Locked: S5</span>
        </div>
        <div className="text-cyan">
          Active: <span className="fw-bold text-white">{activeNode.label}</span>
        </div>
      </div>
    </div>
  );
}
