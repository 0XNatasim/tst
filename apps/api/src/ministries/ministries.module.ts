import { Module } from "@nestjs/common"
import { MinistriesController } from "./ministries.controller.js"
import { MinistriesService } from "./ministries.service.js"

@Module({
  controllers: [MinistriesController],
  providers: [MinistriesService],
})
export class MinistriesModule {}
