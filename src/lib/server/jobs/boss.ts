import PgBoss from 'pg-boss';
import { env } from '../env';

let boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (boss) return boss;
  boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    schema: env.PG_BOSS_SCHEMA ?? 'public'
  });
  await boss.start();
  return boss;
}
