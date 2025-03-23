#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Building Management & Crack Monitoring System (BMCMS)${NC}"
echo -e "${BLUE}This script will start the application with enhanced Swagger documentation${NC}"

# Check if dependencies are installed
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Build the application
echo -e "${YELLOW}Building the application...${NC}"
npm run build

# Start the application
echo -e "${GREEN}Starting the application...${NC}"
echo -e "${BLUE}Once the application is running, you can access:${NC}"
echo -e "${GREEN}• API: ${NC}http://localhost:3000"
echo -e "${GREEN}• Swagger Documentation: ${NC}http://localhost:3000/api"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the application${NC}"

# Start in development mode
npm run start:dev 