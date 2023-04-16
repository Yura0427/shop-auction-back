import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';
import * as uuid from 'uuid';
import { ColorsPicturesFiles } from '../../src/colors-pictures/colors-pictures.entity';
import * as BlueBirdPromise from 'bluebird';
import { CreateColororsPicturesDto } from '../../src/colors-pictures/dto/create-colors-pictures.dto';

export class ColorsForLetsShopProducts1675550164589
  implements MigrationInterface {
  colorsPicturesRepository = getRepository(ColorsPicturesFiles, 'seeds');

  public async up(): Promise<void> {
    const colors: CreateColororsPicturesDto[] = [
      { colorName: 'Гірчичний', hexColor: '#cccc00', colorId: [''] },
      { colorName: 'Капучино', hexColor: '#ecd8c6', colorId: [''] },
      { colorName: 'Різнокольоровий', hexColor: '#ffffff', colorId: [''] },
      { colorName: 'Вишневий', hexColor: '#b30000', colorId: [''] },
      { colorName: 'Бiрюзовий', hexColor: '#33ffcc', colorId: [''] },
      { colorName: 'Бузковий', hexColor: '#ccccff', colorId: [''] },
      { colorName: 'Салатовий', hexColor: '#88ff4d', colorId: [''] },
      { colorName: 'Чорний з червоним', hexColor: '#000000', colorId: [''] },
      { colorName: 'Темно-сірий', hexColor: '#595959', colorId: [''] },
      { colorName: 'Бордовий', hexColor: '#660033', colorId: [''] },
      { colorName: 'Персиковий', hexColor: '#ffc299', colorId: [''] },
      { colorName: 'Пудровий', hexColor: '#fff0e6', colorId: [''] },
      { colorName: 'Мокко', hexColor: '#dfbf9f', colorId: [''] },
      { colorName: 'Світло сірий', hexColor: '#e6e6e6', colorId: [''] },
      { colorName: 'Чорно-жовтий', hexColor: '#000000', colorId: [''] },
      { colorName: 'Темно-зелений', hexColor: '#004d00', colorId: [''] },
      { colorName: 'Темно-рожевий', hexColor: '#ff3399', colorId: [''] },
      { colorName: 'Світло рожевий', hexColor: '#ffb3da', colorId: [''] },
      { colorName: 'Темно зелений', hexColor: '#004d00', colorId: [''] },
      { colorName: 'Кавовий', hexColor: '#604020', colorId: [''] },
      { colorName: 'Світло-сірий', hexColor: '#e6e6e6', colorId: [''] },
      { colorName: 'Темно - зелений', hexColor: '#004d00', colorId: [''] },
      { colorName: 'Світло-коричневий', hexColor: '#ac7339', colorId: [''] },
      { colorName: 'Графіт', hexColor: '#293d3d', colorId: [''] },
      { colorName: 'Темно коричневий', hexColor: '#4d2600', colorId: [''] },
      { colorName: 'Чорно-сірий', hexColor: '#1a1a1a', colorId: [''] },
      { colorName: 'Чорно-білий', hexColor: '#000000', colorId: [''] },
      { colorName: 'Мідь', hexColor: '#cc6600', colorId: [''] },
      { colorName: 'Білий з сірим', hexColor: '#ffffff', colorId: [''] },
      { colorName: 'Чорний з бордовим', hexColor: '#000000', colorId: [''] },
      { colorName: 'Синій з блакитним', hexColor: '#000099', colorId: [''] },
      { colorName: 'Синій з червоним', hexColor: '#000099', colorId: [''] },
      { colorName: 'Сіро-чорний', hexColor: '#262626', colorId: [''] },
      { colorName: 'Світло-бузковий', hexColor: '#e6ccff', colorId: [''] },
      { colorName: 'Темно-фіолетовий', hexColor: '#600080', colorId: [''] },
      { colorName: 'Світло-бежевий', hexColor: '#fff3cc', colorId: [''] },
      { colorName: 'Чорно-рожевий', hexColor: '#000000', colorId: [''] },
      { colorName: 'Жовто-блакитний', hexColor: '#ffff4d', colorId: [''] },
      { colorName: 'Чорно-червоний', hexColor: '#000000', colorId: [''] },
      { colorName: 'Синьо-сірий', hexColor: '#2d5986', colorId: [''] },
      { colorName: 'Рожево-білий', hexColor: '#ffe6ff', colorId: [''] },
      { colorName: 'Сіро-синій', hexColor: '#808080', colorId: [''] },
      { colorName: 'Бронзовий', hexColor: '#b37700', colorId: [''] },
      { colorName: 'Електрик', hexColor: '#0000cc', colorId: [''] },
      { colorName: 'Темно бузковий', hexColor: '#800080', colorId: [''] },
      { colorName: 'Пісочний', hexColor: '#fff2cc', colorId: [''] },
      { colorName: 'Блакитний з сірим', hexColor: '#4dd2ff', colorId: [''] },
      { colorName: 'Синій з білим', hexColor: '#0000b3', colorId: [''] },
      { colorName: 'Червоний з білим', hexColor: '#ff0000', colorId: [''] },
      { colorName: 'Зелений з білим', hexColor: '#008000', colorId: [''] },
      { colorName: 'Сірчаний', hexColor: '#ffff80', colorId: [''] },
      { colorName: 'Чорно-бірюзовий', hexColor: '#003329', colorId: [''] },
      { colorName: 'Чорно-коричневий', hexColor: '#331a00', colorId: [''] },
      { colorName: 'Чорно-синій', hexColor: '#000033', colorId: [''] },
      { colorName: 'Синьо-білий', hexColor: '#0000ff', colorId: [''] },
      { colorName: 'Сіро-білий', hexColor: '#808080', colorId: [''] },
      { colorName: 'Темно-бежевий', hexColor: '#cc9966', colorId: [''] },
      { colorName: 'Камуфляж', hexColor: '#666633', colorId: [''] },
      { colorName: 'Леопардовий', hexColor: '#ffffff', colorId: [''] },
      { colorName: 'Хамелеон', hexColor: '#ffffff', colorId: [''] },
      { colorName: 'Сріблястий', hexColor: '#cccccc', colorId: [''] },
      { colorName: 'Джинсовий', hexColor: '#336699', colorId: [''] },
      { colorName: 'Чорний з синім', hexColor: '#0d1a26', colorId: [''] },
      { colorName: 'Синьо-жовтий', hexColor: '#0000ff', colorId: [''] },
      { colorName: 'Чорний з сірим', hexColor: '#262626', colorId: [''] },
      { colorName: 'Червоний з чорним', hexColor: '#ff0000', colorId: [''] },
      { colorName: 'Чорний з жовтим', hexColor: '#000000', colorId: [''] },
      { colorName: 'Чорний з зеленим', hexColor: '#000000', colorId: [''] },
      { colorName: 'Болотний', hexColor: '#55552b', colorId: [''] },
      { colorName: 'Золотистий', hexColor: '#b8860B', colorId: [''] },
      { colorName: 'Світло-фіолетовий', hexColor: '#d24dff', colorId: [''] },
      { colorName: 'Світло синій', hexColor: '#4d4dff', colorId: [''] },
      { colorName: 'Чорний з фіолетовим', hexColor: '#4d004d', colorId: [''] },
      { colorName: 'Рожевий з блакитним', hexColor: '#ffcce6', colorId: [''] },
      { colorName: 'Рожевий з фіолетовим', hexColor: '#ff99e6', colorId: [''] },
      { colorName: 'Блакитний з жовтим', hexColor: '#00bfff', colorId: [''] },
      { colorName: 'Червоний з сірим', hexColor: '#ff0000', colorId: [''] },
      { colorName: 'Рожевий з сірим', hexColor: '#ffb3da', colorId: [''] },
      { colorName: 'Чорний та срiбний', hexColor: '#1a1a1a', colorId: [''] },
      { colorName: 'Клітинка', hexColor: '#ffffff', colorId: [''] },
      { colorName: 'Білий з чорним', hexColor: '#ffffff', colorId: [''] },
      { colorName: 'Кремовий', hexColor: '#fff2e6', colorId: [''] },
      { colorName: 'Біло-рожевий', hexColor: '#ffe6f3', colorId: [''] },
      { colorName: 'Жовтий з чорним', hexColor: '#ffff00', colorId: [''] },
      { colorName: 'Рожеві з помаранчевим', hexColor: '#ffb3d9', colorId: [''] },
      { colorName: 'Блакитний з рожевим', hexColor: '#00ccff', colorId: [''] },
      { colorName: 'Молочний', hexColor: '#ffd1b3', colorId: [''] },
      { colorName: 'Теракотовий', hexColor: '#cc5200', colorId: [''] },
      { colorName: 'Лавандовий', hexColor: '#3333cc', colorId: [''] },
      { colorName: 'Шоколадний', hexColor: '#9c4e16', colorId: [''] },
    ]

    await BlueBirdPromise.map(colors, async (color) => {
      const colorDb = await this.colorsPicturesRepository.find({
        where: { colorName: color },
      });

      if (!(colorDb.length > 0)) {
        color.colorId = [uuid.v1()]
        await this.colorsPicturesRepository.save(color)
      }
    })
  }

  public async down(): Promise<void> {}
}
