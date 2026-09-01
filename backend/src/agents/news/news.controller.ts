import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { NewsAgentService } from './news-agent.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('news')
@UseGuards(JwtAuthGuard)
export class NewsController {
  constructor(private svc: NewsAgentService) {}

  @Get()
  @Public()
  findAll(@Query('limit') limit?: string, @Query('page') page?: string) {
    return this.svc.findAll(limit ? +limit : 20, page ? +page : 1);
  }

  @Get('count')
  @Public()
  count() {
    return this.svc.count();
  }

  @Get('history')
  @Public()
  getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
  ) {
    return this.svc.getHistory({
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      category,
      q,
    });
  }

  @Get('curiosidades')
  @Public()
  getCuriosidades() {
    return this.svc.getCuriosidades();
  }

  @Get('category/:cat')
  @Public()
  findByCategory(
    @Param('cat') cat: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.svc.findByCategory(cat, limit ? +limit : 20, page ? +page : 1);
  }

  @Get(":id")
  @Public()
  findById(@Param("id") id: string) {
    return this.svc.findById(id);
  }
}
