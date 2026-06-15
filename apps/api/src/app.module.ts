import { Module } from "@nestjs/common"
import { MinistriesModule } from "./ministries/ministries.module.js"
import { ContractsModule } from "./contracts/contracts.module.js"
import { OrganizationsModule } from "./organizations/organizations.module.js"
import { BudgetsModule } from "./budgets/budgets.module.js"
import { SearchModule } from "./search/search.module.js"
import { DashboardModule } from "./dashboard/dashboard.module.js"

@Module({
  imports: [
    MinistriesModule,
    ContractsModule,
    OrganizationsModule,
    BudgetsModule,
    SearchModule,
    DashboardModule,
  ],
})
export class AppModule {}
