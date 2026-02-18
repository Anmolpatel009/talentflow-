#!/bin/bash

# Auto Error Logger Script
# This script monitors terminal output for errors and automatically logs them
# with explanations and potential solutions to error_logs.md

LOG_FILE="git commands/error_logs.md"

# Function to append to log file
log_error() {
    local error_msg="$1"
    local explanation="$2"
    local solution="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat >> "$LOG_FILE" << EOF

---

## Error Log Entry - $timestamp

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
    echo "Error logged successfully at $timestamp"
}

# Function to detect common errors and provide solutions
detect_and_log() {
    local output="$1"
    
    # Check for permission denied errors
    if echo "$output" | grep -qi "permission denied"; then
        local error_msg=$(echo "$output" | grep -i "permission denied")
        log_error "$error_msg" \
            "This error occurs when the user doesn't have sufficient permissions to access or modify a file/directory." \
            "chmod +x <filename> OR sudo <command>"
    fi
    
    # Check for file not found errors
    if echo "$output" | grep -qi "no such file or directory"; then
        local error_msg=$(echo "$output" | grep -i "no such file or directory")
        log_error "$error_msg" \
            "This error occurs when the specified file or directory doesn't exist in the current path." \
            "ls -la to check file existence OR find . -name <filename>"
    fi
    
    # Check for directory not empty errors
    if echo "$output" | grep -qi "directory not empty"; then
        local error_msg=$(echo "$output" | grep -i "directory not empty")
        log_error "$error_msg" \
            "This error occurs when trying to delete a directory that still contains files." \
            "rm -rf <directory> OR rm -r <directory>/*"
    fi
    
    # Check for command not found errors
    if echo "$output" | grep -qi "command not found"; then
        local error_msg=$(echo "$output" | grep -i "command not found")
        log_error "$error_msg" \
            "This error occurs when the command executable is not installed or not in the system PATH." \
            "export PATH=\$PATH:<command-path> OR apt-get install <package>"
    fi
    
    # Check for git errors
    if echo "$output" | grep -qi "fatal:"; then
        local error_msg=$(echo "$output" | grep -i "fatal:")
        log_error "$error_msg" \
            "This is a fatal git error that indicates a serious problem with the git operation." \
            "git status to check repo state OR git reset --hard <commit>"
    fi
    
    # Check for merge conflicts
    if echo "$output" | grep -qi "conflict"; then
        local error_msg=$(echo "$output" | grep -i "conflict")
        log_error "$error_msg" \
            "A merge conflict occurred when git couldn't automatically resolve differences between commits." \
            "git status to see conflicted files OR git add <file> && git commit"
    fi
    
    # Check for branch already exists
    if echo "$output" | grep -qi "branch .* already exists"; then
        local error_msg=$(echo "$output" | grep -i "branch .* already exists")
        log_error "$error_msg" \
            "This error occurs when trying to create a branch that already exists." \
            "git checkout <branch-name> to switch OR git branch -d <branch-name> to delete"
    fi
    
    # Check for detached HEAD
    if echo "$output" | grep -qi "detached HEAD"; then
        local error_msg="Detached HEAD state"
        log_error "$error_msg" \
            "This occurs when you're in 'detached HEAD' state, meaning you're not on a branch." \
            "git checkout <branch-name> to attach to a branch"
    fi
    
    # Check for uncommitted changes
    if echo "$output" | grep -qi "please commit your changes"; then
        local error_msg=$(echo "$output" | grep -i "please commit")
        log_error "$error_msg" \
            "Git won't proceed because there are uncommitted changes that would be overwritten." \
            "git add . && git commit OR git stash"
    fi
}

# Function to run a command and auto-log any errors
run_and_log() {
    local cmd="$*"
    echo "Running: $cmd"
    
    # Run command and capture both stdout and stderr
    output=$("$@" 2>&1)
    exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        echo "Error detected! Logging..."
        detect_and_log "$output"
    else
        echo "Command completed successfully"
    fi
    
    echo "$output"
    return $exit_code
}

# Interactive mode
echo "========================================="
echo "  Auto Error Logger - Interactive Mode"
echo "========================================="
echo ""
echo "Options:"
echo "1. Run a command with auto-error logging"
echo "2. Manually log an error"
echo "3. View error log"
echo "4. Exit"
echo ""

read -p "Select an option (1-4): " choice

case $choice in
    1)
        read -p "Enter command to run: " cmd
        eval "$cmd" 2>&1 | while IFS= read -r line; do
            echo "$line"
            detect_and_log "$line"
        done
        ;;
    2)
        read -p "Enter error message: " error_msg
        read -p "Enter explanation: " explanation
        read -p "Enter solution command: " solution
        log_error "$error_msg" "$explanation" "$solution"
        ;;
    3)
        if [ -f "$LOG_FILE" ]; then
            cat "$LOG_FILE"
        else
            echo "No error log file found"
        fi
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac
