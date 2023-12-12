#!/bin/bash

# Define the repository and commit hash
libraryRepo="https://github.com/ale-ben/chrome-extension-tools"
commitHash="9d70d06467d84a7de6407021b60ee0a067ea3ebf" # The specific commit hash

# Define the local library path
localLibPath="../chrome-extension-tools"

# Clone the repo if it doesn't exist
if [ ! -d "$localLibPath" ]; then
  git clone "$libraryRepo" "$localLibPath"
fi

# Change directory to the local library path and checkout the specific commit
cd "$localLibPath/packages/vite-plugin"
git checkout "$commitHash"

# Install dependencies and build the library
pnpm install
pnpm run build

# Link the library (uncomment the next line if you need to run npm link)
# npm link

echo "Library setup complete."
