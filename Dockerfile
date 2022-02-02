# set node image with version
FROM node:16.13.0
# create directory
RUN mkdir /SSV-goerli-eth-bot
# set work directory
WORKDIR /SSV-goerli-eth-bot
# copy all sources to container
COPY . /SSV-goerli-eth-bot
# install dependencies
RUN npm install
# run your application
CMD npm start
# or run application with pm2
# CMD pm2 start app.js --no-daemon