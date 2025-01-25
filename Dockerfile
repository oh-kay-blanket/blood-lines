FROM node:alpine3.20
WORKDIR /srv
RUN apk add git
RUN git clone https://github.com/mister-blanket/blood-lines.git blood-lines && cd blood-lines && npm i
WORKDIR /srv/blood-lines
EXPOSE 8080
CMD ["npm","start"]
