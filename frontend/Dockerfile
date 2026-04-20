# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept configuration as build args
ARG VITE_DEFAULT_USERNAME
ARG VITE_SUBSCRIBED_TOPICS
ARG VITE_ONLINE_USERS
ARG VITE_MOCK_MESSAGE_COUNT

# Write .env from build args with fallback defaults
RUN cat > .env <<EOF
VITE_DEFAULT_USERNAME=${VITE_DEFAULT_USERNAME:-Daria}
VITE_SUBSCRIBED_TOPICS=${VITE_SUBSCRIBED_TOPICS:-engineering,release_ops,product-updates}
VITE_ONLINE_USERS=${VITE_ONLINE_USERS:-Ava,Noah,Lena,Mateo,Daria}
VITE_MOCK_MESSAGE_COUNT=${VITE_MOCK_MESSAGE_COUNT:-4}
EOF

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
