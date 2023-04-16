import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { HTMLElement } from 'node-html-parser';
import * as uuid from 'uuid';
import { ColorsPicturesFiles } from './colors-pictures.entity';
import { CreateColororsPicturesDto } from './dto/create-colors-pictures.dto';
import { GetColororsPicturesDto } from './dto/get-colors-pictures.dto';
import { ImageUtilsService } from '../image/image-utils.service';
import { Source } from '../image/cropper.enum';
import { ChatGateway } from 'src/socket/socket-console.gateway';
import { ColorsSource } from './colors-source.enum';
import * as translate from 'translate-google';
import * as toHex from 'colornames';
import pobedovColorTranslator from 'src/utils/pobedovColorTranslator';

@Injectable()
export class ColorsPicturesService {
  constructor(
    @InjectRepository(ColorsPicturesFiles)
    private colorsPicturesRepository: Repository<ColorsPicturesFiles>,
    @Inject('ImageUtilsService')
    private imageUtilsService: ImageUtilsService,
    @Inject('ChatGateway')
    private chatGateway: ChatGateway,
  ) {}

  async getColorsPictures(
    colorName: string[],
  ): Promise<GetColororsPicturesDto[]> {
    const colorsDb: GetColororsPicturesDto[] = [];
    await Promise.all(
      colorName.map(async (elem) => {
        const color = await this.colorsPicturesRepository.findOne({
          where: { colorName: elem },
        });
        if (color) colorsDb.push(color);
      }),
    );

    return colorsDb;
  }

  async addColorsPictures(
    colorsPictues: CreateColororsPicturesDto[],
  ): Promise<CreateColororsPicturesDto[]> {
    return Promise.all(
      colorsPictues.map((color) => this.colorsPicturesRepository.save(color)),
    );
  }

  async parseColorPictures(productDOM: HTMLElement, source: ColorsSource) {
    try {
      switch (source) {
        case ColorsSource.fashionGirl:
          const colorsBufer = productDOM.querySelectorAll(
            '#sizing_table tbody tr',
          );
          if (!colorsBufer?.length) return;
          colorsBufer?.shift();

          let colorsFiles: CreateColororsPicturesDto[] = [];
          await Promise.all(
            colorsBufer?.map(async (node) => {
              let colorFileName: string[] = [];
              let colorId: string[] = [];
              let colorName: string | null = null;

              colorName = node.querySelector('strong')?.rawText;
              if (!colorName) return;

              const colorsFormDb = await this.colorsPicturesRepository.find({
                colorName,
              });
              if (colorsFormDb?.length) return;

              node.querySelectorAll('img')?.forEach((img) => {
                if (img.getAttribute('src'))
                  colorId.push(img.getAttribute('src')!.split('PIMAGE_ID=')[1]);
              });

              await Promise.all(
                node.querySelectorAll('img')?.map(async (img) => {
                  if (img.getAttribute('src')) {
                    const imageUrl = img.getAttribute('src').split('?')[0];
                    const imageFile = await this.imageUtilsService.colorPicturesUploader(
                      imageUrl,
                    );

                    if (process.env.NODE_ENV !== 'local') {
                      await this.imageUtilsService
                        .uploadToStorage([imageFile.filename], Source.colors)
                        .catch(console.error);
                      await fs.promises.unlink(imageFile.path);
                    }

                    if (imageFile.filename)
                      colorFileName.push(imageFile.filename);
                  }
                }),
              );

              if (colorName && colorFileName.length && colorId.length) {
                colorsFiles.push({
                  colorName,
                  colorId,
                  colorFile: colorFileName,
                });
              }
            }),
          );
          if (colorsFiles.length) await this.addColorsPictures(colorsFiles);
          return null;

        default:
          return null;
      }
    } catch (error) {
      // await this.chatGateway.handleMessage({
      //   parser: source,
      //   data: 'Can`t upload color image file ',
      // });
      return error;
      // throw new Error(`parseColorPictures: ${error.message}`);
    }
  }

  async parseColorPicturesForLetsShop(color: string) {
    try {
      let colorsHex: CreateColororsPicturesDto[] = [];
      let colorId: string[] = [];
      let hexColor: string | null = null;
      const colorsFormDb = await this.colorsPicturesRepository.find({
        colorName: color,
      });

      if (colorsFormDb?.length > 0) {
        return;
      }
      console.log(colorsFormDb);

      let translatedColorName = await translate(color.toLowerCase(), {
        from: 'uk',
        to: 'en',
      });

      if (translatedColorName) {
        hexColor = toHex(translatedColorName.replace(/ /g, ''));
      }

      if (color && hexColor) {
        colorId = [uuid.v1()];

        colorsHex.push({
          colorName: color,
          hexColor,
          colorId,
        });
      }

      if (colorsHex.length) {
        await this.addColorsPictures(colorsHex);
      }
      return null;
    } catch (error) {
      // await this.chatGateway.handleMessage({
      //   parser: source,
      //   data: 'Can`t upload color image file ',
      // });
      return error;
      // throw new Error(`parseColorPictures: ${error.message}`);
    }
  }

  async parseColorPicturesForPobedov(productDOM: HTMLElement) {
    try {
      const colorNodes = productDOM.querySelectorAll('.iconic-wlv-terms__term');

      if (!colorNodes?.length) return;

      let colorsHex: CreateColororsPicturesDto[] = [];
      await Promise.all(
        colorNodes?.map(async (node) => {
          let colorId: string[] = [];
          let colorName: string | null = null;
          let hexColor: string | null = null;

          colorName = node.getAttribute('data-iconic-wlv-term-label');

          if (!colorName) return;

          colorName = pobedovColorTranslator(colorName);

          const colorsFormDb = await this.colorsPicturesRepository.find({
            colorName,
          });

          if (colorsFormDb?.length) return;

          let translatedColorName = await translate(colorName.toLowerCase(), {
            from: 'ru',
            to: 'en',
          });

          if (translatedColorName) {
            hexColor = toHex(translatedColorName);
          }

          if (colorName && hexColor) {
            colorId = [uuid.v1()];

            colorsHex.push({
              colorName,
              hexColor,
              colorId,
            });
          }
        }),
      );

      if (colorsHex.length) await this.addColorsPictures(colorsHex);
      return null;
    } catch (error) {
      return error;
    }
  }
}
