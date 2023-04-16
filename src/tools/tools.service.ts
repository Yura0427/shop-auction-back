import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { compile } from 'html-to-text';

import { Product } from '../product/product.entity';
import { Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { cache } from '../category/category.controller';

import * as csv from 'csv-writer';
import { MappedShopItem } from './tools';
import * as path from 'path';
import { Storage } from '@google-cloud/storage';
import { User } from 'src/user/user.entity';

@Injectable()
export class ToolsService implements OnApplicationBootstrap {
  googleStorage = new Storage({
    keyFilename: path.join(__dirname, '../../../storage-key.json'),
    projectId: process.env.GOOGLE_BUCKET_PROJECT,
  });
  bucket = this.googleStorage.bucket(process.env.GOOGLE_BUCKET);

  async onApplicationBootstrap() {
    // const items = await this.createUrls();
    // await this.createFileWithUrls(items);
    // await this.generateSitemap();
  }

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private subCategoryRepository: Repository<Category>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUrls(): Promise<MappedShopItem[]> {
    const allProducts = await this.productRepository.find({
      where: { disabled: false },
      select: ['name', 'url', 'key', 'updatedAt'],
    });

    const mappedProducts = allProducts.map((product) => ({
      name: product.name,
      url: `${process.env.FRONT_FULL_LINK}${product.url}/${product.key}`,
      updatedAt: product.updatedAt,
    }));

    const categoriesTree = cache.get<Category[]>('categories');

    const mappedCategories: MappedShopItem[] = [];

    (function mapRecursive(current: Category[], prevUrl: string | null) {
      for (const category of current) {
        let url = prevUrl ? prevUrl : process.env.FRONT_FULL_LINK;

        if (!category.children.length) {
          url += `/${category.key}`;
          mappedCategories.push({
            name: category.name,
            url,
            updatedAt: category.updatedAt,
          });
        } else {
          url += `/${category.key}`;
          mapRecursive(category.children, url);
        }
      }
    })(categoriesTree, null);

    return [...mappedProducts, ...mappedCategories];
  }

  async createFileWithUrls(shopItems: MappedShopItem[]) {
    const dir = process.env.DOC_PATH;

    const isFolderExist = fs.existsSync(dir);

    if (!isFolderExist) {
      fs.mkdirSync(dir);
      console.log(`directory ${dir} has been created`);
    }

    const writer = csv.createObjectCsvWriter({
      path: `${dir}/buyAllUrls.csv`,
      header: [
        { id: 'name', title: 'NAME' },
        { id: 'url', title: 'URL' },
      ],
    });

    const items = shopItems.map((item) => ({ name: item.name, url: item.url }));

    await writer.writeRecords(items);
    console.log(`File buyAllUrls.csv on ${dir} has been created successfully`);
  }

  async generateSitemap() {
    const shopItems = await this.createUrls();

    const sitemapStart = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const sitemapEnd = `</urlset>`;

    let sitemapContent = '';

    for (const item of shopItems) {
      const date = item.updatedAt;
      const betterDate = (date: number) => (date < 10 ? `0${date}` : date);
      const lastMod = `${date.getFullYear()}-${betterDate(
        date.getMonth(),
      )}-${betterDate(date.getDate())}`;
      sitemapContent += `<url><loc>${item.url}</loc><changefreq>weakly</changefreq><lastmod>${lastMod}</lastmod></url>`;
    }

    const sitemap = sitemapStart + sitemapContent + sitemapEnd;

    fs.writeFile(
      `${process.env.DOC_PATH}/sitemap.xml`,
      sitemap,
      function (err) {
        if (err) return console.log(err);
        console.log('sitemap generated successfully');
      },
    );
  }

  async generateFeed() {
    //Google Merchant Center limits
    const maxSymbolsInTitle = 150;
    const maxSymbolsInDescription = 5000;
    const minSymbolsInDescription = 25;
    const maxNumOfAdditionImages = 10;

    //Cut the string to the maximum number of characters with a word limit
    const stringCutter = (string: string, maxNumSymbols: number) => {
      if (string.length > maxNumSymbols) {
        const a = string.substring(0, maxNumSymbols);
        return a.substring(
          0,
          Math.max(a.lastIndexOf(' '), a.lastIndexOf(',') - 1),
        );
      } else {
        return string;
      }
    };

    // AA ==> AA, AAAA ==> Aaaa, Hello ==> Hello (Google Merchant Center limit)
    const checkingWordsRegister = (str: string) => {
      const wordsArr = str.split(' ');
      let checkingString = '';
      wordsArr.forEach((str) => {
        if (str.length > 2) {
          if (str === str.toLowerCase()) {
            checkingString += str + ' ';
          } else {
            checkingString +=
              str[0].toUpperCase() +
              str.substring(1, str.length).toLowerCase() +
              ' ';
          }
        } else checkingString += str + ' ';
      });
      return checkingString.substring(0, checkingString.length - 1);
    };

    const additionImagesLinksCreator = (links) => {
      links = links.slice(0, maxNumOfAdditionImages);
      let additionLinks = '';
      links.forEach((link) => {
        if (link) {
          additionLinks += `<g:additional_image_link>https://${baseImgUrl}${link}</g:additional_image_link>`;
        }
      });
      return additionLinks.trim();
    };

    const stringFilter = (string) => {
      return string.replace(/</gi, '').replace(/&/gi, 'and');
    };

    //Clear HTML tags
    const convert = compile({
      wordwrap: 130,
      formatters: {},
    });

    const baseImgUrl = `api.${process.env.FRONT_DOMAIN}/static/uploads/`;
    const baseImgUrlForLocal = `http://localhost:${process.env.API_PORT}/static/uploads/`;

    const allProducts: Product[] = [];
    const prod = await this.productRepository.findAndCount({
      take: 1,
    });
    const count = prod[1];

    const limit = 5000;

    for (let i = 0; i < count; i += limit) {
      if (count - i < limit) {
        const [partOfProducts] = await this.productRepository
          .createQueryBuilder('product')
          .leftJoinAndSelect('product.mainImg', 'mainImg')
          .leftJoinAndSelect('product.category', 'category')
          .leftJoinAndSelect('product.files', 'file')
          .orderBy('product.id', 'ASC')
          .take(count - i)
          .skip(i)
          .getManyAndCount();
        allProducts.push(...partOfProducts);
      } else {
        const [
          partOfProducts,
        ] = await this.productRepository
          .createQueryBuilder('product')
          .leftJoinAndSelect('product.mainImg', 'mainImg')
          .leftJoinAndSelect('product.category', 'category')
          .leftJoinAndSelect('product.files', 'file')
          .orderBy('product.id', 'ASC')
          .take(limit)
          .skip(i)
          .getManyAndCount();
        allProducts.push(...partOfProducts);
      }
    }

    const sitemapStart = `<?xml version="1.0"?>          
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
     <title>Інтернет-магазин Buy All</title>
     <link>${process.env.FRONT_FULL_LINK}</link>
     <description>Інтернет-магазин Buy All Shop: одяг, взуття, аксесуари та декор.</description>`;

    let sitemapContent = '';

    for (const item of allProducts) {
      if (item) {
        const allFileNames = item.files?.filter(
          (file) => file.name?.slice(0, 8) !== 'cropped-',
        );

        const allImagesNameWithoutCropped = allFileNames.map(
          (file) => file.name,
        );

        const title = checkingWordsRegister(
          stringCutter(stringFilter(convert(item.name)), maxSymbolsInTitle),
        );

        let description = stringCutter(
          stringFilter(convert(item.description)),
          maxSymbolsInDescription,
        );

        //If description is very short or description === null ???
        if (description.length < minSymbolsInDescription) {
          description = title + ' ' + description;
        }

        const productLink = `https://${process.env.FRONT_DOMAIN}${item.url}/${item.key}`;
        const imageLink = `https://${baseImgUrl}${item.mainImg?.name.replace(
          'cropped-',
          '',
        )}`;
        const availability = `${
          item.availability ? 'in stock' : 'out_of_stock'
        }`;
        const price = `${item.price}.00 UAH`;
        const category = `${item.category?.name}`;

        const additionImagesLinks = item.files
          ? additionImagesLinksCreator(allImagesNameWithoutCropped)
          : '';

        sitemapContent += `
     <item>
        <g:id>${item.id}</g:id>
        <g:title>${title}</g:title>
        <g:description>${description}</g:description>
        <g:link>${productLink}</g:link>
        <g:image_link>${imageLink}</g:image_link>
        <g:condition>new</g:condition>
        <g:availability>${availability}</g:availability>
        <g:price>${price}</g:price>
        <g:product_type>${category}</g:product_type>
        ${additionImagesLinks !== '' && additionImagesLinks}
     </item>`;
      }
    }

    const sitemapEnd = `
  </channel>
</rss>`;

    const feed = sitemapStart + sitemapContent + sitemapEnd;
    await this.bucket.file('static/uploads/feeds.xml').save(feed);
  }
}
