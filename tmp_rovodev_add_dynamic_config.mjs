import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('src/app/api/**/route.ts');

const configToAdd = `
// Force dynamic rendering
export const dynamic = 'force-dynamic';
`;

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  
  // Check if already has dynamic config
  if (content.includes("export const dynamic")) {
    console.log(`Skipping ${file} - already has dynamic config`);
    return;
  }
  
  // Find the first import statement
  const firstImportIndex = content.indexOf('import');
  if (firstImportIndex === -1) {
    console.log(`Skipping ${file} - no imports found`);
    return;
  }
  
  // Find the end of all imports (first line that doesn't start with import or is not empty)
  const lines = content.split('\n');
  let lastImportLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('import') || trimmed === '' || trimmed.startsWith('//')) {
      lastImportLine = i;
    } else {
      break;
    }
  }
  
  // Insert config after imports
  lines.splice(lastImportLine + 1, 0, configToAdd);
  
  const newContent = lines.join('\n');
  writeFileSync(file, newContent, 'utf-8');
  console.log(`✓ Added dynamic config to ${file}`);
});

console.log(`\n✓ Processed ${files.length} API route files`);
