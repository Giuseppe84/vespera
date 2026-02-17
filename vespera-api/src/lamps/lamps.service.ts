import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLampDto,
  UpdateLampDto,
  LampQueryDto,
  CreateVariantDto,
  UpdateVariantDto,
  AddMediaDto,
} from './dto/lamp.dto';

@Injectable()
export class LampsService {
  constructor(private prisma: PrismaService) {}

  // ─── LAMPS ───────────────────────────────────────────────

  async findAll(query: LampQueryDto) {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      priceMin,
      priceMax,
      isFeatured,
      isConfigurable,
      sortBy,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isConfigurable !== undefined) where.isConfigurable = isConfigurable;

    if (priceMin !== undefined || priceMax !== undefined) {
      where.basePrice = {};
      if (priceMin !== undefined) where.basePrice.gte = priceMin;
      if (priceMax !== undefined) where.basePrice.lte = priceMax;
    }

    // Ordinamento
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { basePrice: 'asc' };
    if (sortBy === 'price_desc') orderBy = { basePrice: 'desc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

    const [lamps, total] = await this.prisma.$transaction([
      this.prisma.lamp.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          media: {
            where: { isPrimary: true },
            take: 1,
          },
          variants: {
            where: { isActive: true },
            select: { id: true, name: true, price: true, stockQty: true },
          },
          tags: { include: { tag: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.lamp.count({ where }),
    ]);

    return {
      data: lamps,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(slug: string) {
    const lamp = await this.prisma.lamp.findUnique({
      where: { slug },
      include: {
        category: true,
        media: { orderBy: { sortOrder: 'asc' } },
        variants: {
          where: { isActive: true },
          include: { variantOptions: { include: { variantOptionKey: true } } },
        },
        tags: { include: { tag: true } },
        attributes: { include: { attributeKey: true } },
        components: {
          include: {
            component: {
              include: { availableColors: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        electricalParts: { include: { part: true } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        _count: { select: { reviews: true, wishlistItems: true } },
      },
    });

    if (!lamp) throw new NotFoundException(`Lampada "${slug}" non trovata`);
    return lamp;
  }

  async findById(id: string) {
    const lamp = await this.prisma.lamp.findUnique({ where: { id } });
    if (!lamp) throw new NotFoundException('Lampada non trovata');
    return lamp;
  }

  async create(dto: CreateLampDto) {
    const existing = await this.prisma.lamp.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug già in uso');

    const existingSku = await this.prisma.lamp.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) throw new ConflictException('SKU già in uso');

    const { tags, ...lampData } = dto;

    return this.prisma.lamp.create({
      data: {
        ...lampData,
        basePrice: lampData.basePrice,
        ...(tags && {
          tags: {
            create: tags.map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
                  create: {
                    name: tagName,
                    slug: tagName.toLowerCase().replace(/\s+/g, '-'),
                  },
                },
              },
            })),
          },
        }),
      },
      include: { category: true, tags: { include: { tag: true } } },
    });
  }

  async update(id: string, dto: UpdateLampDto) {
    await this.findById(id);

    const { tags, ...lampData } = dto;

    return this.prisma.lamp.update({
      where: { id },
      data: {
        ...lampData,
        ...(tags && {
          tags: {
            deleteMany: {},
            create: tags.map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
                  create: {
                    name: tagName,
                    slug: tagName.toLowerCase().replace(/\s+/g, '-'),
                  },
                },
              },
            })),
          },
        }),
      },
      include: { category: true, tags: { include: { tag: true } } },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.lamp.delete({ where: { id } });
  }

  // ─── VARIANTS ────────────────────────────────────────────

  async createVariant(lampId: string, dto: CreateVariantDto) {
    await this.findById(lampId);

    const existing = await this.prisma.lampVariant.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) throw new ConflictException('SKU variante già in uso');

    const { options, ...variantData } = dto;

    return this.prisma.lampVariant.create({
      data: {
        ...variantData,
        lampId,
        ...(options && {
          variantOptions: {
            create: options.map((opt) => ({
              value: opt.value,
              variantOptionKey: {
                connectOrCreate: {
                  where: { name: opt.key },
                  create: { name: opt.key },
                },
              },
            })),
          },
        }),
      },
      include: { variantOptions: { include: { variantOptionKey: true } } },
    });
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto) {
    const variant = await this.prisma.lampVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Variante non trovata');

    return this.prisma.lampVariant.update({
      where: { id: variantId },
      data: dto,
    });
  }

  async removeVariant(variantId: string) {
    const variant = await this.prisma.lampVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Variante non trovata');
    return this.prisma.lampVariant.delete({ where: { id: variantId } });
  }

  // ─── MEDIA ───────────────────────────────────────────────

  async addMedia(lampId: string, dto: AddMediaDto) {
    await this.findById(lampId);

    // Se isPrimary, rimuovi il primary dagli altri
    if (dto.isPrimary) {
      await this.prisma.lampMedia.updateMany({
        where: { lampId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.lampMedia.create({
      data: { ...dto, lampId },
    });
  }

  async removeMedia(mediaId: string) {
    const media = await this.prisma.lampMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) throw new NotFoundException('Media non trovato');
    return this.prisma.lampMedia.delete({ where: { id: mediaId } });
  }

  // ─── FEATURED & RELATED ──────────────────────────────────

  async findFeatured(limit = 8) {
    return this.prisma.lamp.findMany({
      where: { isActive: true, isFeatured: true },
      take: limit,
      include: {
        media: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
      },
    });
  }

  async findRelated(lampId: string, limit = 4) {
    const lamp = await this.findById(lampId);

    return this.prisma.lamp.findMany({
      where: {
        isActive: true,
        categoryId: lamp.categoryId,
        id: { not: lampId },
      },
      take: limit,
      include: {
        media: { where: { isPrimary: true }, take: 1 },
      },
    });
  }
}
