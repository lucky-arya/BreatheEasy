import { Router } from 'express';
import {
  triggerIngestion,
  getIngestionStatus,
} from '../controllers/ingestController.js';

const router = Router();

/**
 * @route   POST /api/ingest
 * @desc    Trigger data ingestion from OpenAQ
 * @header  apiKey - Internal API key for authorization
 */
router.post('/', triggerIngestion);

/**
 * @route   GET /api/ingest/status
 * @desc    Get ingestion status and statistics
 */
router.get('/status', getIngestionStatus);

export default router;
