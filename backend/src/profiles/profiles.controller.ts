import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateCameraSettingsDto } from './dto/update-camera-settings.dto';
import { UpdateScanSettingsDto } from './dto/update-scan-settings.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @ApiOkResponse({ type: ProfileResponseDto })
  getMyProfile(@CurrentUser() user: AuthenticatedUser): Promise<ProfileResponseDto> {
    return this.profilesService.getOrCreateForUser(user.id);
  }

  @Patch('me/scan-settings')
  @ApiOkResponse({ type: ProfileResponseDto })
  updateMyScanSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateScanSettingsDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateScanSettings(user.id, dto);
  }

  @Patch('me/camera-settings')
  @ApiOkResponse({ type: ProfileResponseDto })
  updateMyCameraSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCameraSettingsDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateCameraSettings(user.id, dto);
  }
}
