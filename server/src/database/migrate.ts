import { query } from './connection';

const migrations = [
  {
    name: '001_create_users_table',
    sql: `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        steam_id VARCHAR(20) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        avatar TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);
    `,
  },
  {
    name: '002_create_guides_table',
    sql: `
      CREATE TABLE IF NOT EXISTS guides (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        steam_app_id INTEGER NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_guides_author ON guides(author_id);
      CREATE INDEX IF NOT EXISTS idx_guides_app_id ON guides(steam_app_id);
      CREATE INDEX IF NOT EXISTS idx_guides_public ON guides(is_public) WHERE is_public = true;
    `,
  },
  {
    name: '003_create_saved_guides_table',
    sql: `
      CREATE TABLE IF NOT EXISTS saved_guides (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guide_id)
      );

      CREATE INDEX IF NOT EXISTS idx_saved_guides_user ON saved_guides(user_id);
    `,
  },
  {
    name: '004_create_guide_likes_table',
    sql: `
      CREATE TABLE IF NOT EXISTS guide_likes (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guide_id)
      );

      CREATE INDEX IF NOT EXISTS idx_guide_likes_guide ON guide_likes(guide_id);
    `,
  },
  {
    name: '005_create_migrations_table',
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
];

async function runMigrations() {
  console.log('🔄 Running database migrations...');

  // Ensure migrations table exists
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Get executed migrations
  const result = await query<{ name: string }>('SELECT name FROM migrations');
  const executedMigrations = new Set(result.rows.map((row) => row.name));

  // Run pending migrations
  for (const migration of migrations) {
    if (!executedMigrations.has(migration.name)) {
      console.log(`  ▶ Running migration: ${migration.name}`);
      try {
        await query(migration.sql);
        await query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
        console.log(`  ✅ Migration completed: ${migration.name}`);
      } catch (error) {
        console.error(`  ❌ Migration failed: ${migration.name}`, error);
        throw error;
      }
    } else {
      console.log(`  ⏭ Skipping already executed: ${migration.name}`);
    }
  }

  console.log('✅ All migrations completed successfully');
}

// Run migrations if this file is executed directly
runMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

export { runMigrations };
