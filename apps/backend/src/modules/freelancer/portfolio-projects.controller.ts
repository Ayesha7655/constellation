import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { API_ERROR_CODES, ORG } from '@constellation/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { ImportPortfolioProjectDto } from './dto/import-portfolio-project.dto';
import { PortfolioProjectsService } from './portfolio-projects.service';

@ApiLocaleBearerController('organizations')
@Controller('organizations/me')
@UseGuards(JwtAuthGuard)
export class PortfolioProjectsController {
  constructor(private readonly portfolioProjectsService: PortfolioProjectsService) {}

  @Post('portfolio-projects/import')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Import or update a scraped Upwork portfolio project',
    ok: {
      schema: {
        example: {
          project: { id: '…', title: 'Viral Shorts Agent with N8N', externalId: '1928…' },
          created: true,
        },
      },
    },
    validation: true,
    badRequest: { codes: [API_ERROR_CODES.PORTFOLIO_PROJECT_IMPORT_INVALID] },
    notFound: {
      codes: [
        API_ERROR_CODES.PORTFOLIO_PROJECT_PROFILE_REQUIRED,
        API_ERROR_CODES.FREELANCER_PROFILE_ORG_REQUIRED,
      ],
    },
  })
  importProject(@Req() request: LocaleAwareRequest, @Body() dto: ImportPortfolioProjectDto) {
    return this.portfolioProjectsService.importProject(request.user?.sub, dto);
  }

  @Get('freelancer-profiles/:profileId/portfolio-projects')
  @RequirePermissions(ORG.FREELANCER_PROFILE_READ)
  @ApiJwtProtectedRoute({
    summary: 'List portfolio projects for a freelancer profile',
    ok: { schema: { example: { projects: [] } } },
    notFound: { codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND] },
  })
  listForProfile(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    return this.portfolioProjectsService.listForProfile(request.user?.sub, profileId);
  }

  @Get('freelancer-profiles/:profileId/portfolio-projects/:projectId')
  @RequirePermissions(ORG.FREELANCER_PROFILE_READ)
  @ApiJwtProtectedRoute({
    summary: 'Get a portfolio project for a freelancer profile',
    ok: { schema: { example: { project: { id: '…', title: '…' } } } },
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.PORTFOLIO_PROJECT_NOT_FOUND],
    },
  })
  getProject(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.portfolioProjectsService.getProject(request.user?.sub, profileId, projectId);
  }

  @Delete('freelancer-profiles/:profileId/portfolio-projects/:projectId')
  @RequirePermissions(ORG.FREELANCER_PROFILE_UPDATE)
  @ApiJwtProtectedRoute({
    summary: 'Delete a portfolio project',
    ok: { schema: { example: { ok: true } } },
    notFound: {
      codes: [API_ERROR_CODES.FREELANCER_PROFILE_NOT_FOUND, API_ERROR_CODES.PORTFOLIO_PROJECT_NOT_FOUND],
    },
  })
  deleteProject(
    @Req() request: LocaleAwareRequest,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.portfolioProjectsService.deleteProject(request.user?.sub, profileId, projectId);
  }
}
