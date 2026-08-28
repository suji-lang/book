# Installation

Suji is distributed as source code and built with Cargo. There is no published
package yet, so every installation starts with a clone and a build.

## Prerequisites

- A Unix-like system (macOS or Linux), or Windows with WSL
- The Rust toolchain, stable channel, **1.85 or newer** (the workspace uses
  Rust edition 2024)
- Git

Suji has no C dependencies: every crate it uses is pure Rust, so you do not need
OpenSSL or any other system library.

## Build from source

### 1. Install Rust

If you don't have Rust, install it from [rustup.rs](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

If Rust is already installed, make sure it is current:

```bash
rustup update stable
rustc --version
```

### 2. Clone the repository

```bash
git clone https://github.com/suji-lang/suji.git
cd suji
```

### 3. Build the interpreter

```bash
cargo build --release
```

The workspace builds the `suji-cli` package by default, producing the binary at
`target/release/suji`. The `Makefile` wraps the same commands:

```bash
make build     # debug build, faster to compile
make release   # optimized build
```

### 4. Put `suji` on your PATH (optional)

```bash
cargo install --path crates/suji-cli
```

This installs the `suji` binary into `~/.cargo/bin`, which rustup already adds to
your PATH. Alternatively, copy the binary yourself:

```bash
sudo cp target/release/suji /usr/local/bin/
# or, without sudo
mkdir -p ~/.local/bin && cp target/release/suji ~/.local/bin/
```

## Verify the installation

Suji has no `--version` or `--help` flag, so verify it by running a program.
Create `hello.si`:

```suji
import std:println

println("Hello, World!")
```

Then run it:

```bash
suji hello.si
```

```text
Hello, World!
```

Starting `suji` with no file argument opens the REPL:

```bash
suji
```

```text
SUJI Language REPL
Type expressions to evaluate them, or :help for commands
Use Ctrl+C to cancel current input, Ctrl+D or :quit to exit

suji>
```

Type `:quit` or press Ctrl+D to leave.

## Platform notes

### macOS

Install the Xcode Command Line Tools if the linker is missing:

```bash
xcode-select --install
```

Apple Silicon builds natively with the ARM64 toolchain; no extra configuration
is needed.

### Linux

You need a working linker and C toolchain for Rust itself. On Debian/Ubuntu:

```bash
sudo apt update
sudo apt install build-essential
```

On Fedora/RHEL:

```bash
sudo dnf install gcc
```

### Windows

Use WSL 2 and follow the Linux instructions. Suji's own code is
platform-independent, but the shell integration (backtick command templates) and
parts of `std:os` assume a Unix shell, so WSL gives the most predictable
behaviour.

## Troubleshooting

**`error: package requires rustc 1.85 or newer`** — run `rustup update stable`.

**Linking errors** — install the platform build tools listed above.

**Out of memory while compiling** — limit parallelism:

```bash
cargo build --release -j 2
```

**`suji: command not found`** — the binary is not on your PATH. Run it by path
(`./target/release/suji program.si`), add the directory to your PATH, or use
`cargo install --path crates/suji-cli`.

## Working on Suji itself

```bash
cargo build            # debug build
cargo run -- examples/hello.si
make test              # Rust tests + spec suite + examples
make lint              # clippy and formatting checks
```

See the [Contributing](../development/contributing.md) chapter for the crate
layout and testing conventions.

## Uninstalling

```bash
cargo uninstall suji-cli        # if installed with cargo install
sudo rm /usr/local/bin/suji     # if copied manually
```

Then delete the cloned repository.

## Next steps

1. Work through the [Quick Start](quick-start.md)
2. Walk through a first program in [Hello World](hello-world.md)
3. Learn the tooling in [CLI & REPL](cli-repl.md)
4. Read the [Language Overview](../fundamentals/overview.md)

## See Also

- [CLI & REPL](cli-repl.md)
- [Contributing](../development/contributing.md)
