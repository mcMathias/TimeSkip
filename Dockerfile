# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Create production environment file with Supabase credentials
# (anon key is safe to expose - it's a publishable key, RLS protects data)
RUN echo "export const environment = {" > src/environments/environment.ts && \
    echo "  production: true," >> src/environments/environment.ts && \
    echo "  supabaseUrl: 'https://nksowzlfcdnzryqgfuyo.supabase.co'," >> src/environments/environment.ts && \
    echo "  supabaseKey: 'sb_publishable_WL23JdJwheOcrBQ_Da6cuw_Vh7ek5xF'" >> src/environments/environment.ts && \
    echo "};" >> src/environments/environment.ts

RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist/timeskip-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
