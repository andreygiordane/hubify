# Stage 1: Build
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build args para variables de env
ARG VITE_API_URL
ARG VITE_SOCKET_URL

# Set env vars no build (vazias = mesmo domínio do frontend, via proxy do nginx)
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copia configuração personalizada do Nginx para lidar com roteamento do React
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
