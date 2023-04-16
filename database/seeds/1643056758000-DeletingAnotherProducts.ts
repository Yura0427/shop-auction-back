import { getRepository, In, MigrationInterface, QueryRunner } from 'typeorm';
import { Product } from '../../src/product/product.entity';
import { File } from '../../src/files/files.entity';
import * as BlueBirdPromise from 'bluebird';
import { ProductToOrder } from '../../src/product-to-order/product-to-order.entity';
import { Order } from '../../src/orders/orders.entity';
import { CharacteristicValue } from '../../src/characteristics-values/characteristics-values.entity';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';

export class deletingAnotherProducts1643056758000 implements MigrationInterface {
  productRepository = getRepository(Product, 'seeds');
  productToOrderRepository = getRepository(ProductToOrder, 'seeds');
  orderRepository = getRepository(Order, 'seeds');
  filesRepository = getRepository(File, 'seeds');
  characteristicsValuesRepository = getRepository(CharacteristicValue, 'seeds');
  googleStorage = new Storage({
    keyFilename: path.join(__dirname, '../../../storage-key.json'),
    projectId: process.env.GOOGLE_BUCKET_PROJECT,
  });

  bucket = this.googleStorage.bucket(process.env.GOOGLE_BUCKET);

  async deleteFromStorage(fileNames: string[]) {
    await BlueBirdPromise.map(
      fileNames,
      async (fileName) => {
        await this.bucket
          .file(`${process.env.SERVE_ROOT}/${fileName}`)
          .delete();
      },
      { concurrency: 10 },
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    let productsIds = [
      50074,
      51625,
      52274,
      52274,
      53282,
      54048,
      54273,
      54770,
      54770,
      55003,
      55191,
      55430,
      57102,
      57142,
      57171,
      57249,
      57252,
      57255,
      57270,
      57277,
      57363,
      57559,
      57603,
      57673,
      57674,
      57686,
      57687,
      57687,
      57799,
      57971,
      58052,
      58058,
      58083,
      58118,
      58119,
      58164,
      58165,
      58178,
      58180,
      58216,
      58216,
      58228,
      58229,
      58262,
      58267,
      58295,
      58300,
      58328,
      58361,
      58380,
      58510,
      58756,
      58757,
      58776,
      58804,
      58808,
      58811,
      58819,
      58820,
      58891,
      58946,
      58965,
      59024,
      59059,
      59085,
      59088,
      59094,
      59100,
      59160,
      59161,
      59166,
      59174,
      59175,
      59178,
      59207,
      59234,
      59241,
      59270,
      59291,
      59295,
      59324,
      59325,
      59353,
      59359,
      59364,
      59393,
      59538,
      59562,
      59563,
      59565,
      59612,
      59613,
      59615,
      59618,
      59621,
      59627,
      59972,
      60206,
      60211,
      60215,
      60216,
      60305,
      60329,
      60346,
      60396,
      60396,
      60410,
      60529,
      61044,
      61081,
      61082,
      61280,
      61283,
      61284,
      61299,
      61301,
      61326,
      61344,
      61413,
      61417,
      61434,
      61448,
      61459,
      61461,
      61542,
      61584,
      61594,
      61595,
      61625,
      61626,
      61627,
      61628,
      61649,
      61920,
      61926,
      62257,
      62261,
      62262,
      62325,
      62328,
      62367,
      62437,
      62537,
      62538,
      62544,
      62586,
      62587,
      62841,
      62842,
      62843,
      62952,
      62997,
      63089,
      63207,
      63224,
      63224,
      63432,
      63473,
      63624,
      64043,
      64260,
      64260,
      64535,
      64535,
      64650,
      66416,
      66504,
      66504,
      66508,
      66509,
      66524,
      66527,
      66528,
      66579,
      66580,
      66581,
      66582,
      66590,
      66591,
      66602,
      66622,
      66692,
      66710,
      66711,
      66722,
      66723,
      66738,
      66741,
      66790,
      66798,
      66820,
      66822,
      66823,
      66836,
      66873,
      66893,
      67243,
      69342,
      69510,
      69524,
      69674,
      69728,
      69987,
      69988,
      70031,
      70334,
      70421,
      70438,
      70439,
      70467,
      70476,
      70501,
      70510,
      70511,
      70524,
      70532,
      70541,
      70543,
      70543,
      70558,
      70572,
      70579,
      70586,
      70594,
      70609,
      70618,
      70631,
      70638,
      70645,
      70652,
      70659,
      70669,
      70677,
      70685,
      70693,
      70694,
      70702,
      70710,
      70737,
      70752,
      70753,
      70761,
      70779,
      70796,
      70854,
      70881,
      70974,
      71024,
      71057,
      71099,
      71107,
      71142,
      71176,
      71176,
      71183,
      71194,
      71248,
      71656,
      71656,
      71695,
      71695,
      71717,
      71717,
      71729,
      71827,
      72002,
      72008,
      72600,
      74550,
      74854,
      74855,
      75866,
      75867,
      75868,
      75869,
      77076,
      77484,
      77716,
      77717,
      77718,
      77719,
      80374,
      80375,
      80376,
      80377,
      80840,
      81392,
      81393,
      81394,
      81395,
      81396,
      81397,
      81478,
      81479,
      81877,
      81878,
      82018,
      82080,
      82163,
      82192,
      82193,
      82206,
      82406,
      82622,
      82695,
      82733,
      82856,
      82857,
      82932,
      82933,
      82989,
      83136,
      83426,
      83686,
      83776,
      83880,
      83881,
      83882,
      83883,
      84380,
      84850,
      85191,
      87307,
      87856,
      87857,
      87858,
      87859,
      87942,
      87967,
      88048,
      88049,
      88062,
      88063,
      88066,
      88067,
      88201,
      88202,
      88210,
      88442,
      88442,
      88494,
      88494,
      88551,
      88552,
      88553,
      88554,
      90060,
      90060,
      90562,
      90562,
      90892,
      91039,
      91040,
      91041,
      91042,
      91271,
      91395,
      91397,
      91412,
      91415,
      91417,
      91452,
      91452,
      91638,
      92066,
      92079,
      92111,
      92183,
      92287,
    ];

    const allProductsByIds = await this.productRepository.find({
      where: {
        id: In(productsIds),
      },
    });

    productsIds = allProductsByIds.map((product) => product.id);

    if (!productsIds.length) return;

    const allFilesByIds = await this.filesRepository
      .createQueryBuilder('files')
      .leftJoinAndSelect('files.product', 'product')
      .where('files.product.id IN (:...productsIds)', { productsIds })
      .getMany();

    const allCharacteristicsValuesByIds = await this.characteristicsValuesRepository
      .createQueryBuilder('characteristicsValues')
      .leftJoinAndSelect('characteristicsValues.product', 'product')
      .select('characteristicsValues.id')
      .where('characteristicsValues.product.id IN (:...productsIds)', {
        productsIds,
      })
      .getMany();

    const characteristicsValuesIds = allCharacteristicsValuesByIds.map(
      (x) => x.id,
    );

    if (characteristicsValuesIds.length) {
      await this.characteristicsValuesRepository.delete(
        characteristicsValuesIds,
      );
    }

    const allProductsToOrderByIds = await this.productToOrderRepository
      .createQueryBuilder('product_to_order')
      .leftJoinAndSelect('product_to_order.product', 'product')
      .leftJoinAndSelect('product_to_order.order', 'order')
      .where('product_to_order.product.id IN (:...productsIds)', {
        productsIds,
      })
      .getMany();
    const ordersIds = allProductsToOrderByIds.map((x) => x.order.id);

    if (ordersIds.length) {
      const allProductsToOrderByOrdersIds = await this.productToOrderRepository
        .createQueryBuilder('product_to_order')
        .leftJoinAndSelect('product_to_order.order', 'order')
        .where('product_to_order.order.id IN (:...ordersIds)', {
          ordersIds,
        })
        .getMany();

      const productsToOrderIds = allProductsToOrderByOrdersIds.map((x) => x.id);
      if (productsToOrderIds.length) {
        await this.productToOrderRepository.delete(productsToOrderIds);
      }

      await this.orderRepository.delete(ordersIds);
    }

    await this.productRepository.delete(productsIds);
    const imagesUrls = allFilesByIds.map((file) => file.name);
    if (imagesUrls) await this.deleteFromStorage(imagesUrls);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
