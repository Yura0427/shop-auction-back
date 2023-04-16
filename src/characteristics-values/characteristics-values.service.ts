import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../product/product.entity';
import { Characteristic } from '../characteristics/characteristics.entity';
import { CustomValidation } from '../utils/custom-validation';
import { CreateCharacteristicValueDto } from './dto/createCharacteristicValue.dto';
import { CharacteristicValue } from './characteristics-values.entity';
import { UpdateCharacteristicValueDto } from './dto/updateCharacteristicValue.dto';
import { ReqType } from '../characteristics/characteristics.enum';
import { DeleteCharacteristicValueDto } from './dto/deleteCharacteristicValue.dto';
import { IDeleteMessage } from '../interfaces/delete-message.interface';
import {
  characteristicValuesByNameQeq,
  characteristicValuesByNameRes,
} from './dto/characteristicValuesByNemeDto.dto';

@Injectable()
export class CharacteristicsValuesService {
  constructor(
    @InjectRepository(CharacteristicValue)
    private characteristicsValuesRepository: Repository<CharacteristicValue>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Characteristic)
    private characteristicsRepository: Repository<Characteristic>,
  ) {}

  async createCharacteristicValue(
    dto: CreateCharacteristicValueDto,
  ): Promise<CharacteristicValue[]> {
    const { productId, characteristicValues } = dto;
    const characteristicsValues = [];

    const relatedCaharcteristicsId = characteristicValues.map(
      (item) => item.characteristicId,
    );

    const submitedValues = characteristicValues
      .sort((a, b) => a.characteristicId - b.characteristicId)
      .map((item) => {
        return Object.keys(item).find((item) =>
          item.toLowerCase().includes('value'),
        );
      });

    const relatedCharacteristics = await this.characteristicsRepository.findByIds(
      relatedCaharcteristicsId,
      {
        relations: ['group'],
      },
    );

    if (!dto.noValidate) {
      new CustomValidation().multipleNotFound(
        relatedCharacteristics,
        relatedCaharcteristicsId,
        'Характеристики',
      );
    }
    relatedCharacteristics.sort((a, b) => a.id - b.id);

    const relatedProduct = await this.productsRepository.findOne(productId);
    new CustomValidation().notFound('Товар', 'id', productId, relatedProduct);

    for (let i = 0; i < relatedCharacteristics.length; i++) {
      const { characteristicId, ...otherFields } = characteristicValues[i];
      new CustomValidation().characteristicValuesDTOChecker(
        Object.keys(otherFields).length,
        ReqType.CREATE,
      );

      const relatedType = relatedCharacteristics[i].type;
      const { minValue, maxValue } = relatedCharacteristics[i];

      if (relatedType === 'range') {
        new CustomValidation().characteristicRangeChecker(
          Number(minValue),
          Number(maxValue),
          characteristicValues[i].numberValue,
        );
      }

      const mappedValuesToTypes = {
        enumValue: 'enum',
        stringValue: 'string',
        numberValue: 'number',
        booleanValue: 'boolean',
        jsonValue: 'json',
        dateValue: 'date',
      };

      if (relatedType === 'range') {
        mappedValuesToTypes.numberValue = 'range';
      }

      if (relatedType !== mappedValuesToTypes[submitedValues[i]]) {
        throw new BadRequestException(
          `Не можливо записати значення ${submitedValues[i]} в характеристику з типом ${relatedType}`,
        );
      }

      characteristicsValues.push({
        product: relatedProduct,
        characteristic: relatedCharacteristics[i],
        type: relatedType,
        ...otherFields,
      });
    }

    return await this.characteristicsValuesRepository.save(
      characteristicsValues,
    );
  }

  async updateCharacteristicVale(
    dto: UpdateCharacteristicValueDto,
  ): Promise<CharacteristicValue[]> {
    const { productId, characteristicValues } = dto;
    const characteristicsValues = [];

    const relatedCaharcteristicsId = characteristicValues.map(
      (item) => item.characteristicId,
    );
    const relatedCharacteristics = await this.characteristicsRepository.findByIds(
      relatedCaharcteristicsId,
    );
    new CustomValidation().multipleNotFound(
      relatedCharacteristics,
      relatedCaharcteristicsId,
      'Характеристики',
    );
    // relatedCharacteristics.reverse();

    const relatedProduct = await this.productsRepository.findOne(productId);
    new CustomValidation().notFound('Товар', 'id', productId, relatedProduct);

    for (let i = 0; i < characteristicValues.length; i++) {
      const { characteristicId, ...otherFields } = characteristicValues[i];

      new CustomValidation().characteristicValuesDTOChecker(
        Object.keys(otherFields).length,
        ReqType.UPDATE,
      );

      const relatedType = relatedCharacteristics[i].type;
      const { minValue, maxValue } = relatedCharacteristics[i];

      if (relatedType === 'range') {
        if (characteristicValues[i].numberValue == 0) {
          await this.characteristicsValuesRepository.delete(otherFields.id);
          continue;
        } else {
          new CustomValidation().characteristicRangeChecker(
            Number(minValue),
            Number(maxValue),
            characteristicValues[i].numberValue,
          );
        }
      }

      if (relatedType === 'json') {
        const { jsonValue } = otherFields;
        if (!Object.keys(jsonValue).length) {
          await this.characteristicsValuesRepository.delete(otherFields.id);
          continue;
        }
      }

      if (relatedType === 'date') {
        if (!dto.characteristicValues[i].dateValue?.getDate()) {
          await this.characteristicsValuesRepository.delete(otherFields.id);
          continue;
        }
      }

      if (relatedType === 'string') {
        if (dto.characteristicValues[i].stringValue === '') {
          await this.characteristicsValuesRepository.delete(otherFields.id);
          continue;
        }
      }

      if (relatedType === 'boolean') {
        if (dto.characteristicValues[i].booleanValue === null) {
          await this.characteristicsValuesRepository.delete(otherFields.id);
          continue;
        }
      }

      if (relatedType === 'number') {
        if (dto.characteristicValues[i].numberValue === 0) {
          await this.characteristicsValuesRepository.delete(otherFields.id);
          continue;
        }
      }

      if (relatedType === 'enum') {
        if (dto.characteristicValues[i].enumValue?.length === 0) {
          await this.characteristicsValuesRepository.delete(otherFields.id);
          continue;
        }
      }

      characteristicsValues.push({
        ...otherFields,
      });
    }

    return await this.characteristicsValuesRepository.save(
      characteristicsValues,
    );
  }

  async deleteCharacteristicValue(
    dto: DeleteCharacteristicValueDto,
  ): Promise<IDeleteMessage> {
    const relatedValues = await this.characteristicsValuesRepository.findByIds(
      dto.characteristicValuesIds,
    );
    new CustomValidation().multipleNotFound(
      relatedValues,
      dto.characteristicValuesIds,
      'Значення характеристик',
    );

    await this.characteristicsValuesRepository.delete(
      dto.characteristicValuesIds,
    );

    return {
      message: `Значення характеристик з ID ${dto.characteristicValuesIds} успішно видалено`,
    };
  }

  async getCharacteristicValuesByNeme(
    query: characteristicValuesByNameQeq,
  ): Promise<characteristicValuesByNameRes[]> {
    return await this.characteristicsValuesRepository
      .createQueryBuilder('characteristicsValues')
      .select('characteristicsValues.stringValue')
      .where('characteristicsValues.characteristicId = :id', query)
      .distinct(true)
      .getRawMany();
  }

  async getProductsSizes() {
    const parameters = await this.characteristicsValuesRepository
      .createQueryBuilder('chars')
      .where('chars.jsonValue is not null')
      .select('chars.jsonValue')
      .getMany();

    const sizes = parameters
      .filter(
        ({ jsonValue }) =>
          typeof jsonValue === 'object' &&
          jsonValue !== null &&
          Array.isArray(jsonValue[Object.keys(jsonValue)[0]]),
      )
      .flatMap(({ jsonValue }) => Object.values(jsonValue)[0])
      .filter((el) => isNaN(Number(el)));

    const arrayOfFiltered = [...new Set(sizes)].sort();
    return arrayOfFiltered;
  }
}
