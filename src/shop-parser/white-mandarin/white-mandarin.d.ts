export interface ICategory {
  url: string;
  name: string;
}

export interface IProduct {
  url: string;
  name: string;
}

export interface IProductWithArticleAndAvailable extends IProduct {
  article: string;
  available: boolean;
}
