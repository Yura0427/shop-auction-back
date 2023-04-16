import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './role.entity';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { RoleService } from './role.service';
import { IDeleteMessage } from '../../interfaces/delete-message.interface';
import {AuthorizedGuard} from "../../auth/guards/authorized.guard";

@ApiBearerAuth()
@UseGuards(AuthorizedGuard, AdminGuard)
@Controller('roles')
export class RoleController {
  constructor(
    private readonly roleService: RoleService
  ) {}

  @Get()
  public async all(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get(':id')
  public async findOne(@Param('id') id: number): Promise<Role> {
    return this.roleService.findById(id);
  }

  @Post(':id')
  public update(@Param('id') id: number, @Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.roleService.updateRoleById(id, createRoleDto);
  }
 
  @Delete(':id')
  public delete(@Param('id') id: number): Promise<IDeleteMessage> {
    return this.roleService.deleteById(id);
  }
}
