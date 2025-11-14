# --- Backend Makefile ---

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

# Cross-compiler setup
CROSS_COMPILER_DIR := ./arm-linux-musleabi-cross
CROSS_COMPILER_URL := https://musl.cc/arm-linux-musleabi-cross.tgz
CC := $(CROSS_COMPILER_DIR)/bin/arm-linux-musleabi-gcc

CFLAGS := -DMIMEFILE=\""/etc/mime.types"\" -DWEBFS_VERSION=\"1.22\" -D_GNU_SOURCE -D_LARGEFILE_SOURCE -D_LARGEFILE64_SOURCE -D_FILE_OFFSET_BITS=64
LDFLAGS := -static

SOURCE_FILES := $(wildcard *.c *.h)
OBJ := $(patsubst %.c,%.o,$(wildcard *.c))
TARGET := webfsd
STRIPPED_TARGET := $(TARGET).stripped
TARGET_DIR := ../webserver/opt/bin
TARGET_PATH := $(TARGET_DIR)/$(TARGET)

.PHONY: all init build lint compile test clean help \
	build-only lint-only compile-only test-only \
	strip export-bin cross-cc clean-cc

all: build ## Default target (same as build)

init: cross-cc ## Initialize the backend

cross-cc: $(CROSS_COMPILER_DIR) ## Download and extract cross-compiler

$(CROSS_COMPILER_DIR):
	@echo "$(BLUE)➜ Setting up backend environment...$(NC)"
ifeq ($(shell uname -s),Linux)
	@echo "$(INFO) Linux OS detected. Proceeding with cross-compiler download."
	mkdir -p $(CROSS_COMPILER_DIR)
	wget -qO- $(CROSS_COMPILER_URL) | tar -xz -C $(CROSS_COMPILER_DIR) --strip-components=1
	@echo "$(TICK) Cross-compiler downloaded and extracted."
else
	@echo "$(CROSS) Error: This build process requires a Linux environment for the cross-compiler."
	@exit 1
endif

$(TARGET): $(OBJ)
	@echo "$(BLUE)➜ Linking $@...$(NC)"
	@$(CC) $(LDFLAGS) -o $@ $^
	@echo "$(TICK) $@ linked."

$(STRIPPED_TARGET):
	@echo "$(BLUE)➜ Striping $(TARGET)...$(NC)"
	@$(CROSS_COMPILER_DIR)/bin/arm-linux-musleabi-strip $(TARGET) -o $@
	@echo "$(TICK) $(TARGET) stripped."

test: compile ## Test the code (runs also: compile, init)
lint: init ## Lint the sources (runs also: init)

compile-only: $(TARGET) ## Compile the sources
compile: lint compile-only ## Compile the sources (runs also: init)

strip: $(STRIPPED_TARGET) ## Strip the binary

%.o: %.c
	@echo "$(BLUE)➜ Compiling $@...$(NC)"
	@$(CC) $(CFLAGS) -c $< -o $@


export-bin: $(STRIPPED_TARGET) $(TARGET_PATH) ## Export the binary

$(TARGET_PATH): strip
	@echo "$(BLUE)➜ Exporting binary to $(TARGET_DIR)...$(NC)"
	@mkdir -p $(TARGET_DIR)
	cp -f $(STRIPPED_TARGET) $@
	@echo "$(TICK) $(TARGET) exported."

build-only: strip export-bin ## Build the backend (runs: strip, export-bin)
build: compile build-only ## Build the backend (runs also: init, compile)

clean: ## Clean the backend
	@echo "$(BLUE)➜ Cleaning backend...$(NC)"
	rm -f $(OBJ) \
		$(TARGET) \
		$(STRIPPED_TARGET) \
		$(TARGET_PATH)

clean-cc: ## Delete the cross compiler
	@echo "$(BLUE)➜ Cleaning cross compiler...$(NC)"
	rm -rf $(CROSS_COMPILER_DIR)

help: ## Display this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

.DEFAULT_GOAL := all
