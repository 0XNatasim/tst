import { Controller, Get, Param, Query } from "@nestjs/common"
import { ContractsService } from "./contracts.service.js"

@Controller("api/contracts")
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get()
  async findAll(
    @Query("limit") limit = "50",
    @Query("offset") offset = "0",
  ) {
    return this.service.findAll(parseInt(limit), parseInt(offset))
  }

  @Get("top")
  async getTop(@Query("limit") limit = "20") {
    return this.service.getTopContracts(parseInt(limit))
  }

  @Get("sole-source")
  async getSoleSource(@Query("limit") limit = "50") {
    return this.service.getSoleSourceContracts(parseInt(limit))
  }

  @Get("stats")
  async getStats() {
    return this.service.getStats()
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id)
  }

  @Get("vendor/:vendorId")
  async findByVendor(@Param("vendorId") vendorId: string) {
    return this.service.findByVendor(vendorId)
  }
}
