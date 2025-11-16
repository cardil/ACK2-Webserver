# --- Pre-execution Setup ---

# Define colors and icons for better readability
ESC := $(shell printf '\033')
BLUE := $(ESC)[38;2;30;144;255m
GREEN := $(ESC)[0;32m
YELLOW := $(ESC)[1;33m
RED := $(ESC)[0;31m
NC := $(ESC)[0m
TICK := $(GREEN)✔$(NC)
CROSS := $(RED)✖$(NC)
INFO := $(BLUE)ℹ$(NC)
WARN := $(YELLOW)⚠$(NC)
ARROW := $(BLUE)➜$(NC)
# --- Makefile Targets ---

.PHONY: all build init lint compile test clean help build-only init-only lint-only compile-only test-only deploy

all: build ## Build the entire project (default)

build: test build-only ## Run the entire build pipeline

init: ## Initialize the project
	@$(MAKE) -C frontend init
	@$(MAKE) -C src init

lint: ## Lint the project
	@$(MAKE) -C frontend lint
	@$(MAKE) -C src lint

compile: ## Compile the project
	@$(MAKE) -C frontend compile
	@$(MAKE) -C src compile

test: ## Run tests
	@$(MAKE) -C frontend test
	@$(MAKE) -C src test

build-only: ## Build and package the project
	@echo ""
	@echo "$(BLUE)➜ Building and Packaging AK2 Dashboard...$(NC)"
	@$(MAKE) -C frontend build-only
	@$(MAKE) -C src build-only
	@echo ""
	@echo "$(BLUE)➜ Creating package...$(NC)"
	@rm -f webserver/webserver.zip
	@cd webserver && zip -q -r --symlinks webserver.zip etc opt
	@echo "$(TICK) SUCCESS! The package is ready in: $(GREEN)webserver/webserver.zip$(NC)"
	@echo "$(INFO) Size: $$(du -h webserver/webserver.zip | awk '{print $$1}')"

lint-only: ## Lint the project without running the pipeline
	@$(MAKE) -C frontend lint-only
	@$(MAKE) -C src lint-only

compile-only: ## Compile the project without running the pipeline
	@$(MAKE) -C frontend compile-only
	@$(MAKE) -C src compile-only

test-only: ## Run tests without running the pipeline
	@$(MAKE) -C frontend test-only
	@$(MAKE) -C src test-only

# --- Deployment Configuration ---
PRINTER_USER ?= root
PRINTER_PORT ?= 22
WEBFSD_PORT ?= 8000

deploy: build ## Deploy to printer via SSH (Usage: make deploy PRINTER_IP=192.168.1.100)
	@if [ -z "$(PRINTER_IP)" ]; then \
		echo "$(CROSS) Error: PRINTER_IP not specified"; \
		echo "$(INFO) Usage: make deploy PRINTER_IP=192.168.1.100 [PRINTER_USER=root] [PRINTER_PORT=22] [WEBFSD_PORT=8000]"; \
		echo "$(WARN) Prerequisites: SSH access, unzip, openssh-sftp-server installed on printer"; \
		echo "$(INFO) Install with: opkg update && opkg install unzip openssh-sftp-server"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(BLUE)➜ Deploying to $(PRINTER_USER)@$(PRINTER_IP):$(PRINTER_PORT)...$(NC)"
	@echo "$(INFO) Webserver will run on port $(WEBFSD_PORT)"
	@echo "$(INFO) Uploading package..."
	@scp -P $(PRINTER_PORT) webserver/webserver.zip $(PRINTER_USER)@$(PRINTER_IP):/webserver.zip || { echo "$(CROSS) Upload failed. Ensure openssh-sftp-server is installed."; exit 1; }
	@echo "$(TICK) Package uploaded"
	@echo "$(INFO) Installing and restarting webserver..."
	@ssh -p $(PRINTER_PORT) $(PRINTER_USER)@$(PRINTER_IP) '\
		cd / && \
		killall webfsd 2>/dev/null || true && \
		rm -rf /opt/webfs && \
		unzip -o webserver.zip && \
		webfsd -p $(WEBFSD_PORT) && \
		rm -f webserver.zip \
	' || { echo "$(CROSS) Deployment failed. Check prerequisites."; exit 1; }
	@echo "$(TICK) Deployment complete"
	@echo ""
	@echo "$(GREEN)✓ Dashboard deployed successfully!$(NC)"
	@echo "$(INFO) Access at: $(BLUE)http://$(PRINTER_IP):$(WEBFSD_PORT)$(NC)"

clean: ## Clean the project
	@echo ""
	@echo "$(BLUE)➜ Cleaning frontend...$(NC)"
	@$(MAKE) -C frontend clean
	@echo ""
	@echo "$(BLUE)➜ Cleaning backend...$(NC)"
	@$(MAKE) -C src clean
	@echo ""
	@echo "$(BLUE)➜ Removing artifacts...$(NC)"
	@rm -f webserver/webserver.zip

help: ## Display this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

.DEFAULT_GOAL := all
