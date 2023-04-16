import { Product } from '../product/product.entity';

export interface INewArrivalProducts {
  isWidgetActive: boolean;
  newArrivalProducts: Product[];
}
