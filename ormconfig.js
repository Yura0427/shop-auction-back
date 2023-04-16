const basicConfig = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: JSON.parse(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: JSON.parse(process.env.PORSTRES_SYNCHRONIZE),
  entities: ['dist/**/*.entity{.ts,.js}'],
};

const defaultConfig = {
  ...basicConfig,
  name: 'default',
  migrationsTableName: 'migration_table',
  migrations: ['dist/database/migrations/**/*{.ts,.js}'],
  cli: {
    entitiesDir: 'src',
    migrationsDir: 'database/migrations',
  },
};

const seedsConfig = {
  ...basicConfig,
  name: 'seeds',
  migrationsTableName: 'seeds_migrations',
  migrations: ['dist/database/seeds/**/*{.ts,.js}'],
  cli: {
    entitiesDir: 'src',
    migrationsDir: 'database/seeds',
  },
};

if (JSON.parse(process.env.POSTGRES_SSL_ENABLED)) {
  basicConfig.ssl = { rejectUnauthorized: false };
}

module.exports = [defaultConfig, seedsConfig];
