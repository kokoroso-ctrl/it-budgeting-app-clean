import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
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
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const budgets = sqliteTable('budgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  quarter: text('quarter').notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull(),
  createdBy: text('created_by').notNull(),
  approver: text('approver'),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const vendors = sqliteTable('vendors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  category: text('category').notNull(),
  totalSpent: real('total_spent').notNull().default(0),
  contracts: integer('contracts').notNull().default(0),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});