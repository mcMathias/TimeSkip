# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build args for environment variables
ARG SUPABASE_URL
ARG SUPABASE_KEY

# Create environment file with build-time variables
RUN echo "export const environment = {" > src/environments/environment.ts && \
    echo "  production: true," >> src/environments/environment.ts && \
    echo "  supabaseUrl: '${SUPABASE_URL}'," >> src/environments/environment.ts && \
    echo "  supabaseKey: '${SUPABASE_KEY}'" >> src/environments/environment.ts && \
    echo "};" >> src/environments/environment.ts

RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist/timeskip-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
