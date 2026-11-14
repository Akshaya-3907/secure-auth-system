const express = require('express');
const router = express.Router();
const NetworkLog = require('../models/NetworkLog');
const { getRecentNetworkRequests } = require('../middleware/networkMonitor');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

/**
 * GET /api/network/stats
 * Aggregated network analytics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalRequests = await NetworkLog.countDocuments();

    // Group by status codes (2xx, 3xx, 4xx, 5xx)
    const statusBreakdown = await NetworkLog.aggregate([
      {
        $group: {
          _id: '$statusCategory',
          count: { $sum: 1 },
          avgLatency: { $avg: '$responseTimeMs' },
          minLatency: { $min: '$responseTimeMs' },
          maxLatency: { $max: '$responseTimeMs' },
        },
      },
    ]);

    // Group by HTTP Methods
    const methodBreakdown = await NetworkLog.aggregate([
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
        },
      },
    ]);

    // Average latency across all requests
    const overallAvg = await NetworkLog.aggregate([
      {
        $group: {
          _id: null,
          avgLatency: { $avg: '$responseTimeMs' },
          totalBandwidthBytes: { $sum: '$responseSize' },
        },
      },
    ]);

    return res.json({
      success: true,
      stats: {
        totalRequests,
        averageLatencyMs: overallAvg[0]?.avgLatency ? Math.round(overallAvg[0].avgLatency * 10) / 10 : 0,
        totalBandwidthBytes: overallAvg[0]?.totalBandwidthBytes || 0,
        statusBreakdown,
        methodBreakdown,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/network/live-stream
 * Returns live in-memory buffer of requests for instant dashboard rendering
 */
router.get('/live-stream', (req, res) => {
  const liveLogs = getRecentNetworkRequests();
  return res.json({
    success: true,
    count: liveLogs.length,
    requests: liveLogs,
  });
});

/**
 * DELETE /api/network/clear
 * Admin can clear historical network logs
 */
router.delete('/clear', requireAuth, requireAdmin, async (req, res) => {
  try {
    await NetworkLog.deleteMany({});
    return res.json({ success: true, message: 'Network logs cleared successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
