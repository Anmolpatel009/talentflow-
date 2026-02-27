#!/bin/bash

# Learning Tracker Script
# This script automates the process of adding entries to the LEARNING_TRACKER.md file

TRACKER_FILE="LEARNING_TRACKER.md"

# Function to add a new learning entry
add_learning_entry() {
    local date=$(date '+%Y-%m-%d')
    local task_description="$1"
    local technical_concepts="$2"
    local key_changes="$3"
    local related_files="$4"

    # Create entry content
    local entry="### $date - $task_description
**Accomplished**: $task_description  
**Technical Concepts**: $technical_concepts  
**Key Changes**: $key_changes  
**Related Files**: $related_files

---"

    # Insert entry after the second line (after the # Entries section header)
    sed -i '3r /dev/stdin' "$TRACKER_FILE" <<<"$entry"

    echo "Learning entry added successfully!"
}

# Function to add a placeholder entry
add_placeholder() {
    local placeholder="### [YYYY-MM-DD] - [Task Description]
**Accomplished**: [What you did]  
**Technical Concepts**: [Concepts learned or used]  
**Key Changes**: [Code or configuration changes]  
**Related Files**: [Links to affected files]

---"

    # Find and replace the current placeholder
    if grep -q '\[YYYY-MM-DD\]' "$TRACKER_FILE"; then
        sed -i '/### \[YYYY-MM-DD\]/,/---/c\'"$placeholder" "$TRACKER_FILE"
    else
        echo "$placeholder" >>"$TRACKER_FILE"
    fi

    echo "Placeholder entry updated successfully!"
}

# Function to update technical concepts index
update_concepts_index() {
    local concepts="$1"
    local category="$2"

    # Check if category exists
    if grep -q "### $category" "$TRACKER_FILE"; then
        # Append concepts to existing category
        sed -i "/### $category/,/^---/s/^- .*/&\\n- $concepts/" "$TRACKER_FILE"
    else
        # Add new category
        local new_category="### $category
- $concepts

---"

        sed -i '/## Technical Concepts Index/r /dev/stdin' "$TRACKER_FILE" <<<"$new_category"
    fi

    echo "Technical concepts index updated successfully!"
}

# Function to show git diff summary
show_git_diff() {
    if [ -z "$(git status --porcelain)" ]; then
        echo "No changes to commit"
    else
        echo "=== Git Diff Summary ==="
        git diff --stat
    fi
}

# Interactive mode
echo "========================================="
echo "  TalentFlow PRT Learning Tracker"
echo "========================================="
echo ""
echo "Options:"
echo "1. Add learning entry"
echo "2. Add placeholder entry"
echo "3. Update technical concepts index"
echo "4. Show git diff summary"
echo "5. Exit"
echo ""

read -p "Select an option (1-5): " choice

case $choice in
    1)
        read -p "Enter task description: " task_desc
        read -p "Enter technical concepts: " concepts
        read -p "Enter key changes: " changes
        read -p "Enter related files (comma-separated): " files

        add_learning_entry "$task_desc" "$concepts" "$changes" "$files"
        ;;
    2)
        add_placeholder
        ;;
    3)
        read -p "Enter technical concepts (comma-separated): " concepts
        read -p "Enter category (e.g., Database Design, Frontend Development): " category
        update_concepts_index "$concepts" "$category"
        ;;
    4)
        show_git_diff
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option"
