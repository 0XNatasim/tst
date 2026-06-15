import { Controller, Get, Param, Query } from "@nestjs/common"
import { BudgetsService } from "./budgets.service.js"

@Controller("api/budgets")
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Get()
  async getByFiscalYear(@Query("fiscalYear") fiscalYear: string) {
    return this.service.getByFiscalYear(fiscalYear)
  }

  @Get("variance-summary")
  async getVarianceSummary(@Query("fiscalYear") fiscalYear: string) {
    return this.service.getVarianceSummary(fiscalYear)
  }

  @Get("overruns")
  async getTopOverruns(
    @Query("fiscalYear") fiscalYear: string,
    @Query("limit") limit = "20",
  ) {
    return this.service.getTopOverruns(fiscalYear, parseInt(limit))
  }
}
