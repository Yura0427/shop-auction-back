import { Category } from '../category/category.entity';
import { AxiosResponse } from 'axios';

interface FashionGirl {
  fashionGirl: string;
}

interface Bazzilla {
  bazzillaId: string | string[];
}

interface Olla {
  olla: string | string[];
}

interface Pobedov {
  pobedov: string | string[];
}

interface letsShop {
  letsShop: string | string[];
}

interface WhiteMandarin {
  whiteMandarin: string | string[];
}

export interface Categories {
  key: string;
  // #if name need to create category with custom name, else - create category with parsed name
  name?: string;
  // #if shopKeys doesn't exist its mean that category already created from default categories file. Need to skip creation this category
  shopKeys?: Array<
    Bazzilla | FashionGirl | Olla | Pobedov | letsShop | WhiteMandarin
  >;
  subCategories: Categories[];
}

export interface BaseCategory {
  key: string;
  name: string;
  description: string;
}

export interface BaseProductFromLetsShop {
  productKey: string;
  category: string;
  parentCategory: string;
}

export interface DefaultCategories {
  key: string;
  name: string;
  description: string;
  subCategories: DefaultCategories[];
}

export interface BazzillaParsedCategory {
  id: string;
  title: string;
  titlefull: string;
  parent: string;
}

export interface SimpleMap {
  key: string;
  name?: string;
  shopKeys?: Array<
    Bazzilla | FashionGirl | Olla | Pobedov | letsShop | WhiteMandarin
  >;
  parentKey: string;
}

export interface CategoryToSave extends BaseCategory {
  parentKey?: string;
}

export interface CheckedCategory extends BaseCategory {
  parentKey?: string;
}

export interface CreatedCategories {
  mainCategories?: any[];
  subCategories?: Category[];
  productsList?: ProductsUrl[];
}

export interface ProductsUrl {
  url: string;
  keyOfCategory: string;
  keyOfParentCategory?: Category;
}

export interface ProductCandidateLetsShop {
  productKey: string;
  keyOfCategory: string;
}

export interface BazzillaCategories {
  id: string;
  title: string;
  titlefull: string;
  parent: string;
}

export interface ProductsParserResult {
  updateQuantity: number;
  createQuantity: number;
}

export interface LetsShopProduct {
  productKey: string;
  category: string;
  parentCategory: string;
  name: string;
  nameWithKey: string;
  nameWithKeyRu: string;
  size: string;
  producingCountry: string;
  trademark: string;
  type: string;
  price: number;
  quantity: number;
  images: string;
  description: string;
  characteristics: string;
  colorsAndSizes: any;
  article: string;
  xlsId: string;
  categoryFromDoc: string;
}

export interface ParserSpec {
  [value: string]: string | unknown;
}

export type FetchDataType<T> = Promise<AxiosResponse<T>>;

export interface IWMProductParam {
  _: string;
  $: { name: string };
}
export interface IWMProduct {
  $: { id: string; group_id: string; available: string };
  url: [string];
  price: [string];
  currencyId: [string];
  categoryId: [string];
  picture: [string];
  vendorCode: [string];
  vendor: [string];
  name: [string];
  description: [string];
  name_ua: [string];
  description_ua: [string];
  param: IWMProductParam[];
}

export interface IWMFormattedProduct {
  name: string;
  key: string;
  description: string;
  price: number;
  availability: boolean;
  shopKey: string;
  categoryId: string;
  article: string;
  files: string[];
  parameters: { [key: string]: string } | null;
}

export interface IParserParams {
  parserLimit?: number;
  updatePhoto?: boolean;
  createNewProducts?: boolean;
  updateOldProducts?: boolean;
  updateOldCharacteristics?: boolean;
}
