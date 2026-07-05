# ---- Build stage: compile TypeScript to dist/ ----
FROM node:22-alpine AS build
WORKDIR /app

# Install all dependencies (including dev) for the Nest build.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage: production dependencies only ----
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Copy the compiled output from the build stage.
COPY --from=build /app/dist ./dist

# The app reads PORT from the environment (defaults to 3000 in main.ts).
EXPOSE 3000
CMD ["node", "dist/main"]
