import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Attendance = sequelize.define('Attendance', {
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
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0=미정, 1=출석, 2=지각, 3=결석, 4=공결'
  },
  checked_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  late_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Attendances',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['session_id', 'student_id']
    }
  ]
});

export default Attendance;
