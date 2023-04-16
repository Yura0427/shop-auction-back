import { DefaultCategories } from '../parser';

export const defaultCategories: DefaultCategories[] = [
  {
    name: 'Одяг',
    key: 'odyah',
    description: 'Одяг',
    subCategories: [
      {
        name: 'Для жінок',
        key: 'zhinochyi-odyah',
        description: 'Жіночий одяг',
        subCategories: [
          {
            name: 'Одяг великих розмірів',
            key: 'zhinochyi-odyah-velykykh-rozmiriv',
            description: 'Одяг великих розмірів',
            subCategories: [],
          },
          {
            name: 'Сукні',
            key: 'zhinochi-sukni',
            description: 'Жіночі сукні',
            subCategories: [],
          },
          {
            name: 'Літній одяг',
            key: 'litniy-zhinochyi-odyah',
            description: 'Літній одяг',
            subCategories: [],
          },
          {
            name: 'Спортивний одяг',
            key: 'zhinochiy-sportyvnyi-odyah',
            description: 'Спортивний одяг',
            subCategories: [],
          },
          {
            name: 'Верхній одяг',
            key: 'verhniy-zhinochyi-odyah',
            description: 'Верхній одяг',
            subCategories: [],
          },
          {
            name: 'Аксесуари',
            key: 'zhinochi-aksesuary',
            description: 'Аксесуари жіночі',
            subCategories: [
              {
                name: 'Сумки, барсетки, косметички',
                key: 'zhinochi-sumky-ta-inshe',
                description: 'Сумки, барсетки, косметички',
                subCategories: [],
              },
              {
                name: 'Головні убори',
                key: 'zhinochi-golovni-ubory',
                description: 'Головні убори',
                subCategories: [],
              },
            ],
          },
          {
            name: 'Шкарпетки і колготки',
            key: 'zhinochi-shkarpetky-i-kolgotky',
            description: 'Шкарпетки і колготки',
            subCategories: [],
          },
          {
            name: 'Нижня білизна',
            key: 'zhinocha-nuzhniya-bilyzna',
            description: 'Нижня білизна жіноча',
            subCategories: [],
          },
          {
            name: 'Кофти, светри і кардигани',
            key: 'zhinochi-kofty-svetry-kardygany',
            description: 'Кофти, светри і кардигани жіночі',
            subCategories: [],
          },
        ],
      },
      {
        name: 'Для чоловіків',
        key: 'cholovichyj-odyah',
        description: 'Чоловічий одяг',
        subCategories: [
          {
            name: 'Аксесуари',
            key: 'cholovichi-aksesuary',
            description: 'Аксесуари для чоловіків',
            subCategories: [
              {
                name: 'Головні убори',
                key: 'cholovichi-golovny-ubory',
                description: 'Чоловічі головні убори',
                subCategories: [],
              },
              {
                name: 'Сумки, рюкзаки, барсетки',
                key: 'cholovichi-sumki-ta-inshe',
                description: 'Сумки, рюкзаки, барсетки',
                subCategories: [],
              },
            ],
          },
          {
            name: 'Літній одяг',
            key: 'cholovichyj-litniy-odyah',
            description: 'Літній чоловічий одяг',
            subCategories: [],
          },
          {
            name: 'Спортивний одяг',
            key: 'cholovichyj-sportyvnyi-odyah',
            description: 'Спортивний одяг для чоловіків',
            subCategories: [],
          },
          {
            name: 'Кофти, светри і кардигани',
            key: 'cholovichi-kofty-svetry-kardygany',
            description: 'Кофти, светри і кардигани для чоловіків',
            subCategories: [],
          },
          {
            name: 'Верхній одяг',
            key: 'cholovichyj-verhniy-odyah',
            description: 'Верхній одяг для чоловіків',
            subCategories: [],
          },
        ],
      },
      {
        name: 'Дитячий одяг',
        key: 'dytyiachiy-odyah',
        description: 'Дитячий одяг',
        subCategories: [
          {
            name: 'Для малюків',
            key: 'odyah-dlya-malyukiv',
            description: 'Дитячий одяг для малюків',
            subCategories: [],
          },
        ],
      },
    ],
  },
  {
    name: 'Взуття',
    key: 'vzuttya',
    description: 'Взуття',
    subCategories: [
      {
        name: 'Жіноче',
        key: 'zhinoche-vzuttya',
        description: 'Жіноче взуття',
        subCategories: [
          {
            name: 'Літнє взуття',
            key: 'zhinoche-litne-vzuttya',
            description: 'Літнє взуття',
            subCategories: [],
          },
          {
            name: 'Осінь-Зима',
            key: 'zhinoche-osin-zyma-vzuttya',
            description: 'Осінь-Зима',
            subCategories: [],
          },
        ],
      },
      {
        name: 'Чоловіче',
        key: 'choloviche-vzuttya',
        description: 'Чоловіче взуття',
        subCategories: [
          {
            name: 'Літнє взуття',
            key: 'choloviche-litne-vzuttya',
            description: 'Літнє взуття',
            subCategories: [],
          },
          {
            name: 'Осінь-Зима',
            key: 'choloviche-osin-zyma-vzuttya',
            description: 'Осінь-Зима',
            subCategories: [],
          },
        ],
      },
      {
        name: 'Дитяче',
        key: 'dytyache-vzuttya',
        description: 'Дитяче взуття',
        subCategories: [],
      },
    ],
  },
  {
    name: 'Текстиль',
    key: 'tekstyl',
    description: 'Текстиль',
    subCategories: [
      {
        name: 'Рушники',
        key: 'tekstil-rushniky',
        description: 'Рушники',
        subCategories: [],
      },
    ],
  },
  {
    name: 'Догляд',
    key: 'dohliad',
    description: 'Догляд',
    subCategories: [
      {
        name: 'Натуральна косметика WHITE MANDARIN',
        description: 'Натуральна косметика WHITE MANDARIN',
        key: 'naturalna-kosmetyka-white-mandarin',
        subCategories: [
          {
            name: 'Догляд за обличчям',
            description: 'Догляд за обличчям',
            key: 'dohliad-za-oblychchiam',
            subCategories: [
              {
                name: 'Крем для обличчя',
                description: 'Крем для обличчя',
                key: 'krem-dlia-oblychchia',
                subCategories: [],
              },
              {
                name: 'Маска для обличчя',
                description: 'Маска для обличчя',
                key: 'maska-dlia-oblychchia',
                subCategories: [],
              },
              {
                name: 'Сироватка для обличчя',
                description: 'Сироватка для обличчя',
                key: 'syrovatka-dlia-oblychchia',
                subCategories: [],
              },
              {
                name: 'Скраб для обличчя',
                description: 'Скраб для обличчя',
                key: 'skrab-dlia-oblychchia',
                subCategories: [],
              },
              {
                name: 'Для вмивання / Демакіяж',
                description: 'Для вмивання / Демакіяж',
                key: 'dlia-vmyvannia-demakiiazh',
                subCategories: [],
              },
              {
                name: 'Тонік для обличчя',
                description: 'Тонік для обличчя',
                key: 'tonik-dlia-oblychchia',
                subCategories: [],
              },
              {
                name: 'Для проблемної шкіри обличчя',
                description: 'Для проблемної шкіри обличчя',
                key: 'dlia-problemnoi-shkiry-oblychchia',
                subCategories: [],
              },
            ],
          },
          {
            name: 'Догляд за волоссям',
            description: 'Догляд за волоссям',
            key: 'dohliad-za-volossiam',
            subCategories: [
              {
                name: 'Шампунь для волосся',
                description: 'Шампунь для волосся',
                key: 'shampun-dlia-volossia',
                subCategories: [],
              },
              {
                name: 'Маска та Бальзам для волосся',
                description: 'Маска та Бальзам для волосся',
                key: 'maska-ta-balzam-dlia-volossia',
                subCategories: [],
              },
              {
                name: 'Для пошкодженого та фарбованого волосся',
                description: 'Для пошкодженого та фарбованого волосся',
                key: 'dlia-poshkodzhenoho-ta-farbovanoho-volossia',
                subCategories: [],
              },
            ],
          },
          {
            name: 'Догляд за тілом',
            description: 'Догляд за тілом',
            key: 'dohliad-za-tilom',
            subCategories: [
              {
                name: 'Дезодорант',
                description: 'Дезодорант',
                key: 'dezodorant',
                subCategories: [],
              },
              {
                name: 'Гель для душа',
                description: 'Гель для душа',
                key: 'hel-dlia-dusha',
                subCategories: [],
              },
              {
                name: 'Крем та бальзам для тіла і рук',
                description: 'Крем та бальзам для тіла і рук',
                key: 'krem-ta-balzam-dlia-tila-i-ruk',
                subCategories: [],
              },
              {
                name: 'Скраб / Пілінг для тіла',
                description: 'Скраб / Пілінг для тіла',
                key: 'skrab-pilinh-dlia-tila',
                subCategories: [],
              },
              {
                name: 'Молочко для тіла',
                description: 'Молочко для тіла',
                key: 'molochko-dlia-tila',
                subCategories: [],
              },
              {
                name: 'Spa collection',
                description: 'Spa collection',
                key: 'spa-collection',
                subCategories: [],
              },
              {
                name: 'Мило',
                description: 'Мило',
                key: 'mylo',
                subCategories: [],
              },
            ],
          },
          {
            name: 'Косметика догляд для дітей',
            description: 'Косметика догляд для дітей',
            key: 'kosmetyka-dohliad-dlia-ditei',
            subCategories: [],
          },
          {
            name: 'Чоловіча косметика',
            description: 'Чоловіча косметика',
            key: 'cholovicha-kosmetyka',
            subCategories: [
              {
                name: 'Засоби для гоління',
                description: 'Засоби для гоління',
                key: 'zasoby-dlia-holinnia',
                subCategories: [],
              },
            ],
          },
          {
            name: 'Косметичні набори',
            description: 'Косметичні набори',
            key: 'kosmetychni-nabory',
            subCategories: [],
          },
        ],
      },
      {
        name: 'Догляд за порожниною рота BIOX',
        description: 'Догляд за порожниною рота BIOX',
        key: 'dohliad-za-porozhnynoiu-rota-biox',
        subCategories: [
          {
            name: 'Зубні пасти',
            description: 'Зубні пасти',
            key: 'zubni-pasty',
            subCategories: [],
          },
          {
            name: 'Зубні щітки',
            description: 'Зубні щітки',
            key: 'zubni-shchitky',
            subCategories: [],
          },
        ],
      },
      {
        name: 'Подарункові набори',
        description: 'Подарункові набори',
        key: 'podarunkovi-nabory',
        subCategories: [],
      },
    ],
  },
  {
    name: 'Побутова хімія',
    description: 'Натуральна побутова хімія',
    key: 'pobutova-khimiia',
    subCategories: [
      {
        name: 'Натуральна побутова хімія GREEN MAX',
        description: 'Натуральна побутова хімія GREEN MAX',
        key: 'naturalna-pobutova-khimiia-green-max',
        subCategories: [
          {
            name: 'Пральні засоби',
            description: 'Пральні засоби',
            key: 'pralni-zasoby',
            subCategories: [
              {
                name: 'Пральний порошок',
                description: 'Пральний порошок',
                key: 'pralnyi-poroshok',
                subCategories: [],
              },
              {
                name: 'Плямовивідник / Відбілювач',
                description: 'Плямовивідник / Відбілювач',
                key: 'pliamovyvidnyk-vidbiliuvach',
                subCategories: [],
              },
              {
                name: 'Рідкий пральний засіб',
                description: 'Рідкий пральний засіб',
                key: 'ridkyi-pralnyi-zasib',
                subCategories: [],
              },
            ],
          },
          {
            name: 'Засоби для кухні',
            description: 'Засоби для кухні',
            key: 'zasoby-dlia-kukhni',
            subCategories: [],
          },
          {
            name: 'Засоби для прибирання',
            description: 'Засоби для прибирання',
            key: 'zasoby-dlia-prybyrannia',
            subCategories: [],
          },
        ],
      },
    ],
  },
];
