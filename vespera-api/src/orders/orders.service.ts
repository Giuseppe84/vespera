import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  AddShipmentDto,
  OrderQueryDto,
} from './dto/cart-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ─── Crea ordine dal carrello ────────────────────────────

  async createFromCart(userId: string, dto: CreateOrderDto) {
    // Carica il carrello
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        lamp: true,
        variant: true,
        configuration: true,
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Il carrello è vuoto');
    }

    // Verifica indirizzi
    const [shippingAddress, billingAddress] = await Promise.all([
      this.prisma.address.findFirst({
        where: { id: dto.shippingAddressId, userId },
      }),
      this.prisma.address.findFirst({
        where: { id: dto.billingAddressId, userId },
      }),
    ]);

    if (!shippingAddress) throw new NotFoundException('Indirizzo di spedizione non trovato');
    if (!billingAddress) throw new NotFoundException('Indirizzo di fatturazione non trovato');

    // Calcola subtotale
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    // Gestisci coupon
    let discountAmount = 0;
    let coupon = null;
    if (dto.couponCode) {
      coupon = await this.prisma.coupon.findFirst({
        where: {
          code: dto.couponCode,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
        },
      });

      if (!coupon) throw new BadRequestException('Coupon non valido o scaduto');

      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        throw new BadRequestException(
          `Ordine minimo per questo coupon: €${coupon.minOrderAmount}`,
        );
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new BadRequestException('Coupon esaurito');
      }

      if (coupon.discountPercent) {
        discountAmount = (subtotal * coupon.discountPercent) / 100;
      } else if (coupon.discountFixed) {
        discountAmount = Math.min(Number(coupon.discountFixed), subtotal);
      }
    }

    // Calcola spedizione (logica semplificata)
    const shippingCost = subtotal >= 100 ? 0 : 9.9;

    // IVA 22%
    const taxableAmount = subtotal - discountAmount + shippingCost;
    const taxAmount = taxableAmount * 0.22;
    const totalAmount = taxableAmount + taxAmount;

    // Genera numero ordine
    const orderNumber = await this.generateOrderNumber();

    // Crea ordine in transazione
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddressId: dto.shippingAddressId,
          billingAddressId: dto.billingAddressId,
          subtotal,
          shippingCost,
          taxAmount: Number(taxAmount.toFixed(2)),
          discountAmount: Number(discountAmount.toFixed(2)),
          totalAmount: Number(totalAmount.toFixed(2)),
          notes: dto.notes,
          items: {
            create: cartItems.map((item) => ({
              lampId: item.lampId,
              variantId: item.variantId,
              configurationId: item.configurationId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: Number(item.unitPrice) * item.quantity,
              lampSnapshot: {
                name: item.lamp.name,
                sku: item.lamp.sku,
                variantName: item.variant?.name,
                configurationName: item.configuration?.name,
              },
            })),
          },
        },
        include: this.orderInclude(),
      });

      // Collega coupon se usato
      if (coupon) {
        await tx.couponUsage.create({
          data: { couponId: coupon.id, orderId: newOrder.id },
        });
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Svuota carrello
      await tx.cartItem.deleteMany({ where: { userId } });

      // Segna le configurazioni come ordinate
      const configIds = cartItems
        .filter((i) => i.configurationId)
        .map((i) => i.configurationId!);

      if (configIds.length > 0) {
        await tx.lampConfiguration.updateMany({
          where: { id: { in: configIds } },
          data: { status: 'ORDERED' },
        });
      }

      return newOrder;
    });

    return order;
  }

  // ─── Lista ordini utente ─────────────────────────────────

  async findAllByUser(userId: string, query: OrderQueryDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              lamp: {
                select: {
                  name: true,
                  slug: true,
                  media: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          shipments: { include: { provider: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Dettaglio ordine utente ─────────────────────────────

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude(),
    });

    if (!order) throw new NotFoundException('Ordine non trovato');
    if (order.userId !== userId) throw new ForbiddenException('Accesso negato');

    return order;
  }

  // ─── Lista ordini admin ──────────────────────────────────

  async findAllAdmin(query: OrderQueryDto) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { select: { quantity: true, totalPrice: true } },
          payment: { select: { status: true, method: true } },
          shipments: { include: { provider: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Aggiorna stato ordine (admin) ───────────────────────

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Ordine non trovato');

    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status as any,
        ...(dto.status === 'DELIVERED' && { deliveredAt: new Date() }),
      },
    });
  }

  // ─── Aggiungi spedizione (admin) ─────────────────────────

  async addShipment(orderId: string, dto: AddShipmentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Ordine non trovato');

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        providerId: dto.providerId,
        trackingNumber: dto.trackingNumber,
        trackingUrl: dto.trackingUrl,
        shippedAt: new Date(),
      },
      include: { provider: true },
    });

    // Aggiorna stato ordine a SHIPPED
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
    });

    return shipment;
  }

  // ─── Cancella ordine (utente, solo se PENDING) ───────────

  async cancel(id: string, userId: string) {
    const order = await this.findOne(id, userId);

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException(
        'Non puoi cancellare un ordine già in lavorazione',
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // ─── Dashboard stats (admin) ─────────────────────────────

  async getStats() {
    const [
      totalOrders,
      pendingOrders,
      totalRevenue,
      todayOrders,
    ] = await this.prisma.$transaction([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.aggregate({
        where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      todayOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0).toFixed(2),
    };
  }

  // ─── Helpers ─────────────────────────────────────────────

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `VES-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.order.count();
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }

  private orderInclude() {
    return {
      items: {
        include: {
          lamp: {
            select: {
              id: true,
              name: true,
              slug: true,
              media: { where: { isPrimary: true }, take: 1 },
            },
          },
          variant: true,
          configuration: {
            select: { id: true, name: true, screenshotUrl: true },
          },
        },
      },
      shippingAddress: true,
      billingAddress: true,
      payment: true,
      shipments: { include: { provider: true } },
      couponUsages: { include: { coupon: true } },
    };
  }
}
