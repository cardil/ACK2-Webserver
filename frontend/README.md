# Frontend Development Guide

Modern Svelte-based frontend for the AK2 Dashboard.

## Overview

The frontend is a reactive single-page application built with Svelte and SvelteKit. It provides a modern, responsive interface for printer control, bed mesh leveling, system tools, and file management.

### Technology Stack

- **[Svelte](https://svelte.dev/)** - Reactive UI framework
- **[SvelteKit](https://kit.svelte.dev/)** - Application framework with routing
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[ECharts](https://echarts.apache.org/)** - 3D bed mesh visualization
- **[Prism.js](https://prismjs.com/)** - Syntax highlighting for code viewer

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Modern web browser

### Installation

```bash
cd frontend
npm install
```

### Development Server

Start the dev server with hot module reloading:

```bash
npm run dev
```

Open browser at `http://localhost:5173`

The dev server includes:

- **Hot Module Replacement** - Instant updates without page reload
- **Mock API Server** - Simulates printer API for testing
- **Source Maps** - Debug TypeScript directly in browser
- **Fast Refresh** - Preserves component state during edits

## Building for Production

### Build Commands

**Production Build:**

```bash
npm run build
```

Outputs to `build/` directory as a static site.

**Preview Production Build:**

```bash
npm run preview
```

**Full Build from Project Root:**

```bash
make
```

Builds frontend and packages into `webserver/` for deployment.

For detailed architecture, API integration, testing, and best practices, see the complete guide above.

---

For backend development, see [../src/README.md](../src/README.md).
