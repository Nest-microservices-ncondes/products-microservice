FROM node:21-alpine3.19
# set working directory
WORKDIR /usr/src/app
# copy source files
COPY package*.json ./
# install dependencies
RUN npm install
# copy source files to container
COPY . .
# expose port
EXPOSE 3001