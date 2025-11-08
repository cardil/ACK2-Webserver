import { writable } from 'svelte/store';

export interface WebserverConfig {
  printer_model: string;
  update_version: string;
  mqtt_webui_url: string;
}

function createWebserverStore() {
  const { subscribe, set } = writable<WebserverConfig | null>(null);

  async function fetchConfig() {
    try {
      const response = await fetch('/api/webserver.json');
      if (!response.ok) {
        throw new Error('Failed to fetch webserver config');
      }
      const config = await response.json();
      set(config);
    } catch (error) {
      console.error('Error fetching webserver config:', error);
      set(null); // Explicitly set to null on error
    }
  }

  fetchConfig();

  return {
    subscribe,
  };
}

export const webserverStore = createWebserverStore();
