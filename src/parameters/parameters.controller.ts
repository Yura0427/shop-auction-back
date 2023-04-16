import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ParametersDto } from './dto/parameters.dto';
import { Parameters } from './parameters.entity';
import { ParametersService } from './parameters.service';
import { ForbiddenExceptionFilter } from '../utils/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';

@ApiTags('Parameters')
@Controller('parameters')
@UseInterceptors(LoggingInterceptor)
export class ParametersController {
  constructor(private readonly parametersService: ParametersService) {}

  @Post()
  @ApiCreatedResponse({ type: Parameters })
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  public createParameters(@Body() dto: ParametersDto): Promise<Parameters> {
    return this.parametersService.createParameters(dto);
  }

  @Get()
  @ApiCreatedResponse({ type: Parameters })
  public getParameters(): Promise<Parameters[]> {
    return this.parametersService.getParameters();
  }

  @Get(':name')
  @ApiCreatedResponse({ type: Parameters })
  public getParametersByName(@Param('name') name: string): Promise<Parameters> {
    return this.parametersService.getParameter(name);
  }

  @Put()
  @ApiCreatedResponse({ type: Parameters })
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  public updateParameter(@Body() dto: ParametersDto): Promise<Parameters[]> {
    return this.parametersService.updateParameters(dto);
  }
}
