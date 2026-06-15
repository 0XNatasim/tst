import { Controller, Get, Param, Query } from "@nestjs/common"
import { MinistriesService } from "./ministries.service.js"

@Controller("api/ministries")
export class MinistriesController {
  constructor(private readonly service: MinistriesService) {}

  @Get()
  async findAll() {
    return this.service.findAll()
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id)
  }

  @Get("budgets/comparison")
  async getBudgetComparison(@Query("fiscalYear") fiscalYear: string) {
    return this.service.getBudgetComparison(fiscalYear)
  }
}
