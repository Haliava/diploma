import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { ScanStatsResponseDto } from './dto/scan-stats-response.dto';
import { WebhookStatsResponseDto } from './dto/webhook-stats-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('scan-stats')
  @ApiOkResponse({ type: ScanStatsResponseDto })
  getScanStats(
    @Query() query: DashboardQueryDto,
  ): Promise<ScanStatsResponseDto> {
    return this.dashboardService.getScanStats(query);
  }

  @Get('webhook-stats')
  @ApiOkResponse({ type: WebhookStatsResponseDto })
  getWebhookStats(
    @Query() query: DashboardQueryDto,
  ): Promise<WebhookStatsResponseDto> {
    return this.dashboardService.getWebhookStats(query);
  }
}
