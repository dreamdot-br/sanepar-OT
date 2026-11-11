# Build do simulador (Vite) + nginx na porta 8080 (exigência do Cloud Run).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Vite está em devDependencies; não omitir no estágio de build.
RUN npm ci --include=dev
COPY . .
RUN npm run build && ls dist/assets/*.js

FROM nginx:1.27-alpine
COPY nginx.cloudrun.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
