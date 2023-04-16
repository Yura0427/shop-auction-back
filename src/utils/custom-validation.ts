import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult';

import { Product } from '../product/product.entity';
import { Category } from '../category/category.entity';
import { Characteristic } from '../characteristics/characteristics.entity';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';
import { CreateCharacteristicDto } from '../characteristics/dto/createCharacteristic.dto';
import { updateCharacteristicDto } from '../characteristics/dto/updateCharacteristic.dto';
import { CharacteristicGroup } from '../characteristic-group/characteristic-group.entity';
import { ReqType } from '../characteristics/characteristics.enum';
import { Comment } from 'src/comments/comments.entity';
import { Feedback } from 'src/feedbacks/feedbacks.entity';
import { User } from 'src/user/user.entity';
import { Order } from 'src/orders/orders.entity';
import { ProductToOrder } from 'src/product-to-order/product-to-order.entity';

export class CustomValidation {
  notFound(
    entityName: string,
    fieldName: string,
    fieldValue: string | number,
    searchResult:
      | Product
      | Category
      | Characteristic
      | CharacteristicValue
      | Comment
      | Feedback
      | User
      | Order
      | ProductToOrder,
    deleteResult?: DeleteResult,
  ): HttpException | void {
    if (
      (!searchResult && !deleteResult) ||
      (!searchResult && !deleteResult.affected)
    ) {
      throw new NotFoundException(
        `${entityName} з ${fieldName}: ${fieldValue} не знайдено`,
      );
    }
  }

  isOrderExists(
    entityName: string,
    fieldName: string,
    fieldValue: string | number,
    searchResult: Order,
  ): HttpException | void {
    if (searchResult) {
      throw new BadRequestException(
        `${entityName} з ${fieldName}: ${fieldValue} має замовлення`,
      );
    }
  }

  multipleNotFound(
    searchResult:
      | CharacteristicGroup[]
      | Characteristic[]
      | Product[]
      | CharacteristicValue[],
    searchIDs: number[],
    entityName: string,
  ): HttpException | void {
    const notFoundIds = [...searchIDs];

    for (let i = 0; i < searchResult.length; i++) {
      notFoundIds.splice(notFoundIds.indexOf(searchResult[i].id), 1);
    }

    if (notFoundIds.length) {
      throw new NotFoundException(
        `${entityName} з ID: ${notFoundIds} не вдалося знайти`,
      );
    }
  }

  characteristicMinMaxChecker(
    DTOs: CreateCharacteristicDto[] | updateCharacteristicDto[],
  ): void {
    for (const dto of DTOs) {
      if (dto.type !== 'range') continue;
      const { maxValue, minValue } = dto;

      if (maxValue === minValue)
        throw new BadRequestException(
          `Мінімальне ${minValue} і максимальне значення ${maxValue} не повинно співпадати`,
        );

      if (maxValue < minValue)
        throw new BadRequestException(
          `Максимальне значення ${maxValue} повинно бути більше ніж мінімальне ${minValue}`,
        );
    }
  }

  characteristicValuesDTOChecker(
    dtoLength: number,
    reqType: ReqType,
  ): HttpException | void {
    switch (reqType) {
      case ReqType.CREATE:
        if (dtoLength <= 1) {
          throw new BadRequestException(
            'В тілі запиту не знайдено жодного значення характеристики',
          );
        }

        if (dtoLength > 2) {
          throw new BadRequestException(
            'Характеристика може мати тільки одне значення',
          );
        }
        break;
      case ReqType.UPDATE:
        if (dtoLength <= 2) {
          throw new BadRequestException(
            'В тілі запиту не знайдено жодного значення характеристики',
          );
        }

        if (dtoLength > 3) {
          throw new BadRequestException(
            'Характеристика може мати тільки одне значення',
          );
        }
        break;
    }
  }

  characteristicRangeChecker(min: number, max: number, value: number): void {
    if (value < min || value > max && value !== 0) {
      throw new BadRequestException(
        `Значення ${value} повинно бути в діапазоні: ${min} - ${max}`,
      );
    }
  }

  unathorized(
    action: string,
    entity: Comment,
    userId: number,
  ): HttpException | void {
    if (entity.author && entity.author.id !== userId) {
      throw new UnauthorizedException(
        `Недостатньо прав для ${action} ${entity.id}`,
      );
    }
  }

  isExists(
    entityName: string,
    fieldName: string,
    fieldValue: string | number,
    searchResult: User | Category,
  ): HttpException | void {
    if (searchResult instanceof User && searchResult.status === 'confirmed') {
      throw new HttpException(
        `${entityName} з ${fieldName}: ${fieldValue} вже існує`,
        409,
      );
    }

    if (searchResult) {
      throw new HttpException(
        `${entityName} з ${fieldName}: ${fieldValue} вже існує`,
        409,
      );
    }
  }

  noAccess(currentUserId: boolean, role?: string): HttpException | void {
    if (!currentUserId && role !== 'admin') {
      throw new ForbiddenException(`Користувач не має доступу!`);
    }
  }

  socialUnauthorized(socialKey: string): HttpException | void {
    if (!socialKey) {
      throw new UnauthorizedException(`Сталася помилка авторизації!`);
    }
  }

  userUnauthorized(id: number): HttpException | void {
    if (!id) {
      throw new UnauthorizedException(`Користувача з ID: ${id} не знайдено! `);
    }
  }

  emailNotConfirmed(status: string): HttpException | void {
    if (status !== 'confirmed') {
      throw new HttpException(
        `Спочатку вам потрібно підтвердити поточну пошту`,
        401,
      );
    }
  }

  noVerifyAccount(status: string): HttpException | void {
    if (status !== 'confirmed') {
      throw new HttpException(
        `Реєстрацію не підтверджено, спробуйте ще раз!`,
        409,
      );
    }
  }

  noExistConfirmToken(): HttpException | void {
    throw new HttpException(`Код не співпадає`, 409);
  }

  passwordMismatch(
    password: string,
    confirmedPassword: string,
  ): HttpException | void {
    if (password !== confirmedPassword) {
      throw new BadRequestException(`Пароль не співпадає`);
    }
  }

  imageTitleNotMatchCategory(name: string): HttpException {
    throw new BadRequestException(
      `Назва файлу ${name} не відповідає жодній категорії`,
    );
  }

  productsInCategoryExists(categoryName: string): HttpException {
    throw new BadRequestException(
      `Категорія: "${categoryName}" містить продукти`,
    );
  }
}

export function enumValidationMessage(args: ValidationArguments): string {
  return `${args.value} у полі ${
    args.property
  } повинно мати одне із валідних значень: ${Object.values(
    args.constraints[0],
  )}`;
}
