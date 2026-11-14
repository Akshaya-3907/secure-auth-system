import React, { useState, useEffect } from 'react';
import { networkService } from '../services/api';
import {
  Radio,
  Activity,
  Server,
  Zap,
  RefreshCw,
  Globe,
  Database,
  Shield,
  Layers,
} from 'lucide-react';
import NetworkPacketInspector from '../components/NetworkPacketInspector';

export default function NetworkMonitoringPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchNetworkStats = async () => {
    setLoading(true);
    try {
      const res = await networkService.getStats();
      if (res.data?.stats) setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching network statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <Radio size={24} className="text-cyan me-2 animate-pulse" />
            <h3 className="fw-bold text-white mb-0">Computer Networks &amp; HTTP Traffic Analysis</h3>
          </div>
          <span className="text-muted small">
            OSI Layer 7 Application Protocol Instrumentation, Status Distribution &amp; Packet Telemetry
          </span>
        </div>
        <button onClick={fetchNetworkStats} className="btn btn-sm btn-cyber-outline d-flex align-items-center">
          <RefreshCw size={14} className={`me-1 ${loading ? 'spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* 4 Network KPI Cards */}
      <div className="row g-3 mb-4">
        {/* Total Packets */}
        <div className="col-md-3 col-sm-6">
          <div className="cyber-card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small font-monospace">TOTAL HTTP REQUESTS</span>
              <Globe size={18} className="text-cyan" />
            </div>
            <div className="fs-3 fw-bold text-white font-monospace mb-1">{stats?.totalRequests || 0}</div>
            <span className="text-dim small font-monospace" style={{ fontSize: '0.72rem' }}>
              Captured by Express NetworkMonitor
            </span>
          </div>
        </div>

        {/* Average Latency */}
        <div className="col-md-3 col-sm-6">
          <div className="cyber-card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small font-monospace">AVERAGE LATENCY</span>
              <Zap size={18} className="text-warning" />
            </div>
            <div className="fs-3 fw-bold text-warning font-monospace mb-1">
              {stats?.averageLatencyMs || 0} ms
            </div>
            <span className="text-dim small font-monospace" style={{ fontSize: '0.72rem' }}>
              Socket round-trip processing time
            </span>
          </div>
        </div>

        {/* Total Bandwidth */}
        <div className="col-md-3 col-sm-6">
          <div className="cyber-card cyber-card-purple p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small font-monospace">TOTAL BANDWIDTH</span>
              <Server size={18} className="text-purple" />
            </div>
            <div className="fs-3 fw-bold text-purple font-monospace mb-1">
              {((stats?.totalBandwidthBytes || 0) / 1024).toFixed(2)} KB
            </div>
            <span className="text-dim small font-monospace" style={{ fontSize: '0.72rem' }}>
              Cumulative payload data transferred
            </span>
          </div>
        </div>

        {/* Security Transport Status */}
        <div className="col-md-3 col-sm-6">
          <div className="cyber-card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small font-monospace">TRANSPORT SECURITY</span>
              <Shield size={18} className="text-success" />
            </div>
            <div className="fs-5 fw-bold text-success font-monospace mb-1">
              HTTP/1.1 &bull; REST API
            </div>
            <span className="text-dim small font-monospace" style={{ fontSize: '0.72rem' }}>
              CORS + Signed Session Cookies Enabled
            </span>
          </div>
        </div>
      </div>

      {/* HTTP Status Code Distribution & Method Breakdown */}
      <div className="row g-4 mb-4">
        {/* Status Breakdown */}
        <div className="col-md-6">
          <div className="cyber-card p-4 h-100">
            <h5 className="fw-bold text-white mb-3">HTTP Response Status Distribution</h5>
            <div className="row g-3">
              {stats?.statusBreakdown?.map((cat) => (
                <div key={cat._id} className="col-6">
                  <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 text-center">
                    <span className="badge bg-secondary font-monospace mb-2" style={{ fontSize: '0.75rem' }}>
                      Status {cat._id}
                    </span>
                    <div className="fs-4 fw-bold text-white font-monospace">{cat.count}</div>
                    <div className="text-dim small font-monospace" style={{ fontSize: '0.72rem' }}>
                      Avg Latency: {Math.round(cat.avgLatency)}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HTTP Protocol Overview */}
        <div className="col-md-6">
          <div className="cyber-card p-4 h-100">
            <h5 className="fw-bold text-white mb-3">Client-Server Communication Architecture</h5>
            <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 font-monospace small">
              <div className="mb-2">
                <span className="text-cyan fw-bold">1. Client Tier:</span> React 18 SPA (Vite)
              </div>
              <div className="mb-2">
                <span className="text-purple fw-bold">2. Transport Layer:</span> HTTP / TCP Socket on port 5000
              </div>
              <div className="mb-2">
                <span className="text-warning fw-bold">3. Network Middleware:</span> High-resolution process.hrtime latency timer
              </div>
              <div className="mb-0">
                <span className="text-success fw-bold">4. State Persistence:</span> MongoDB connect-mongo collection
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Network Packet Inspector Component */}
      <div className="mb-4">
        <NetworkPacketInspector maxItems={25} />
      </div>
    </div>
  );
}
