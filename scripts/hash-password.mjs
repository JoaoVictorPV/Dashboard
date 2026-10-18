import { randomBytes, scryptSync } from 'node:crypto';

async function hiddenPrompt(label) {
  if (!process.stdin.isTTY) throw new Error('Execute este comando em um terminal interativo.');
  process.stdout.write(label);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  let value = '';
  return new Promise((resolve, reject) => process.stdin.on('data', (key) => {
    if (key === '\u0003') { process.stdin.setRawMode(false); reject(new Error('Cancelado.')); return; }
    if (key === '\r' || key === '\n') { process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); resolve(value); return; }
    if (key === '\u007f' || key === '\b') { value = value.slice(0, -1); return; }
    if (key >= ' ') value += key;
  }));
}

const password = await hiddenPrompt('Digite a nova senha (não será exibida): ');
if (password.length < 12) throw new Error('Use uma senha com pelo menos 12 caracteres.');
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
console.log(`\nADMIN_PASSWORD_HASH=scrypt:16384:8:1:${salt.toString('hex')}:${hash.toString('hex')}\n`);
console.log('Copie apenas a linha acima para as variáveis protegidas da Vercel.');
