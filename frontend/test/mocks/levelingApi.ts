import type { Connect } from "vite"

// This file will mock the C backend API for leveling tools.
// It will provide data structures and functions that simulate the
// responses from the C API, allowing for independent frontend development.

export interface LevelingSettings {
  grid_size: number
  bed_temp: number
  precision: number
  z_offset: number // z_offset is returned in settings by the C backend
}

export interface MeshData {
  mesh_data: string
}

export interface SavedMesh {
  id: number
  date: string
  mesh_data: string
}

export interface LevelingStatus {
  settings: LevelingSettings
  active_mesh: MeshData
  saved_meshes: SavedMesh[]
}

// Function to generate dynamic mesh data for slopes
type SlopeDirection =
  | "x-positive"
  | "x-negative"
  | "y-positive"
  | "y-negative"
  | "flat"

function generateSlopedMeshData(
  gridSize: number,
  direction: SlopeDirection = "y-positive",
): string {
  const mesh: number[][] = []
  for (let i = 0; i < gridSize; i++) {
    const row: number[] = []
    for (let j = 0; j < gridSize; j++) {
      let value = 0
      const curve = Math.sin((i / (gridSize - 1)) * Math.PI) * 0.02 // Gentle sine curve

      switch (direction) {
        case "x-positive":
          value = -0.05 + (0.1 / (gridSize - 1)) * i + curve
          break
        case "x-negative":
          value = 0.05 - (0.1 / (gridSize - 1)) * i + curve
          break
        case "y-positive":
          value = -0.05 + (0.1 / (gridSize - 1)) * j + curve
          break
        case "y-negative":
          value = 0.05 - (0.1 / (gridSize - 1)) * j + curve
          break
        case "flat":
        default:
          value = 0.01 // A simple flat mesh for contrast
          break
      }
      row.push(value)
    }
    mesh.push(row)
  }
  return mesh
    .flat()
    .map((v) => v.toFixed(6))
    .join(", ")
}

// Mock data based on the C API structure
const mockLevelingStatus: LevelingStatus = {
  settings: {
    grid_size: 5,
    bed_temp: 60,
    precision: 0.01,
    z_offset: 1.443, // z_offset is in settings
  },
  active_mesh: {
    mesh_data: generateSlopedMeshData(5, "y-positive"),
  },
  saved_meshes: [
    {
      id: 1,
      date: "2025-11-12 10:30:00",
      mesh_data: generateSlopedMeshData(5, "x-positive"),
    },
    {
      id: 2,
      date: "2025-11-11 15:45:00",
      mesh_data: generateSlopedMeshData(5, "x-negative"),
    },
    {
      id: 3,
      date: "2025-11-12 10:30:00",
      mesh_data: generateSlopedMeshData(5, "y-positive"),
    },
    {
      id: 4,
      date: "2025-11-11 15:45:00",
      mesh_data: generateSlopedMeshData(5, "y-negative"),
    },
    {
      id: 10,
      date: "2025-11-12 22:45:00",
      mesh_data: generateSlopedMeshData(5, "flat"),
    },
  ],
}

// --- Mock API Functions ---

export async function getLevelingStatus(): Promise<LevelingStatus> {
  console.log("Mock API: Fetching leveling status")
  return new Promise((resolve) =>
    setTimeout(() => resolve(mockLevelingStatus), 500),
  )
}

export async function deleteMeshSlot(
  slotId: number,
): Promise<{ status: string; message: string }> {
  console.log(`Mock API: Deleting mesh slot ${slotId}`)
  const index = mockLevelingStatus.saved_meshes.findIndex(
    (mesh) => mesh.id === slotId,
  )
  if (index !== -1) {
    mockLevelingStatus.saved_meshes.splice(index, 1)
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: "success",
            message: `Mesh slot ${slotId} deleted.`,
          }),
        500,
      ),
    )
  } else {
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ status: "error", message: "Slot not found." }),
        500,
      ),
    )
  }
}

export interface SaveSettingsResponse {
  status: string
  message: string
  grid_size_changed: boolean
}

export async function saveLevelingSettings(
  settings: Omit<LevelingSettings, "z_offset">,
): Promise<SaveSettingsResponse> {
  console.log(`Mock API: Saving leveling settings`, settings)
  let gridSizeChanged = false
  if (settings.grid_size !== mockLevelingStatus.settings.grid_size) {
    gridSizeChanged = true
    mockLevelingStatus.saved_meshes = []
    const newSize = settings.grid_size * settings.grid_size
    mockLevelingStatus.active_mesh.mesh_data = Array(newSize)
      .fill("0.000000")
      .join(", ")
  }
  // Update settings but preserve z_offset (it's read-only)
  mockLevelingStatus.settings = {
    ...settings,
    z_offset: mockLevelingStatus.settings.z_offset,
  }

  const response: SaveSettingsResponse = {
    status: "success",
    message: "Settings saved.",
    grid_size_changed: gridSizeChanged,
  }
  return new Promise((resolve) => setTimeout(() => resolve(response), 500))
}

export async function saveActiveMesh(
  slotId: number,
  meshData: string,
): Promise<{ status: string; message: string }> {
  console.log(`Mock API: Saving active mesh to slot ${slotId}`)
  if (!mockLevelingStatus.active_mesh) {
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ status: "error", message: "No active mesh to save." }),
        500,
      ),
    )
  }
  const existingSlot = mockLevelingStatus.saved_meshes.find(
    (mesh) => mesh.id === slotId,
  )
  if (existingSlot) {
    // Overwrite existing slot
    existingSlot.mesh_data = meshData
    existingSlot.date = new Date().toISOString().slice(0, 19).replace("T", " ")
  } else {
    // Add new slot
    mockLevelingStatus.saved_meshes.push({
      id: slotId,
      date: new Date().toISOString().slice(0, 19).replace("T", " "),
      mesh_data: meshData,
    })
  }
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          status: "success",
          message: `Mesh saved to slot ${slotId}.`,
        }),
      500,
    ),
  )
}

export async function activateMeshSlot(
  slotId: number,
  meshData: string,
): Promise<{ status: string; message: string }> {
  console.log(`Mock API: Activating mesh from slot ${slotId}`)
  const slotToActivate = mockLevelingStatus.saved_meshes.find(
    (mesh) => mesh.id === slotId,
  )
  if (slotToActivate) {
    // Use the provided meshData (which should match the slot)
    mockLevelingStatus.active_mesh.mesh_data = meshData
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: "success",
            message: `Mesh from slot ${slotId} activated.`,
          }),
        500,
      ),
    )
  } else {
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ status: "error", message: "Slot not found." }),
        500,
      ),
    )
  }
}

export async function activateMeshContent(
  meshData: string,
): Promise<{ status: string; message: string }> {
  console.log("Mock API: Activating mesh from content")
  mockLevelingStatus.active_mesh.mesh_data = meshData
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ status: "success", message: "Mesh content activated." }),
      500,
    ),
  )
}

export async function deleteAllMeshSlots(): Promise<{
  status: string
  message: string
}> {
  console.log(`Mock API: Deleting all mesh slots`)
  mockLevelingStatus.saved_meshes = []
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ status: "success", message: "All mesh slots deleted." }),
      500,
    ),
  )
}

export function createLevelingApiMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url?.startsWith("/api/leveling")) {
      return next()
    }

    res.setHeader("Content-Type", "application/json")

    if (req.method === "GET" && req.url === "/api/leveling") {
      getLevelingStatus().then((data) => {
        res.end(JSON.stringify(data))
      })
      return
    }

    // PUT /api/leveling/settings (changed from POST)
    if (req.method === "PUT" && req.url === "/api/leveling/settings") {
      let body = ""
      req.on("data", (chunk) => {
        body += chunk.toString()
      })
      req.on("end", () => {
        const settings = JSON.parse(body)
        saveLevelingSettings(settings).then((response) => {
          res.statusCode = 200
          res.end(JSON.stringify(response))
        })
      })
      return
    }

    // PUT /api/leveling/mesh/{id} (changed from POST /api/leveling/mesh/save)
    const putMeshMatch = req.url.match(/^\/api\/leveling\/mesh\/(\d+)$/)
    if (req.method === "PUT" && putMeshMatch) {
      const slotId = parseInt(putMeshMatch[1], 10)
      let body = ""
      req.on("data", (chunk) => {
        body += chunk.toString()
      })
      req.on("end", () => {
        const { mesh_data } = JSON.parse(body)
        saveActiveMesh(slotId, mesh_data).then((response) => {
          res.statusCode = response.status === "success" ? 200 : 400
          res.end(JSON.stringify(response))
        })
      })
      return
    }

    // PUT /api/leveling/printer-mesh (changed from POST /api/leveling/mesh/activate/content)
    if (req.method === "PUT" && req.url === "/api/leveling/printer-mesh") {
      let body = ""
      req.on("data", (chunk) => {
        body += chunk.toString()
      })
      req.on("end", () => {
        const { mesh_data } = JSON.parse(body)
        activateMeshContent(mesh_data).then((response) => {
          res.statusCode = response.status === "success" ? 200 : 400
          res.end(JSON.stringify(response))
        })
      })
      return
    }

    // DELETE /api/leveling/mesh/{id}
    const deleteMatch = req.url.match(/^\/api\/leveling\/mesh\/(\d+)$/)
    if (req.method === "DELETE" && deleteMatch) {
      const slotId = parseInt(deleteMatch[1], 10)
      deleteMeshSlot(slotId).then((response) => {
        res.statusCode = response.status === "success" ? 200 : 404
        res.end(JSON.stringify(response))
      })
      return
    }

    // DELETE /api/leveling/mesh/all (for mock compatibility, but backend doesn't support this)
    if (req.method === "DELETE" && req.url === "/api/leveling/mesh/all") {
      deleteAllMeshSlots().then((response) => {
        res.statusCode = 200
        res.end(JSON.stringify(response))
      })
      return
    }

    next()
  }
}
