import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConfiguratorService } from '../../../files/configurator.service';
import {
  CreateConfigurationDto,
  UpdateConfigurationDto,
  UpdateSlotDto,
  PricePreviewDto,
} from './dto/configurator.dto';
import { CurrentUser, Public } from '../auth/decorators/auth.decorators';

@ApiTags('configurator')
@ApiBearerAuth('access-token')
@Controller('configurator')
export class ConfiguratorController {
  constructor(private configuratorService: ConfiguratorService) {}

  // GET /api/v1/configurator/lamps/:lampId/components
  @Public()
  @Get('lamps/:lampId/components')
  @ApiOperation({ summary: 'Componenti disponibili per configurare una lampada' })
  @ApiParam({ name: 'lampId', example: 'cuid-della-lampada' })
  getAvailableComponents(@Param('lampId') lampId: string) {
    return this.configuratorService.getAvailableComponents(lampId);
  }

  // POST /api/v1/configurator/preview
  @Public()
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcola il prezzo di una configurazione senza salvarla' })
  previewPrice(@Body() dto: PricePreviewDto) {
    return this.configuratorService.previewPrice(dto);
  }

  // POST /api/v1/configurator/compatibility
  @Public()
  @Post('compatibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica compatibilità tra componenti' })
  checkCompatibility(@Body() body: { componentIds: string[] }) {
    return this.configuratorService.checkCompatibility(body.componentIds);
  }

  // GET /api/v1/configurator/my
  @Get('my')
  @ApiOperation({ summary: 'Lista configurazioni salvate dell\'utente' })
  findAll(@CurrentUser('id') userId: string) {
    return this.configuratorService.findAllByUser(userId);
  }

  // GET /api/v1/configurator/:id
  @Get(':id')
  @ApiOperation({ summary: 'Dettaglio di una configurazione' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.configuratorService.findOne(id, userId);
  }

  // POST /api/v1/configurator
  @Post()
  @ApiOperation({ summary: 'Salva una nuova configurazione lampada' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConfigurationDto,
  ) {
    return this.configuratorService.create(userId, dto);
  }

  // PATCH /api/v1/configurator/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Aggiorna una configurazione esistente' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateConfigurationDto,
  ) {
    return this.configuratorService.update(id, userId, dto);
  }

  // PATCH /api/v1/configurator/slots/:slotId
  @Patch('slots/:slotId')
  @ApiOperation({ summary: 'Aggiorna un singolo componente nella configurazione' })
  updateSlot(
    @Param('slotId') slotId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.configuratorService.updateSlot(slotId, userId, dto);
  }

  // POST /api/v1/configurator/:id/duplicate
  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplica una configurazione' })
  duplicate(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.configuratorService.duplicate(id, userId);
  }

  // DELETE /api/v1/configurator/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archivia una configurazione' })
  archive(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.configuratorService.archive(id, userId);
  }
}
