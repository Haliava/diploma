import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  BatchDeleteScanRecordsDto,
  BatchDeleteScanRecordsResponseDto,
} from './dto/batch-delete-scan-records.dto';
import { CreateScanRecordDto } from './dto/create-scan-record.dto';
import { ListScanRecordsQueryDto } from './dto/list-scan-records-query.dto';
import {
  PaginatedScanRecordsResponseDto,
  ScanRecordResponseDto,
} from './dto/scan-record-response.dto';
import { UpdateScanRecordDto } from './dto/update-scan-record.dto';
import { ScanHistoryService } from './scan-history.service';

@ApiTags('scan-history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scan-history')
export class ScanHistoryController {
  constructor(private readonly scanHistoryService: ScanHistoryService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedScanRecordsResponseDto })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListScanRecordsQueryDto,
  ): Promise<PaginatedScanRecordsResponseDto> {
    return this.scanHistoryService.findAll(user.id, query);
  }

  @Post()
  @ApiOkResponse({ type: ScanRecordResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScanRecordDto,
  ): Promise<ScanRecordResponseDto> {
    return this.scanHistoryService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: ScanRecordResponseDto })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ScanRecordResponseDto> {
    return this.scanHistoryService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ScanRecordResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateScanRecordDto,
  ): Promise<ScanRecordResponseDto> {
    return this.scanHistoryService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.scanHistoryService.remove(user.id, id);
  }

  @Post('batch-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BatchDeleteScanRecordsResponseDto })
  deleteBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BatchDeleteScanRecordsDto,
  ): Promise<BatchDeleteScanRecordsResponseDto> {
    return this.scanHistoryService.deleteBatch(user.id, dto);
  }
}
