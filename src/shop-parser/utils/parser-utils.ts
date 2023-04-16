import { CharacteristicValue } from '../../characteristics-values/characteristics-values.entity';

export const shouldFilterName = (
  string: string,
  filteredNames: string[],
): { shouldFilter: boolean; failOnWord: string | null } => {
  let failOnWord: string;
  const stringWithoutSpaces = string.replace(/\s+/g, ' ');

  const shouldFilter = filteredNames.some((item) => {
    failOnWord = item;
    return stringWithoutSpaces.includes(item);
  });

  return {
    shouldFilter,
    failOnWord: shouldFilter ? failOnWord : null,
  };
};

export const clearName = (name: string, filteredNames: string[]): string => {
  const nameWithoutSpaces = name.replace(/\s+/g, ' ');

  const { shouldFilter, failOnWord } = shouldFilterName(name, filteredNames);

  if (shouldFilter) {
    return nameWithoutSpaces.replace(failOnWord, '').trim();
  }

  return nameWithoutSpaces.trim();
};

export const characteristicsToDesc = (
  charValues: CharacteristicValue[],
): string => {
  let desc = ['<ul>'];

  charValues.forEach((char, index) => {
    const charValue = char.booleanValue
      ? char.booleanValue
        ? '+'
        : '-'
      : char.stringValue;

    if (index < charValues.length - 1) {
      desc.push(`<li>${char.name}: ${charValue};</li>`);
    } else {
      desc.push(`<li>${char.name}: ${charValue}.</li></ul>`);
    }
  });

  return desc.join('');
};

export const createKeysForCategory = (categoryName) => {
  const ukrainian = {
    get: function (char) {
      return this[char.toLowerCase()] || char.toLowerCase();
    },
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'h',
    ґ: 'g',
    д: 'd',
    е: 'e',
    є: 'ie',
    ж: 'zh',
    з: 'z',
    и: 'y',
    і: 'i',
    ї: 'i',
    й: 'i',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ь: '',
    ю: 'iu',
    я: 'ia',
  };

  const translitted = categoryName
    .split('')
    .map((char) => ukrainian.get(char))
    .join('')
    .trim();

  function removeNonLatinChars(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/ +/g, '-');
  }

  return removeNonLatinChars(translitted);
};
