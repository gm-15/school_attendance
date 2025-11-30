import express from 'express';
import {
  getSystemSettings,
  getSystemSetting,
  updateSystemSetting,
  updateSystemSettings
} from '../controllers/system.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLog.js';

const router = express.Router();

router.use(authenticate);
router.use(adminOnly);

router.get('/', getSystemSettings);
router.get('/:key', getSystemSetting);
router.put('/:key', auditMiddleware('system_setting_change', 'SystemSetting', (req) => req.params.key), updateSystemSetting);
router.put('/', auditMiddleware('system_settings_bulk_change', 'SystemSetting', null), updateSystemSettings);

export default router;

