// Sunucu ve istemciyi birlikte geliştirme modunda başlatır.
import { spawn } from 'node:child_process';

const env = { ...process.env, GAME_DAY_MS: process.env.GAME_DAY_MS ?? '3000' };
const procs = [
  spawn('npx', ['tsx', 'watch', 'src/server/index.ts'], { stdio: 'inherit', env }),
  spawn('npx', ['vite'], { stdio: 'inherit', env }),
];
const stop = () => procs.forEach((p) => p.kill('SIGINT'));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => code && stop()));
