FROM node:20-alpine AS build
WORKDIR /app
COPY package.json vite.config.mjs index.html ./
COPY src ./src
RUN npm install
RUN npm run build

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
