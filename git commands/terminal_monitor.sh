#!/bin/bash

# Terminal Error Monitor - Background Service
# This script runs in the background and monitors terminal output for errors
# Automatically logs errors to error_logs.md

LOG_FILE="git commands/error_logs.md"
MONITOR_DIR="/home/user/studio"
PID_FILE="git commands/.monitor.pid"

# Function to log error with timestamp
log_error() {
    local error_msg="$1"
    local explanation="$2"
    local solution="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat >> "$LOG_FILE" << EOF

---

## Auto-Detected Error - $timestamp

### Error Message:
\`\`\`
$error_msg
\`\`\`

### Explanation:
$explanation

### Suggested Solution:
\`\`\`bash
$solution
\`\`\`

EOF
    echo "[$(date)] Error logged: $error_msg" >> "git commands/monitor.log"
}

# Function to analyze output and detect errors
analyze_output() {
    local output="$1"
    
    # Permission denied
    if echo "$output" | grep -qi "permission denied"; then
        log_error "$output" \
            "Permission denied - you don't have the necessary permissions to perform this operation." \
            "chmod +x <file> OR sudo <command>"
        return 0
    fi
    
    # File not found
    if echo "$output" | grep -qi "no such file or directory"; then
        log_error "$output" \
            "The specified file or directory does not exist." \
            "ls -la to list files OR find . -name '<filename>'"
        return 0
    fi
    
    # Command not found
    if echo "$output" | grep -qi "command not found"; then
        log_error "$output" \
            "The command is not installed or not in PATH." \
            "sudo apt-get install <package> OR npm install -g <package>"
        return 0
    fi
    
    # Git fatal errors
    if echo "$output" | grep -qi "fatal:"; then
        log_error "$output" \
            "A fatal Git error occurred." \
            "git status to check repository state"
        return 0
    fi
    
    # Merge conflicts
    if echo "$output" | grep -qi "conflict"; then
        log_error "$output" \
            "A merge conflict was detected." \
            "git status to see conflicted files, then resolve manually"
        return 0
    fi
    
    # npm/yarn errors
    if echo "$output" | grep -qi "npm ERR!"; then
        log_error "$output" \
            "An npm error occurred." \
            "npm install OR rm -rf node_modules && npm install"
        return 0
    fi
    
    # TypeScript/JavaScript errors
    if echo "$output" | grep -qiE "(error TS|TypeError|ReferenceError|SyntaxError)"; then
        log_error "$output" \
            "A TypeScript or JavaScript error was detected." \
            "Check the file and line number mentioned in the error"
        return 0
    fi
    
    # Build errors
    if echo "$output" | grep -qiE "(build failed|compilation failed|error:)"; then
        log_error "$output" \
            "A build or compilation error occurred." \
            "Check the error details and fix the source code"
        return 0
    fi
    
    # Network errors
    if echo "$output" | grep -qiE "(network error|connection refused|ECONNREFUSED|ETIMEDOUT)"; then
        log_error "$output" \
            "A network connectivity error occurred." \
            "Check your internet connection and firewall settings"
        return 0
    fi
    
    # Generic error detection (exit code non-zero mentioned)
    if echo "$output" | grep -qiE "(error|failed|exception)"; then
        log_error "$output" \
            "An error was detected in the terminal output." \
            "Review the error message and take appropriate action"
        return 0
    fi
}

# Function to start monitoring
start_monitor() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Monitor is already running with PID $(cat $PID_FILE)"
        return 1
    fi
    
    echo "Starting terminal error monitor..."
    
    # Create a named pipe for communication
    PIPE_FILE="git commands/.monitor_pipe"
    rm -f "$PIPE_FILE"
    mkfifo "$PIPE_FILE"
    
    # Start background monitor
    (
        while true; do
            if read -r line < "$PIPE_FILE"; then
                analyze_output "$line"
            fi
        done
    ) &
    
    echo $! > "$PID_FILE"
    echo "Monitor started with PID $(cat $PID_FILE)"
    echo "[$(date)] Monitor started" >> "git commands/monitor.log"
}

# Function to stop monitoring
stop_monitor() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo "Monitor stopped (PID: $PID)"
            echo "[$(date)] Monitor stopped" >> "git commands/monitor.log"
        fi
        rm -f "$PID_FILE"
        rm -f "git commands/.monitor_pipe"
    else
        echo "No monitor running"
    fi
}

# Function to check monitor status
status_monitor() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "Monitor is running with PID $(cat $PID_FILE)"
    else
        echo "Monitor is not running"
        rm -f "$PID_FILE"
    fi
}

# Function to send output to monitor
send_to_monitor() {
    PIPE_FILE="git commands/.monitor_pipe"
    if [ -p "$PIPE_FILE" ]; then
        echo "$1" > "$PIPE_FILE"
    else
        echo "Monitor pipe not found. Is the monitor running?"
    fi
}

# Main script logic
case "${1:-}" in
    start)
        start_monitor
        ;;
    stop)
        stop_monitor
        ;;
    status)
        status_monitor
        ;;
    log)
        shift
        send_to_monitor "$*"
        ;;
    *)
        echo "Usage: $0 {start|stop|status|log <output>}"
        echo ""
        echo "Commands:"
        echo "  start         Start the background error monitor"
        echo "  stop          Stop the background error monitor"
        echo "  status        Check if monitor is running"
        echo "  log <output>  Send terminal output to be analyzed"
        exit 1
        ;;
esac
