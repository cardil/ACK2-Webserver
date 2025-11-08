import fs from 'fs';
import path from 'path';
import type { Connect } from 'vite';

// Path to the source of truth JSON files
const API_SOURCE_PATH = path.join(__dirname, '..', '..', '..', 'webserver', 'opt', 'webfs', 'api');

function getApiFilePath(url: string): string | null {
    const apiEndpoint = url.substring('/api/'.length);
    if (!apiEndpoint || !['do.json', 'info.json', 'webserver.json'].includes(apiEndpoint)) {
        return null;
    }
    return path.join(API_SOURCE_PATH, apiEndpoint);
}

export function createMockApiMiddleware(defaultMqttUrl: string): Connect.NextHandleFunction {
    return (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
            return next();
        }

    const filePath = getApiFilePath(req.url);

        if (!filePath || !fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            if (req.url.endsWith('/webserver.json')) {
                const data = JSON.parse(fileContent);

                // Allow overriding via environment variable for development, otherwise use default
                data.mqtt_webui_url = process.env.VITE_MOCK_MQTT_URL || defaultMqttUrl;

                const modifiedContent = JSON.stringify(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(modifiedContent);
            } else {
                // For other files, serve them as is
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(fileContent);
            }
        } catch (error) {
            res.writeHead(500);
            res.end('Error processing the request');
            console.error(error);
        }
};
}
