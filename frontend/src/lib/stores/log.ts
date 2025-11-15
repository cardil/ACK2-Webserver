import { writable } from "svelte/store"
import { browser } from "$app/environment"

export interface LogEntry {
  line: string
  count: number
}

function createLogStore() {
  const { subscribe, set } = writable<LogEntry[]>([])

  async function fetchLog() {
    if (!browser) return
    try {
      const response = await fetch("/files/log")
      if (response.ok) {
        const logText = await response.text()
        const lines = logText.split("\n")
        const processedLog: LogEntry[] = []

        if (lines.length > 0) {
          let currentEntry: LogEntry = { line: lines[0], count: 1 }
          for (let i = 1; i < lines.length; i++) {
            if (lines[i] === currentEntry.line) {
              currentEntry.count++
            } else {
              processedLog.push(currentEntry)
              currentEntry = { line: lines[i], count: 1 }
            }
          }
          processedLog.push(currentEntry)
        }
        set(processedLog)
      } else {
        set([])
      }
    } catch (error) {
      console.error("Error fetching log:", error)
      set([])
    }
  }

  return {
    subscribe,
    fetchLog,
    clearLog: async () => {
      if (!browser) return
      try {
        await fetch("/api/do.json?action=log_clear")
        fetchLog()
      } catch (error) {
        console.error("Error clearing log:", error)
      }
    },
  }
}

export const logStore = createLogStore()
