FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
COPY src/db/migrations ./src/db/migrations
RUN npm ci --production
COPY --from=build /usr/src/app/dist ./dist 

EXPOSE 3000
CMD ["npm", "start"] 