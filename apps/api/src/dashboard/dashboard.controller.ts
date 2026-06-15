import { Controller, Get } from "@nestjs/common"
import { DashboardService } from "./dashboard.service.js"

@Controller("api/dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get("summary")
  async getSummary() {
    return this.service.getSummary()
  }

  @Get("red-flags")
  async getRedFlags() {
    return this.service.getRedFlags()
  }
}
