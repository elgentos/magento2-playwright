const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(process.cwd(), '.env');

function getCurrentValue(key) {
  if (!fs.existsSync(ENV_FILE)) return null;

  const lines = fs.readFileSync(ENV_FILE, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(new RegExp(`^${key}=(.*)$`));
    if (match) return match[1];
  }
  return null;
}

function updateEnvFile(updates) {
  let lines = [];
  if (fs.existsSync(ENV_FILE)) {
    lines = fs.readFileSync(ENV_FILE, 'utf-8').split(/\r?\n/);
  }

  const remaining = { ...updates };

  lines = lines.map((line) => {
    for (const key of Object.keys(remaining)) {
      const match = line.match(new RegExp(`^${key}=`));
      if (match) {
        delete remaining[key];
        return `${key}=${updates[key]}`;
      }
    }
    return line;
  });

  for (const [key, value] of Object.entries(remaining)) {
    lines.push(`${key}=${value}`);
  }

  fs.writeFileSync(ENV_FILE, lines.join('\n'));
}

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return;
  const lines = fs.readFileSync(ENV_FILE, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

function getHttpCredentials() {
  const username = process.env.HTTP_AUTH_USERNAME;
  const password = process.env.HTTP_AUTH_PASSWORD;
  if (username && password) {
    return { username, password };
  }
  return null;
}

module.exports = { ENV_FILE, getCurrentValue, updateEnvFile, loadEnv, getHttpCredentials };
