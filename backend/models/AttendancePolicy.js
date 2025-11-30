import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AttendancePolicy = sequelize.define('AttendancePolicy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Courses',
      key: 'id'
    }
  },
  late_threshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    comment: '지각 기준 (분)'
  },
  late_to_absent_threshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: '지각→결석 전환 기준 (분)'
  },
  max_absences: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  absence_warning_threshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    comment: '경고 결석 횟수'
  },
  absence_danger_threshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: '위험 결석 횟수'
  },
  absence_fail_threshold: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.25,
    comment: '낙제 결석 비율 (25%)'
  },
  attendance_weight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 1.0,
    comment: '출석 가중치'
  },
  late_weight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.5,
    comment: '지각 가중치'
  }
}, {
  tableName: 'AttendancePolicies',
  timestamps: true
});

export default AttendancePolicy;
