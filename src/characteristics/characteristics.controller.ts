import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { CharacteristicsService } from './characteristics.service';
import { Characteristic } from './characteristics.entity';
import { CreateCharacteristicDto } from './dto/createCharacteristic.dto';
import { updateCharacteristicDto } from './dto/updateCharacteristic.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IDeleteMessage } from '../interfaces/delete-message.interface';
import { ForbiddenExceptionFilter } from '../utils/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import {AdminGuard} from "../auth/guards/admin.guard";
import {AuthorizedGuard} from "../auth/guards/authorized.guard";

@ApiTags('Characteristic')
@Controller('characteristics')
@UseInterceptors(LoggingInterceptor)
export class CharacteristicsController {
  constructor(private characteristicsService: CharacteristicsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async createCharacteristic(
    @Body() dto: CreateCharacteristicDto,
  ): Promise<Characteristic> {
    return this.characteristicsService.createCharacteristic(dto);
  }

  @Get('category/:key')
  async getCharacteristicInCategory(
    @Param('key') key: string,
  ): Promise<Characteristic[]> {
    return this.characteristicsService.getCharacteristicInCategory(key);
  }

  @Get()
  async getAllCharacteristic(): Promise<Characteristic[]> {
    return this.characteristicsService.getAllCharacteristic();
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async deleteCharacteristic(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IDeleteMessage> {
    return this.characteristicsService.deleteCharacteristic(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async updateCharacteristic(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: updateCharacteristicDto,
  ): Promise<Characteristic> {
    return this.characteristicsService.updateCharacteristic(id, dto);
  }
}
