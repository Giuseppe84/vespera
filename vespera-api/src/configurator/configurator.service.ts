import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateConfigurationDto,
  UpdateConfigurationDto,
  UpdateSlotDto,
  PricePreviewDto,
} from './dto/configurator.dto';

@Injectable()
export class ConfiguratorService {
  constructor(private prisma: PrismaService) {}

  // ─── Calcolo prezzo ──────────────────────────────────────
  // Usato sia per preview che per salvare il totale

  async calculatePrice(
    lampId: string,
    slots: { componentId: string; quantity?: number }[],
    electricalParts?: { partId: string; quantity?: number }[],
  ): Promise<{
    basePrice: number;
    componentsTotal: number;
    electricalTotal: number;
    total: number;
    breakdown: any[];
  }> {
    // Prezzo base lampada
    const lamp = await this.prisma.lamp.findUnique({
      where: { id: lampId },
      select: { basePrice: true, name: true },
    });
    if (!lamp) throw new NotFoundException('Lampada non trovata');

    const basePrice = Number(lamp.basePrice);
    const breakdown: any[] = [];

    // Calcola costo componenti 3D
    let componentsTotal = 0;
    for (const slot of slots) {
      const component = await this.prisma.component3D.findUnique({
        where: { id: slot.componentId },
        select: { id: true, name: true, unitCost: true },
      });
      if (!component) {
        throw new BadRequestException(
          `Componente "${slot.componentId}" non trovato`,
        );
      }
      const qty = slot.quantity || 1;
      const lineTotal = Number(component.unitCost) * qty;
      componentsTotal += lineTotal;
      breakdown.push({
        type: 'component',
        id: component.id,
        name: component.name,
        unitCost: Number(component.unitCost),
        quantity: qty,
        lineTotal,
      });
    }

    // Calcola costo parti elettriche
    let electricalTotal = 0;
    for (const ep of electricalParts || []) {
      const part = await this.prisma.electricalPart.findUnique({
        where: { id: ep.partId },
        select: { id: true, name: true, unitCost: true },
      });
      if (!part) {
        throw new BadRequestException(`Parte elettrica "${ep.partId}" non trovata`);
      }
      const qty = ep.quantity || 1;
      const lineTotal = Number(part.unitCost) * qty;
      electricalTotal += lineTotal;
      breakdown.push({
        type: 'electrical',
        id: part.id,
        name: part.name,
        unitCost: Number(part.unitCost),
        quantity: qty,
        lineTotal,
      });
    }

    return {
      basePrice,
      componentsTotal,
      electricalTotal,
      total: basePrice + componentsTotal + electricalTotal,
      breakdown,
    };
  }

  // ─── Verifica compatibilità componenti ───────────────────

  async checkCompatibility(componentIds: string[]): Promise<{
    isCompatible: boolean;
    conflicts: { componentA: string; componentB: string }[];
  }> {
    if (componentIds.length < 2) return { isCompatible: true, conflicts: [] };

    const conflicts: { componentA: string; componentB: string }[] = [];

    // Per ogni coppia verifica che esista una relazione di compatibilità
    for (let i = 0; i < componentIds.length; i++) {
      for (let j = i + 1; j < componentIds.length; j++) {
        const compatible = await this.prisma.componentCompatibility.findFirst({
          where: {
            OR: [
              { componentAId: componentIds[i], componentBId: componentIds[j] },
              { componentAId: componentIds[j], componentBId: componentIds[i] },
            ],
          },
        });

        if (!compatible) {
          conflicts.push({
            componentA: componentIds[i],
            componentB: componentIds[j],
          });
        }
      }
    }

    return { isCompatible: conflicts.length === 0, conflicts };
  }

  // ─── Preview prezzo (senza salvare) ──────────────────────

  async previewPrice(dto: PricePreviewDto) {
    return this.calculatePrice(dto.lampId, dto.slots, dto.electricalParts);
  }

  // ─── Crea configurazione ─────────────────────────────────

  async create(userId: string, dto: CreateConfigurationDto) {
    // Verifica che la lampada esista e sia configurabile
    const lamp = await this.prisma.lamp.findUnique({
      where: { id: dto.lampId },
      select: { id: true, isConfigurable: true, name: true },
    });
    if (!lamp) throw new NotFoundException('Lampada non trovata');
    if (!lamp.isConfigurable) {
      throw new BadRequestException('Questa lampada non supporta la configurazione');
    }

    // Calcola il prezzo totale
    const pricing = await this.calculatePrice(
      dto.lampId,
      dto.slots,
      dto.electricalParts,
    );

    // Recupera i prezzi unitari per ogni slot
    const slotsWithPrices = await Promise.all(
      dto.slots.map(async (slot) => {
        const component = await this.prisma.component3D.findUnique({
          where: { id: slot.componentId },
          select: { unitCost: true },
        });
        return { ...slot, unitPrice: Number(component!.unitCost) };
      }),
    );

    const elecPartsWithPrices = await Promise.all(
      (dto.electricalParts || []).map(async (ep) => {
        const part = await this.prisma.electricalPart.findUnique({
          where: { id: ep.partId },
          select: { unitCost: true },
        });
        return { ...ep, unitPrice: Number(part!.unitCost) };
      }),
    );

    return this.prisma.lampConfiguration.create({
      data: {
        userId,
        lampId: dto.lampId,
        name: dto.name || `La mia ${lamp.name}`,
        notes: dto.notes,
        totalPrice: pricing.total,
        status: 'DRAFT',
        slots: {
          create: slotsWithPrices.map((slot, index) => ({
            componentId: slot.componentId,
            colorHex: slot.colorHex,
            colorName: slot.colorName,
            quantity: slot.quantity || 1,
            slotLabel: slot.slotLabel,
            sortOrder: slot.sortOrder ?? index,
            unitPrice: slot.unitPrice,
          })),
        },
        electricalParts: {
          create: elecPartsWithPrices.map((ep) => ({
            partId: ep.partId,
            quantity: ep.quantity || 1,
            unitPrice: ep.unitPrice,
          })),
        },
      },
      include: this.configurationInclude(),
    });
  }

  // ─── Lista configurazioni utente ─────────────────────────

  async findAllByUser(userId: string) {
    return this.prisma.lampConfiguration.findMany({
      where: { userId, status: { not: 'ARCHIVED' } },
      include: {
        lamp: {
          select: {
            id: true,
            name: true,
            slug: true,
            media: { where: { isPrimary: true }, take: 1 },
          },
        },
        slots: {
          include: { component: { select: { id: true, name: true, thumbnailUrl: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { slots: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ─── Dettaglio configurazione ────────────────────────────

  async findOne(id: string, userId: string) {
    const config = await this.prisma.lampConfiguration.findUnique({
      where: { id },
      include: this.configurationInclude(),
    });

    if (!config) throw new NotFoundException('Configurazione non trovata');
    if (config.userId !== userId) throw new ForbiddenException('Accesso negato');

    return config;
  }

  // ─── Aggiorna configurazione ─────────────────────────────

  async update(id: string, userId: string, dto: UpdateConfigurationDto) {
    const config = await this.findOne(id, userId);

    if (config.status === 'ORDERED') {
      throw new BadRequestException('Non puoi modificare una configurazione già ordinata');
    }

    // Ricalcola prezzo se cambiano gli slot
    let totalPrice = Number(config.totalPrice);

    if (dto.slots) {
      const pricing = await this.calculatePrice(
        config.lampId,
        dto.slots,
        dto.electricalParts,
      );
      totalPrice = pricing.total;
    }

    const slotsWithPrices = dto.slots
      ? await Promise.all(
          dto.slots.map(async (slot) => {
            const component = await this.prisma.component3D.findUnique({
              where: { id: slot.componentId },
              select: { unitCost: true },
            });
            return { ...slot, unitPrice: Number(component!.unitCost) };
          }),
        )
      : undefined;

    const elecPartsWithPrices = dto.electricalParts
      ? await Promise.all(
          dto.electricalParts.map(async (ep) => {
            const part = await this.prisma.electricalPart.findUnique({
              where: { id: ep.partId },
              select: { unitCost: true },
            });
            return { ...ep, unitPrice: Number(part!.unitCost) };
          }),
        )
      : undefined;

    return this.prisma.lampConfiguration.update({
      where: { id },
      data: {
        name: dto.name,
        notes: dto.notes,
        screenshotUrl: dto.screenshotUrl,
        totalPrice,
        status: 'SAVED',
        ...(slotsWithPrices && {
          slots: {
            deleteMany: {},
            create: slotsWithPrices.map((slot, index) => ({
              componentId: slot.componentId,
              colorHex: slot.colorHex,
              colorName: slot.colorName,
              quantity: slot.quantity || 1,
              slotLabel: slot.slotLabel,
              sortOrder: slot.sortOrder ?? index,
              unitPrice: slot.unitPrice,
            })),
          },
        }),
        ...(elecPartsWithPrices && {
          electricalParts: {
            deleteMany: {},
            create: elecPartsWithPrices.map((ep) => ({
              partId: ep.partId,
              quantity: ep.quantity || 1,
              unitPrice: ep.unitPrice,
            })),
          },
        }),
      },
      include: this.configurationInclude(),
    });
  }

  // ─── Aggiorna singolo slot ───────────────────────────────

  async updateSlot(slotId: string, userId: string, dto: UpdateSlotDto) {
    const slot = await this.prisma.configurationSlot.findUnique({
      where: { id: slotId },
      include: { configuration: true },
    });

    if (!slot) throw new NotFoundException('Slot non trovato');
    if (slot.configuration.userId !== userId) throw new ForbiddenException('Accesso negato');

    return this.prisma.configurationSlot.update({
      where: { id: slotId },
      data: dto,
    });
  }

  // ─── Duplica configurazione ──────────────────────────────

  async duplicate(id: string, userId: string) {
    const config = await this.findOne(id, userId);

    return this.prisma.lampConfiguration.create({
      data: {
        userId,
        lampId: config.lampId,
        name: `${config.name} (copia)`,
        notes: config.notes,
        totalPrice: config.totalPrice,
        status: 'DRAFT',
        slots: {
          create: config.slots.map((slot) => ({
            componentId: slot.componentId,
            colorHex: slot.colorHex,
            colorName: slot.colorName,
            quantity: slot.quantity,
            slotLabel: slot.slotLabel,
            sortOrder: slot.sortOrder,
            unitPrice: slot.unitPrice,
          })),
        },
        electricalParts: {
          create: config.electricalParts.map((ep) => ({
            partId: ep.partId,
            quantity: ep.quantity,
            unitPrice: ep.unitPrice,
          })),
        },
      },
      include: this.configurationInclude(),
    });
  }

  // ─── Archivia configurazione ─────────────────────────────

  async archive(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.lampConfiguration.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  // ─── Componenti disponibili per una lampada ───────────────

  async getAvailableComponents(lampId: string) {
    const lamp = await this.prisma.lamp.findUnique({
      where: { id: lampId },
      include: {
        components: {
          include: {
            component: {
              include: {
                availableColors: true,
                compatibilityAsA: {
                  include: { componentB: { select: { id: true, name: true } } },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        electricalParts: {
          include: { part: true },
        },
      },
    });

    if (!lamp) throw new NotFoundException('Lampada non trovata');

    return {
      components: lamp.components,
      electricalParts: lamp.electricalParts,
    };
  }

  // ─── Include helper ──────────────────────────────────────

  private configurationInclude() {
    return {
      lamp: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          media: { where: { isPrimary: true }, take: 1 },
        },
      },
      slots: {
        include: {
          component: {
            include: { availableColors: true },
          },
        },
        orderBy: { sortOrder: 'asc' as const },
      },
      electricalParts: {
        include: { part: true },
      },
    };
  }
}
