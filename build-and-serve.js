const { execSync } = require('child_process');
const path = require('path');

console.log('Building Expo web app...');

try {
  execSync('npx expo export -p web --output-dir dist', {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('Build complete! Starting server...');
  require('./server.js');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
