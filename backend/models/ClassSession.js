import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ClassSession = sequelize.define('ClassSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id'
    }
  },
  week: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  session_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  room: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attendance_method: {
    type: DataTypes.ENUM('electronic', 'code', 'roll_call'),
    allowNull: false,
    defaultValue: 'code'
  },
  attendance_code: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'open', 'paused', 'closed'),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  attendance_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: 3,
      max: 15
    }
  },
  is_holiday: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_makeup: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'ClassSessions',
  timestamps: true
});

export default ClassSession;
