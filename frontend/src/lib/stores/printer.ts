import { writable } from 'svelte/store';
import { io } from 'socket.io-client';
import { webserverStore } from './webserver';

// Define the structure of the printer data based on main.py
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
  files: any[]; // Define a proper type if needed
}

function createPrinterStore() {
  const { subscribe, set, update } = writable<{ [id: string]: Printer }>({});

  webserverStore.subscribe(config => {
    if (config && config.mqtt_webui_url) {
      const socket = io(config.mqtt_webui_url, {
        transports: ['websocket'],
      });
      
      socket.on('connect', () => {
        console.log('Connected to Kobra Unleashed');
        socket.emit('get_printer_list');
      });

      socket.on('printer_list', (printers: { [id: string]: Printer }) => {
        set(printers);
      });
      
      socket.on('printer_updated', (data: { id: string; printer: Printer }) => {
        update((printers) => {
          printers[data.id] = data.printer;
          return printers;
        });
      });
      
      socket.on('disconnect', () => {
        console.log('Disconnected from Kobra Unleashed');
      });
    }
  });


  return {
    subscribe,
    // You can add methods here to send commands to the printer if needed
  };
}

export const printerStore = createPrinterStore();
