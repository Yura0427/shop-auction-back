import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import * as BlueBirdPromise from 'bluebird';
import * as fs from 'fs';

//# to execute this script run "ts-node uploadToGoogle.ts"

const googleStorage = new Storage({
  keyFilename: path.join(__dirname, 'storage-key.json'),
  projectId: 'shop-320408',
});
const bucket = googleStorage.bucket('shop-live');

const pathDir = '../uploads/images/icons/';
const pathDest = 'static/uploads/icons/';

const uploadToStorage = async (fileNames: string[]) => {
  await BlueBirdPromise.map(
    fileNames,
    (fileName) => {
      const filePath = `${pathDir}${fileName}`;

      return bucket.upload(path.resolve(filePath), {
        destination: `${pathDest}${fileName}`,
      });
    },
    { concurrency: 1 },
  );
};

fs.readdir(path.join(__dirname, pathDir), async function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }

  const fileNames = files;

  console.log('start upload');
  await uploadToStorage(fileNames);
  console.log('end upload');
});
