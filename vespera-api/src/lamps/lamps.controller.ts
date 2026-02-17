import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LampsService } from './lamps.service';
import {
  CreateLampDto,
  UpdateLampDto,
  LampQueryDto,
  CreateVariantDto,
  UpdateVariantDto,
  AddMediaDto,
} from './dto/lamp.dto';
import { Public, Roles } from '../auth/decorators/auth.decorators';

@ApiTags('lamps')
@Controller('lamps')
export class LampsController {
  constructor(private lampsService: LampsService) {}

  // ─── LAMPS ───────────────────────────────────────────────

  // GET /api/v1/lamps
  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista lampade con filtri e paginazione' })
  findAll(@Query() query: LampQueryDto) {
    return this.lampsService.findAll(query);
  }

  // GET /api/v1/lamps/featured
  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Lampade in evidenza' })
  findFeatured() {
    return this.lampsService.findFeatured();
  }

  // GET /api/v1/lamps/:slug
  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Dettaglio lampada per slug' })
  @ApiParam({ name: 'slug', example: 'lampada-vespera-x1' })
  findOne(@Param('slug') slug: string) {
    return this.lampsService.findOne(slug);
  }

  // GET /api/v1/lamps/:id/related
  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Lampade correlate' })
  findRelated(@Param('id') id: string) {
    return this.lampsService.findRelated(id);
  }

  // POST /api/v1/lamps
  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Crea una nuova lampada' })
  create(@Body() dto: CreateLampDto) {
    return this.lampsService.create(dto);
  }

  // PATCH /api/v1/lamps/:id
  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Aggiorna una lampada' })
  update(@Param('id') id: string, @Body() dto: UpdateLampDto) {
    return this.lampsService.update(id, dto);
  }

  // DELETE /api/v1/lamps/:id
  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Elimina una lampada' })
  remove(@Param('id') id: string) {
    return this.lampsService.remove(id);
  }

  // ─── VARIANTS ────────────────────────────────────────────

  // POST /api/v1/lamps/:id/variants
  @Post(':id/variants')
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Aggiungi variante a lampada' })
  createVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.lampsService.createVariant(id, dto);
  }

  // PATCH /api/v1/lamps/variants/:variantId
  @Patch('variants/:variantId')
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Aggiorna variante' })
  updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.lampsService.updateVariant(variantId, dto);
  }

  // DELETE /api/v1/lamps/variants/:variantId
  @Delete('variants/:variantId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Elimina variante' })
  removeVariant(@Param('variantId') variantId: string) {
    return this.lampsService.removeVariant(variantId);
  }

  // ─── MEDIA ───────────────────────────────────────────────

  // POST /api/v1/lamps/:id/media
  @Post(':id/media')
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Aggiungi media a lampada' })
  addMedia(@Param('id') id: string, @Body() dto: AddMediaDto) {
    return this.lampsService.addMedia(id, dto);
  }

  // DELETE /api/v1/lamps/media/:mediaId
  @Delete('media/:mediaId')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Elimina media' })
  removeMedia(@Param('mediaId') mediaId: string) {
    return this.lampsService.removeMedia(mediaId);
  }
}
