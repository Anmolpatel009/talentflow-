#!/bin/bash

# Shell Hook for Automatic Error Capture
# Add this to your .bashrc or source it in your shell

# Path to the monitor script
MONITOR_SCRIPT="/home/user/studio/git commands/terminal_monitor.sh"
LOG_FILE="/home/user/studio/git commands/error_logs.md"

# Function to capture and log errors after each command
auto_log_errors() {
    local exit_code=$?
    
    # Only log if exit code is non-zero (error)
    if [ $exit_code -ne 0 ]; then
        local cmd=$(history 1 | sed 's/^[ ]*[0-9]*[ ]*//')
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        
        # Log to error file
        cat >> "$LOG_FILE" << EOF

---

## Shell Error - $timestamp

### Command:
\`\`\`bash
$cmd
\`\`\`

### Exit Code: $exit_code

### Explanation:
The command exited with a non-zero status code, indicating an error occurred.

### Suggested Solution:
\`\`\`bash
# Check the command syntax and arguments
# Run with verbose output for more details
\`\`\`

EOF
        echo "[$(date)] Logged error: $cmd (exit code: $exit_code)" >> "/home/user/studio/git commands/monitor.log"
    fi
}

# Function to capture stderr and log it
capture_stderr() {
    local exit_code=$?
    local cmd=$(history 1 | sed 's/^[ ]*[0-9]*[ ]*//')
    
    if [ $exit_code -ne 0 ]; then
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        
        cat >> "$LOG_FILE" << EOF

---

## Command Error - $timestamp

### Command:
\`\`\`bash
$cmd
\`\`\`

### Exit Code: $exit_code

### Possible Causes:
- Command syntax error
- Missing arguments
- File or directory not found
- Permission denied
- Network connectivity issues

### Debugging Steps:
\`\`\`bash
# 1. Check if the command exists
which <command>

# 2. Check file permissions
ls -la <file>

# 3. Run with verbose/debug flags
<command> --verbose
\`\`\`

EOF
    fi
}

# Set PROMPT_COMMAND to capture errors
export PROMPT_COMMAND="capture_stderr"

# Alternative: Use trap to catch ERR signal
trap 'auto_log_errors' ERR

echo "Error logging enabled. Errors will be automatically captured to:"
echo "$LOG_FILE"
