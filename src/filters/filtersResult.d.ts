export interface filterResult {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  price: number;
  availability: boolean;
  avgRating: string;
  categoryId: number;
  category: {
    id: number;
    key: string;
  };
  key: string;
  description: string;
  mainImg: {
    id: number;
    name: string;
  };
  characteristicValue: Array<{
    id: number;
    name: string;
    type: string;
    characteristicId: number;
    stringValue: string;
    numberValue: number;
    enumValue: string[];
    booleanValue: boolean;
    jsonValue: JSON;
    dateValue: Date;
  }>;
  comments: Array<{
    id: number;
    text: string;
    authorId: number;
    productId: number;
  }>
}
