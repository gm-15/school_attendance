import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PollVote = sequelize.define('PollVote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  poll_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Polls',
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
  vote: {
    type: DataTypes.ENUM('agree', 'disagree'),
    allowNull: false
  }
}, {
  tableName: 'PollVotes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['poll_id', 'student_id']
    }
  ]
});

export default PollVote;
