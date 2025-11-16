# AK2 Dashboard

A modern web interface for Anycubic Kobra 2 Series 3D printers, bringing powerful features and full control to your fingertips.

## What You Get

### 🎯 Comprehensive Dashboard
- **Live webcam streaming** - Monitor your prints in real-time
- **Real-time printer statistics** - Temperature, progress, status at a glance
- **Full printer control** - Upload files, start/pause/stop prints remotely
- **Print history** - Track all your completed prints
- **Kobra Unleashed integration** - Advanced cloud printing and monitoring

### 🔧 Advanced Bed Mesh Leveling
The stock firmware's bed leveling produces inconsistent results. Our solution changes that:

- **Intelligent mesh averaging** - Combine multiple leveling passes for superior accuracy
- **3D mesh visualization** - See your bed topology in stunning detail
- **Profile system** - Save different configurations for various materials and plates
- **Custom grids** - Choose your probe density (up to 10×10 on Plus/Max)
- **Temperature-aware leveling** - Account for thermal expansion at print temperatures

The averaging algorithm eliminates measurement inconsistencies by computing the mean of multiple probe passes, giving you reliable first-layer adhesion every time.

### 📁 Smart File Management
- **Syntax-highlighted code viewer** - View G-code, configs, and scripts with proper highlighting (11+ languages)
- **Binary file support** - Inspect binary files with hex dump view
- **Directory navigation** - Browse printer filesystem with breadcrumb trails
- **File operations** - Download files directly from the web interface

### 🛠️ System Tools
- **System monitoring** - CPU usage, memory, uptime, temperatures
- **Service management** - Control SSH access remotely
- **Security** - Change root password from the web interface
- **Advanced log viewer** - Real-time printer logs with error highlighting, deduplication, and follow mode
- **Resource efficient** - Less than 1% memory usage, minimal CPU impact

### 🎨 Modern Design
- **Light and dark themes** - Easy on the eyes, day or night
- **Responsive layout** - Works on desktop, tablet, and mobile
- **Fast and lightweight** - Built with performance in mind
- **Intuitive interface** - No learning curve required

## Why This Exists

The closed-source nature of these 3D printers imposes limitations on end users, confining them to functionalities predetermined by the manufacturer. This lack of flexibility stifles innovation and prevents users from implementing their own ideas for product enhancements.

The AK2 Dashboard addresses these limitations, offering features unavailable in the stock firmware. It empowers users with greater control over their printing processes while maintaining remarkable efficiency.

## Project History

This project evolved from a simple static HTML webserver into a comprehensive, modern web application:

- **Origins** - Born from the Kobra 2 modding community's desire for better printer control
- **Evolution** - Transitioned from static HTML to a reactive Svelte application
- **Community-driven** - Built with contributions and feedback from users worldwide
- **Open source** - All code freely available for learning and improvement

## Community & Credits

### Join the Community
- **Telegram Group** - [https://t.me/kobra2modding](https://t.me/kobra2modding) - For questions, bug reports, and discussions

### Key Projects
- **[AK2 Custom Firmware & Tools](https://github.com/cardil/kobra2-fw-tools)** - Custom firmware tools for Kobra 2 Series
- **[AK2 Dashboard](https://github.com/cardil/ACK2-Webserver)** - This webserver project
- **[Kobra Unleashed](https://github.com/anjomro/kobra-unleashed)** - Original MQTT server project
- **[Kobra Unleashed (Updated)](https://github.com/cardil/kobra-unleashed)** - Maintained fork with enhancements

### Built With
- **[WEBFS](https://linux.bytesex.org/misc/webfs.html)** - Optimized static web server
- **[MUSL](https://musl.libc.org)** - Lightweight C standard library for ARM cross-compilation
- **[Svelte](https://svelte.dev/)** - Modern reactive web framework
- **[ECharts](https://echarts.apache.org/)** - 3D mesh visualization

### Contributors
This project represents countless hours of development, testing, and refinement by community members passionate about improving their 3D printing experience. Special thanks to all who have contributed code, reported bugs, tested features, and provided feedback.

## Technical Overview

The AK2 Dashboard consists of two main components:

- **C Backend** - A lightweight WEBFS-based server built with MUSL for minimal resource usage
- **Svelte Frontend** - A modern, reactive web application that communicates via REST API

The entire stack runs efficiently on the printer's ARM processor, using less than 1% of system memory and imposing minimal CPU load.

---

**This project is open source and welcomes contributions. Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.**
