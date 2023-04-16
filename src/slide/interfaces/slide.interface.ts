import { IFile } from '../../interfaces/file.interface';

export interface ISlideImages {
  image?: IFile;
  imageMobile?: IFile;
}

export interface ISlideImagesArr {
  image?: IFile[];
  imageMobile?: IFile[];
}

export interface ISlideImagesAssoc {
  image?: string;
  imageMobile?: string;
}
