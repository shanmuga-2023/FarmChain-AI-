// ============================================
// FarmChain AI — Hardcoded String Auditor
// Scans scope files to find potential hardcoded strings
// ============================================

import fs from 'fs';
import path from 'path';

const scopeFiles = [
  'frontend/src/pages/landing.js',
  'frontend/src/pages/auth.js',
  'frontend/src/pages/farmer/dashboard.js',
  'frontend/src/pages/farmer/products.js',
  'frontend/src/pages/farmer/orders.js',
  'frontend/src/pages/farmer/product-wizard.js',
  'frontend/src/pages/intermediary/dashboard.js',
  'frontend/src/pages/intermediary/inventory.js',
  'frontend/src/pages/retailer/dashboard.js',
  'frontend/src/pages/retailer/source.js',
  'frontend/src/pages/consumer/marketplace.js',
  'frontend/src/pages/consumer/orders.js',
  'frontend/src/pages/consumer/trace.js',
  'frontend/src/pages/admin/dashboard.js',
  'frontend/src/pages/admin/fraud.js',
  'frontend/src/pages/admin/explorer.js',
  'frontend/src/pages/admin/forecast.js',
  'frontend/src/pages/admin/users.js',
  'frontend/src/pages/admin/products.js',
  'frontend/src/components/sidebar.js',
  'frontend/src/components/live-camera.js',
  'frontend/src/components/notification-center.js',
  'frontend/src/components/charts.js',
  'frontend/src/components/camera-qr-scanner.js',
  'frontend/src/components/wallet-connect.js',
  'frontend/src/utils/voice.js',
  'frontend/src/utils/notifications.js',
  'frontend/src/utils/api.js',
  'frontend/src/utils/helpers.js',
  'frontend/src/ai/quality-guard.js',
  'frontend/src/ai/fraud-detector.js',
  'frontend/src/ai/geo-velocity.js',
  'frontend/src/ai/visual-oracle.js',
];

console.log(`Auditing ${scopeFiles.length} scope files for hardcoded strings...\n`);

let totalWarnings = 0;

for (const file of scopeFiles) {
  if (!fs.existsSync(file)) {
    console.warn(`File not found: ${file}`);
    continue;
  }
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip comments, imports, console logs, style blocks, attribute definitions
    if (
      line.trim().startsWith('//') ||
      line.trim().startsWith('*') ||
      line.trim().startsWith('/*') ||
      line.includes('import ') ||
      line.includes('console.') ||
      line.includes('style=') ||
      line.includes('stroke=') ||
      line.includes('fill=') ||
      line.includes('rgba(')
    ) return;

    // Check for hardcoded raw text in buttons or headers not using i18n
    const suspiciousPatterns = [
      /<button[^>]*>([A-Za-z]{4,}\s?[A-Za-z]*)<\/button>/,
      /<h3>([A-Za-z]{4,}\s?[A-Za-z]*)<\/h3>/,
      /<h2>([A-Za-z]{4,}\s?[A-Za-z]*)<\/h2>/,
    ];

    for (const pat of suspiciousPatterns) {
      const match = line.match(pat);
      if (match && !line.includes('i18n.t') && !line.includes('${')) {
        console.warn(`⚠️ [${path.basename(file)}:${idx + 1}] Possible hardcoded text: "${match[1]}"`);
        totalWarnings++;
      }
    }
  });
}

if (totalWarnings === 0) {
  console.log('✅ Audit complete! No raw hardcoded buttons or headings found in scope files.');
} else {
  console.log(`\nFound ${totalWarnings} potential hardcoded string instances.`);
}
