import * as winston from 'winston';
import * as fs from 'fs';
import * as readline from 'readline';
const ms = require('ms');

const retentionTime = ms(process.env.LOG_FILE_RETENTION || '24h');
const filename = process.env.LOG_FILE_URL_NAME || './logs/logStream.log';

export enum Target {
  admin = 'admin',
  user = 'user',
}

const saveJsonFile = (tempArray: any[], file: fs.PathLike, stop: boolean) => {
  if (!tempArray[0].length && !tempArray[1].length && stop) {
    return fs.promises.unlink(file);
  }

  if (!tempArray[0].length && !tempArray[1].length && !stop) {
    return setTimeout(() => convertLogToJSON(filename, false), retentionTime);
  }

  const date = new Date();

  Promise.all(
    tempArray.map((elem, index) => {
      if (elem.length) {
        const newJsonLog = `./logs/log_${Object.keys(Target)[index]}_${
          date.toISOString().split('T')[0]
        }_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.json`;

        fs.promises.appendFile(newJsonLog, JSON.stringify(elem));
      }
    }),
  ).then(() => {
    if (stop) {
      fs.promises.unlink(file);
    } else {
      fs.promises
        .writeFile(file, '')
        .then(() =>
          setTimeout(() => convertLogToJSON(filename, false), retentionTime),
        );
    }
  });
};

const convertLogToJSON = async (fileName: fs.PathLike, stop: boolean) => {
  fs.access(fileName, async (error) => {
    if (error) {
      return;
    } else {
      let adminDataArray = [];
      let clientDataArray = [];

      const fileStream = fs.createReadStream(fileName);
      const rl = readline.createInterface({
        input: fileStream,
      });

      rl.on('line', (line) => {
        if (line) {
          if (JSON.parse(line).message.source === Target.admin) {
            adminDataArray.push(JSON.parse(line));
          } else {
            clientDataArray.push(JSON.parse(line));
          }
        }
      }).on('close', () => {
        saveJsonFile([adminDataArray, clientDataArray], fileName, stop);
      });
    }
  });
};

export const logStreamHandler = () => {
  const stream = new winston.transports.File({
    filename,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
  });
  setTimeout(() => convertLogToJSON(filename, false), retentionTime);
  return stream;
};

process.on('SIGINT', () => {
  convertLogToJSON(filename, true);
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});
