import React, { useState, useEffect } from 'react';
import { networkService } from '../services/api';
import { Radio, RefreshCw, ArrowDownUp, CheckCircle, AlertTriangle, XOctagon } from 'lucide-react';

export default function NetworkPacketInspector({ maxItems = 15 }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchLiveNetwork = async () => {
    setLoading(true);
    try {
      const res = await networkService.getLiveRequests();
      if (res.data && res.data.requests) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Network inspect error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveNetwork();
    const interval = setInterval(fetchLiveNetwork, 4000); // Poll live packet stream
    return () => clearInterval(interval);
  }, []);

  const filtered = requests.filter((r) => {
    if (filter === 'ALL') return true;
    if (filter === '2xx') return r.statusCode >= 200 && r.statusCode < 300;
    if (filter === '4xx') return r.statusCode >= 400 && r.statusCode < 500;
    if (filter === '5xx') return r.statusCode >= 500;
    return true;
  });

  const getStatusBadge = (code) => {
    if (code >= 200 && code < 300) {
      return <span className="badge bg-success bg-opacity-25 text-success border border-success font-monospace">{code} OK</span>;
    }
    if (code === 401 || code === 403) {
      return <span className="badge bg-warning bg-opacity-25 text-warning border border-warning font-monospace">{code} AUTH_DENIED</span>;
    }
    if (code === 423) {
      return <span className="badge bg-danger bg-opacity-25 text-danger border border-danger font-monospace">423 LOCKED</span>;
    }
    if (code >= 400 && code < 500) {
      return <span className="badge bg-warning bg-opacity-25 text-warning border border-warning font-monospace">{code} CLIENT_ERR</span>;
    }
    return <span className="badge bg-danger text-white font-monospace">{code} SERVER_ERR</span>;
  };

  const getMethodBadge = (method) => {
    const map = {
      GET: 'text-info border-info',
      POST: 'text-primary border-primary',
      PUT: 'text-warning border-warning',
      DELETE: 'text-danger border-danger',
    };
    return (
      <span className={`badge bg-transparent border ${map[method] || 'text-light border-secondary'} font-monospace py-1 px-2`}>
        {method}
      </span>
    );
  };

  return (
    <div className="cyber-card p-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center">
          <Radio size={18} className="text-cyan me-2 animate-pulse" />
          <h6 className="mb-0 text-white fw-bold">Live Network HTTP Traffic Stream</h6>
        </div>
        <div className="d-flex gap-2">
          {/* Status Filter */}
          <select
            className="form-select form-select-sm cyber-input py-0"
            style={{ width: '100px', fontSize: '0.75rem' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All (HTTP)</option>
            <option value="2xx">2xx (OK)</option>
            <option value="4xx">4xx (Errors)</option>
            <option value="5xx">5xx (Server)</option>
          </select>
          <button
            onClick={fetchLiveNetwork}
            className="btn btn-sm btn-cyber-outline py-0 px-2"
            disabled={loading}
            title="Refresh packet capture"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Packet Table */}
      <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Method</th>
              <th>Endpoint URL</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Payload Size</th>
              <th>Cookie</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No network packets recorded yet. Trigger any API call to observe live HTTP traffic.
                </td>
              </tr>
            ) : (
              filtered.slice(0, maxItems).map((pkt) => (
                <tr key={pkt.id}>
                  <td className="font-monospace text-dim" style={{ fontSize: '0.75rem' }}>
                    {new Date(pkt.timestamp).toLocaleTimeString()}
                  </td>
                  <td>{getMethodBadge(pkt.method)}</td>
                  <td className="font-monospace text-light" style={{ fontSize: '0.8rem' }}>
                    {pkt.url}
                  </td>
                  <td>{getStatusBadge(pkt.statusCode)}</td>
                  <td className="font-monospace">
                    <span className={pkt.responseTimeMs > 200 ? 'text-warning' : 'text-cyan'}>
                      {pkt.responseTimeMs}ms
                    </span>
                  </td>
                  <td className="font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                    {pkt.requestSize + pkt.responseSize} B
                  </td>
                  <td>
                    {pkt.hasCookie ? (
                      <span className="badge bg-success bg-opacity-20 text-success" style={{ fontSize: '0.65rem' }}>
                        SID_ATTACHED
                      </span>
                    ) : (
                      <span className="badge bg-secondary bg-opacity-20 text-muted" style={{ fontSize: '0.65rem' }}>
                        NONE
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
