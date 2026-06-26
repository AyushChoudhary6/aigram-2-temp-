const fs = require('fs');

const BSScreen = 'src/screens/business/BusinessScreen.tsx';
let bssContent = fs.readFileSync(BSScreen, 'utf8');
bssContent = bssContent.replace(/require\(['"].*?video\d\.mp4['"]\)/g, "'https://www.w3schools.com/html/mov_bbb.mp4'");
fs.writeFileSync(BSScreen, bssContent);

const DummyShorts = 'src/utils/dummyShorts.ts';
let dsContent = fs.readFileSync(DummyShorts, 'utf8');
dsContent = dsContent.replace(/require\(['"].*?video\d\.mp4['"]\)/g, "'https://www.w3schools.com/html/mov_bbb.mp4'");
fs.writeFileSync(DummyShorts, dsContent);
