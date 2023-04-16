import { getRepository, MigrationInterface } from 'typeorm';
import * as uuid from 'uuid';
import { ColorsPicturesFiles } from '../../src/colors-pictures/colors-pictures.entity';
import * as BlueBirdPromise from 'bluebird';
import { CreateColororsPicturesDto } from '../../src/colors-pictures/dto/create-colors-pictures.dto';

export class ColorsPobedovProducts1677510508843 implements MigrationInterface {
  colorsPicturesRepository = getRepository(ColorsPicturesFiles, 'seeds');

  public async up(): Promise<void> {
    const colors: CreateColororsPicturesDto[] = [
      { colorName: 'Голубий', hexColor: '#add8e6', colorId: [''] },
      { colorName: 'Жовтий', hexColor: '#ffff00', colorId: [''] },
      { colorName: 'Пудра', hexColor: '#e5b5b4', colorId: [''] },
      { colorName: 'Navy', hexColor: '#000080', colorId: [''] },
      { colorName: 'Антрацит', hexColor: '#383e42', colorId: [''] },
      { colorName: 'Бежевий', hexColor: '#f5f5dc', colorId: [''] },
      { colorName: 'Білий', hexColor: '#ffffff', colorId: [''] },
      { colorName: 'Зелений', hexColor: '#00ff00', colorId: [''] },
      { colorName: 'Коричневий', hexColor: '#964b00', colorId: [''] },
      { colorName: 'Червоний', hexColor: '#ff0000', colorId: [''] },
      { colorName: 'Сірий', hexColor: '#808080', colorId: [''] },
      { colorName: 'Синій', hexColor: '#0000ff', colorId: [''] },
      { colorName: 'Хакі', hexColor: '#f0e68c', colorId: [''] },
      { colorName: 'Чорний', hexColor: '#000000', colorId: [''] },
      { colorName: 'Рожевий', hexColor: '#ffc0cb', colorId: [''] },
      { colorName: 'Оливковий', hexColor: '#808000', colorId: [''] },
      { colorName: 'Космос', hexColor: '#414a4c', colorId: [''] },
    ];

    await BlueBirdPromise.map(colors, async (color) => {
      const colorDb = await this.colorsPicturesRepository.find({
        where: { colorName: color },
      });

      if (!(colorDb.length > 0)) {
        color.colorId = [uuid.v1()];
        await this.colorsPicturesRepository.save(color);
      }
    });
  }

  public async down(): Promise<void> {}
}
