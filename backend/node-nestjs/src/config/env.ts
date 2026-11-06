import { config as loadEnv } from 'dotenv';

// Optional local env file; absent in containers that inject env vars.
// Kept in its own module so anything that reads `process.env` while a module is
// being evaluated (entity column decorators) sees `.env.local` first. dotenv
// never overrides variables that are already set.
loadEnv({ path: '.env.local' });
