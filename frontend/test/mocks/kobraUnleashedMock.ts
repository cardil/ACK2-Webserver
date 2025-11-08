// frontend/test/mocks/kobraUnleashedMock.ts
import { Server as SocketIOServer } from 'socket.io';
import { mockPrinter, Printer, PrintJob } from './kobraData';
import { ViteDevServer } from 'vite';

let printer: Printer = JSON.parse(JSON.stringify(mockPrinter)); // Deep copy to prevent mutation
let printJobInterval: NodeJS.Timeout | null = null;

export function createKobraUnleashedMock(server: ViteDevServer) {
	if (!server.httpServer) {
		console.error('HTTP server is not available');
		return;
	}
	const io = new SocketIOServer(server.httpServer, {
		cors: {
			origin: '*'
		}
	});

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
			}
		});

		socket.on('resume_print', () => {
			if (printer.state === 'paused') {
				printer.state = 'printing';
				printer.print_job!.state = 'printing';
				startPrintSimulation(io);
				io.emit('printer_updated', { id: printer.id, printer });
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
	if (printer.print_job) {
		printer.print_job.state = finalState;
		printer.print_job.progress = finalState === 'done' ? 100 : printer.print_job.progress;
	}
	printer.state = 'free';
	io.emit('printer_updated', { id: printer.id, printer });
	// Reset job after a short delay
	setTimeout(() => {
		printer.print_job = null;
		io.emit('printer_updated', { id: printer.id, printer });
	}, 2000);
}
