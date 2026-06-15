import { Controller, Get, Param, Query } from "@nestjs/common"
import { OrganizationsService } from "./organizations.service.js"

@Controller("api/organizations")
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  async findAll(
    @Query("type") type?: string,
    @Query("limit") limit = "50",
    @Query("offset") offset = "0",
  ) {
    return this.service.findAll(type, parseInt(limit), parseInt(offset))
  }

  @Get("search")
  async search(@Query("q") query: string) {
    return this.service.search(query)
  }

  @Get("top-vendors")
  async getTopVendors(@Query("limit") limit = "50") {
    return this.service.getTopVendors(parseInt(limit))
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.service.findOne(id)
  }
}
