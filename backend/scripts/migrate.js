import dotenv from 'dotenv';
import { connectDatabase, sequelize } from '../src/config/database.js';
import '../src/models/index.js';

dotenv.config();

await connectDatabase();
await sequelize.sync({ alter: true });
console.log('Database tables synchronized.');
await sequelize.close();
