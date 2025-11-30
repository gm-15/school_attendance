import sequelize from '../config/database.js';
import { testConnection } from '../config/database.js';
import '../models/index.js';

const migrate = async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('Database connection failed');
      process.exit(1);
    }

    console.log('Starting database migration...');
    await sequelize.sync({ force: false, alter: true });
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();

