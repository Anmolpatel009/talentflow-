#!/bin/bash

# TalentFlow PRT Shell Hook for Automatic Error and Learning Tracking
# This script is sourced to enable automatic logging of all terminal commands
# and their output, including error detection and learning entry creation

# Error log file
LOG_FILE="git commands/error_logs.md"

# Learning tracker file
TRACKER_FILE="LEARNING_TRACKER.md"

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
}

# Function to log file changes as learning entry
log_file_change() {
    local filename="$1"
    local change_type="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Create learning entry
    local entry="### ${timestamp% *} - File ${change_type}: ${filename}
**Accomplished**: File ${change_type}: ${filename}  
**Technical Concepts**: File manipulation  
**Key Changes**: ${change_type} on ${filename}  
**Related Files**: ${filename}

---"

    # Insert entry after the # Entries section header
    if [ -f "$TRACKER_FILE" ]; then
        sed -i '3r /dev/stdin' "$TRACKER_FILE" <<<"$entry"
        
        # Update placeholder entry to ensure it's always at the end
        local placeholder="### [YYYY-MM-DD] - [Task Description]
**Accomplished**: [What you did]  
**Technical Concepts**: [Concepts learned or used]  
**Key Changes**: [Code or configuration changes]  
**Related Files**: [Links to affected files]

---"
        
        # Remove existing placeholder if it exists
        sed -i '/### \[YYYY-MM-DD\]/,/---/d' "$TRACKER_FILE"
        
        # Append new placeholder
        echo "$placeholder" >>"$TRACKER_FILE"
    fi
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

# Function to execute before each command is run
preexec() {
    # Log the command being executed
    PREEXEC_COMMAND="$BASH_COMMAND"
}

# Function to execute after each command is run
precmd() {
    local cmd="$PREEXEC_COMMAND"
    local exit_code="$?"
    
    # Reset for next command
    PREEXEC_COMMAND=""
    
    # Only process non-internal commands
    if [ -n "$cmd" ] && [ "$cmd" != "precmd" ] && [ "$cmd" != "preexec" ] && [ "$cmd" != "prompt_command" ]; then
        
        # Check for file change commands
        if echo "$cmd" | grep -qiE "(git add|mv |cp |rm |touch )"; then
            # Extract filename from command
            filename=$(echo "$cmd" | grep -oE "(git add|mv|cp|rm|touch) [^ ]+" | awk '{print $2}')
            if [ -n "$filename" ]; then
                # Determine change type
                if echo "$cmd" | grep -qi "git add"; then
                    log_file_change "$filename" "Added"
                elif echo "$cmd" | grep -qi "mv "; then
                    log_file_change "$filename" "Moved"
                elif echo "$cmd" | grep -qi "cp "; then
                    log_file_change "$filename" "Copied"
                elif echo "$cmd" | grep -qi "rm "; then
                    log_file_change "$filename" "Deleted"
                elif echo "$cmd" | grep -qi "touch "; then
                    log_file_change "$filename" "Created"
                fi
            fi
        elif echo "$cmd" | grep -qiE "(npm run|node |tsc |npx )"; then
            log_file_change "Project Files" "Modified"
        fi
        
        # If command failed, log error
        if [ "$exit_code" -ne 0 ]; then
            # Try to get output of previous command
            local output=$(fc -e - 1)
            analyze_output "$output"
        fi
    fi
}

# Function to handle the prompt
prompt_command() {
    # Call precmd after each command
    precmd
}

# Enable the hooks
if [ -z "$PROMPT_COMMAND_BAK" ]; then
    PROMPT_COMMAND_BAK="$PROMPT_COMMAND"
fi

PROMPT_COMMAND="prompt_command"

# This is just to ensure we set PS0 correctly
if [ -n "$BASH_VERSION" ] && [ "${BASH_VERSINFO:-0}" -ge 4 ] && [ "${BASH_VERSINFO:-0}" -lt 5 ]; then
    PS0="$(printf '\033]0;%s\007' "TalentFlow PRT")"
elif [ -n "$BASH_VERSION" ] && [ "${BASH_VERSINFO:-0}" -ge 5 ]; then
    PS0="$(printf '\033]0;%s\007' "TalentFlow PRT")"
else
    echo "Shell version less than 4.0, advanced pre-exec hook not supported"
fi

echo "✅ TalentFlow PRT shell hook activated"
echo "   Terminal commands and errors will be automatically tracked"
echo "   File changes will be logged in LEARNING_TRACKER.md"
