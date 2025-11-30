import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'attendance_change, approval, policy_change 등'
  },
  target_type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Attendance, ExcuseRequest 등'
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  old_value: {
    type: DataTypes.JSON,
    allowNull: true
  },
  new_value: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'AuditLogs',
  timestamps: true,
  indexes: [
    {
      fields: ['target_type', 'target_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default AuditLog;
