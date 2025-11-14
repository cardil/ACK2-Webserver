import fs from 'fs';
import path from 'path';
import { parseMockCommandsFromSources, commandSources } from './mockCommandParser.mjs';

const outputPath = path.resolve(process.cwd(), 'test/mocks/mockCommands.json');

// "Make" pattern: Only build if the source files are newer than the output.
if (fs.existsSync(outputPath)) {
  const sourcePaths = commandSources();
  const sourceStats = sourcePaths.map(p => fs.statSync(p).mtimeMs);
  const latestSourceTime = Math.max(...sourceStats);
  const outputStats = fs.statSync(outputPath);
  if (latestSourceTime <= outputStats.mtimeMs) {
    console.log('✅ Mock commands manifest is up to date. Skipping build.');
    process.exit(0);
  }
}

console.log('Building mock commands manifest...');

try {
  const allCommands = parseMockCommandsFromSources();
  fs.writeFileSync(outputPath, `${JSON.stringify(allCommands, null, 2)}\n`);
  console.log(`✅ Mock commands manifest built successfully at ${outputPath}`);
} catch (error) {
  console.error('🔥 Failed to build mock commands manifest:', error);
  process.exit(1);
}
