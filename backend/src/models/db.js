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
} else if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE ? path.resolve(process.env.DB_STORAGE) : defaultSqliteStorage,
    logging: false,
  });
}

export { sequelize };
