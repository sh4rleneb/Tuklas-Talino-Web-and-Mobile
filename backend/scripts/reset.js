import dotenv from 'dotenv';
import { connectDatabase, sequelize } from '../src/config/database.js';
import '../src/models/index.js';
import { seedData } from '../src/seed/seedData.js';

dotenv.config();

await connectDatabase();
await sequelize.sync({ force: true });
await seedData();
console.log('Database reset and seeded.');
await sequelize.close();
