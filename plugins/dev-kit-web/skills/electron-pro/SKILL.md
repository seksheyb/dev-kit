---
name: electron-pro
description: Use when the task involves Electron desktop applications — cross-platform desktop apps for Windows/macOS/Linux, main/renderer processes, IPC, preload scripts, context isolation, native OS integration, system tray, auto-updates, code signing, notarization, installers, electron-builder.
---

# Electron Pro

Knowledge pack for building cross-platform Electron desktop applications with Electron 27+ and native OS integrations — secure, performant desktop apps that feel native while maintaining code efficiency across Windows, macOS, and Linux, from architecture to signed, distributable installers.

Before implementing, review desktop app requirements and OS targets, security constraints and native integration needs, and performance requirements and memory budgets; design following Electron security best practices.

## Desktop Development Checklist

- Context isolation enabled everywhere
- Node integration disabled in renderers
- Strict Content Security Policy
- Preload scripts for secure IPC
- Code signing configured
- Auto-updater implemented
- Native menus integrated
- App size under 100MB installer

## Security Implementation

- Context isolation mandatory
- Remote module disabled
- WebSecurity enabled
- Preload script API exposure
- IPC channel validation
- Permission request handling
- Certificate pinning
- Secure data storage

## Process Architecture

- Main process responsibilities
- Renderer process isolation
- IPC communication patterns
- Shared memory usage
- Worker thread utilization
- Process lifecycle management
- Memory leak prevention
- CPU usage optimization

## Native OS Integration

- System menu bar setup
- Context menus
- File associations
- Protocol handlers
- System tray functionality
- Native notifications
- OS-specific shortcuts
- Dock/taskbar integration

## Window Management

- Multi-window coordination
- State persistence
- Display management
- Full-screen handling
- Window positioning
- Focus management
- Modal dialogs
- Frameless windows

## Auto-Update System

- Update server setup
- Differential updates
- Rollback mechanism
- Silent updates option
- Update notifications
- Version checking
- Download progress
- Signature verification

## Performance Optimization

- Startup time under 3 seconds
- Memory usage below 200MB idle
- Smooth animations at 60 FPS
- Efficient IPC messaging
- Lazy loading strategies
- Resource cleanup
- Background throttling
- GPU acceleration

## Build Configuration

- Multi-platform builds
- Native dependency handling
- Asset optimization
- Installer customization
- Icon generation
- Build caching
- CI/CD integration
- Platform-specific features

## Implementation Workflow

Navigate desktop development through security-first phases.

### 1. Architecture Design

Plan secure and efficient desktop application structure.

Design considerations:

- Process separation strategy
- IPC communication design
- Native module requirements
- Security boundary definition
- Update mechanism planning
- Data storage approach
- Performance targets
- Distribution method

Technical decisions:

- Electron version selection
- Framework integration
- Build tool configuration
- Native module usage
- Testing strategy
- Packaging approach
- Update server setup
- Monitoring solution

### 2. Secure Implementation

Build with security and performance as primary concerns.

Development focus:

- Main process setup
- Renderer configuration
- Preload script creation
- IPC channel implementation
- Native menu integration
- Window management
- Update system setup
- Security hardening

### 3. Distribution Preparation

Package and prepare for multi-platform distribution.

Distribution checklist:

- Code signing completed
- Notarization processed
- Installers generated
- Auto-update tested
- Performance validated
- Security audit passed
- Documentation ready
- Support channels setup

## Platform-Specific Handling

- Windows registry integration
- macOS entitlements
- Linux desktop files
- Platform keybindings
- Native dialog styling
- OS theme detection
- Accessibility APIs
- Platform conventions

## File System Operations

- Sandboxed file access
- Permission prompts
- Recent files tracking
- File watchers
- Drag and drop
- Save dialog integration
- Directory selection
- Temporary file cleanup

## Debugging and Diagnostics

- DevTools integration
- Remote debugging
- Crash reporting
- Performance profiling
- Memory analysis
- Network inspection
- Console logging
- Error tracking

## Native Module Management

- Module compilation
- Platform compatibility
- Version management
- Rebuild automation
- Binary distribution
- Fallback strategies
- Security validation
- Performance impact

## Priorities

- Prioritize security, ensure native OS integration quality, and deliver performant desktop experiences across all platforms.
