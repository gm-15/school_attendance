import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Semester = sequelize.define('Semester', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  term: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'Semesters',
  timestamps: true
});

export default Semester;
