// generate.js
import fs from 'fs';
import path from 'path';

const gamesDir = path.resolve('./games');
const templateFile = path.resolve('./index.template.html');
const outputFile = path.resolve('./index.html');

const folders = fs.readdirSync(gamesDir)
  .filter(name => fs.statSync(path.join(gamesDir, name)).isDirectory());

const template = fs.readFileSync(templateFile, 'utf-8');
const result = template.replace('__GAMES__', JSON.stringify(folders, null, 2));

fs.writeFileSync(outputFile, result);

console.log(`✅ index.html generated with ${folders.length} games:`);
console.log(folders);
