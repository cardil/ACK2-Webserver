import type { Connect } from "vite"
import fs from "fs"
import path from "path"
import {
  getLogContent,
  getLogContentSize,
  getLogContentRange,
  clearLog,
  startLogGrowth,
} from "./logMock"

// Path to the source of truth JSON files (reused from mockApi.ts)
const API_SOURCE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "webserver",
  "opt",
  "webfs",
  "api",
)

// Mock system state (enhances the static info.json)
interface SystemState {
  startTime: number
  ssh_status: number // 0 = stopped, 1 = starting, 2 = running
}

// Initialize mock system state
const systemState: SystemState = {
  startTime: Date.now(),
  ssh_status: 2, // Running by default
}

// Mock file system structure
interface MockFileSystemEntry {
  name: string
  isDirectory: boolean
  content?: string // For files
  children?: MockFileSystemEntry[] // For directories
  size?: number // File size in bytes
  mtime?: number // Modification time in seconds (Unix timestamp)
}

// Helper to generate mtime (seconds since epoch)
const now = Math.floor(Date.now() / 1000)
const oneDayAgo = now - 86400
const oneWeekAgo = now - 604800
const oneMonthAgo = now - 2592000

const mockFileSystem: MockFileSystemEntry = {
  name: "/",
  isDirectory: true,
  children: [
    {
      name: "config",
      isDirectory: true,
      children: [
        {
          name: "printer.cfg",
          isDirectory: false,
          content: "printer_type: kobra2\n",
          mtime: oneWeekAgo,
        },
        {
          name: "settings.json",
          isDirectory: false,
          content: '{"temperature": 200}\n',
          mtime: oneDayAgo,
        },
        {
          name: "profiles",
          isDirectory: true,
          children: [
            {
              name: "default.json",
              isDirectory: false,
              content: '{"profile": "default"}\n',
              mtime: oneMonthAgo,
            },
            {
              name: "high_quality_0.2mm_layer_height_very_detailed_printing_profile_v2.1.json",
              isDirectory: false,
              content: '{"layer_height": 0.2}\n',
              mtime: oneWeekAgo,
            },
            {
              name: "ultra_fine_detailed_high_resolution_printing_configuration_with_extended_settings_and_custom_parameters_for_advanced_users.json",
              isDirectory: false,
              content: '{"advanced": true}\n',
              mtime: oneDayAgo,
            },
          ],
        },
        {
          name: "backups",
          isDirectory: true,
          children: [
            {
              name: "backup_2025-01-15_10-30-45.cfg",
              isDirectory: false,
              content: "backup content\n",
              mtime: oneDayAgo,
            },
            {
              name: "very_long_backup_filename_with_timestamp_and_detailed_description_of_configuration_changes_made_during_printing_session_2025-01-15.cfg",
              isDirectory: false,
              content: "long backup\n",
              mtime: oneWeekAgo,
            },
          ],
        },
      ],
    },
    {
      name: "logs",
      isDirectory: true,
      children: [
        {
          name: "system.log",
          isDirectory: false,
          content: getLogContent(),
          mtime: now - 3600,
        },
        {
          name: "error.log",
          isDirectory: false,
          content: "2025-01-15 10:00:20 [ERROR] Test error\n",
          mtime: now - 7200,
        },
        {
          name: "archive",
          isDirectory: true,
          children: [
            {
              name: "system_2025-01-14.log",
              isDirectory: false,
              content: "archived log\n",
              mtime: oneDayAgo,
            },
            {
              name: "system_2025-01-13.log",
              isDirectory: false,
              content: "older log\n",
              mtime: oneWeekAgo,
            },
            {
              name: "very_long_archived_log_filename_with_complete_timestamp_and_detailed_information_about_the_logging_session_2025-01-12_23-59-59.log",
              isDirectory: false,
              content: "very old log\n",
              size: 150 * 1024,
              mtime: oneMonthAgo,
            },
            {
              name: "large_archive.log",
              isDirectory: false,
              content: "large log file\n",
              size: 300 * 1024,
              mtime: oneWeekAgo,
            },
          ],
        },
      ],
    },
    {
      name: "gcode",
      isDirectory: true,
      children: [
        {
          name: "test.gcode",
          isDirectory: false,
          content: "G28\nG1 X10 Y10\n",
          mtime: oneDayAgo,
        },
        {
          name: "calibration.gcode",
          isDirectory: false,
          content: "G28\nM104 S200\n",
          mtime: oneWeekAgo,
        },
        {
          name: "large_model.gcode",
          isDirectory: false,
          content: "G28\n",
          size: 150 * 1024,
          mtime: oneDayAgo,
        },
        {
          name: "very_long_gcode_filename_that_tests_how_the_file_browser_handles_extremely_long_file_names_with_multiple_words_and_descriptions.gcode",
          isDirectory: false,
          content: "G28\n",
          mtime: oneDayAgo,
        },
        {
          name: "complex_print_job_with_multiple_parts_and_detailed_naming_convention_that_includes_project_name_version_number_and_print_settings_v2.3.1.gcode",
          isDirectory: false,
          content: "G28\nG1 X0 Y0\n",
          size: 250 * 1024,
          mtime: now - 1800,
        },
        {
          name: "projects",
          isDirectory: true,
          children: [
            {
              name: "project1.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "project2.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "complex_projects",
              isDirectory: true,
              children: [
                {
                  name: "multi_part_assembly_project_with_custom_support_structures_and_advanced_printing_parameters.gcode",
                  isDirectory: false,
                  content: "G28\n",
                  size: 500 * 1024,
                  mtime: oneWeekAgo,
                },
                {
                  name: "experimental_design_with_very_long_descriptive_filename_to_test_ui_rendering.gcode",
                  isDirectory: false,
                  content: "G28\n",
                  mtime: oneDayAgo,
                },
                {
                  name: "huge_3d_model_export.gcode",
                  isDirectory: false,
                  content: "G28\n",
                  size: 2 * 1024 * 1024,
                  mtime: oneDayAgo,
                },
              ],
            },
          ],
        },
        {
          name: "test_files",
          isDirectory: true,
          children: [
            {
              name: "test_1.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_2.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "test_3.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_4.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "test_5.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_6.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "test_7.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_8.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "test_9.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_10.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "test_11.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_12.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "test_13.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_14.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "test_15.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_16.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "test_17.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_18.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "test_19.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneDayAgo,
            },
            {
              name: "test_20.gcode",
              isDirectory: false,
              content: "G28\n",
              mtime: oneWeekAgo,
            },
            {
              name: "large_test_file.gcode",
              isDirectory: false,
              content: "G28\n",
              size: 120 * 1024,
              mtime: oneDayAgo,
            },
            {
              name: "calibration_test.gcode",
              isDirectory: false,
              content: "G28\nM104 S200\n",
              mtime: oneDayAgo,
            },
            {
              name: "bed_leveling.gcode",
              isDirectory: false,
              content: "G28\nG29\n",
              mtime: oneWeekAgo,
            },
            {
              name: "temperature_test.gcode",
              isDirectory: false,
              content: "M104 S200\nM140 S60\n",
              mtime: oneDayAgo,
            },
            {
              name: "extruder_test.gcode",
              isDirectory: false,
              content: "G1 E10 F100\n",
              mtime: oneWeekAgo,
            },
            {
              name: "fan_test.gcode",
              isDirectory: false,
              content: "M106 S255\n",
              mtime: oneDayAgo,
            },
            {
              name: "movement_test.gcode",
              isDirectory: false,
              content: "G1 X10 Y10 Z10\n",
              mtime: oneWeekAgo,
            },
            {
              name: "retraction_test.gcode",
              isDirectory: false,
              content: "G1 E-5 F100\n",
              mtime: oneDayAgo,
            },
            {
              name: "speed_test.gcode",
              isDirectory: false,
              content: "G1 X100 F3000\n",
              mtime: oneWeekAgo,
            },
            {
              name: "layer_test.gcode",
              isDirectory: false,
              content: "G1 Z0.2\n",
              mtime: oneDayAgo,
            },
            {
              name: "final_test.gcode",
              isDirectory: false,
              content: "G28\nM84\n",
              mtime: oneWeekAgo,
            },
          ],
        },
      ],
    },
    {
      name: "readme.txt",
      isDirectory: false,
      content: "System readme file\n",
      mtime: oneMonthAgo,
    },
    {
      name: "very_long_readme_filename_that_tests_file_browser_display_capabilities_with_extended_descriptive_text.txt",
      isDirectory: false,
      content: "Long filename readme\n",
      mtime: oneWeekAgo,
    },
  ],
}

// Find file system entry by path
function findFileSystemEntry(
  pathSegments: string[],
): MockFileSystemEntry | null {
  let current: MockFileSystemEntry = mockFileSystem
  for (const segment of pathSegments) {
    if (!segment || segment === "") continue
    if (!current.children) return null
    const found = current.children.find((child) => child.name === segment)
    if (!found) return null
    current = found
  }
  return current
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

// Update info.json with dynamic data (enhances the static file)
function getDynamicInfoJson(): string {
  const infoJsonPath = path.join(API_SOURCE_PATH, "info.json")
  let baseInfo: any = {}

  // Read base info.json if it exists
  if (fs.existsSync(infoJsonPath)) {
    try {
      const fileContent = fs.readFileSync(infoJsonPath, "utf-8")
      baseInfo = JSON.parse(fileContent)
    } catch (error) {
      console.error("[System Mock] Error reading info.json:", error)
    }
  }

  // Calculate dynamic uptime
  const elapsed = Math.floor((Date.now() - systemState.startTime) / 1000)
  const uptime = formatUptime(elapsed)

  // Simulate CPU and memory fluctuations
  const cpu_use = 40 + Math.floor(Math.random() * 40)
  const cpu_usr_use = Math.floor(cpu_use * 0.5)
  const cpu_sys_use = cpu_use - cpu_usr_use
  const cpu_idle = 100 - cpu_use

  // Simulate memory changes
  const total_mem = baseInfo.total_mem || 114208768
  const memVariation = Math.floor(Math.random() * 10) - 5
  const free_mem = Math.max(
    30000000,
    Math.min(
      total_mem,
      (baseInfo.free_mem || 43442176) + memVariation * 1024 * 1024,
    ),
  )
  const free_mem_per = Math.floor((free_mem / total_mem) * 100)

  // Return enhanced info with dynamic values
  return JSON.stringify({
    api_ver: baseInfo.api_ver || 1,
    total_mem,
    free_mem,
    free_mem_per,
    cpu_use,
    cpu_usr_use,
    cpu_sys_use,
    cpu_idle,
    ssh_status: systemState.ssh_status,
    uptime,
  })
}

export function createSystemApiMiddleware(): Connect.NextHandleFunction {
  // Start log growth simulation when middleware is created (not at module load)
  startLogGrowth()

  return (req, res, next) => {
    const url = new URL(req.url!, `http://${req.headers.host}`)

    // Handle /api/info.json - enhance with dynamic data
    if (req.method === "GET" && url.pathname === "/api/info.json") {
      res.setHeader("Content-Type", "application/json")
      res.statusCode = 200
      res.end(getDynamicInfoJson())
      return
    }

    // Handle /api/do.json?action=...
    if (req.method === "GET" && url.pathname === "/api/do.json") {
      const action = url.searchParams.get("action")
      res.setHeader("Content-Type", "application/json")

      switch (action) {
        case "reboot":
          console.log("[System Mock] Reboot requested")
          // Reset uptime
          systemState.startTime = Date.now()
          res.statusCode = 200
          res.end(JSON.stringify({ api_ver: 1, result: 1 }))
          return

        case "poweroff":
          console.log("[System Mock] Poweroff requested")
          res.statusCode = 200
          res.end(JSON.stringify({ api_ver: 1, result: 1 }))
          return

        case "ssh_start":
          console.log("[System Mock] SSH start requested")
          systemState.ssh_status = 2 // Running
          res.statusCode = 200
          res.end(JSON.stringify({ api_ver: 1, result: 2 }))
          return

        case "ssh_stop":
          console.log("[System Mock] SSH stop requested")
          systemState.ssh_status = 0 // Stopped
          res.statusCode = 200
          res.end(JSON.stringify({ api_ver: 1, result: 1 }))
          return

        case "ssh_restart":
          // Not in backend, but useful for frontend
          console.log("[System Mock] SSH restart requested")
          systemState.ssh_status = 1 // Starting
          setTimeout(() => {
            systemState.ssh_status = 2 // Running
          }, 1000)
          res.statusCode = 200
          res.end(JSON.stringify({ api_ver: 1, result: 1 }))
          return

        case "log_clear":
          console.log("[System Mock] Log clear requested")
          clearLog()
          res.statusCode = 200
          res.end(JSON.stringify({ api_ver: 1, result: 1 }))
          return

        default:
          res.statusCode = 200
          res.end(JSON.stringify({ api_ver: 1, result: -1 }))
          return
      }
    }

    // Handle /files/log with HEAD, Range request support
    if (
      (req.method === "GET" || req.method === "HEAD") &&
      url.pathname === "/files/log"
    ) {
      const rangeHeader =
        req.headers["range"] || req.headers["Range"] || req.headers["RANGE"]
      const logContent = getLogContent()
      const logSize = getLogContentSize()

      // Handle HEAD request
      if (req.method === "HEAD") {
        res.setHeader("Content-Type", "text/plain")
        res.setHeader("Content-Length", logSize.toString())
        res.setHeader("Accept-Ranges", "bytes")
        res.statusCode = 200
        res.end()
        return
      }

      // Parse Range header if present
      if (
        rangeHeader &&
        typeof rangeHeader === "string" &&
        rangeHeader.startsWith("bytes=")
      ) {
        const rangeValue = rangeHeader.substring(6) // Remove "bytes="
        const rangeMatch = rangeValue.match(/^(\d+)-$/) // Match "start-" format

        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10)

          // Check if range is valid
          if (start >= 0 && start < logSize) {
            const rangeContent = getLogContentRange(start)
            const rangeSize = Buffer.byteLength(rangeContent, "utf8")
            const end = start + rangeSize - 1

            res.setHeader("Content-Type", "text/plain")
            res.setHeader("Content-Range", `bytes ${start}-${end}/${logSize}`)
            res.setHeader("Accept-Ranges", "bytes")
            res.statusCode = 206 // Partial Content
            res.end(rangeContent)
            return
          } else if (start >= logSize) {
            // Range Not Satisfiable
            res.setHeader("Content-Range", `bytes */${logSize}`)
            res.statusCode = 416
            res.end("Range Not Satisfiable")
            return
          }
        }
      }

      // Full content response (no Range header or invalid range)
      res.setHeader("Content-Type", "text/plain")
      res.setHeader("Accept-Ranges", "bytes")
      res.statusCode = 200
      res.end(logContent)
      return
    }

    // Handle file browser - serve as JSON API for easier development
    if (
      req.method === "GET" &&
      url.pathname.startsWith("/files/") &&
      url.pathname !== "/files/log"
    ) {
      const filePath = url.pathname.substring("/files/".length)
      const pathSegments = filePath.split("/").filter((p) => p)
      const entry = findFileSystemEntry(pathSegments)

      if (entry) {
        if (entry.isDirectory) {
          // Serve directory listing as JSON
          const children = (entry.children || []).map((child) => {
            const result: any = {
              name: child.name,
              isDirectory: child.isDirectory,
            }
            if (!child.isDirectory) {
              // Calculate size from content if not set
              if (child.size !== undefined) {
                result.size = child.size
              } else if (child.content) {
                result.size = Buffer.byteLength(child.content, "utf8")
              }
              // Include mtime if set
              if (child.mtime !== undefined) {
                result.mtime = child.mtime
              }
            }
            return result
          })
          res.setHeader("Content-Type", "application/json")
          res.statusCode = 200
          res.end(JSON.stringify(children))
          return
        } else {
          // Serve file content
          res.setHeader("Content-Type", "text/plain")
          res.statusCode = 200
          res.end(entry.content || "")
          return
        }
      } else {
        res.statusCode = 404
        res.end("Not found")
        return
      }
    }

    // Handle root directory listing for file browser
    if (req.method === "GET" && url.pathname === "/") {
      // Check if it's a file browser request (could check Accept header or query param)
      // For now, let it pass through to SvelteKit
      next()
      return
    }

    next()
  }
}
