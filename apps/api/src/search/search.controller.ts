import { Controller, Get, Query } from "@nestjs/common"
import { SearchService } from "./search.service.js"

@Controller("api/search")
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  async search(@Query("q") query: string) {
    if (!query || query.length < 2) return []
    return this.service.search(query)
  }
}
