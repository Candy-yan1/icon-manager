import fs from 'node:fs';
import path from 'node:path';

const iconDir = path.join(process.cwd(), 'public', 'icon');
const outputDir = path.join(process.cwd(), 'src', 'generated');
const outputFile = path.join(outputDir, 'icons.json');
const outputEdgeFile = path.join(process.cwd(), 'src', 'generated', 'icons-edge.js');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let icons = [];

try {
  if (fs.existsSync(iconDir)) {
    icons = fs.readdirSync(iconDir).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].includes(ext);
    });
    console.log(`Found ${icons.length} icons.`);
  } else {
    console.warn(`Icon directory not found: ${iconDir}`);
  }
} catch (error) {
  console.error('Error reading icon directory:', error);
}

// Write JSON for Frontend
fs.writeFileSync(outputFile, JSON.stringify(icons, null, 2));
console.log(`Icon list written to ${outputFile}`);

// Write JS for Edge Routine
const edgeContent = `export const icons = ${JSON.stringify(icons)};`;
fs.writeFileSync(outputEdgeFile, edgeContent);
console.log(`Edge icon list written to ${outputEdgeFile}`);
