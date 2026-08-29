.PHONY: all build serve clean watch install help

# mdBook's default build directory (see book.toml: no build-dir override)
BUILD_DIR := book

# Default target
all: build

# Build the book
build:
	@echo "Building the Suji book..."
	mdbook build

# Serve the book with live reload
serve:
	@echo "Starting local server with live reload..."
	mdbook serve --open

# Watch for changes and rebuild
watch:
	@echo "Watching for changes..."
	mdbook watch

# Clean build artifacts
clean:
	@echo "Cleaning build directory..."
	rm -rf $(BUILD_DIR)

# Initialize/reinstall mdbook (if needed)
install:
	@echo "Checking for mdbook installation..."
	@which mdbook > /dev/null || (echo "Installing mdbook..." && cargo install mdbook)

# Display help
help:
	@echo "Suji Book Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  build      - Build the book"
	@echo "  serve      - Start local server with live reload"
	@echo "  watch      - Watch for changes and rebuild"
	@echo "  clean      - Remove build artifacts"
	@echo "  install    - Install mdbook"
	@echo "  help       - Show this help message"
