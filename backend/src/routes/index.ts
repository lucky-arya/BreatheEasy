import { Router } from 'express';
import heatmapRoutes from './heatmapRoutes.js';
import predictionRoutes from './predictionRoutes.js';
import searchRoutes from './searchRoutes.js';
import pushRoutes from './pushRoutes.js';
import ingestRoutes from './ingestRoutes.js';

const router = Router();

// API routes
router.use('/heatmap', heatmapRoutes);
router.use('/predictions', predictionRoutes);
router.use('/search', searchRoutes);
router.use('/push', pushRoutes);
router.use('/alerts', pushRoutes); // Alerts are part of push routes
router.use('/ingest', ingestRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
