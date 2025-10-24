const { Sequelize } = require('sequelize');
const pg = require('pg');

// Database configuration
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/enish-radio-pro',
  {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'username',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'enish-radio-pro',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;