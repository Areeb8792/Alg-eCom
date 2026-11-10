import fs from 'fs';
import dotenv from 'dotenv';

// Load untracked .env file
if (!fs.existsSync('.env')) {
  console.error('❌ Error: .env file does not exist');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync('.env', 'utf8'));
const composeContent = fs.readFileSync('docker-compose.yml', 'utf8');

// Match ${VAR} and ${VAR:-fallback} and ${VAR:?error}
const varRegex = /\$\{([A-Za-z0-9_]+)(?::([-?])([^}]*))?\}/g;
let match: RegExpExecArray | null;
const missingMandatory: string[] = [];
const evaluatedVars = new Set<string>();

while ((match = varRegex.exec(composeContent)) !== null) {
  const varName = match[1];
  const operator = match[2];
  const fallback = match[3];
  evaluatedVars.add(varName);

  const val = envConfig[varName] || process.env[varName];
  if (!val) {
    if (operator === '?') {
      missingMandatory.push(`${varName}: ${fallback}`);
    } else if (fallback === undefined) {
      missingMandatory.push(varName);
    }
  }
}

// Verify host mounts
const mountRegex = /-\s+(\.[^:]+):/g;
let mountMatch: RegExpExecArray | null;
const missingMounts: string[] = [];
while ((mountMatch = mountRegex.exec(composeContent)) !== null) {
  const hostPath = mountMatch[1].trim();
  if (!fs.existsSync(hostPath)) {
    missingMounts.push(hostPath);
  }
}

const requiredSecrets = ['DB_PASSWORD', 'JWT_SECRET', 'ADMIN_PASSWORD', 'GRAFANA_ADMIN_PASSWORD'];
const allSecretsPresent = requiredSecrets.every((k) => !!envConfig[k]);

console.log('--- Docker Compose Pre-Flight Validation ---');
console.log(`Referenced Environment Variables: ${evaluatedVars.size}`);
console.log(`All Required Secrets in .env: ${allSecretsPresent ? 'YES (Securely Loaded)' : 'NO'}`);
console.log(`Missing Variables: ${missingMandatory.length === 0 ? 'None (All satisfied)' : missingMandatory.join(', ')}`);
console.log(`Host Volume Mounts Verified: ${missingMounts.length === 0 ? 'All exist on disk' : missingMounts.join(', ')}`);

if (!allSecretsPresent || missingMandatory.length > 0 || missingMounts.length > 0) {
  console.error('❌ Validation FAILED');
  process.exit(1);
}

console.log('✅ docker-compose.yml and .env specification validation PASSED (No secrets printed).');
