import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const File = sequelize.define('File', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stored_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  uploader_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  related_type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'excuse_request, appeal 등'
  },
  related_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'Files',
  timestamps: true
});

export default File;
