import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'mock-api-server',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url?.startsWith('/api/')) {
						const filePath = path.join(
							__dirname,
							'..', // Go up from 'frontend' to project root
							'webserver',
							'opt',
							'webfs',
							req.url
						);

						if (fs.existsSync(filePath)) {
							fs.readFile(filePath, 'utf-8', (err, data) => {
								if (err) {
									res.writeHead(500);
									res.end('Error reading the file');
									return;
								}
								res.writeHead(200, { 'Content-Type': 'application/json' });
								res.end(data);
							});
						} else {
							res.writeHead(404);
							res.end('Not Found');
						}
					} else {
						next();
					}
				});
			}
		}
	]
});
