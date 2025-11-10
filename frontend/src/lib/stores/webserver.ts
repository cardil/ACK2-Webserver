import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface WebserverConfig {
  printer_model: string;
  update_version: string;
  mqtt_webui_url: string;
}

function createWebserverStore() {
  const { subscribe, set } = writable<WebserverConfig | null>(null);

  async function fetchConfig() {
    try {
      let url = '/api/webserver.json';
      if (browser) {
        const params = new URLSearchParams(window.location.search);
        if (params.has('api_url')) {
          url += `?api_url=${params.get('api_url')}`;
        }
      }
      const response = await fetch(url);
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


  if (browser) {
    fetchConfig();
  }

  return {
    subscribe,
  };
}

export const webserverStore = createWebserverStore();
