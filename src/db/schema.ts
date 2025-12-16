import { pgTable, serial, text, real, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  vendor: text('vendor').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull(),
  poNumber: text('po_number').notNull(),
  warranty: text('warranty'),
  expiredWarranty: text('expired_warranty'),
  licenseType: text('license_type'),
  expiredSubscription: text('expired_subscription'),
  invoiceData: text('invoice_data'),
  invoiceMimeType: text('invoice_mime_type'),
  invoiceFilename: text('invoice_filename'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  quarter: text('quarter').notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull(),
  createdBy: text('created_by').notNull(),
  approver: text('approver'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category').notNull(),
  totalSpent: real('total_spent').notNull().default(0),
  contracts: integer('contracts').notNull().default(0),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});