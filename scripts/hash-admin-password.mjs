import { pbkdf2Sync, randomBytes } from 'node:crypto';

function printCredentials(password) {
  const salt = randomBytes(16);
  // Cloudflare Workers production caps a single PBKDF2 operation at 100,000
  // iterations. The generated admin password has 192 bits of random entropy.
  const iterations = 100000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  console.log('\nAdmin password (save this in your password manager):');
  console.log(password);
  console.log('\nADMIN_PASSWORD_HASH (paste this into the Cloudflare secret):');
  console.log(`pbkdf2-sha256$${iterations}$${salt.toString('base64')}$${hash.toString('base64')}`);
}

if (process.argv.includes('--generate')) {
  const password = randomBytes(24).toString('base64url');
  printCredentials(password);
  process.exit(0);
}

if (!process.stdin.isTTY) {
  console.error('Run this command in an interactive terminal.');
  process.exit(1);
}

process.stdout.write('Choose the InnStack Studio admin password: ');
process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
let password = '';

process.stdin.on('data', (key) => {
  if (key === '\u0003') process.exit(130);
  if (key === '\r' || key === '\n') {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write('\n');
    if (password.length < 14) {
      console.error('Use at least 14 characters. No hash was generated.');
      process.exitCode = 1;
      return;
    }
    printCredentials(password);
    return;
  }
  if (key === '\u007f' || key === '\b') { password = password.slice(0, -1); return; }
  if (key >= ' ') password += key;
});
