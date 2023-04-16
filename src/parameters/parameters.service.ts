import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParametersDto } from './dto/parameters.dto';
import { Parameters } from './parameters.entity';

@Injectable()
export class ParametersService {
  constructor(
    @InjectRepository(Parameters)
    private parametersRepository: Repository<Parameters>,
  ) {}

  public async createParameters(dto: ParametersDto): Promise<Parameters> {
    const { name } = dto;

    const isParametersName = await this.parametersRepository.findOne({
      where: { name },
    });

    if (isParametersName) {
      throw new HttpException(
        'Parameters with name already exist',
        HttpStatus.FOUND,
      );
    }

    return await this.parametersRepository.save(dto);
  }

  public async getParameters(): Promise<Parameters[]> {
    await this.parametersRepository.count();

    return await this.parametersRepository.find({ order: { id: 'ASC' } });
  }

  public async getParameter(name: string): Promise<any> {
    const parameters = await this.parametersRepository.findOne({
      name,
    });

    return parameters;
  }

  public async updateParameters(dto: ParametersDto): Promise<Parameters[]> {
    const { name, settings } = dto;
    const update = await this.parametersRepository.update(
      { name },
      { settings },
    );

    if (update.affected === 0) {
      throw new HttpException(
        'Parameters with this name not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.getParameters();
  }
}
