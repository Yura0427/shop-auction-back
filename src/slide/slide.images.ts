import { IFile } from 'src/interfaces/file.interface';
import {
  ISlideImages,
  ISlideImagesArr,
  ISlideImagesAssoc,
} from './interfaces/slide.interface';

export class SlideImages {
  images: ISlideImages;

  constructor(files: ISlideImagesArr) {
    this.images = {};
    if (typeof files.image != 'undefined' && files.image.length > 0) {
      this.images.image = files.image[0];
    }
    if (
      typeof files.imageMobile != 'undefined' &&
      files.imageMobile.length > 0
    ) {
      this.images.imageMobile = files.imageMobile[0];
    }
  }

  get image(): IFile {
    return this.images.image;
  }

  set image(val: IFile | undefined) {
    this.images.image = val;
  }

  get imageMobile(): IFile {
    return this.images.imageMobile;
  }

  set imageMobile(val: IFile | undefined) {
    this.images.imageMobile = val;
  }

  isEmpty(): boolean {
    return !('image' in this.images) && !('imageMobile' in this.images);
  }

  getNames(): string[] {
    return Object.values(this.images).map((file) => {
      return file.filename;
    });
  }

  getPathes(): string[] {
    return Object.values(this.images).map((file) => {
      return file.path;
    });
  }

  getIds(): string[] {
    return Object.values(this.images).map((file) => {
      return file.id;
    });
  }

  getNamesKeys(): ISlideImagesAssoc {
    let namesKeys = {};
    Object.keys(this.images).map(
      (fileKey) => (namesKeys[fileKey] = this.images[fileKey].filename),
    );
    return namesKeys;
  }
}
