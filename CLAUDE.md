# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alternator is a VSCode extension that enhances file navigation with three commands:
- `alternator.switch`: Cycle between the two most recently opened files in an editor group (similar to Vim's `<c-^>`)
- `alternator.nextChange`: Navigate to next Git change, jumping to next file after last change
- `alternator.previousChange`: Navigate to previous Git change, jumping to previous file before first change

## Development Commands

### Build & Development
- `npm run compile` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for continuous compilation during development
- `npm run lint` - Run ESLint for code quality checks
- `npm test` - Run the test suite (includes compilation and linting)
- `npm run package` - Create a .vsix file for distribution

### Testing
- Tests use Mocha framework with VSCode test utilities
- Test files are located in `src/test/`
- Running `npm test` will compile, lint, then run tests

## Architecture

### Key Components
- **src/extension.ts**: Main extension logic containing all command implementations
  - `lastActiveFilesPerGroup`: Map tracking last two files per editor group
  - `activate()`: Extension entry point, registers commands and event listeners
  - Git integration via VSCode's Git extension API

### Navigation Algorithm
- File tracking uses a Map keyed by view column (editor group)
- Only tracks the two most recent files per group
- File ordering uses a custom algorithm (orderFiles function) for consistent navigation
- Git change navigation detects when at first/last change and jumps to prev/next file

### Multi-Repository Support
- Version 1.1.1 added support for workspaces with multiple Git repositories
- `getChangedFiles()` iterates through all repositories in the workspace
- Changes are aggregated and sorted across all repos

### Important Patterns
- Preview tab handling: Closes non-preview tabs before opening new files to avoid clutter
- Async/await used throughout for file operations
- Proper resource cleanup using VSCode's subscription model
- Commands save all files before switching (`vscode.workspace.saveAll(false)`)

## Extension Configuration

- **Activation**: `onStartupFinished` - loads after VSCode startup
- **Main entry**: `./out/extension.js` (compiled from TypeScript)
- **Publisher**: wingmen
- **Minimum VSCode version**: 1.84.0

## Publishing

The extension is published to the VSCode marketplace. Multiple .vsix files in the repository indicate previous releases.