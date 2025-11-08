// frontend/test/mocks/kobraData.ts

export interface PrintJob {
  taskid: string;
  filename: string;
  filepath: string;
  state: 'printing' | 'paused' | 'done' | 'failed' | 'unknown';
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

export interface FileElement {
  filename: string;
  size: number;
  timestamp: number;
  is_dir: boolean;
  is_local: boolean;
}

export interface Printer {
  id: string;
  name: string;
  model_id: string;
  fwver: number;
  online: boolean;
  state: 'free' | 'printing' | 'paused' | 'offline' | 'failed' | 'downloading' | 'checking';
  nozzle_temp: string;
  target_nozzle_temp: string;
  hotbed_temp: string;
  target_hotbed_temp: string;
  print_job: PrintJob | null;
  files: FileElement[][];
}

export const mockPrinter: Printer = {
  id: '9347a110c5423fe412ce45533bfc10e6',
  name: 'Kobra Mock',
  model_id: '20021',
  fwver: 312,
  online: true,
  state: 'free',
  nozzle_temp: '25',
  target_nozzle_temp: '0',
  hotbed_temp: '25',
  target_hotbed_temp: '0',
  print_job: null,
  files: [
    [
      {
        filename: 'benchy.gcode',
        size: 123456,
        timestamp: 3661, // 1h 1m 1s
        is_dir: false,
        is_local: true,
      },
      {
        filename: 'flat-test.gcode',
        size: 7890,
        timestamp: 125, // 2m 5s
        is_dir: false,
        is_local: true,
      },
      {
        filename: 'calibration-cube.gcode',
        size: 4567,
        timestamp: 630, // 10m 30s
        is_dir: false,
        is_local: true,
      },
      {
        filename: 'wh40k-spacemarine.gcode',
        size: 987654,
        timestamp: 10800, // 3h
        is_dir: false,
        is_local: true,
      },
    ],
    [], // Udisk files
  ],
};
