import * as fs from 'fs';
import * as path from 'path';
import { WorkerProfile, RetailerProfile } from './types';

export function loadWorkers(): WorkerProfile[] {
  const dir = path.join(__dirname, '../assets/workers');
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as WorkerProfile);
}

export function loadRetailer(id = 'r001'): RetailerProfile {
  const fp = path.join(__dirname, `../assets/retailers/${id}.json`);
  return JSON.parse(fs.readFileSync(fp, 'utf-8')) as RetailerProfile;
}
