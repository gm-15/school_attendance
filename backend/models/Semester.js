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
    type: DataTypes.ENUM('1', '2', '여름', '겨울'),
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
