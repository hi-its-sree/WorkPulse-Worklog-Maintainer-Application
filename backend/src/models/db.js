import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqliteDir = path.join(__dirname, '../data');
if (!fs.existsSync(sqliteDir)) {
  fs.mkdirSync(sqliteDir, { recursive: true });
}
const defaultSqliteStorage = path.join(sqliteDir, 'workpulse.sqlite');

const dialect = process.env.DB_DIALECT?.toLowerCase();
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE ? path.resolve(process.env.DB_STORAGE) : defaultSqliteStorage,
    logging: false,
  });
} else if (dialect === 'postgres' || (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')))) {
  if (!databaseUrl) {
    throw new Error('Postgres is configured but DATABASE_URL is not set.');
  }
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
  });
} else {
  throw new Error('No valid database configuration provided. Set DB_DIALECT=postgres and DATABASE_URL, or DB_DIALECT=sqlite and DB_STORAGE.');
}

export { sequelize };
