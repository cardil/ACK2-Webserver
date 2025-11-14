import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface FileEntry {
  name: string;
  isDirectory: boolean;
  size?: number;
  mtime?: number;
}

function createFileBrowserStore() {
  const { subscribe, set } = writable<FileEntry[]>([]);
  const currentPathStore = writable<string>('/files/');

  async function fetchFiles() {
    if (!browser) return;
    const currentPath = get(currentPathStore);

    try {
      // Ensure path starts with /files/ and ends with / for directories
      const fetchPath = currentPath === '/files/' ? '/files/' : currentPath.endsWith('/') ? currentPath : `${currentPath}/`;
      const response = await fetch(fetchPath);
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          // JSON API response (mock mode)
          const files: FileEntry[] = await response.json();
          set(files);
        } else {
          // HTML directory listing (real backend)
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const links = Array.from(doc.querySelectorAll('a'));
          const files: FileEntry[] = links
            .map((link) => {
              const name = link.textContent || '';
              const isDirectory = name.endsWith('/');
              return { name: isDirectory ? name.slice(0, -1) : name, isDirectory };
            })
            .filter((file) => file.name !== '..' && file.name !== '.'); // Exclude parent and current directory
          set(files);
        }
      } else {
        set([]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      set([]);
    }
  }

  function navigate(path: string) {
    const currentPath = get(currentPathStore);

    let newPath: string;
    if (path.startsWith('/files/')) {
      newPath = path.endsWith('/') ? path : `${path}/`;
    } else if (path.startsWith('/')) {
      const fullPath = `/files${path}`;
      newPath = fullPath.endsWith('/') ? fullPath : `${fullPath}/`;
    } else {
      const fullPath = `${currentPath}${path}`;
      newPath = fullPath.endsWith('/') ? fullPath : `${fullPath}/`;
    }

    currentPathStore.set(newPath);
    fetchFiles();
  }

  function goUp() {
    const currentPath = get(currentPathStore);
    const segments = currentPath.replace('/files/', '').split('/').filter((s) => s);
    segments.pop();
    const newPath = segments.length === 0 ? '/files/' : `/files/${segments.join('/')}/`;
    currentPathStore.set(newPath);
    fetchFiles();
  }

  function navigateToPath(index: number) {
    if (index === -1) {
      // Navigate to root
      currentPathStore.set('/files/');
      fetchFiles();
      return;
    }
    const currentPath = get(currentPathStore);
    const segments = currentPath.replace('/files/', '').split('/').filter((s) => s);
    const newPath = `/files/${segments.slice(0, index + 1).join('/')}/`;
    currentPathStore.set(newPath);
    fetchFiles();
  }

  function canGoUp(): boolean {
    const currentPath = get(currentPathStore);
    const pathWithoutPrefix = currentPath.replace('/files/', '').replace(/^\/+|\/+$/g, '');
    return pathWithoutPrefix.length > 0;
  }

  function getCurrentPath(): string {
    const currentPath = get(currentPathStore);
    return currentPath.replace('/files', '') || '/';
  }

  return {
    subscribe,
    fetchFiles,
    navigate,
    goUp,
    navigateToPath,
    getCurrentPath,
    canGoUp,
    currentPath: currentPathStore,
  };
}

export const fileBrowserStore = createFileBrowserStore();
