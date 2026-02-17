import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Slot DTO (un componente 3D nella configurazione) ────────

export class ConfigurationSlotDto {
  @ApiProperty({ example: 'cuid-del-componente' })
  @IsString()
  componentId: string;

  @ApiPropertyOptional({ example: '#1A1A2E' })
  @IsOptional()
  @IsString()
  colorHex?: string;

  @ApiPropertyOptional({ example: 'Nero Opaco' })
  @IsOptional()
  @IsString()
  colorName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ example: 'Paralume' })
  @IsOptional()
  @IsString()
  slotLabel?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;
}

// ─── Electrical Part DTO (parte elettrica nella configurazione)

export class ConfigurationElecPartDto {
  @ApiProperty({ example: 'cuid-della-parte' })
  @IsString()
  partId: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number;
}

// ─── Create Configuration ────────────────────────────────────

export class CreateConfigurationDto {
  @ApiProperty({ example: 'cuid-della-lampada-base' })
  @IsString()
  lampId: string;

  @ApiPropertyOptional({ example: 'La mia lampada industriale' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Note personalizzate...' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [ConfigurationSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigurationSlotDto)
  slots: ConfigurationSlotDto[];

  @ApiPropertyOptional({ type: [ConfigurationElecPartDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigurationElecPartDto)
  electricalParts?: ConfigurationElecPartDto[];
}

// ─── Update Configuration ────────────────────────────────────

export class UpdateConfigurationDto {
  @ApiPropertyOptional({ example: 'Lampada Nordica V2' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Note aggiornate...' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [ConfigurationSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigurationSlotDto)
  slots?: ConfigurationSlotDto[];

  @ApiPropertyOptional({ type: [ConfigurationElecPartDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigurationElecPartDto)
  electricalParts?: ConfigurationElecPartDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  screenshotUrl?: string;
}

// ─── Update Slot (modifica singolo componente) ───────────────

export class UpdateSlotDto {
  @ApiPropertyOptional({ example: '#FF5733' })
  @IsOptional()
  @IsString()
  colorHex?: string;

  @ApiPropertyOptional({ example: 'Rosso Fuoco' })
  @IsOptional()
  @IsString()
  colorName?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number;
}

// ─── Price Preview Request ───────────────────────────────────

export class PricePreviewDto {
  @ApiProperty({ example: 'cuid-della-lampada' })
  @IsString()
  lampId: string;

  @ApiProperty({ type: [ConfigurationSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigurationSlotDto)
  slots: ConfigurationSlotDto[];

  @ApiPropertyOptional({ type: [ConfigurationElecPartDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigurationElecPartDto)
  electricalParts?: ConfigurationElecPartDto[];
}
