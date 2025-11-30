import { AuditLog } from '../models/index.js';

// 감사 로그 기록 미들웨어
export const createAuditLog = async (req, action, targetType, targetId, oldValue = null, newValue = null) => {
  try {
    await AuditLog.create({
      user_id: req.user.id,
      action: action,
      target_type: targetType,
      target_id: targetId,
      old_value: oldValue,
      new_value: newValue,
      ip_address: req.ip || req.connection.remoteAddress
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // 감사 로그 실패해도 요청은 계속 진행
  }
};

// 감사 로그 미들웨어 팩토리
export const auditMiddleware = (action, targetType, getTargetId, getOldValue = null, getNewValue = null) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = async function(data) {
      // 성공적인 응답인 경우에만 로그 기록
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const targetId = getTargetId ? getTargetId(req, data) : req.params.id;
        const oldValue = getOldValue ? await getOldValue(req) : null;
        const newValue = getNewValue ? getNewValue(req, data) : data;
        
        await createAuditLog(req, action, targetType, targetId, oldValue, newValue);
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

