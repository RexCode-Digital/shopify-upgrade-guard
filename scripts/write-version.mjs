import fs from 'node:fs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
fs.writeFileSync('src/version.js',`// Generated from package.json.\nexport const TOOL_VERSION = ${JSON.stringify(version)};\n`);
fs.writeFileSync('src/version-data.js',`// Generated from data/versions.json.\nexport default ${fs.readFileSync('data/versions.json','utf8').trim()};\n`);
