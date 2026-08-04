import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../railway-store/railway-store.types';
import { AdminService } from './admin.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { CoachStatusQueryDto } from './dto/coach-status-query.dto';
import { CreateCoachAdminDto } from './dto/create-coach-admin.dto';
import { CreateTrainAdminDto } from './dto/create-train-admin.dto';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { UpdateCoachAmenitiesDto } from './dto/update-coach-amenities.dto';
import { UpdateTrainAdminDto } from './dto/update-train-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics/overview')
  getOverview(@Query() query: AnalyticsQueryDto) {
    return this.adminService.getOverview(query.period ?? 'weekly');
  }

  @Get('trains/:trainNo/coaches/status')
  getCoachStatus(
    @Param('trainNo') trainNo: string,
    @Query() query: CoachStatusQueryDto,
  ) {
    return this.adminService.getCoachStatus(trainNo, query.journeyDate);
  }

  @Get('users/admins')
  getAdmins() {
    return this.adminService.getAdmins();
  }

  @Post('users/admins')
  promoteToAdmin(@Body() body: PromoteAdminDto) {
    return this.adminService.promoteToAdmin(body.email);
  }

  @Delete('users/admins/:userId')
  removeAdmin(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.removeAdmin(userId, user);
  }

  @Post('trains')
  createTrain(@Body() body: CreateTrainAdminDto) {
    return this.adminService.createTrain(body);
  }

  @Patch('trains/:trainNo')
  updateTrain(
    @Param('trainNo') trainNo: string,
    @Body() body: UpdateTrainAdminDto,
  ) {
    return this.adminService.updateTrain(trainNo, body);
  }

  @Delete('trains/:trainNo')
  removeTrain(@Param('trainNo') trainNo: string) {
    return this.adminService.removeTrain(trainNo);
  }

  @Post('coaches')
  createCoach(@Body() body: CreateCoachAdminDto) {
    return this.adminService.createCoach(body);
  }

  @Patch('trains/:trainNo/coaches/:coachCode/amenities')
  updateCoachAmenities(
    @Param('trainNo') trainNo: string,
    @Param('coachCode') coachCode: string,
    @Body() body: UpdateCoachAmenitiesDto,
  ) {
    return this.adminService.updateCoachAmenities(trainNo, coachCode, body);
  }

  @Delete('trains/:trainNo/coaches/:coachCode')
  removeCoach(
    @Param('trainNo') trainNo: string,
    @Param('coachCode') coachCode: string,
  ) {
    return this.adminService.removeCoach(trainNo, coachCode);
  }
}
