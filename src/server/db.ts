import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'db.json');

export interface DbStore {
  entries: any[];
  users: any[];
  pledges?: any[];
  badges?: any[];
  [key: string]: any;
}

export function readDb(): DbStore {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      users: Array.isArray(parsed.users) ? parsed.users : [],
      pledges: Array.isArray(parsed.pledges) ? parsed.pledges : [],
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
    };
  } catch {
    return { entries: [], users: [], pledges: [], badges: [] };
  }
}

export function writeDb(data: DbStore): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[db.json] Write failed:', e);
  }
}
