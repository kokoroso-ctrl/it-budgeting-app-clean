import { db } from '@/db';
import { budgets } from '@/db/schema';

async function main() {
    const sampleBudgets = [
        {
            name: 'Q1 2024 Hardware Budget',
            year: 2024,
            quarter: 'Q1',
            category: 'Hardware',
            amount: 250000,
            status: 'approved',
            createdBy: 'John Smith',
            approver: 'Sarah Johnson',
            description: 'Q1 hardware procurement including servers and networking equipment',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Q2 2024 Software Licenses',
            year: 2024,
            quarter: 'Q2',
            category: 'Software',
            amount: 180000,
            status: 'approved',
            createdBy: 'Emily Chen',
            approver: 'Sarah Johnson',
            description: 'Enterprise software licenses renewal for Q2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Q3 2024 Cloud Infrastructure',
            year: 2024,
            quarter: 'Q3',
            category: 'Infrastructure',
            amount: 320000,
            status: 'pending',
            createdBy: 'Michael Brown',
            approver: null,
            description: 'AWS and Google Cloud budget for Q3 operations',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Q4 2024 Personnel Training',
            year: 2024,
            quarter: 'Q4',
            category: 'Personnel',
            amount: 125000,
            status: 'draft',
            createdBy: 'David Lee',
            approver: null,
            description: 'IT staff training and certification programs',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Annual 2024 Website Maintenance',
            year: 2024,
            quarter: 'Annual',
            category: 'Website',
            amount: 95000,
            status: 'approved',
            createdBy: 'Lisa Anderson',
            approver: 'Sarah Johnson',
            description: 'Annual website hosting, maintenance and development',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Q3 2024 Managed Services',
            year: 2024,
            quarter: 'Q3',
            category: 'Services',
            amount: 450000,
            status: 'pending',
            createdBy: 'Robert Taylor',
            approver: null,
            description: 'Managed IT services and support contracts',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(budgets).values(sampleBudgets);
    
    console.log('✅ Budgets seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});