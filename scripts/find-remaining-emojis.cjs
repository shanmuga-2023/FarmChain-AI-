const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['.git', 'node_modules', 'dist'].includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = walk('frontend/src');
const results = [];

for (const f of files) {
  if (!/\.(js|css|html)$/.test(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  const matchedLines = [];
  lines.forEach((l, idx) => {
    if (emojiRegex.test(l)) {
      matchedLines.push({ lineNum: idx + 1, text: l.trim().substring(0, 100) });
    }
  });
  if (matchedLines.length > 0) {
    results.push({ file: f, count: matchedLines.length, samples: matchedLines.slice(0, 5) });
  }
}

console.log('Remaining files with emojis:', results.length);
results.forEach(r => {
  console.log(`\n--- ${r.file} (${r.count} lines) ---`);
  r.samples.forEach(s => console.log(`  L${s.lineNum}: ${s.text}`));
});
