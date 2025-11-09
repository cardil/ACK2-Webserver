// frontend/test/mocks/kobraUnleashedMock.ts
import { Server as SocketIOServer } from 'socket.io';
import { mockPrinter, Printer, PrintJob } from './kobraData';
import { ViteDevServer, Connect } from 'vite';

// This will hold the "real" state of the print job for simulation purposes
interface PrintSimulation {
	totalPrintTime: number; // The total real duration of the print in seconds
	startTime: number; // The timestamp when the print started
	shouldPubliclyHaveEta: boolean; // Flag to control if the UI sees the ETA
	speedMultiplier: number;
}

let printer: Printer = JSON.parse(JSON.stringify(mockPrinter)); // Deep copy to prevent mutation
let printJobInterval: NodeJS.Timeout | null = null;
let tempInterval: NodeJS.Timeout | null = null;
let simulation: PrintSimulation | null = null;


const ROOM_TEMP = 25;
const TARGET_NOZZLE_TEMP = 215;
const TARGET_BED_TEMP = 60;
const PREHEAT_SECONDS = 15;
const COOLDOWN_SECONDS = 10;
const BASE_SIMULATION_SPEED = 10;

/**
 * Clears all active simulation intervals.
 */
function clearAllIntervals() {
	if (printJobInterval) {
		clearInterval(printJobInterval);
		printJobInterval = null;
	}
	if (tempInterval) {
		clearInterval(tempInterval);
		tempInterval = null;
	}
}

function calculateSpeedMultiplier(totalPrintTimeSeconds: number): number {
	const tenMinutesInSeconds = 10 * 60;
	if (totalPrintTimeSeconds <= tenMinutesInSeconds) {
		return BASE_SIMULATION_SPEED;
	}
	const printTimeMinutes = totalPrintTimeSeconds / 60;
	const multiplier = BASE_SIMULATION_SPEED + (printTimeMinutes - 10);
	return Math.round(multiplier);
}

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
						clearAllIntervals();

						const filenameMatch = body.match(/filename="([^"]+)"/);
						const filename = filenameMatch
							? filenameMatch[1]
							: `uploaded_file_${Date.now()}.gcode`;

						// Heuristics for print time and layers
						const fileSizeInKb = body.length / 1024;
						const estimatedPrintTime = (fileSizeInKb / 100) * 6 * 60; // 100KB = 6 mins
						const totalLayers = Math.max(10, Math.floor(estimatedPrintTime / 30)); // Avg 30s per layer

						// 50% chance of having no ETA from the slicer
						const hasEta = Math.random() < 0.5;
						if (!hasEta) {
							console.log('📠 [Kobra Mock] Simulating a job with no initial ETA.');
						}

						// Set up the internal simulation state
						const speedMultiplier = calculateSpeedMultiplier(estimatedPrintTime);
						simulation = {
							totalPrintTime: estimatedPrintTime,
							startTime: 0, // Will be set when preheating finishes
							shouldPubliclyHaveEta: hasEta,
							speedMultiplier
						};

						printer.state = 'downloading';
						printer.print_job = {
							taskid: Math.random().toString(36).substring(7),
							filename: filename,
							filepath: '/',
							state: 'downloading',
							remaining_time: hasEta ? estimatedPrintTime : 0,
							progress: 0,
							print_time: 0,
							supplies_usage: 0,
							total_layers: totalLayers,
							curr_layer: 0,
							fan_speed: 100,
							z_offset: 0,
							print_speed_mode: 1
						};
						io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
						console.log(
							`📠 [Kobra Mock] Downloading ${filename}, estimated time: ${estimatedPrintTime}s`
						);

						// Transition to preheating after a short delay
						setTimeout(() => {
							startPreheating(io);
						}, 1500);

						res.writeHead(200);
						res.end('File uploaded successfully');
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
				clearAllIntervals();
				const { file } = data;
				// Find the file in the mock data to get its size
				const fileData = printer.files[0].find((f) => f.filename === file);
				const fileSizeInKb = (fileData?.size ?? 200000) / 1024; // Default to 200KB if not found
				const estimatedPrintTime = (fileSizeInKb / 100) * 6 * 60; // 100KB = 6 mins
				const totalLayers = Math.max(10, Math.floor(estimatedPrintTime / 30)); // Avg 30s per layer
				const hasEta = Math.random() < 0.5;
				if (!hasEta) {
					console.log('📠 [Kobra Mock] Simulating a job with no initial ETA.');
				}

				// Set up the internal simulation state
				const speedMultiplier = calculateSpeedMultiplier(estimatedPrintTime);
				simulation = {
					totalPrintTime: estimatedPrintTime,
					startTime: 0, // Will be set when preheating finishes
					shouldPubliclyHaveEta: hasEta,
					speedMultiplier
				};

				printer.state = 'downloading';
				printer.print_job = {
					taskid: Math.random().toString(36).substring(7),
					filename: file,
					filepath: '/',
					state: 'downloading',
					remaining_time: hasEta ? estimatedPrintTime : 0,
					progress: 0,
					print_time: 0,
					supplies_usage: 0,
					total_layers: totalLayers,
					curr_layer: 0,
					fan_speed: 100,
					z_offset: 0,
					print_speed_mode: 1
				};
				io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
				setTimeout(() => startPreheating(io), 500);
			}
		});

		socket.on('stop_print', () => {
			stopPrintSimulation(io, 'failed');
		});

		socket.on('pause_print', () => {
			if (printer.state === 'printing' && printer.print_job) {
				printer.state = 'paused';
				printer.print_job.state = 'paused';
				clearAllIntervals();
				io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
				console.log('📠 [Kobra Mock] Paused print job.');
			}
		});

		socket.on('resume_print', () => {
			if (printer.state === 'paused' && printer.print_job) {
				startPrintSimulation(io);
				console.log('📠 [Kobra Mock] Resumed print job.');
			}
		});

		socket.on('set_fan', (data) => {
			if (printer.print_job) {
				printer.print_job.fan_speed = data.speed;
				io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
			}
		});

		socket.on('disconnect', () => {
			console.log('🔌 [Kobra Mock] Client disconnected');
		});
	});
}

/**
 * Returns a version of the printer state that honors the simulation's rules,
 * like whether to hide the ETA.
 */
function getPublicPrinterState(): Printer {
	const publicPrinter = JSON.parse(JSON.stringify(printer)); // Deep copy
	if (simulation && publicPrinter.print_job && !simulation.shouldPubliclyHaveEta) {
		publicPrinter.print_job.remaining_time = 0;
	}
	return publicPrinter;
}

function startPrintSimulation(io: SocketIOServer) {
	if (printJobInterval || !printer.print_job || !simulation) return;

	printer.state = 'printing';
	printer.print_job.state = 'printing';
	// To resume correctly, we calculate what the startTime *would have been*
	// if the print had been running continuously at the accelerated speed to
	// reach the current `print_time`.
	const simulatedElapsedTime = printer.print_job.print_time;
	const wallClockTimeEquivalent = (simulatedElapsedTime * 1000) / simulation.speedMultiplier;
	simulation.startTime = Date.now() - wallClockTimeEquivalent;

	io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
	console.log(
		`📠 [Kobra Mock] Starting time-based print simulation (Speed: ${simulation.speedMultiplier}x).`
	);

	const simulationInterval = 250; // Update 4 times per second for smoothness

	printJobInterval = setInterval(() => {
		const job = printer.print_job!;
		const sim = simulation!;
		const wallClockTime = (Date.now() - sim.startTime) / 1000; // in seconds
		const elapsedTime = wallClockTime * sim.speedMultiplier;

		if (elapsedTime >= sim.totalPrintTime) {
			stopPrintSimulation(io, 'done');
			return;
		}

		job.print_time = elapsedTime;
		job.progress = Math.min(100, Math.round((elapsedTime / sim.totalPrintTime) * 100));
		job.remaining_time = sim.totalPrintTime - elapsedTime;
		job.curr_layer = Math.floor((job.progress / 100) * job.total_layers);
		const filamentIncrease =
			(Math.random() * 2 + 1) * (simulationInterval / 1000) * sim.speedMultiplier;
		job.supplies_usage += filamentIncrease;

		io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
	}, simulationInterval);
}

function stopPrintSimulation(io: SocketIOServer, finalState: 'done' | 'failed') {
	clearAllIntervals();
	simulation = null;

	const job = printer.print_job;
	if (!job) {
		printer.state = 'free';
		io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
		return;
	}


	job.state = finalState;
	job.progress = finalState === 'done' ? 100 : job.progress;

	if (finalState === 'done') {
		const completedFile = {
			filename: job.filename,
			size: Math.floor(Math.random() * 100000),
			timestamp: job.print_time,
			is_dir: false,
			is_local: true
		};
		printer.files[0].unshift(completedFile);
	}
	startCooldown(io);

	printer.state = 'free';
	io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });

	setTimeout(() => {
		printer.print_job = null;
		io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
	}, 2000);
}

function startPreheating(io: SocketIOServer) {
	clearAllIntervals();
	printer.state = 'preheating';
	printer.print_job!.state = 'preheating';
	printer.target_nozzle_temp = String(TARGET_NOZZLE_TEMP);
	printer.target_hotbed_temp = String(TARGET_BED_TEMP);
	io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
	console.log('📠 [Kobra Mock] Preheating...');

	const steps = PREHEAT_SECONDS;
	let currentStep = 0;
	const initialNozzleTemp = Number(printer.nozzle_temp);
	const initialBedTemp = Number(printer.hotbed_temp);

	tempInterval = setInterval(() => {
		currentStep++;
		if (currentStep > steps) {
			clearAllIntervals();
			printer.nozzle_temp = String(TARGET_NOZZLE_TEMP);
			printer.hotbed_temp = String(TARGET_BED_TEMP);
			startPrintSimulation(io);
			return;
		}

		const fraction = currentStep / steps;
		printer.nozzle_temp = String(
			Math.round(initialNozzleTemp + (TARGET_NOZZLE_TEMP - initialNozzleTemp) * fraction)
		);
		printer.hotbed_temp = String(
			Math.round(initialBedTemp + (TARGET_BED_TEMP - initialBedTemp) * fraction)
		);
		io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
	}, 1000);
}

function startCooldown(io: SocketIOServer) {
	clearAllIntervals();
	printer.target_nozzle_temp = '0';
	printer.target_hotbed_temp = '0';
	io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
	console.log('📠 [Kobra Mock] Cooling down...');

	const steps = COOLDOWN_SECONDS;
	let currentStep = 0;
	const initialNozzleTemp = Number(printer.nozzle_temp);
	const initialBedTemp = Number(printer.hotbed_temp);

	tempInterval = setInterval(() => {
		currentStep++;
		if (currentStep > steps) {
			clearInterval(tempInterval!);
			tempInterval = null;
			printer.nozzle_temp = String(ROOM_TEMP);
			printer.hotbed_temp = String(ROOM_TEMP);
			io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
			return;
		}

		const fraction = currentStep / steps;
		printer.nozzle_temp = String(
			Math.round(initialNozzleTemp - (initialNozzleTemp - ROOM_TEMP) * fraction)
		);
		printer.hotbed_temp = String(
			Math.round(initialBedTemp - (initialBedTemp - ROOM_TEMP) * fraction)
		);
		io.emit('printer_updated', { id: printer.id, printer: getPublicPrinterState() });
	}, 1000);
}
