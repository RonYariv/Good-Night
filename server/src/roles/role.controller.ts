import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from './role.schema';
import { RoleService } from './role.service';
import { WinCondition } from '@myorg/shared';
import { CreateRoleDto } from './dto/createRole.dto';

@ApiTags('role')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() body: CreateRoleDto): Promise<Role> {
    return this.roleService.create(body);
  }

  @Get()
  async list(): Promise<Role[]> {
    return this.roleService.list();
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Role>): Promise<Role> {
    return this.roleService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ id: string }> {
    await this.roleService.delete(id);
    return { id };
  }
}
