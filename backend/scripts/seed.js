import dotenv from 'dotenv';
import { connectDatabase, sequelize } from '../src/config/database.js';
import '../src/models/index.js';
import { seedData } from '../src/seed/seedData.js';

dotenv.config();

await connectDatabase();
await sequelize.sync({ alter: true });
await seedData();
console.log('Demo data seeded.');
await sequelize.close();
