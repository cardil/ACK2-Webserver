// frontend/src/lib/api/leveling.ts

// --- API Data Structures ---
// These interfaces define the contract with the C backend API.

export interface LevelingSettings {
  grid_size: number;
  bed_temp: number;
  precision: number;
}

export interface MeshData {
  mesh_data: string;
  z_offset: number;
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

export async function saveLevelingSettings(settings: LevelingSettings): Promise<SaveSettingsResponse> {
    const response = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    return handleResponse<SaveSettingsResponse>(response);
}

export async function saveActiveMesh(slotId: number): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/mesh/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: slotId }),
    });
    return handleResponse(response);
}

export async function activateMeshSlot(slotId: number): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/mesh/activate/${slotId}`, {
        method: 'POST',
    });
    return handleResponse(response);
}

export async function activateMeshContent(meshData: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/mesh/activate/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesh_data: meshData }),
    });
    return handleResponse(response);
}

export async function deleteAllMeshSlots(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/mesh/all`, {
        method: 'DELETE',
    });
    return handleResponse(response);
}
