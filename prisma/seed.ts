import 'dotenv/config'

console.log('DATABASE_URL:', process.env.DATABASE_URL)



import {  Role, ComponentCategory, MaterialType, LightSourceType, FilamentBrand, FilamentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });
async function main() {
  console.log('🌱 Avvio seed database...\n');

  // ─── PULIZIA ──────────────────────────────────────────────
  await cleanup();

  // ─── UTENTI ───────────────────────────────────────────────
  const users = await seedUsers();

  // ─── CATEGORIE ────────────────────────────────────────────
  const categories = await seedCategories();

  // ─── COMPONENTI 3D ────────────────────────────────────────
  const components = await seedComponents();

  // ─── PARTI ELETTRICHE ─────────────────────────────────────
  const electricalParts = await seedElectricalParts();

  // ─── FILAMENTI ────────────────────────────────────────────
  await seedFilaments();

  // ─── LAMPADE ──────────────────────────────────────────────
  const lamps = await seedLamps(categories, components, electricalParts);

  // ─── COUPON ───────────────────────────────────────────────
  await seedCoupons();

  // ─── CORRIERI ─────────────────────────────────────────────
  await seedShippingProviders();

  // ─── CONFIGURAZIONE DI ESEMPIO ────────────────────────────
  await seedSampleConfiguration(users.customer, lamps[0], components);

  console.log('\n✅ Seed completato!');
  console.log('─────────────────────────────────────────');
  console.log('👤 Admin:    admin@vespera.it / Admin123!');
  console.log('👤 Customer: mario@esempio.it / Mario123!');
  console.log('─────────────────────────────────────────');
}

// ─── CLEANUP ────────────────────────────────────────────────

async function cleanup() {
  console.log('🧹 Pulizia tabelle...');
  const tables = [
    'configuration_electrical_parts',
    'configuration_slots',
    'lamp_configurations',
    'order_items',
    'coupon_usages',
    'shipments',
    'payments',
    'orders',
    'cart_items',
    'wishlist_items',
    'reviews',
    'lamp_tags',
    'lamp_attributes',
    'lamp_variant_options',
    'lamp_variants',
    'lamp_media',
    'lamp_electrical_parts',
    'lamp_components',
    'component_compatibility',
    'component_colors',
    'components_3d',
    'electrical_parts',
    'filament_usage_logs',
    'filaments',
    'lamps',
    'categories',
    'coupons',
    'shipping_providers',
    'sessions',
    'addresses',
    'notifications',
    'tags',
    'attribute_keys',
    'variant_option_keys',
    'users',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`).catch(() => {});
  }
}

// ─── UTENTI ─────────────────────────────────────────────────

async function seedUsers() {
  console.log('👤 Creazione utenti...');

  const adminHash = await bcrypt.hash('Admin123!', 12);
  const customerHash = await bcrypt.hash('Mario123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@vespera.it',
      passwordHash: adminHash,
      firstName: 'Luca',
      lastName: 'Vespera',
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'mario@esempio.it',
      passwordHash: customerHash,
      firstName: 'Mario',
      lastName: 'Rossi',
      role: Role.CUSTOMER,
      isVerified: true,
      addresses: {
        create: [
          {
            type: 'SHIPPING',
            fullName: 'Mario Rossi',
            line1: 'Via Roma 42',
            city: 'Milano',
            province: 'MI',
            postalCode: '20121',
            country: 'IT',
            isDefault: true,
          },
          {
            type: 'BILLING',
            fullName: 'Mario Rossi',
            line1: 'Via Roma 42',
            city: 'Milano',
            province: 'MI',
            postalCode: '20121',
            country: 'IT',
            isDefault: true,
          },
        ],
      },
    },
  });

  console.log('   ✓ Admin e Customer creati');
  return { admin, customer };
}

// ─── CATEGORIE ──────────────────────────────────────────────

async function seedCategories() {
  console.log('📁 Creazione categorie...');

  const tavolo = await prisma.category.create({
    data: {
      name: 'Lampade da Tavolo',
      slug: 'lampade-da-tavolo',
      description: 'Lampade stampate in 3D per scrivania e comodino',
      sortOrder: 1,
      isActive: true,
    },
  });

  const soffitto = await prisma.category.create({
    data: {
      name: 'Lampade da Soffitto',
      slug: 'lampade-da-soffitto',
      description: 'Lampade a sospensione e plafoniere 3D',
      sortOrder: 2,
      isActive: true,
    },
  });

  const parete = await prisma.category.create({
    data: {
      name: 'Applique da Parete',
      slug: 'applique-da-parete',
      description: 'Lampade a muro stampate in 3D',
      sortOrder: 3,
      isActive: true,
    },
  });

  console.log('   ✓ 3 categorie create');
  return { tavolo, soffitto, parete };
}

// ─── COMPONENTI 3D ──────────────────────────────────────────

async function seedComponents() {
  console.log('🧩 Creazione componenti 3D...');

  const paralumeCono = await prisma.component3D.create({
    data: {
      name: 'Paralume Conico',
      slug: 'paralume-conico',
      description: 'Paralume a forma conica con texture esagonale, diffusione calda',
      category: ComponentCategory.SHADE,
      material: MaterialType.PLA,
      colorHex: '#F5F0E8',
      modelFileUrl: '/models/paralume-conico.glb',
      thumbnailUrl: '/thumbnails/paralume-conico.jpg',
      printTime: 4.5,
      filamentGrams: 120,
      unitCost: 18.00,
      isActive: true,
      sortOrder: 1,
      availableColors: {
        create: [
          { name: 'Bianco Latte', colorHex: '#F5F0E8', isDefault: true, priceModifier: 0 },
          { name: 'Nero Opaco', colorHex: '#1A1A1A', priceModifier: 0 },
          { name: 'Verde Salvia', colorHex: '#7D9B7A', priceModifier: 2 },
          { name: 'Terracotta', colorHex: '#C4713A', priceModifier: 2 },
          { name: 'Blu Navy', colorHex: '#1B3A5C', priceModifier: 2 },
        ],
      },
    },
  });

  const paralumeSfera = await prisma.component3D.create({
    data: {
      name: 'Paralume Sferico',
      slug: 'paralume-sferico',
      description: 'Paralume tondo con pattern a voronoi, effetto ombra decorativo',
      category: ComponentCategory.SHADE,
      material: MaterialType.PLA,
      colorHex: '#FFFFFF',
      modelFileUrl: '/models/paralume-sferico.glb',
      thumbnailUrl: '/thumbnails/paralume-sferico.jpg',
      printTime: 6.0,
      filamentGrams: 180,
      unitCost: 24.00,
      isActive: true,
      sortOrder: 2,
      availableColors: {
        create: [
          { name: 'Bianco Puro', colorHex: '#FFFFFF', isDefault: true, priceModifier: 0 },
          { name: 'Grigio Cemento', colorHex: '#9E9E9E', priceModifier: 0 },
          { name: 'Ambra', colorHex: '#FFBF00', priceModifier: 3 },
        ],
      },
    },
  });

  const baseRotonda = await prisma.component3D.create({
    data: {
      name: 'Base Rotonda Pesante',
      slug: 'base-rotonda-pesante',
      description: 'Base circolare con peso integrato per stabilità, foro passacavo',
      category: ComponentCategory.BASE,
      material: MaterialType.PETG,
      colorHex: '#2C2C2C',
      modelFileUrl: '/models/base-rotonda.glb',
      thumbnailUrl: '/thumbnails/base-rotonda.jpg',
      printTime: 3.0,
      filamentGrams: 200,
      unitCost: 14.00,
      isActive: true,
      sortOrder: 3,
      availableColors: {
        create: [
          { name: 'Antracite', colorHex: '#2C2C2C', isDefault: true, priceModifier: 0 },
          { name: 'Bianco', colorHex: '#F0F0F0', priceModifier: 0 },
          { name: 'Oro Spazzolato', colorHex: '#C9A84C', priceModifier: 5 },
        ],
      },
    },
  });

  const baseQuadrata = await prisma.component3D.create({
    data: {
      name: 'Base Quadrata Minimal',
      slug: 'base-quadrata-minimal',
      description: 'Base a profilo basso con design minimalista e fessure di ventilazione',
      category: ComponentCategory.BASE,
      material: MaterialType.PETG,
      colorHex: '#1A1A2E',
      modelFileUrl: '/models/base-quadrata.glb',
      thumbnailUrl: '/thumbnails/base-quadrata.jpg',
      printTime: 2.5,
      filamentGrams: 160,
      unitCost: 12.00,
      isActive: true,
      sortOrder: 4,
      availableColors: {
        create: [
          { name: 'Nero Notte', colorHex: '#1A1A2E', isDefault: true, priceModifier: 0 },
          { name: 'Bianco Artico', colorHex: '#F8F9FA', priceModifier: 0 },
        ],
      },
    },
  });

  const astaMedia = await prisma.component3D.create({
    data: {
      name: 'Asta Media 25cm',
      slug: 'asta-media-25cm',
      description: 'Asta verticale da 25cm con passacavo interno e raccordi filettati',
      category: ComponentCategory.STEM,
      material: MaterialType.PETG,
      colorHex: '#2C2C2C',
      modelFileUrl: '/models/asta-media.glb',
      thumbnailUrl: '/thumbnails/asta-media.jpg',
      printTime: 1.5,
      filamentGrams: 80,
      unitCost: 8.00,
      isActive: true,
      sortOrder: 5,
      availableColors: {
        create: [
          { name: 'Antracite', colorHex: '#2C2C2C', isDefault: true, priceModifier: 0 },
          { name: 'Bianco', colorHex: '#F0F0F0', priceModifier: 0 },
          { name: 'Ottone', colorHex: '#B5A642', priceModifier: 4 },
        ],
      },
    },
  });

  const astaAlta = await prisma.component3D.create({
    data: {
      name: 'Asta Alta 40cm',
      slug: 'asta-alta-40cm',
      description: 'Asta verticale da 40cm, ideale per lampade da terra o sospensione alta',
      category: ComponentCategory.STEM,
      material: MaterialType.PETG,
      colorHex: '#2C2C2C',
      modelFileUrl: '/models/asta-alta.glb',
      thumbnailUrl: '/thumbnails/asta-alta.jpg',
      printTime: 2.5,
      filamentGrams: 130,
      unitCost: 12.00,
      isActive: true,
      sortOrder: 6,
      availableColors: {
        create: [
          { name: 'Antracite', colorHex: '#2C2C2C', isDefault: true, priceModifier: 0 },
          { name: 'Bianco', colorHex: '#F0F0F0', priceModifier: 0 },
        ],
      },
    },
  });

  const giuntoAngolato = await prisma.component3D.create({
    data: {
      name: 'Giunto Angolato 45°',
      slug: 'giunto-angolato-45',
      description: 'Raccordo angolato a 45° per direzione del fascio luminoso',
      category: ComponentCategory.JOINT,
      material: MaterialType.PETG,
      colorHex: '#2C2C2C',
      modelFileUrl: '/models/giunto-45.glb',
      thumbnailUrl: '/thumbnails/giunto-45.jpg',
      printTime: 0.8,
      filamentGrams: 30,
      unitCost: 4.50,
      isActive: true,
      sortOrder: 7,
      availableColors: {
        create: [
          { name: 'Antracite', colorHex: '#2C2C2C', isDefault: true, priceModifier: 0 },
          { name: 'Bianco', colorHex: '#F0F0F0', priceModifier: 0 },
        ],
      },
    },
  });

  // ─── Compatibilità componenti ────────────────────────────
  const compatibilities = [
    { a: paralumeCono.id, b: baseRotonda.id },
    { a: paralumeCono.id, b: baseQuadrata.id },
    { a: paralumeCono.id, b: astaMedia.id },
    { a: paralumeCono.id, b: astaAlta.id },
    { a: paralumeSfera.id, b: baseRotonda.id },
    { a: paralumeSfera.id, b: astaMedia.id },
    { a: paralumeSfera.id, b: astaAlta.id },
    { a: baseRotonda.id, b: astaMedia.id },
    { a: baseRotonda.id, b: astaAlta.id },
    { a: baseQuadrata.id, b: astaMedia.id },
    { a: baseQuadrata.id, b: astaAlta.id },
    { a: astaMedia.id, b: giuntoAngolato.id },
    { a: astaAlta.id, b: giuntoAngolato.id },
  ];

  for (const { a, b } of compatibilities) {
    await prisma.componentCompatibility.create({
      data: { componentAId: a, componentBId: b },
    });
  }

  console.log('   ✓ 7 componenti 3D e compatibilità create');
  return { paralumeCono, paralumeSfera, baseRotonda, baseQuadrata, astaMedia, astaAlta, giuntoAngolato };
}

// ─── PARTI ELETTRICHE ────────────────────────────────────────

async function seedElectricalParts() {
  console.log('⚡ Creazione parti elettriche...');

  const ledE27 = await prisma.electricalPart.create({
    data: {
      name: 'Portalampada E27 con Cavo Tessile',
      slug: 'portalampada-e27-cavo-tessile',
      description: 'Portalampada E27 con 2m di cavo tessile intrecciato nero',
      sku: 'ELEC-E27-TESS-001',
      lightSourceType: LightSourceType.LED_BULB,
      voltage: 230,
      wattage: 60,
      cableLength: 2.0,
      hasSwitch: false,
      hasDimmer: false,
      unitCost: 12.00,
      stockQty: 150,
      isActive: true,
    },
  });

  const ledE27Dimmer = await prisma.electricalPart.create({
    data: {
      name: 'Portalampada E27 con Dimmer Inline',
      slug: 'portalampada-e27-dimmer',
      description: 'Portalampada E27 con dimmer rotativo integrato nel cavo',
      sku: 'ELEC-E27-DIM-001',
      lightSourceType: LightSourceType.LED_BULB,
      voltage: 230,
      wattage: 60,
      cableLength: 1.8,
      hasSwitch: true,
      hasDimmer: true,
      unitCost: 18.50,
      stockQty: 80,
      isActive: true,
    },
  });

  const ledStriscia = await prisma.electricalPart.create({
    data: {
      name: 'Striscia LED COB 50cm 2700K',
      slug: 'striscia-led-cob-50cm',
      description: 'Striscia LED COB da 50cm, luce calda 2700K, 12V DC',
      sku: 'ELEC-LED-COB-50',
      lightSourceType: LightSourceType.LED_STRIP,
      voltage: 12,
      wattage: 8,
      colorTemperature: 2700,
      lumens: 500,
      cri: 95,
      lifespan: 50000,
      cableLength: 0.5,
      hasSwitch: false,
      hasDimmer: false,
      unitCost: 9.00,
      stockQty: 200,
      isActive: true,
    },
  });

  const alimentatore = await prisma.electricalPart.create({
    data: {
      name: 'Alimentatore 12V 2A con Spina EU',
      slug: 'alimentatore-12v-2a',
      description: 'Alimentatore switching 12V 2A per strisce LED, spina europea',
      sku: 'ELEC-PWR-12V-2A',
      voltage: 12,
      wattage: 24,
      unitCost: 7.50,
      stockQty: 120,
      isActive: true,
    },
  });

  console.log('   ✓ 4 parti elettriche create');
  return { ledE27, ledE27Dimmer, ledStriscia, alimentatore };
}

// ─── FILAMENTI ───────────────────────────────────────────────

async function seedFilaments() {
  console.log('🧵 Creazione stock filamenti...');

  const filaments = [
    {
      name: 'PLA Bianco Latte 1.75mm',
      brand: FilamentBrand.PRUSAMENT,
      material: MaterialType.PLA,
      colorName: 'Bianco Latte',
      colorHex: '#F5F0E8',
      spoolWeightGrams: 1000,
      remainingGrams: 840,
      density: 1.24,
      printTempMin: 210,
      printTempMax: 230,
      bedTempMin: 60,
      bedTempMax: 60,
      purchasePrice: 24.99,
      isOpen: true,
      status: FilamentStatus.AVAILABLE,
      location: 'Scaffale A1',
    },
    {
      name: 'PLA Nero Opaco 1.75mm',
      brand: FilamentBrand.PRUSAMENT,
      material: MaterialType.PLA,
      colorName: 'Nero Opaco',
      colorHex: '#1A1A1A',
      spoolWeightGrams: 1000,
      remainingGrams: 1000,
      density: 1.24,
      printTempMin: 210,
      printTempMax: 230,
      bedTempMin: 60,
      bedTempMax: 60,
      purchasePrice: 24.99,
      isOpen: false,
      status: FilamentStatus.AVAILABLE,
      location: 'Scaffale A1',
    },
    {
      name: 'PETG Antracite 1.75mm',
      brand: FilamentBrand.ESUN,
      material: MaterialType.PETG,
      colorName: 'Antracite',
      colorHex: '#2C2C2C',
      spoolWeightGrams: 1000,
      remainingGrams: 620,
      density: 1.27,
      printTempMin: 230,
      printTempMax: 250,
      bedTempMin: 75,
      bedTempMax: 85,
      purchasePrice: 22.50,
      isOpen: true,
      status: FilamentStatus.AVAILABLE,
      location: 'Scaffale A2',
    },
    {
      name: 'PLA Verde Salvia 1.75mm',
      brand: FilamentBrand.BAMBU,
      material: MaterialType.PLA,
      colorName: 'Verde Salvia',
      colorHex: '#7D9B7A',
      spoolWeightGrams: 1000,
      remainingGrams: 150,
      density: 1.24,
      printTempMin: 220,
      printTempMax: 240,
      bedTempMin: 35,
      bedTempMax: 45,
      purchasePrice: 27.99,
      isOpen: true,
      status: FilamentStatus.LOW_STOCK,
      location: 'Scaffale B1',
    },
    {
      name: 'PETG Bianco 1.75mm',
      brand: FilamentBrand.POLYMAKER,
      material: MaterialType.PETG,
      colorName: 'Bianco',
      colorHex: '#F0F0F0',
      spoolWeightGrams: 1000,
      remainingGrams: 1000,
      density: 1.27,
      printTempMin: 230,
      printTempMax: 250,
      bedTempMin: 75,
      bedTempMax: 85,
      purchasePrice: 23.99,
      isOpen: false,
      status: FilamentStatus.AVAILABLE,
      location: 'Scaffale A2',
    },
  ];

  for (const f of filaments) {
    await prisma.filament.create({ data: f });
  }

  console.log(`   ✓ ${filaments.length} filamenti creati`);
}

// ─── LAMPADE ─────────────────────────────────────────────────

async function seedLamps(categories: any, components: any, electricalParts: any) {
  console.log('💡 Creazione lampade...');

  // Tag comuni
  const tags = ['industrial', 'minimal', 'moderno', 'artigianale', 'personalizzabile', 'eco'];
  for (const t of tags) {
    await prisma.tag.upsert({
      where: { slug: t },
      update: {},
      create: { name: t.charAt(0).toUpperCase() + t.slice(1), slug: t },
    });
  }

  // Chiave attributo
  const styleKey = await prisma.attributeKey.create({ data: { name: 'Stile' } });
  const finishKey = await prisma.attributeKey.create({ data: { name: 'Finitura' } });

  // Chiave variante
  const colorKey = await prisma.variantOptionKey.create({ data: { name: 'Colore' } });
  const sizeKey = await prisma.variantOptionKey.create({ data: { name: 'Dimensione' } });

  // ── Lampada 1: Vespera Classic ──────────────────────────
  const vesperaClassic = await prisma.lamp.create({
    data: {
      name: 'Vespera Classic',
      slug: 'vespera-classic',
      shortDescription: 'Lampada da tavolo iconica con paralume conico e base rotonda',
      description: `La Vespera Classic è la nostra lampada da tavolo più amata. 
Stampata interamente in PLA riciclabile, combina il paralume conico con texture esagonale 
e la base rotonda pesante per una stabilità perfetta. Disponibile in 5 colorazioni 
e completamente configurabile nel nostro editor 3D.`,
      categoryId: categories.tavolo.id,
      basePrice: 89.00,
      sku: 'VES-CLS-001',
      isActive: true,
      isFeatured: true,
      isConfigurable: true,
      weight: 0.9,
      metaTitle: 'Vespera Classic — Lampada da Tavolo 3D | Vespera',
      metaDescription: 'Lampada da tavolo stampata in 3D, paralume conico personalizzabile.',
      media: {
        create: [
          { url: '/media/vespera-classic-1.jpg', altText: 'Vespera Classic bianca', isPrimary: true, sortOrder: 0 },
          { url: '/media/vespera-classic-2.jpg', altText: 'Vespera Classic nera', isPrimary: false, sortOrder: 1 },
          { url: '/media/vespera-classic-3d.glb', altText: 'Modello 3D', type: 'model3d', isPrimary: false, sortOrder: 2 },
        ],
      },
      variants: {
        create: [
          {
            name: 'Bianco Latte / Standard',
            sku: 'VES-CLS-001-BL',
            price: 89.00,
            comparePrice: 99.00,
            stockQty: 25,
            variantOptions: {
              create: [
                { value: 'Bianco Latte', variantOptionKey: { connect: { id: colorKey.id } } },
                { value: 'Standard', variantOptionKey: { connect: { id: sizeKey.id } } },
              ],
            },
          },
          {
            name: 'Nero Opaco / Standard',
            sku: 'VES-CLS-001-NO',
            price: 89.00,
            stockQty: 18,
            variantOptions: {
              create: [
                { value: 'Nero Opaco', variantOptionKey: { connect: { id: colorKey.id } } },
                { value: 'Standard', variantOptionKey: { connect: { id: sizeKey.id } } },
              ],
            },
          },
          {
            name: 'Verde Salvia / Standard',
            sku: 'VES-CLS-001-VS',
            price: 94.00,
            stockQty: 10,
            variantOptions: {
              create: [
                { value: 'Verde Salvia', variantOptionKey: { connect: { id: colorKey.id } } },
                { value: 'Standard', variantOptionKey: { connect: { id: sizeKey.id } } },
              ],
            },
          },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { slug: 'minimal' } } },
          { tag: { connect: { slug: 'personalizzabile' } } },
          { tag: { connect: { slug: 'artigianale' } } },
        ],
      },
      attributes: {
        create: [
          { value: 'Minimal Nordico', attributeKey: { connect: { id: styleKey.id } } },
          { value: 'Opaco', attributeKey: { connect: { id: finishKey.id } } },
        ],
      },
    },
  });

  // Collegamento componenti alla lampada
  await prisma.lampComponent.create({
    data: { lampId: vesperaClassic.id, componentId: components.paralumeCono.id, quantity: 1, isOptional: false, isSwappable: true, sortOrder: 0, positionLabel: 'Paralume' },
  });
  await prisma.lampComponent.create({
    data: { lampId: vesperaClassic.id, componentId: components.baseRotonda.id, quantity: 1, isOptional: false, isSwappable: true, sortOrder: 1, positionLabel: 'Base' },
  });
  await prisma.lampComponent.create({
    data: { lampId: vesperaClassic.id, componentId: components.astaMedia.id, quantity: 1, isOptional: false, isSwappable: true, sortOrder: 2, positionLabel: 'Asta' },
  });

  // Parti elettriche
  await prisma.lampElectricalPart.create({
    data: { lampId: vesperaClassic.id, partId: electricalParts.ledE27.id, quantity: 1, isOptional: false, isSwappable: true },
  });

  // ── Lampada 2: Vespera Sfera ────────────────────────────
  const vesperaSfera = await prisma.lamp.create({
    data: {
      name: 'Vespera Sfera',
      slug: 'vespera-sfera',
      shortDescription: 'Paralume sferico con pattern voronoi per effetti luce spettacolari',
      description: `Vespera Sfera trasforma la luce in arte. Il suo paralume sferico con 
pattern a voronoi crea suggestivi giochi d'ombra su soffitti e pareti. 
Disponibile con dimmer integrato per regolare l'atmosfera.`,
      categoryId: categories.tavolo.id,
      basePrice: 105.00,
      sku: 'VES-SFR-001',
      isActive: true,
      isFeatured: true,
      isConfigurable: true,
      weight: 1.1,
      media: {
        create: [
          { url: '/media/vespera-sfera-1.jpg', altText: 'Vespera Sfera bianca', isPrimary: true, sortOrder: 0 },
          { url: '/media/vespera-sfera-3d.glb', altText: 'Modello 3D', type: 'model3d', isPrimary: false, sortOrder: 1 },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { slug: 'moderno' } } },
          { tag: { connect: { slug: 'personalizzabile' } } },
        ],
      },
    },
  });

  await prisma.lampComponent.create({
    data: { lampId: vesperaSfera.id, componentId: components.paralumeSfera.id, quantity: 1, isOptional: false, isSwappable: true, sortOrder: 0, positionLabel: 'Paralume' },
  });
  await prisma.lampComponent.create({
    data: { lampId: vesperaSfera.id, componentId: components.baseRotonda.id, quantity: 1, isOptional: false, isSwappable: true, sortOrder: 1, positionLabel: 'Base' },
  });
  await prisma.lampComponent.create({
    data: { lampId: vesperaSfera.id, componentId: components.astaAlta.id, quantity: 1, isOptional: false, isSwappable: true, sortOrder: 2, positionLabel: 'Asta' },
  });
  await prisma.lampElectricalPart.create({
    data: { lampId: vesperaSfera.id, partId: electricalParts.ledE27Dimmer.id, quantity: 1, isSwappable: true },
  });

  // ── Lampada 3: Vespera Industrial ───────────────────────
  const vesperaIndustrial = await prisma.lamp.create({
    data: {
      name: 'Vespera Industrial',
      slug: 'vespera-industrial',
      shortDescription: 'Stile industriale con asta alta e base quadrata in PETG nero',
      description: `Design industriale senza compromessi. Asta alta 40cm in PETG resistente, 
base quadrata minimal e paralume conico direzionabile. Perfetta per scrivania da lavoro 
o studio creativo.`,
      categoryId: categories.tavolo.id,
      basePrice: 119.00,
      sku: 'VES-IND-001',
      isActive: true,
      isFeatured: false,
      isConfigurable: true,
      weight: 1.3,
      media: {
        create: [
          { url: '/media/vespera-industrial-1.jpg', altText: 'Vespera Industrial nera', isPrimary: true, sortOrder: 0 },
        ],
      },
      tags: {
        create: [
          { tag: { connect: { slug: 'industrial' } } },
          { tag: { connect: { slug: 'artigianale' } } },
        ],
      },
    },
  });

  await prisma.lampComponent.create({
    data: { lampId: vesperaIndustrial.id, componentId: components.paralumeCono.id, quantity: 1, isOptional: false, isSwappable: true, sortOrder: 0, positionLabel: 'Paralume' },
  });
  await prisma.lampComponent.create({
    data: { lampId: vesperaIndustrial.id, componentId: components.baseQuadrata.id, quantity: 1, isOptional: false, isSwappable: true, sortOrder: 1, positionLabel: 'Base' },
  });
  await prisma.lampComponent.create({
    data: { lampId: vesperaIndustrial.id, componentId: components.astaAlta.id, quantity: 1, isOptional: false, isSwappable: true, sortOrder: 2, positionLabel: 'Asta' },
  });
  await prisma.lampComponent.create({
    data: { lampId: vesperaIndustrial.id, componentId: components.giuntoAngolato.id, quantity: 1, isOptional: true, isSwappable: false, sortOrder: 3, positionLabel: 'Giunto' },
  });
  await prisma.lampElectricalPart.create({
    data: { lampId: vesperaIndustrial.id, partId: electricalParts.ledE27.id, quantity: 1, isSwappable: true },
  });

  // ── Review di esempio ───────────────────────────────────
  const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  if (customer) {
    await prisma.review.create({
      data: {
        lampId: vesperaClassic.id,
        userId: customer.id,
        rating: 5,
        title: 'Lampada bellissima!',
        body: 'Qualità eccellente, la stampa è perfetta e la luce è calda e avvolgente. Consiglio!',
        isVerified: true,
        isApproved: true,
      },
    });
  }

  console.log('   ✓ 3 lampade create con varianti, componenti e recensioni');
  return [vesperaClassic, vesperaSfera, vesperaIndustrial];
}

// ─── COUPON ─────────────────────────────────────────────────

async function seedCoupons() {
  console.log('🎟️  Creazione coupon...');

  await prisma.coupon.createMany({
    data: [
      {
        code: 'BENVENUTO10',
        description: '10% di sconto per i nuovi clienti',
        discountPercent: 10,
        minOrderAmount: 50,
        maxUses: 500,
        isActive: true,
        expiresAt: new Date('2026-12-31'),
      },
      {
        code: 'ESTATE20',
        description: '€20 di sconto sugli ordini superiori a €150',
        discountFixed: 20,
        minOrderAmount: 150,
        maxUses: 100,
        isActive: true,
        expiresAt: new Date('2026-09-30'),
      },
      {
        code: 'SPEDIZIONEGRATIS',
        description: 'Spedizione gratuita (sconto fisso €9.90)',
        discountFixed: 9.90,
        minOrderAmount: 0,
        isActive: true,
      },
    ],
  });

  console.log('   ✓ 3 coupon creati');
}

// ─── CORRIERI ────────────────────────────────────────────────

async function seedShippingProviders() {
  console.log('🚚 Creazione corrieri...');

  await prisma.shippingProvider.createMany({
    data: [
      { name: 'GLS Italy', code: 'GLS', isActive: true },
      { name: 'BRT - Bartolini', code: 'BRT', isActive: true },
      { name: 'DHL Express', code: 'DHL', isActive: true },
      { name: 'Poste Italiane', code: 'SDA', isActive: true },
    ],
  });

  console.log('   ✓ 4 corrieri creati');
}

// ─── CONFIGURAZIONE DI ESEMPIO ───────────────────────────────

async function seedSampleConfiguration(customer: any, lamp: any, components: any) {
  console.log('⚙️  Creazione configurazione di esempio...');

  await prisma.lampConfiguration.create({
    data: {
      userId: customer.id,
      lampId: lamp.id,
      name: 'La mia Vespera Verde',
      status: 'SAVED',
      totalPrice: 131.00, // 89 base + 18 paralume + 14 base + 8 asta + 12 elec - prezzi unitari
      screenshotUrl: '/screenshots/config-verde.jpg',
      notes: 'Colori nordici per la scrivania del salotto',
      slots: {
        create: [
          {
            componentId: components.paralumeCono.id,
            colorHex: '#7D9B7A',
            colorName: 'Verde Salvia',
            quantity: 1,
            slotLabel: 'Paralume',
            unitPrice: 18.00,
            sortOrder: 0,
          },
          {
            componentId: components.baseRotonda.id,
            colorHex: '#F0F0F0',
            colorName: 'Bianco',
            quantity: 1,
            slotLabel: 'Base',
            unitPrice: 14.00,
            sortOrder: 1,
          },
          {
            componentId: components.astaMedia.id,
            colorHex: '#F0F0F0',
            colorName: 'Bianco',
            quantity: 1,
            slotLabel: 'Asta',
            unitPrice: 8.00,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  console.log('   ✓ Configurazione di esempio creata');
}

// ─── ESEGUI ──────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('❌ Errore nel seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });