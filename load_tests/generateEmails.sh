#!/bin/bash

start_time=$(date +%s.%N)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_FILE="$SCRIPT_DIR/sampleEmails.csv"
DOMAIN="example.com"
COUNT=2000

rm -f "$OUTPUT_FILE"

generate_random_string() {
    local length=$1
    local chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    local result=""
    for ((i=0; i<length; i++)); do
        result+=${chars:$((RANDOM % ${#chars})):1}
    done
    echo "$result"
}

# Generate emails in memory first using a regular array
declare -a emails
email_count=0
while [ $email_count -lt $COUNT ]; do
    prefix=$(generate_random_string 8)
    email="$prefix@$DOMAIN"
    # Check if email already exists in array
    if ! printf '%s\n' "${emails[@]}" | grep -q "^$email$"; then
        emails+=("$email")
        ((email_count++))
    fi
done

# Write all emails to file at once
echo "email" > "$OUTPUT_FILE"
printf '%s\n' "${emails[@]}" >> "$OUTPUT_FILE"

# Calculate elapsed time
end_time=$(date +%s.%N)
elapsed=$(echo "$end_time - $start_time" | bc)

# Verify count and display timing
ACTUAL_COUNT=$(wc -l < "$OUTPUT_FILE")
((ACTUAL_COUNT--))
echo "Generated $ACTUAL_COUNT unique email addresses in $OUTPUT_FILE"
printf "Time elapsed: %.2f seconds\n" $elapsed
