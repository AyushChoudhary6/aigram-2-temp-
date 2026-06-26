const fs = require('fs');
const content = fs.readFileSync('src/utils/dummyShorts.ts', 'utf8');
const regex = /"title": "(.*?)"/g;
let match;
let i = 0;
while ((match = regex.exec(content)) !== null && i < 50) {
  console.log(`${++i}: ${match[1]}`);
}
