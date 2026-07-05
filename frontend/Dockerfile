# ---- Build stage: produce the static Vite bundle ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The backend URL is baked into the bundle at build time (Vite env var).
# On Render/Docker set VITE_API_URL as a build arg / service env var.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Runtime stage: serve the static files with nginx ----
FROM nginx:alpine
# nginx.conf is a template: the image substitutes ${PORT} at startup. Restrict
# substitution to PORT so nginx variables like $uri are left untouched.
ENV PORT=80
ENV NGINX_ENVSUBST_FILTER=PORT
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# The base image's entrypoint runs envsubst on the templates, then starts nginx.

