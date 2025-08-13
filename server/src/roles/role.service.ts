import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './role.schema';
import { randomUUID } from 'crypto';
import { WinCondition } from '@myorg/shared';

@Injectable()
export class RoleService {
  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}

  async create(data: { name: string; winCondition: WinCondition; nightOrder: number }): Promise<Role> {
    const role = new this.roleModel({ id: randomUUID(), ...data });
    return role.save();
  }

  async list(): Promise<Role[]> {
    return this.roleModel.find().sort({ nightOrder: 1 }).exec();
  }

  async update(id: string, changes: Partial<Role>): Promise<Role> {
    const updated = await this.roleModel.findOneAndUpdate({ id }, changes, { new: true }).exec();
    if (!updated) throw new NotFoundException('role not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const res = await this.roleModel.deleteOne({ id }).exec();
    if (res.deletedCount === 0) throw new NotFoundException('role not found');
  }
}
