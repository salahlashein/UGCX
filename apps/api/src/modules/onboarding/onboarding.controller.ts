import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { OnboardingService } from './onboarding.service';
import { OnboardingInsightsQueryDto } from './dto/onboarding-insights-query.dto';

/** First sign-up onboarding for the web app. Every route acts on the signed-in user only. */
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  async status(@CurrentUser() user: AuthUser) {
    return { data: await this.onboardingService.getStatus(user.userId) };
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async complete(@CurrentUser() user: AuthUser) {
    return { data: await this.onboardingService.complete(user.userId) };
  }

  @Get('insights')
  async insights(@Query() query: OnboardingInsightsQueryDto) {
    return { data: await this.onboardingService.getInsights(query.city) };
  }
}
