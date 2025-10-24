const { Sequelize } = require('sequelize');
const pg = require('pg');

// Database configuration
const databaseUrl = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/enish-radio-pro';

const sequelize = new Sequelize(
  databaseUrl,
  {
    dialect: 'postgres',
    dialectModule: pg,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: databaseUrl.includes('sslmode=require') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

module.exports = sequelize;