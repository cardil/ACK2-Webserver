// frontend/src/lib/api/leveling.ts

// --- API Data Structures ---
// These interfaces define the contract with the C backend API.

export interface LevelingSettings {
  grid_size: number;
  bed_temp: number;
  precision: number;
  z_offset: number; // z_offset is returned in settings by the C backend
}

export interface MeshData {
  mesh_data: string;
}

export interface SavedMesh {
  id: number;
  date: string;
  mesh_data: string;
}

export interface LevelingStatus {
  settings: LevelingSettings;
  active_mesh: MeshData;
  saved_meshes: SavedMesh[];
}

// --- API Client Functions ---

const API_BASE = '/api/leveling';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json() as Promise<T>;
}

export async function getLevelingStatus(): Promise<LevelingStatus> {
  const response = await fetch(API_BASE);
  return handleResponse<LevelingStatus>(response);
}

export async function deleteMeshSlot(slotId: number): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/mesh/${slotId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export interface SaveSettingsResponse {
    status: string;
    message: string;
    grid_size_changed: boolean;
}

export async function saveLevelingSettings(settings: Omit<LevelingSettings, 'z_offset'>): Promise<SaveSettingsResponse> {
    // z_offset is read-only, so we don't send it when saving settings
    const response = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grid_size: settings.grid_size,
            bed_temp: settings.bed_temp,
            precision: settings.precision,
        }),
    });
    return handleResponse<SaveSettingsResponse>(response);
}

export async function saveActiveMesh(slotId: number, meshData: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/mesh/${slotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesh_data: meshData }),
    });
    return handleResponse(response);
}

export async function activateMeshSlot(slotId: number, meshData: string): Promise<{ status: string; message: string }> {
    // The C backend doesn't have a direct "activate slot" endpoint.
    // Instead, we need to first read the slot data, then activate it.
    // For now, we'll use activateMeshContent with the mesh data.
    return activateMeshContent(meshData);
}

export async function activateMeshContent(meshData: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/printer-mesh`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesh_data: meshData }),
    });
    return handleResponse(response);
}

export async function deleteAllMeshSlots(): Promise<{ status: string; message: string }> {
    // The C backend doesn't have a "delete all" endpoint.
    // We'll need to delete slots individually. For now, return an error.
    throw new Error('Delete all slots is not supported by the backend. Please delete slots individually.');
}
