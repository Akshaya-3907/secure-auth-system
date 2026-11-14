import React, { useState, useEffect } from 'react';
import { sessionService } from '../services/api';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';

export default function SecurityEventLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [eventType, setEventType] = useState('');
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await sessionService.getSecurityLogs({
        eventType: eventType || undefined,
        severity: severity || undefined,
        search: search || undefined,
        limit: 40,
      });

      if (res.data?.logs) {
        setLogs(res.data.logs);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching security logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventType, severity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getSeverityBadge = (sev) => {
    const map = {
      CRITICAL: 'bg-danger text-white border-danger',
      DANGER: 'bg-danger bg-opacity-50 text-white border-danger',
      WARNING: 'bg-warning bg-opacity-25 text-warning border-warning',
      INFO: 'bg-info bg-opacity-20 text-info border-info',
    };
    return (
      <span className={`badge border font-monospace py-1 px-2 ${map[sev] || 'bg-secondary'}`}>
        {sev}
      </span>
    );
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <FileText size={24} className="text-cyan me-2" />
            <h3 className="fw-bold text-white mb-0">Immutable Security Audit Trail</h3>
          </div>
          <span className="text-muted small">
            Zero-Trust Event Logging &bull; Sensitive Data Redaction Enforced
          </span>
        </div>
        <button onClick={fetchLogs} className="btn btn-sm btn-cyber-outline d-flex align-items-center">
          <RefreshCw size={14} className={`me-1 ${loading ? 'spin' : ''}`} /> Refresh Logs
        </button>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-3 mb-4 rounded bg-dark border border-cyan border-opacity-25 font-monospace small d-flex align-items-center">
        <ShieldAlert size={20} className="text-cyan me-3 flex-shrink-0" />
        <div className="text-dim" style={{ fontSize: '0.78rem' }}>
          <strong className="text-white">Privacy &amp; Security Compliance:</strong> Under academic security guidelines, passwords, hashes, and session tokens are strictly stripped and masked as <code>[REDACTED_BY_SECURITY_POLICY]</code> before committing to the database.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="cyber-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          {/* Search input */}
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark border-secondary border-opacity-25 text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control cyber-input"
                placeholder="Search email or IP address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Severity filter */}
          <div className="col-md-3 col-sm-6">
            <select
              className="form-select form-select-sm cyber-input"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="DANGER">DANGER</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Event type filter */}
          <div className="col-md-3 col-sm-6">
            <select
              className="form-select form-select-sm cyber-input"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="">All Event Types</option>
              <option value="LOGIN_ATTEMPT">LOGIN_ATTEMPT</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
              <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
              <option value="ACCOUNT_UNLOCKED">ACCOUNT_UNLOCKED</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT</option>
              <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
              <option value="REGISTRATION">REGISTRATION</option>
              <option value="ADMIN_ACTION">ADMIN_ACTION</option>
            </select>
          </div>

          <div className="col-md-2">
            <button type="submit" className="btn btn-sm btn-cyber-primary w-100">
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="cyber-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-white mb-0">Event Audit Table</h5>
          <span className="badge bg-dark border border-secondary text-dim font-monospace">
            {total} Total Audit Records
          </span>
        </div>

        <div className="table-responsive">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Severity</th>
                <th>Target User</th>
                <th>IP Address</th>
                <th>FSM State</th>
                <th>Outcome</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No matching security events found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td className="font-monospace text-dim" style={{ fontSize: '0.75rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="font-monospace text-cyan" style={{ fontSize: '0.8rem' }}>
                      {log.eventType}
                    </td>
                    <td>{getSeverityBadge(log.severity)}</td>
                    <td className="font-monospace text-white" style={{ fontSize: '0.8rem' }}>
                      {log.userEmail}
                    </td>
                    <td className="font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                      {log.ipAddress}
                    </td>
                    <td>
                      <span className={`state-badge ${log.fsmState || 'LOGGED_OUT'}`} style={{ fontSize: '0.65rem' }}>
                        {log.fsmState || 'LOGGED_OUT'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          log.outcome === 'SUCCESS' ? 'text-success border-success' : 'text-danger border-danger'
                        } bg-transparent border font-monospace`}
                        style={{ fontSize: '0.68rem' }}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-xs btn-cyber-outline py-0 px-2"
                        title="View Sanitized JSON Payload"
                      >
                        <Eye size={12} className="me-1" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedLog && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content cyber-card border-cyan">
              <div className="modal-header border-secondary border-opacity-25">
                <h6 className="modal-title text-cyan font-monospace fw-bold">
                  Security Log Payload &bull; ID: {selectedLog._id}
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedLog(null)}
                />
              </div>
              <div className="modal-body">
                <pre className="cyber-code" style={{ maxHeight: '400px' }}>
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
              <div className="modal-footer border-secondary border-opacity-25">
                <button
                  type="button"
                  className="btn btn-sm btn-cyber-outline"
                  onClick={() => setSelectedLog(null)}
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
