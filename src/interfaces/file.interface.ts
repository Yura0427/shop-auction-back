export interface IDeleteMessage {
  message: string;
}

export interface IFile {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  destination?: string;
  filename?: string;
  path?: string;
  size?: number;
}
