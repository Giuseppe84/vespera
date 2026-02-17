import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart-order.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // ─── Leggi carrello ──────────────────────────────────────

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        lamp: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            media: { where: { isPrimary: true }, take: 1 },
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            price: true,
            stockQty: true,
            variantOptions: { include: { variantOptionKey: true } },
          },
        },
        configuration: {
          select: {
            id: true,
            name: true,
            totalPrice: true,
            screenshotUrl: true,
            slots: {
              include: { component: { select: { name: true, thumbnailUrl: true } } },
              orderBy: { sortOrder: 'asc' },
              take: 3,
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    return {
      items,
      summary: {
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: Number(subtotal.toFixed(2)),
      },
    };
  }

  // ─── Aggiungi al carrello ────────────────────────────────

  async addItem(userId: string, dto: AddToCartDto) {
    // Recupera il prezzo corretto
    let unitPrice: number;

    if (dto.configurationId) {
      // Prezzo da configurazione
      const config = await this.prisma.lampConfiguration.findUnique({
        where: { id: dto.configurationId },
        select: { totalPrice: true, userId: true },
      });
      if (!config) throw new NotFoundException('Configurazione non trovata');
      if (config.userId !== userId) {
        throw new BadRequestException('Configurazione non appartiene a questo utente');
      }
      unitPrice = Number(config.totalPrice);
    } else if (dto.variantId) {
      // Prezzo da variante
      const variant = await this.prisma.lampVariant.findUnique({
        where: { id: dto.variantId },
        select: { price: true, stockQty: true, isActive: true },
      });
      if (!variant || !variant.isActive) {
        throw new NotFoundException('Variante non disponibile');
      }
      if (variant.stockQty < 1) {
        throw new BadRequestException('Variante esaurita');
      }
      unitPrice = Number(variant.price);
    } else {
      // Prezzo base lampada
      const lamp = await this.prisma.lamp.findUnique({
        where: { id: dto.lampId },
        select: { basePrice: true, isActive: true },
      });
      if (!lamp || !lamp.isActive) {
        throw new NotFoundException('Lampada non disponibile');
      }
      unitPrice = Number(lamp.basePrice);
    }

    // Upsert: se esiste aggiorna la quantità, altrimenti crea
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        userId,
        lampId: dto.lampId,
        variantId: dto.variantId ?? null,
        configurationId: dto.configurationId ?? null,
      },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (dto.quantity || 1) },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        lampId: dto.lampId,
        variantId: dto.variantId,
        configurationId: dto.configurationId,
        quantity: dto.quantity || 1,
        unitPrice,
      },
    });
  }

  // ─── Aggiorna quantità ───────────────────────────────────

  async updateItem(itemId: string, userId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new NotFoundException('Articolo non trovato nel carrello');

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
  }

  // ─── Rimuovi articolo ────────────────────────────────────

  async removeItem(itemId: string, userId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new NotFoundException('Articolo non trovato nel carrello');

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  // ─── Svuota carrello ─────────────────────────────────────

  async clearCart(userId: string) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }

  // ─── Conta articoli (per badge header) ───────────────────

  async getCount(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.cartItem.aggregate({
      where: { userId },
      _sum: { quantity: true },
    });
    return { count: result._sum.quantity || 0 };
  }
}
