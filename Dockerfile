FROM node:21.6.2 as build

WORKDIR /source

# Copy the package lock file into the container
COPY package*.json ./

# Run ci only for the production dependencies
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy the rest of the files into the container and build
COPY . .

RUN npm run build --prod

FROM nginx:alpine
COPY --from=build /source/dist/erga_front-end /usr/share/nginx/html
COPY --from=build /source/default.conf /etc/nginx/conf.d/
EXPOSE 8080
