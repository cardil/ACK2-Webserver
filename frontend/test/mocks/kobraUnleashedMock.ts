// frontend/test/mocks/kobraUnleashedMock.ts
import { Server as SocketIOServer } from 'socket.io';
import { mockPrinter, Printer, PrintJob } from './kobraData';
import { ViteDevServer, Connect } from 'vite';

let printer: Printer = JSON.parse(JSON.stringify(mockPrinter)); // Deep copy to prevent mutation
let printJobInterval: NodeJS.Timeout | null = null;

export function createKobraUnleashedHttpMiddleware(io: SocketIOServer): Connect.NextHandleFunction {
	return (req, res, next) => {
		// Handle Kobra Unleashed HTTP API mocks
		if (req.url?.startsWith('/api/')) {
			const filesUrlRegex = /^\/api\/printer\/([a-zA-Z0-9]+)\/files$/;
			const printUrlRegex = /^\/api\/print$/;

			const filesMatch = req.url.match(filesUrlRegex);
			const printMatch = req.url.match(printUrlRegex);

			if (filesMatch && req.method === 'GET') {
				const printerId = filesMatch[1];
				if (printerId === printer.id) {
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify(printer.files[0])); // Return local files
				} else {
					res.writeHead(404);
					res.end('Printer not found');
				}
				return;
			}

			if (printMatch && req.method === 'POST') {
				if (printer.state === 'free') {
					let body = '';
					req.on('data', (chunk) => {
						body += chunk.toString();
					});

					req.on('end', () => {
						const filenameMatch = body.match(/filename="([^"]+)"/);
						const filename = filenameMatch
							? filenameMatch[1]
							: `uploaded_file_${Date.now()}.gcode`;

						printer.state = 'printing';
						printer.print_job = {
							taskid: Math.random().toString(36).substring(7),
							filename: filename,
							filepath: '/',
							state: 'printing',
							remaining_time: 7200, // longer print for uploads
							progress: 0,
							print_time: 0,
							supplies_usage: 0,
							total_layers: 250,
							curr_layer: 0,
							fan_speed: 100,
							z_offset: 0,
							print_speed_mode: 1
						};
						io.emit('printer_updated', { id: printer.id, printer });
						startPrintSimulation(io);

						res.writeHead(200);
						res.end('File uploaded successfully');
						console.log(
							`📠 [Kobra Mock] Simulated file upload for ${filename} and started print.`
						);
					});
				} else {
					res.writeHead(400);
					res.end('Printer is busy');
				}
				return;
			}
		}

		// Handle webserver API mocks (passthrough)
		next();
	};
}

export function createKobraUnleashedSocketMock(server: ViteDevServer) {
	if (!server.httpServer) {
		console.error('HTTP server is not available');
		return;
	}
	const io = new SocketIOServer(server.httpServer, {
		cors: {
			origin: '*'
		}
	});
	attachSocketListeners(io);
	// Return the io instance so it can be used by the HTTP mock
	return io;
}


function attachSocketListeners(io: SocketIOServer) {
	io.on('connection', (socket) => {
		console.log('🔌 [Kobra Mock] Client connected');

		// Emit initial state on connection
		socket.emit('printer_list', { [printer.id]: printer });

		socket.on('get_printer_list', () => {
			socket.emit('printer_list', { [printer.id]: printer });
		});

		socket.on('print_file', (data) => {
			if (printer.state === 'free') {
				const { file } = data;
				printer.state = 'printing';
				printer.print_job = {
					taskid: Math.random().toString(36).substring(7),
					filename: file,
					filepath: '/',
					state: 'printing',
					remaining_time: 3600,
					progress: 0,
					print_time: 0,
					supplies_usage: 0,
					total_layers: 100,
					curr_layer: 0,
					fan_speed: 100,
					z_offset: 0,
					print_speed_mode: 1
				};
				io.emit('printer_updated', { id: printer.id, printer });
				startPrintSimulation(io);
			}
		});

		socket.on('stop_print', () => {
			stopPrintSimulation(io, 'failed');
		});

		socket.on('pause_print', () => {
			if (printer.state === 'printing' && printer.print_job) {
				printer.state = 'paused';
				printer.print_job.state = 'paused';
				if (printJobInterval) {
					clearInterval(printJobInterval);
					printJobInterval = null;
				}
				io.emit('printer_updated', { id: printer.id, printer });
				console.log('📠 [Kobra Mock] Paused print job.');
			}
		});

		socket.on('resume_print', () => {
			if (printer.state === 'paused') {
				printer.state = 'printing';
				if (printer.print_job) {
					printer.print_job.state = 'printing';
				}
				startPrintSimulation(io);
				io.emit('printer_updated', { id: printer.id, printer });
				console.log('📠 [Kobra Mock] Resumed print job.');
			}
		});

		socket.on('set_fan', (data) => {
			if (printer.print_job) {
				printer.print_job.fan_speed = data.speed;
				io.emit('printer_updated', { id: printer.id, printer });
			}
		});

		socket.on('disconnect', () => {
			console.log('🔌 [Kobra Mock] Client disconnected');
		});
	});
}


function startPrintSimulation(io: SocketIOServer) {
	if (printJobInterval || !printer.print_job) return;

	printJobInterval = setInterval(() => {
		const job = printer.print_job;
		if (!job || job.progress >= 100) {
			stopPrintSimulation(io, 'done');
			return;
		}

		job.progress = Math.min(100, job.progress + 1);
		job.print_time += 36;
		job.remaining_time = Math.max(0, 3600 - job.print_time);
		job.curr_layer = Math.floor((job.progress / 100) * job.total_layers);
		job.supplies_usage += 0.5;

		io.emit('printer_updated', { id: printer.id, printer });
	}, 1000);
}

function stopPrintSimulation(io: SocketIOServer, finalState: 'done' | 'failed') {
	if (printJobInterval) {
		clearInterval(printJobInterval);
		printJobInterval = null;
	}

	const job = printer.print_job;
	if (!job) {
		printer.state = 'free';
		io.emit('printer_updated', { id: printer.id, printer });
		return;
	}

	job.state = finalState;
	job.progress = finalState === 'done' ? 100 : job.progress;

	if (finalState === 'done') {
		// Add the completed job to the print history
		const completedFile = {
			filename: job.filename,
			size: Math.floor(Math.random() * 100000), // a plausible random size
			timestamp: job.print_time,
			is_dir: false,
			is_local: true
		};
		// Add to the beginning of the list
		printer.files[0].unshift(completedFile);
	}

	printer.state = 'free';
	io.emit('printer_updated', { id: printer.id, printer });

	// Reset job after a short delay
	setTimeout(() => {
		printer.print_job = null;
		io.emit('printer_updated', { id: printer.id, printer });
	}, 2000);
}
