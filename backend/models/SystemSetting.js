import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: '설정 키'
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '설정 값 (JSON 문자열)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '설정 설명'
  }
}, {
  tableName: 'SystemSettings',
  timestamps: true
});

export default SystemSetting;

