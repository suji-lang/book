.PHONY: all build serve clean watch install test help highlight

# mdBook's default build directory (see book.toml: no build-dir override)
BUILD_DIR := book

# Default target
all: highlight build

# Build the book. `highlight` must run first: theme/highlight.js is a theme
# override, so mdbook copies it into $(BUILD_DIR) as part of the build.
build: highlight
	@echo "Building the Suji book..."
	mdbook build

# Build the Suji-aware highlight.js bundle into theme/highlight.js
highlight:
	@echo "Building custom highlight.js with Suji support..."
	@command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }
	@test -d node_modules || npm install
	npm run build-highlight

# Serve the book with live reload
serve: highlight
	@echo "Starting local server with live reload..."
	mdbook serve --open

# Watch for changes and rebuild
watch: highlight
	@echo "Watching for changes..."
	mdbook watch

# Clean build artifacts
clean:
	@echo "Cleaning build directory..."
	rm -rf $(BUILD_DIR)
	rm -f theme/highlight.js theme/highlight.js.map

# Initialize/reinstall mdbook and preprocessors (if needed)
install:
	@echo "Checking for mdbook installation..."
	@which mdbook > /dev/null || (echo "Installing mdbook..." && cargo install mdbook)
	@echo "Installing node dependencies..."
	npm install

# Check that the book builds and the highlighter made it into the output
test: build
	@echo "Testing the Suji highlight definition..."
	npm run test-highlight
	@echo "Testing book build..."
	@test -f $(BUILD_DIR)/index.html || (echo "Build failed: no index.html" && exit 1)
	@grep -q suji $(BUILD_DIR)/highlight.js || (echo "highlight.js in the build has no Suji support" && exit 1)
	@echo "Build successful!"

# Display help
help:
	@echo "Suji Book Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  build      - Build the book (runs highlight first)"
	@echo "  highlight  - Build the Suji-aware highlight.js bundle"
	@echo "  serve      - Start local server with live reload"
	@echo "  watch      - Watch for changes and rebuild"
	@echo "  clean      - Remove build artifacts"
	@echo "  install    - Install mdbook and node dependencies"
	@echo "  test       - Check that the book builds correctly"
	@echo "  help       - Show this help message"
