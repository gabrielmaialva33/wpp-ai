#!/bin/bash

# Kill any existing Chrome processes using the bot's profile
echo "Cleaning up existing Chrome processes..."
pkill -f "user-data-dir=/Users/gabrielmaia/Documents/projects/wpp-ai/tokens/wpp_ai" 2>/dev/null

# Remove singleton lock file
echo "Removing singleton lock file..."
rm -f /Users/gabrielmaia/Documents/projects/wpp-ai/tokens/wpp_ai/SingletonLock

# Wait a moment for processes to fully terminate
sleep 1

echo "Cleanup complete! You can now start the bot."