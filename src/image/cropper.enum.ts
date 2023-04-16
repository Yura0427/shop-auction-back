export enum Cropper {
  SMALL = 'small',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum Source {
  avatar = 'avatar',
  colors = 'colors',
  category = 'category',
}

export interface CalculateDimensions {
  height: number;
  width: number;
}

export interface FileNameInfo {
  fileName: string;
  fileExt: string;
  isPng: boolean;
  isGif: boolean;
}
