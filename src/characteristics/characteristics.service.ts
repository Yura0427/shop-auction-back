import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Characteristic } from './characteristics.entity';
import { Category } from '../category/category.entity';
import { CreateCharacteristicDto } from './dto/createCharacteristic.dto';
import { CustomValidation } from '../utils/custom-validation';
import { updateCharacteristicDto } from './dto/updateCharacteristic.dto';
import { CharacteristicGroup } from '../characteristic-group/characteristic-group.entity';
import { CreateCharacteristicGroupDto } from './dto/createCharacteristicGroup.dto';
import { IDeleteMessage } from '../interfaces/delete-message.interface';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';

@Injectable()
export class CharacteristicsService {
  constructor(
    @InjectRepository(Characteristic)
    private characteristicsRepository: Repository<Characteristic>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(CharacteristicGroup)
    private characteristicGroupRepository: Repository<CharacteristicGroup>,
    @InjectRepository(CharacteristicValue)
    private characteristicValue: Repository<CharacteristicValue>,
  ) {}

  async createCharacteristic(
    dto: CreateCharacteristicDto,
  ): Promise<Characteristic> {
    const { categoryId, groupId, ...otherFields } = dto;
    const relatedCategory = await this.categoryRepository.findOne(categoryId);
    const relatedGroup = await this.characteristicGroupRepository.findOne(groupId);
    if (dto.type === 'range') {
      // new CustomValidation().characteristicMinMaxChecker(dto);
    }
    new CustomValidation().notFound(
      'Категорію',
      'ID',
      categoryId,
      relatedCategory,
    );

    return this.characteristicsRepository.save({
      category: relatedCategory,
      group: relatedGroup,
      ...otherFields,
    });
  }

  async getCharacteristicInCategory(key: string): Promise<Characteristic[]> {
    const relatedCategory = await this.categoryRepository.findOne({
      where: { key },
    });

    new CustomValidation().notFound('Категорію', 'key', key, relatedCategory);

    return this.characteristicsRepository.find({
      where: {
        category: relatedCategory,
      },
      relations: ['characteristicValue'],
    });
  }

  async getAllCharacteristic(): Promise<Characteristic[]> {
    return this.characteristicsRepository.find({
      relations: ['characteristicValue'],
    });
  }

  async deleteCharacteristic(id: number): Promise<IDeleteMessage> {
    const allCharacteristicsToDelete = await this.characteristicValue.find({where: {characteristic: {id}}})
    await this.characteristicValue.remove(allCharacteristicsToDelete)

    const result = await this.characteristicsRepository.delete(id);

    new CustomValidation().notFound('Характеристику', 'ID', id, null, result);

    return { message: `Характеристику з id: ${id} успішно видалено.` };
  }

  async updateCharacteristic(
    id: number,
    dto: updateCharacteristicDto,
  ): Promise<Characteristic> {
    if (!Object.keys(dto).length) {
      throw new BadRequestException(
        'Запит повинен мати один із наступних ключів: name, description, type, defaultValues, minValue, maxValue, categoryId',
      );
    }

    // new CustomValidation().characteristicMinMaxChecker(dto);

    const relatedCharacteristic = await this.characteristicsRepository.findOne(
      id,
    );
    new CustomValidation().notFound(
      'Характеристику',
      'ID',
      id,
      relatedCharacteristic,
    );

    // Change all name characteristicsValues
    const oldName = relatedCharacteristic.name
    const newName = dto.name
    const allCharacteristicsToUpdate = await this.characteristicValue.find({where: {name: oldName}})
    allCharacteristicsToUpdate.map(char => {
      char.name = newName

      // if we change typeChar we remove all char values
      if (char.type !== dto.type) {
        char.type = dto.type
        char.booleanValue = null
        char.dateValue = null
        char.enumValue = null
        char.jsonValue = null
        char.numberValue = null
        char.stringValue = null
      }
    })
    await this.characteristicValue.save(allCharacteristicsToUpdate)

    const { categoryId, ...otherFields } = dto;

    const relatedCategory = await this.categoryRepository.findOne(categoryId);
    new CustomValidation().notFound(
      'Категорію',
      'ID',
      categoryId,
      relatedCategory,
    );

    await this.characteristicsRepository.update(id, {
      category: relatedCategory,
      ...otherFields,
    });

    return this.characteristicsRepository.findOne(id, {
      relations: ['category', 'characteristicValue'],
    });
  }
}
