// frontend/test/check-devmode.mjs
import { createServer } from 'vite';
import fetch from 'node-fetch';

console.log('Attempting to programmatically start and test the Vite dev server...');

let server;
const capturedErrors = [];

// Create a custom logger to capture errors instead of letting Vite print them
const customLogger = {
  ...console,
  error: (msg) => {
    capturedErrors.push(msg);
  },
  warn: () => {}, // Suppress warnings for this test
  info: () => {}, // Suppress info for this test
};

try {
  server = await createServer({
    root: process.cwd(),
    configFile: 'vite.config.ts',
    customLogger, // Use our custom logger
    server: {
      port: 0, // Listen on a random free port
    },
  });

  await server.listen();

  const address = server.httpServer.address();
  if (typeof address === 'string' || address === null) {
    throw new Error('Server address is not in the expected format.');
  }

  const port = address.port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`Vite server listening on ${baseUrl}. Making test requests...`);

  const pathsToTest = ['/', '/leveling'];

  for (const path of pathsToTest) {
    const url = `${baseUrl}${path}`;
    console.log(`- Testing ${url}...`);
    try {
      await fetch(url);
    } catch (fetchError) {
      capturedErrors.push(`Fetch failed for ${path}: ${fetchError.message}`);
    }
  }

  // Now, check if our logger captured any errors during the server's lifecycle.
  if (capturedErrors.length > 0) {
    console.error('❌ Errors were logged during Vite server startup or request handling:');
    capturedErrors.forEach(err => console.error(err));
    throw new Error('Smoke test failed due to logged errors.');
  }

  console.log('✅ Vite server started and handled all test requests without errors.');

  await server.close();
  process.exit(0);

} catch (e) {
  // This block will catch the error we throw above, or any initial setup error.
  console.error('❌ Smoke test failed:', e.message);
  if (server) {
    await server.close();
  }
  process.exit(1);
}
