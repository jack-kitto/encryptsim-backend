# Build stage
FROM node:lts-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run stage
FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
# Corrected COPY command to preserve the dist folder structure
COPY --from=builder /app/dist ./dist
# Expose the port the application listens on
EXPOSE 8080
# The CMD should now correctly point to the entrypoint within the copied dist folder
CMD [ "node", "dist/src/index.js" ]