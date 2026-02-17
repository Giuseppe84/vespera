import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/lamp.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true, parentId: null }, // solo categorie radice
      include: {
        children: {
          where: { isActive: true },
          include: { _count: { select: { lamps: true } } },
        },
        _count: { select: { lamps: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true } },
        parent: true,
        _count: { select: { lamps: true } },
      },
    });
    if (!category) throw new NotFoundException(`Categoria "${slug}" non trovata`);
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug già in uso');

    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria non trovata');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoria non trovata');
    return this.prisma.category.delete({ where: { id } });
  }
}
