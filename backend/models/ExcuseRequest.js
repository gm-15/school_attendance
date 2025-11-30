import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ExcuseRequest = sequelize.define('ExcuseRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ClassSessions',
      key: 'id'
    }
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reason_code: {
    type: DataTypes.ENUM('병가', '경조사', '기타'),
    allowNull: false
  },
  reason_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  instructor_comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  files: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'ExcuseRequests',
  timestamps: true
});

export default ExcuseRequest;
