import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { extname } from 'path';
import * as uuid from 'uuid';
import * as sharp from 'sharp';
import * as fs from 'fs';
import axios from 'axios';
import * as retry from 'bluebird-retry';
import * as BlueBirdPromise from 'bluebird';
import * as path from 'path';
import { Storage } from '@google-cloud/storage';

import { IFile } from '../interfaces/file.interface';
import {
  CalculateDimensions,
  Cropper,
  FileNameInfo,
  Source,
} from './cropper.enum';
import { SlideImages } from '../slide/slide.images';

@Injectable()
export class ImageUtilsService {
  googleStorage = new Storage({
    keyFilename: path.join(__dirname, '../../../storage-key.json'),
    projectId: process.env.GOOGLE_BUCKET_PROJECT,
  });
  bucket = this.googleStorage.bucket(process.env.GOOGLE_BUCKET);

  public static imageFileFilter(
    req: Request,
    file: IFile,
    callback: CallableFunction,
  ): void {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
      callback(
        new BadRequestException(
          'Завантажити можливо лише файли зображень .jpg, .jpeg, .png, .gif, .svg',
        ),
        false,
      );
    }

    callback(null, true);
  }

  public static customImageFileName(
    req: Request,
    file: IFile,
    callback: CallableFunction,
  ): void {
    const fileExt = extname(file.originalname);

    let fileName = file.originalname.split('.')[0].replace(/\s+/g, '-');

    if (fileName.match(/^[а-яА-Я]/g)) {
      fileName = 'image';
    }

    callback(null, `${fileName}-${uuid.v1()}${fileExt}`);
  }

  public static imageCategoryName(
    req: Request,
    file: IFile,
    callback: CallableFunction,
  ): void {
    const splitted = file.originalname.split('.');
    let ext: string = splitted[splitted.length - 1];

    if (ext === 'jpeg') {
      ext = 'jpg';
    }

    if (splitted.length > 1) {
      return callback(null, `${splitted[0]}.${ext}`);
    }
    callback(null, `${splitted[0]}.${ext}`);
  }

  public static customIconFileName(
    req: Request,
    file: IFile,
    callback: CallableFunction,
  ): void {
    const fileExt = extname(file.originalname);

    callback(null, `${req.body.key}${fileExt}`);
  }

  public iconUpdateName(fileName: string, key?: string) {
    const tempImgPath = `${process.env.IMG_TEMP}/${fileName}`;

    const getFileName = fileName.split('.')[0];
    const getFileExt = fileName.split('.')[1];

    let newTempImgPath: string;
    if (getFileName.includes('undefined')) {
      newTempImgPath = `${process.env.IMG_TEMP}/${key}.${getFileExt}`;
      fs.rename(tempImgPath, newTempImgPath, function (err) {
        if (err) console.log('ERROR: ' + err);
      });
    }
  }

  public async imageOptimize(
    fileName: string,
    quality?: number,
    source: null | Source = null,
  ): Promise<sharp.OutputInfo | void> {
    sharp.cache(false);

    let storageDir = path.resolve(process.env.IMG_PATH);
    const tempImgPath = `${process.env.IMG_TEMP}/${fileName}`;

    const getFileName = fileName.split('.')[0];
    const getFileExt = fileName.split('.')[1];

    const metaData = await sharp(tempImgPath).metadata();
    const dimensions = { height: metaData.height, width: metaData.width };

    if (source === Source.avatar) {
      storageDir = path.resolve(process.env.IMG_PATH, Source.avatar);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
    }

    if (getFileExt === 'svg' && source !== Source.avatar) {
      const file = await fs.promises.readFile(tempImgPath);
      const iconsFolder = `${storageDir}/icons/`;

      if (!fs.existsSync(iconsFolder)) {
        fs.mkdirSync(iconsFolder, { recursive: true });
      }

      await fs.promises.writeFile(`${iconsFolder}${fileName}`, file);
      return fs.promises.unlink(tempImgPath);
    }

    if (getFileExt === 'jpeg' || getFileExt === 'jpg') {
      await sharp(tempImgPath, { failOnError: false })
        .jpeg({ quality: quality ? quality : 50 })
        .toFile(`${storageDir}/${fileName}`);
    }

    if (getFileExt === 'png') {
      await sharp(tempImgPath, { failOnError: false })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .toFormat('jpeg')
        .jpeg({ quality: quality ? quality : 50 })
        .toFile(`${storageDir}/${getFileName}.jpeg`);
    }

    if (getFileExt === 'gif') {
      const file = await fs.promises.readFile(tempImgPath);
      await fs.promises.writeFile(`${storageDir}/${fileName}`, file);
      return fs.promises.unlink(tempImgPath);
    }

    const { width, height } = ImageUtilsService.calculateDimensions(
      dimensions,
      'SMALL',
    );

    const optimizedExt = getFileExt === 'png' ? 'jpeg' : getFileExt;
    const optimizedFileName = `${getFileName}.${optimizedExt}`;

    if (source !== Source.category) {
      await sharp(`${storageDir}/${optimizedFileName}`, {
        failOnError: false,
      })
        .resize({
          width: width,
          height: height,
        })
        .toFile(`${storageDir}/cropped-${optimizedFileName}`);
    }

    return fs.promises.unlink(tempImgPath);
  }

  public async tempImageCrop(img: unknown): Promise<any> {
    sharp.cache(false);

    const metaData = await sharp(img).metadata();
    const dimensions = { height: metaData.height, width: metaData.width };

    return sharp(img).extract({
      width: dimensions.width,
      height: dimensions.height - 40,
      left: 0,
      top: 0,
    });
  }

  private static calculateDimensions(
    dimensions: CalculateDimensions,
    cropper: keyof typeof Cropper,
  ): CalculateDimensions {
    const heightSizes = {
      SMALL: 200,
      MEDIUM: 800,
      HIGH: 1400,
    };

    const isPortrait = dimensions.width < dimensions.height;
    const proportion = isPortrait
      ? +(dimensions.height / dimensions.width).toFixed(2)
      : +(dimensions.width / dimensions.height).toFixed(2);

    const height = heightSizes[cropper];
    const width = isPortrait
      ? Math.round(height / proportion)
      : Math.round(height * proportion);

    return {
      height,
      width,
    };
  }

  public getFileName(file: IFile): FileNameInfo {
    return {
      fileName: file.filename.split('.')[0],
      fileExt: file.filename.split('.')[1],
      isPng: file.filename.split('.')[1] === 'png',
      isGif: file.filename.split('.')[1] === 'gif',
    };
  }

  public async imageProcessor(
    files: IFile[],
    source?: Source | null,
  ): Promise<(sharp.OutputInfo | void)[]> {
    const promises = files.map((file) =>
      this.imageOptimize(file.filename, 85, source),
    );

    return Promise.all(promises);
  }

  async imagesUploader(imgUrls: string[], shopKey?: string): Promise<IFile[]> {
    const files: IFile[] = [];

    const promises = imgUrls.map(async (url) => {
      let img = null;

      if (/[а-яА-ЯЁё]/.test(url)) return;
      if (
        url === 'https:' ||
        url === 'htt' ||
        url === 'https://letssho' ||
        url === 'http' ||
        url === 'https'
      )
        return;

      const getImage = async () => {
        try {
          const { data } = await axios.get(url, {
            responseType: 'arraybuffer',
          });
          img = data;
        } catch (e) {
          img = null;
        }

        if (!img) {
          console.log('Can`t upload image file');
          return;

          // return BlueBirdPromise.reject(
          //   new Error('Помилка завантаження зображення'),
          // );
        }
      };
      await retry(getImage, { max_tries: 10, interval: 5000 });

      const image = sharp(img);
      await image.metadata().then(async function (metadata) {
        if (metadata.width < 250 || metadata.height < 250) img = null;
        if (metadata.format === 'webp')
          img = await sharp(img).toFormat('jpeg').toBuffer();
      });

      if (!img) {
        return null;
      }

      let imgName = '';

      if (shopKey && shopKey === 'letsShop') {
        imgName = `${uuid.v1()}`;
      }

      if (shopKey && shopKey !== 'pobedov' && shopKey !== 'letsShop') {
        const splitUrl = url.split('_');
        imgName = `${uuid.v1()}-${splitUrl[splitUrl.length - 1]}`;
      }

      if (shopKey && shopKey === 'fashionGirl') {
        const splitUrl = url.split('_');
        imgName = `${uuid.v1()}-${splitUrl[splitUrl.length - 1]}`;
      }

      const expansion = (await sharp(img).metadata()).format;
      imgName = imgName.split('.')[0] + '.' + expansion;

      if (shopKey && shopKey === 'pobedov') {
        const splitUrl = url.split('.');
        imgName = `${uuid.v1()}-pobedov.${splitUrl[splitUrl.length - 1]}`;
      }

      const imgPath = `${process.env.IMG_TEMP}/${imgName}`;

      files.push({ filename: imgName, path: imgPath });

      if (shopKey === 'letsShop') {
        await fs.promises.writeFile(imgPath, img);

        const metaData = await sharp(imgPath).metadata();
        const dimensions = { height: metaData.height, width: metaData.width };
        const { width, height } = ImageUtilsService.calculateDimensions(
          dimensions,
          'HIGH',
        );

        return await sharp(imgPath, {
          failOnError: false,
        })
          .resize({
            width: width,
            height: height,
          })
          .toFile(`${imgPath}.jpg`);
      }

      return fs.promises.writeFile(imgPath, img);
    });

    try {
      await Promise.all(promises);
      return files;
    } catch (e) {
      // throw new Error(`Сталася помилка під час завантаження файлів: ${e.message}`);
      console.log(`An error occurred while uploading files: ${e.message}`);
      return files;
    }
  }

  async colorPicturesUploader(
    imgUrls: string,
  ): Promise<{ filename: string; path: string }> {
    try {
      let img = null;
      const getImage = async () => {
        try {
          const { data } = await axios.get(imgUrls, {
            responseType: 'arraybuffer',
          });
          img = data;
        } catch (e) {
          img = null;
        }

        if (!img) {
          // console.log('Can`t upload color image file ');
          // return BlueBirdPromise.reject(
          //   new Error('Помилка завантаження зображення'),
          // );
        }
      };
      await retry(getImage, { max_tries: 10, interval: 5000 });

      if (!img) {
        return null;
      }

      const uploadedImage = sharp(img).toFormat('png');
      const uploadedImageExt = await uploadedImage.metadata();

      const uploadedImageName = `${uuid.v1()}.${uploadedImageExt.format}`;
      const uploadPath = `${process.env.IMG_PATH}/${Source.colors}/${uploadedImageName}`;

      const uploadDir = path.resolve(process.env.IMG_PATH, Source.colors);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.promises.writeFile(uploadPath, img);
      if (uploadPath && uploadedImageName)
        return { filename: uploadedImageName, path: uploadPath };
      return null;
    } catch (err) {
      return err;
      // throw new Error(`colorPicturesUploader: ${err.message}`);
    }
  }

  async isExistInStorage(fileName: string): Promise<boolean> {
    return await this.bucket.file(fileName).exists()[0];
  }

  async imageRemover(
    fileNames: string[],
    source: null | Source = null,
  ): Promise<any[]> {
    const promises: Promise<any>[] = [];

    fileNames.forEach((fileName) => {
      const getFileExt = fileName.split('.')[1];

      let filePath: string;

      if (getFileExt === 'svg') {
        filePath = path.resolve(`${process.env.IMG_PATH}/icons/${fileName}`);
      } else if (source === Source.avatar) {
        filePath = path.resolve(process.env.IMG_PATH, Source.avatar, fileName);
      } else if (source === Source.category) {
        filePath = path.resolve(
          process.env.IMG_PATH,
          Source.category,
          fileName,
        );
      } else {
        filePath = path.resolve(`${process.env.IMG_PATH}/${fileName}`);
      }

      fs.access(filePath, (err) => {
        if (!err) {
          promises.push(fs.promises.unlink(filePath));
        }
      });
    });

    return Promise.all(promises);
  }

  async uploadToStorage(
    fileNames: string[],
    source: null | Source = null,
  ): Promise<any> {
    await BlueBirdPromise.map(
      fileNames,
      (fileName) => {
        const getFileExt = fileName.split('.')[1];

        let filePath: string;
        let destinationPath: string;

        if (getFileExt === 'svg') {
          filePath = `${process.env.IMG_PATH}/icons/${fileName}`;
          destinationPath = `static/uploads/icons/${fileName}`;
        } else if (source === Source.avatar) {
          filePath = `${process.env.IMG_PATH}/${Source.avatar}/${fileName}`;
          destinationPath = `static/uploads/${Source.avatar}/${fileName}`;
        } else if (source === Source.colors) {
          filePath = `${process.env.IMG_PATH}/${Source.colors}/${fileName}`;
          destinationPath = `static/uploads/${Source.colors}/${fileName}`;
        } else if (source === Source.category) {
          filePath = `${process.env.IMG_PATH}/${Source.category}/${fileName}`;
          destinationPath = `static/uploads/${Source.category}/${fileName}`;
        } else {
          filePath = `${process.env.IMG_PATH}/${fileName}`;
          destinationPath = `static/uploads/${fileName}`;
        }

        return this.bucket.upload(path.resolve(filePath), {
          destination: destinationPath,
        });
      },
      { concurrency: 1 },
    );
  }

  async deleteFromStorage(fileNames: string[]): Promise<any> {
    try {
      await BlueBirdPromise.map(
        fileNames,
        async (fileName) => {
          await this.bucket.file(fileName).delete();
        },
        { concurrency: 10 },
      );
    } catch (err) {
      console.log(err.message);
    }
  }

  async moveFilesToUploads(slideImages: SlideImages): Promise<boolean> {
    const fileNames = slideImages.getNames();
    for (const fileName of fileNames) {
      const tempImgPath = `${process.env.IMG_TEMP}/${fileName}`;
      const storageImgPath = `${path.resolve(
        process.env.IMG_PATH,
      )}/${fileName}`;
      const file = await fs.promises.readFile(tempImgPath);
      try {
        await fs.promises.writeFile(storageImgPath, file);
      } catch (err) {
        return new Promise((resolve) => {
          resolve(false);
        });
      }
      await fs.promises.unlink(tempImgPath);
    }
    return new Promise((resolve) => {
      resolve(true);
    });
  }

  async moveFilesToCategoryDir(fileNames: string[]) {
    const storageImgPath = `${path.join(process.env.IMG_PATH)}`;
    const targetImgPath = `${path.join(process.env.IMG_PATH, '/category')}`;

    if (!fs.existsSync(targetImgPath)) {
      fs.mkdir(targetImgPath, (err) => {
        if (err) throw err;
      });
    }

    for (const file of fileNames) {
      if (fs.readFileSync(`${storageImgPath}/${file}`)) {
        const sourcePath = path.join(storageImgPath, file);
        const destPath = path.join(targetImgPath, file);

        await fs.promises.rename(sourcePath, destPath);
      }
    }
  }

  async findAndDeleteOldImagesFromBucket(fileNames: string[]) {
    BlueBirdPromise.map(fileNames, async (name) => {
      const file = this.bucket.file(`static/uploads/category/${name}`);

      const exists = await file.exists();

      if (exists[0]) {
        console.log(`File with name: ${name} been deleted`);
        await file.delete();
      }
    });
  }

  async checkImagesForSize(files: IFile[]) {
    const sizesErrors = [];
    await BlueBirdPromise.map(files, async (file) => {
      const metadata = await sharp(file.path).metadata();

      const width = metadata.width;
      const height = metadata.height;
      const targetRatio = { width: 260, height: 160 };
      if (width !== targetRatio.width || height !== targetRatio.height) {
        sizesErrors.push({
          file: file.originalname,
          message: 'Неправильні співвідношення сторін',
        });
      }
    });

    return sizesErrors;
  }
}
