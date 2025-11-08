import { writable, get } from 'svelte/store';
import { io, Socket } from 'socket.io-client';
import { webserverStore } from './webserver';
import { activePrinterIdStore } from './activePrinterId';

// Define the structure for a file on the printer
export interface PrinterFile {
	name: string;
	path: string;
	size: number;
}

// Define the structure for a print job
export interface PrintJob {
	taskid: string;
	filename: string;
	filepath: string;
  state: string;
	remaining_time: number;
	progress: number;
	print_time: number;
	supplies_usage: number;
	total_layers: number;
	curr_layer: number;
	fan_speed: number;
	z_offset: number;
	print_speed_mode: number;
}

// Define the structure for the printer data
export interface Printer {
	id: string;
	name: string;
	model_id: string;
	fwver: number;
	online: boolean;
	state: string;
	nozzle_temp: string;
	target_nozzle_temp: string;
	hotbed_temp: string;
	target_hotbed_temp: string;
    print_job: PrintJob | null;
	files: PrinterFile[];
}

function createPrinterStore() {
	const { subscribe, set, update } = writable<{ [id: string]: Printer }>({});
  let socket: Socket | undefined;

	webserverStore.subscribe((config) => {
		// Disconnect from the old socket if it exists
      if (socket) {
      socket.disconnect();
      socket = undefined;
      set({});
      }

		// Connect to the new socket if a URL is provided
		if (config?.mqtt_webui_url) {
      socket = io(config.mqtt_webui_url, {
				transports: ['websocket'],
				reconnectionAttempts: 5
      });

      socket.on('connect', () => {
        console.log('Connected to Kobra Unleashed');
        socket?.emit('get_printer_list');
      });

			socket.on('connect_error', (err) => {
				console.error('Connection to Kobra Unleashed failed:', err.message);
			});

      socket.on('printer_list', (printers: { [id: string]: Printer }) => {
        set(printers);
        // Automatically select the first printer if one isn't already selected
				// or if the currently selected one no longer exists.
        const printerIds = Object.keys(printers);
        if (printerIds.length > 0) {
            const currentActiveId = get(activePrinterIdStore);
					if (!currentActiveId || !printers[currentActiveId]) {
                activePrinterIdStore.select(printerIds[0]);
      }
    }
      });

			socket.on('printer_updated', ({ id, printer }: { id: string; printer: Printer }) => {
				update((currentPrinters) => ({
					...currentPrinters,
					[id]: printer
				}));
        });
      socket.on('disconnect', () => {
        console.log('Disconnected from Kobra Unleashed');
        set({}); // Clear printers on disconnect
      });
}
  });

	// Helper to safely emit socket commands
	const emitCommand = (command: string, printerId: string, extraData: object = {}) => {
		if (socket?.connected) {
			socket.emit(command, { printer_id: printerId, ...extraData });
		} else {
			console.warn(`Socket not connected. Cannot emit command '${command}'.`);
		}
  };

	return {
		subscribe,

		// Triggers the backend to refresh the file list for a specific printer.
		// The update will be pushed back via the 'printer_updated' event.
		refreshFiles: (printerId: string) => {
			fetch(`/api/printer/${printerId}/files`);
		},

		startPrint: (printerId: string, filename: string) => {
			emitCommand('start_print', printerId, { filename });
		},

		pausePrint: (printerId: string) => {
			emitCommand('pause_print', printerId);
		},

		resumePrint: (printerId: string) => {
			emitCommand('resume_print', printerId);
		},

		stopPrint: (printerId: string) => {
			emitCommand('stop_print', printerId);
}
	};
}

export const printerStore = createPrinterStore();
