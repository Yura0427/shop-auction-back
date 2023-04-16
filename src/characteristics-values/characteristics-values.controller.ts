import {
  Body,
  Controller,
  Delete,
  Get,
  Query,
  Patch,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { CharacteristicsValuesService } from './characteristics-values.service';
import { CharacteristicValue } from './characteristics-values.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateCharacteristicValueDto } from './dto/createCharacteristicValue.dto';
import { UpdateCharacteristicValueDto } from './dto/updateCharacteristicValue.dto';
import { DeleteCharacteristicValueDto } from './dto/deleteCharacteristicValue.dto';
import { IDeleteMessage } from '../interfaces/delete-message.interface';
import { ForbiddenExceptionFilter } from '../utils/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import {
  characteristicValuesByNameQeq,
  characteristicValuesByNameRes,
} from './dto/characteristicValuesByNemeDto.dto';

@ApiTags('Characteristic Values')
@Controller('characteristics-values')
@UseInterceptors(LoggingInterceptor)
export class CharacteristicsValuesController {
  constructor(
    private characteristicsValuesService: CharacteristicsValuesService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async createCharacteristicValue(
    @Body() dto: CreateCharacteristicValueDto,
  ): Promise<CharacteristicValue[]> {
    return this.characteristicsValuesService.createCharacteristicValue(dto);
  }

  @Patch()
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async updateCharacteristicValues(
    @Body() dto: UpdateCharacteristicValueDto,
  ): Promise<CharacteristicValue[]> {
    return this.characteristicsValuesService.updateCharacteristicVale(dto);
  }

  @Delete()
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async deleteCharacteristicValue(
    @Body() dto: DeleteCharacteristicValueDto,
  ): Promise<IDeleteMessage> {
    return this.characteristicsValuesService.deleteCharacteristicValue(dto);
  }

  @Get()
  async getCharacteristicValuesByNeme(
    @Query() query: characteristicValuesByNameQeq,
  ): Promise<characteristicValuesByNameRes[]> {
    return this.characteristicsValuesService.getCharacteristicValuesByNeme(
      query,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  @Get('/filtered-sizes')
  async getProductsSizes() {
    return await this.characteristicsValuesService.getProductsSizes();
  }
}
