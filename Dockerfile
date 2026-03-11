# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build args for environment variables
ARG SUPABASE_URL
ARG SUPABASE_KEY

# Replace environment variables in the file before building
RUN sed -i "s|supabaseUrl:.*|supabaseUrl: '${SUPABASE_URL}',|" src/environments/environment.ts && \
    sed -i "s|supabaseKey:.*|supabaseKey: '${SUPABASE_KEY}'|" src/environments/environment.ts

RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist/timeskip-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
