# Git Commands - Error Logging System

This folder contains scripts for automatically detecting and logging terminal errors.

## Files

| File | Description |
|------|-------------|
| `error_logs.md` | Main log file where all errors are recorded |
| `run_with_log.sh` | Wrapper script to run commands with automatic error logging |
| `terminal_monitor.sh` | Background service for monitoring terminal output |
| `shell_hook.sh` | Shell integration for automatic error capture |
| `auto_error_logger.sh` | Interactive error logger |

## Quick Start

### Method 1: Run Commands with Error Logging (Recommended)

Wrap any command with the logger:

```bash
./git commands/run_with_log.sh <your command>
```

Example:
```bash
./git commands/run_with_log.sh npm install
./git commands/run_with_log.sh git status
./git commands/run_with_log.sh ls /some/path
```

If the command fails, it automatically logs:
- The command that failed
- Exit code
- Output/error message
- Explanation of the error
- Suggested solution

### Method 2: Enable Shell Integration

To automatically log ALL errors in your terminal:

```bash
source ./git commands/shell_hook.sh
```

This will enable error logging for the current terminal session. Every command that fails will be logged automatically.

### Method 3: Background Monitor

Start the background monitor service:

```bash
./git commands/terminal_monitor.sh start
```

Check status:
```bash
./git commands/terminal_monitor.sh status
```

Stop the monitor:
```bash
./git commands/terminal_monitor.sh stop
```

## Error Types Detected

The system automatically detects and explains:

- **Permission denied** - Insufficient permissions
- **File not found** - Missing files or directories
- **Command not found** - Missing packages or PATH issues
- **Git fatal errors** - Repository problems
- **npm errors** - Package installation issues
- **TypeScript/JavaScript errors** - Code compilation errors
- **Network errors** - Connection issues
- **Merge conflicts** - Git merge problems

## Viewing Logs

View the error log:
```bash
cat "git commands/error_logs.md"
```

Or open in VS Code:
```bash
code "git commands/error_logs.md"
```

## Example Log Entry

```markdown
## Command Error - 2026-02-18 16:59:04

### Command:
ls /nonexistent/path/to/file

### Exit Code: 2

### Output:
ls: cannot access '/nonexistent/path/to/file': No such file or directory

### Explanation:
File or directory not found.

### Suggested Solution:
ls -la to check files OR find . -name '<filename>'
```
