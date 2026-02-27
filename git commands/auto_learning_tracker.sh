#!/bin/bash

# Auto Learning Tracker Script
# This script works in conjunction with the git post-commit hook to
# automatically update the LEARNING_TRACKER.md file with commit information

TRACKER_FILE="LEARNING_TRACKER.md"

# Function to create a new learning entry
create_learning_entry() {
    local commit_hash="$1"
    local commit_msg="$2"
    local commit_date="$3"
    local changed_files="$4"

    # Create entry content with markdown formatting
    local entry="### $commit_date - Commit ${commit_hash}
**Accomplished**: ${commit_msg}  
**Key Changes**: $(echo "$changed_files" | head -5)  
**Related Files**: $(echo "$changed_files" | head -5)

---"

    echo "$entry"
}

# Function to update technical concepts index
update_concepts_index() {
    local commit_msg="$1"
    local changed_files="$2"

    # Extract potential technical concepts from commit message and changed files
    # This is a simple keyword matching - you can enhance this
    local concepts=()

    # Check for frontend-related keywords
    if echo "$commit_msg $changed_files" | grep -qi "react\|next\|tailwind\|frontend"; then
        concepts+=("Frontend Development")
    fi

    # Check for backend-related keywords
    if echo "$commit_msg $changed_files" | grep -qi "supabase\|postgres\|api\|backend"; then
        concepts+=("Backend Architecture")
    fi

    # Check for database-related keywords
    if echo "$commit_msg $changed_files" | grep -qi "sql\|schema\|database\|migration"; then
        concepts+=("Database Design")
    fi

    # Check for security-related keywords
    if echo "$commit_msg $changed_files" | grep -qi "auth\|security\|encrypt\|otp"; then
        concepts+=("Security")
    fi

    # Check for AI-related keywords
    if echo "$commit_msg $changed_files" | grep -qi "ai\|llm\|semantic\|vector"; then
        concepts+=("AI/ML Integration")
    fi

    # Return unique concepts
    echo "${concepts[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '
}

# Function to log error for manual entry
log_manual_entry() {
    local task_description="$1"
    local technical_concepts="$2"
    local key_changes="$3"
    local related_files="$4"

    local entry="### $(date '+%Y-%m-%d') - $task_description
**Accomplished**: $task_description  
**Technical Concepts**: $technical_concepts  
**Key Changes**: $key_changes  
**Related Files**: $related_files

---"

    # Insert entry after the second line (after the # Entries section header)
    sed -i '3r /dev/stdin' "$TRACKER_FILE" <<<"$entry"

    echo "✅ Manual learning entry added successfully!"
}

# Main function called from git post-commit hook
main() {
    # Check if tracker file exists
    if [ ! -f "$TRACKER_FILE" ]; then
        echo "ℹ️  Learning tracker file not found, skipping auto-entry"
        return 0
    fi

    # Get commit information
    local commit_hash=$(git log -1 --pretty=%h)
    local commit_msg=$(git log -1 --pretty=%B)
    local commit_date=$(git log -1 --pretty=%cd --date=format:%Y-%m-%d)
    local changed_files=$(git show --stat --oneline HEAD)

    # Create learning entry
    local entry=$(create_learning_entry "$commit_hash" "$commit_msg" "$commit_date" "$changed_files")

    # Insert entry after the # Entries section header
    sed -i '3r /dev/stdin' "$TRACKER_FILE" <<<"$entry"

    # Update placeholder entry
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

    echo "✅ Learning tracker updated for commit ${commit_hash}"
}

# If called directly with arguments, add manual entry
if [ "$#" -ge 1 ]; then
    log_manual_entry "$1" "$2" "$3" "$4"
else
    # Called from git post-commit hook
    main
fi
