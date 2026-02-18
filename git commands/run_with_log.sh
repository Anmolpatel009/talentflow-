#!/bin/bash

# Simple Error Logger Wrapper
# Usage: ./run_with_log.sh <your command>
# This wraps any command and automatically logs errors

LOG_FILE="/home/user/studio/git commands/error_logs.md"

# Run the command and capture both stdout and stderr
output=$("$@" 2>&1)
exit_code=$?

# Display the output
echo "$output"

# If there was an error, log it
if [ $exit_code -ne 0 ]; then
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Determine error type and explanation
    explanation="The command failed with exit code $exit_code."
    solution="Check the command syntax and arguments."
    
    if echo "$output" | grep -qi "permission denied"; then
        explanation="Permission denied - insufficient permissions."
        solution="chmod +x <file> OR sudo <command>"
    elif echo "$output" | grep -qi "no such file or directory"; then
        explanation="File or directory not found."
        solution="ls -la to check files OR find . -name '<filename>'"
    elif echo "$output" | grep -qi "command not found"; then
        explanation="Command not installed or not in PATH."
        solution="sudo apt-get install <package> OR npm install -g <package>"
    elif echo "$output" | grep -qi "fatal:"; then
        explanation="Git fatal error occurred."
        solution="git status to check repository state"
    elif echo "$output" | grep -qi "npm ERR!"; then
        explanation="npm error occurred."
        solution="npm install OR rm -rf node_modules && npm install"
    fi
    
    # Log the error
    cat >> "$LOG_FILE" << EOF

---

## Command Error - $timestamp

### Command:
\`\`\`bash
$*
\`\`\`

### Exit Code: $exit_code

### Output:
\`\`\`
$output
\`\`\`

### Explanation:
$explanation

### Suggested Solution:
\`\`\`bash
$solution
\`\`\`

EOF
    
    echo ""
    echo "⚠️  Error logged to: $LOG_FILE"
fi

exit $exit_code
