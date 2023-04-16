FROM node:16

WORKDIR /usr/src/app

COPY . .

RUN npm install --legacy-peer-deps
RUN npm run clean:dist

RUN npm run build

RUN npm run migration:run

RUN npm run seed:run

RUN cp -rf ./src/mail/templates dist/src/mail/

EXPOSE 4000

CMD [ "npm","run", "start:prod" ]
