const { AuditLog } = require('../models');

// 감사 로그 기록 함수
const logAudit = async (userId, action, targetType, targetId, oldValue = null, newValue = null, ipAddress = null) => {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId,
      old_value: oldValue,
      new_value: newValue,
      ip_address: ipAddress
    });
  } catch (error) {
    console.error('감사 로그 기록 실패:', error);
    // 로그 기록 실패해도 요청은 계속 진행
  }
};

module.exports = {
  logAudit
};

