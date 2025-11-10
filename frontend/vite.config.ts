import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import {
	createKobraUnleashedHttpMiddleware,
	createKobraUnleashedSocketMock
} from './test/mocks/kobraUnleashedMock';
import { createMockApiMiddleware } from './test/mocks/mockApi';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'mock-api-server',
			configureServer(server) {
				const host = server.config.server.host || 'localhost';
				const port = server.config.server.port || 5173;
				const protocol = server.config.server.https ? 'https' : 'http';
				const defaultMqttUrl = `${protocol}://${host}:${port}`;
				const io = createKobraUnleashedSocketMock(server);
				if (io) {
					server.middlewares.use(createKobraUnleashedHttpMiddleware(io));
				}

				server.middlewares.use(createMockApiMiddleware(defaultMqttUrl));
				server.middlewares.use((req, res, next) => {
					if (req.url?.startsWith('/webcam/cam.jpg')) {
						const imagePath = path.join(__dirname, 'static', 'webcam', 'default.jpg');
						if (fs.existsSync(imagePath)) {
							fs.readFile(imagePath, (err, data) => {
								if (err) {
									res.writeHead(500);
									res.end('Error reading the file');
									return;
								}
								res.writeHead(200, { 'Content-Type': 'image/jpeg' });
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
