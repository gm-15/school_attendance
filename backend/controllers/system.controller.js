import { SystemSetting } from '../models/index.js';
import { createAuditLog } from '../middleware/auditLog.js';

// 모든 시스템 설정 조회
export const getSystemSettings = async (req, res, next) => {
  try {
    // 테이블이 없을 수 있으므로 try-catch로 처리
    let settings = [];
    try {
      settings = await SystemSetting.findAll({
        order: [['key', 'ASC']]
      });
    } catch (dbError) {
      // 테이블이 없는 경우 빈 객체 반환
      if (dbError.name === 'SequelizeDatabaseError' && dbError.message.includes("doesn't exist")) {
        return res.json({});
      }
      throw dbError;
    }

    const settingsMap = {};
    settings.forEach(setting => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsMap[setting.key] = setting.value;
      }
    });

    res.json(settingsMap);
  } catch (error) {
    next(error);
  }
};

// 특정 설정 조회
export const getSystemSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const setting = await SystemSetting.findOne({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    try {
      res.json({ key: setting.key, value: JSON.parse(setting.value), description: setting.description });
    } catch {
      res.json({ key: setting.key, value: setting.value, description: setting.description });
    }
  } catch (error) {
    next(error);
  }
};

// 시스템 설정 업데이트
export const updateSystemSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    let setting = await SystemSetting.findOne({
      where: { key }
    });

    const oldValue = setting ? setting.value : null;

    if (setting) {
      setting.value = typeof value === 'string' ? value : JSON.stringify(value);
      if (description !== undefined) {
        setting.description = description;
      }
      await setting.save();
    } else {
      setting = await SystemSetting.create({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description: description || null
      });
    }

    // 감사 로그 기록
    await createAuditLog(
      req,
      'system_setting_change',
      'SystemSetting',
      setting.id,
      { value: oldValue },
      { value: setting.value }
    );

    try {
      res.json({ key: setting.key, value: JSON.parse(setting.value), description: setting.description });
    } catch {
      res.json({ key: setting.key, value: setting.value, description: setting.description });
    }
  } catch (error) {
    next(error);
  }
};

// 여러 설정 일괄 업데이트
export const updateSystemSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const results = [];

    for (const [key, value] of Object.entries(settings)) {
      let setting = await SystemSetting.findOne({
        where: { key }
      });

      const oldValue = setting ? setting.value : null;

      if (setting) {
        setting.value = typeof value === 'string' ? value : JSON.stringify(value);
        await setting.save();
      } else {
        setting = await SystemSetting.create({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value)
        });
      }

      // 감사 로그 기록
      await createAuditLog(
        req,
        'system_setting_change',
        'SystemSetting',
        setting.id,
        { value: oldValue },
        { value: setting.value }
      );

      results.push({ key: setting.key, value: setting.value });
    }

    res.json({ message: 'Settings updated successfully', settings: results });
  } catch (error) {
    next(error);
  }
};

