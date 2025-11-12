import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'auto' | 'light' | 'dark';

const defaultValue: Theme = 'auto';
const initialValue = browser ? (window.localStorage.getItem('theme') as Theme) ?? defaultValue : defaultValue;

export const theme = writable<Theme>(initialValue);

theme.subscribe((value) => {
  if (browser) {
    window.localStorage.setItem('theme', value);
  }
});
