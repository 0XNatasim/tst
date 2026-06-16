import {
  pgTable, serial, text, timestamp, numeric, integer, boolean, jsonb, uuid, varchar, index, uniqueIndex,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("unknown"),
  registryId: text("registry_id"),
  jurisdiction: varchar("jurisdiction", { length: 10 }).default("QC"),
  sector: text("sector"),
  address: text("address"),
  website: text("website"),
  isGovernment: boolean("is_government").default(false),
  isAgency: boolean("is_agency").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("org_name_idx").on(table.normalizedName),
  typeIdx: index("org_type_idx").on(table.type),
}))

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert

export const ministries = pgTable("ministries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  budget: numeric("budget", { precision: 18, scale: 2 }),
  actualSpending: numeric("actual_spending", { precision: 18, scale: 2 }),
  fiscalYear: varchar("fiscal_year", { length: 9 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Ministry = typeof ministries.$inferSelect

export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  ministryId: uuid("ministry_id").notNull().references(() => ministries.id),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }),
  budget: numeric("budget", { precision: 18, scale: 2 }),
  actualSpending: numeric("actual_spending", { precision: 18, scale: 2 }),
  fiscalYear: varchar("fiscal_year", { length: 9 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ministryIdx: index("prog_ministry_idx").on(table.ministryId),
}))

export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: text("external_id"),
  ministryId: uuid("ministry_id").references(() => ministries.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  vendorId: uuid("vendor_id").references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 18, scale: 2 }),
  originalAmount: numeric("original_amount", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("CAD"),
  procurementMethod: text("procurement_method"),
  bidCount: integer("bid_count"),
  isSoleSource: boolean("is_sole_source").default(false),
  awardDate: timestamp("award_date"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 30 }).default("active"),
  amendmentCount: integer("amendment_count").default(0),
  totalAmendmentsValue: numeric("total_amendments_value", { precision: 18, scale: 2 }),
  sourceUrl: text("source_url"),
  source: varchar("source", { length: 100 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  vendorIdx: index("contract_vendor_idx").on(table.vendorId),
  ministryIdx: index("contract_ministry_idx").on(table.ministryId),
  externalIdx: uniqueIndex("contract_external_idx").on(table.externalId),
}))

export type Contract = typeof contracts.$inferSelect

export const contractAmendments = pgTable("contract_amendments", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  amendmentNumber: integer("amendment_number").notNull(),
  description: text("description"),
  valueChange: numeric("value_change", { precision: 18, scale: 2 }),
  date: timestamp("date"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contractIdx: index("amend_contract_idx").on(table.contractId),
}))

export const grants = pgTable("grants", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: text("external_id"),
  ministryId: uuid("ministry_id").references(() => ministries.id),
  recipientId: uuid("recipient_id").references(() => organizations.id),
  programName: text("program_name").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 18, scale: 2 }),
  fiscalYear: varchar("fiscal_year", { length: 9 }),
  grantType: varchar("grant_type", { length: 50 }),
  awardDate: timestamp("award_date"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  recipientIdx: index("grant_recipient_idx").on(table.recipientId),
  ministryIdx: index("grant_ministry_idx").on(table.ministryId),
}))

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  ministryId: uuid("ministry_id").notNull().references(() => ministries.id),
  fiscalYear: varchar("fiscal_year", { length: 9 }).notNull(),
  planned: numeric("planned", { precision: 18, scale: 2 }).notNull(),
  actual: numeric("actual", { precision: 18, scale: 2 }),
  variance: numeric("variance", { precision: 18, scale: 2 }),
  variancePct: numeric("variance_pct", { precision: 6, scale: 3 }),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ministryFiscalIdx: index("budget_mf_idx").on(table.ministryId, table.fiscalYear),
}))

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id").references(() => contracts.id),
  grantId: uuid("grant_id").references(() => grants.id),
  recipientId: uuid("recipient_id").references(() => organizations.id),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date"),
  description: text("description"),
  fiscalYear: varchar("fiscal_year", { length: 9 }),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const lobbyists = pgTable("lobbyists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  clientId: uuid("client_id").references(() => organizations.id),
  registrationId: text("registration_id"),
  registrationDate: timestamp("registration_date"),
  targetEntity: text("target_entity"),
  subject: text("subject"),
  status: varchar("status", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
})

export const auditFindings = pgTable("audit_findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 20 }),
  organizationId: uuid("organization_id").references(() => organizations.id),
  ministryId: uuid("ministry_id").references(() => ministries.id),
  contractId: uuid("contract_id").references(() => contracts.id),
  amount: numeric("amount", { precision: 18, scale: 2 }),
  recommendation: text("recommendation"),
  status: varchar("status", { length: 30 }),
  reportUrl: text("report_url"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: text("external_id"),
  title: text("title").notNull(),
  source: varchar("source", { length: 100 }),
  sourceUrl: text("source_url"),
  documentType: varchar("document_type", { length: 50 }),
  format: varchar("format", { length: 10 }),
  content: text("content"),
  contentHash: text("content_hash"),
  extractedAt: timestamp("extracted_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
})

export const riskScores = pgTable("risk_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  targetType: varchar("target_type", { length: 30 }).notNull(),
  targetId: uuid("target_id").notNull(),
  score: integer("score").notNull(),
  factors: jsonb("factors").default({}),
  modelVersion: varchar("model_version", { length: 20 }),
  calculatedAt: timestamp("calculated_at").defaultNow(),
}, (table) => ({
  targetIdx: index("risk_target_idx").on(table.targetType, table.targetId),
}))

export const relationships = pgTable("relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceType: varchar("source_type", { length: 30 }).notNull(),
  sourceId: uuid("source_id").notNull(),
  targetType: varchar("target_type", { length: 30 }).notNull(),
  targetId: uuid("target_id").notNull(),
  relationType: varchar("relation_type", { length: 50 }).notNull(),
  properties: jsonb("properties").default({}),
  validFrom: timestamp("valid_from").defaultNow(),
  validTo: timestamp("valid_to"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sourceIdx: index("rel_source_idx").on(table.sourceType, table.sourceId),
  targetIdx: index("rel_target_idx").on(table.targetType, table.targetId),
}))
