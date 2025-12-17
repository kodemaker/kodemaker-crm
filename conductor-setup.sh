#!/bin/bash

# Install dependencies
pnpm install

# Copy .env file
cp $CONDUCTOR_ROOT_PATH/.env .env

# Build the app
pnpm run build
