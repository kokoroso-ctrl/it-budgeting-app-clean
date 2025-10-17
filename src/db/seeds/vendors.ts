import { db } from '@/db';
import { vendors } from '@/db/schema';

async function main() {
    const sampleVendors = [
        {
            name: 'AWS (Amazon Web Services)',
            category: 'Infrastructure',
            totalSpent: 285000,
            contracts: 12,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Microsoft',
            category: 'Software',
            totalSpent: 420000,
            contracts: 18,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Dell Technologies',
            category: 'Hardware',
            totalSpent: 195000,
            contracts: 8,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Cisco Systems',
            category: 'Infrastructure',
            totalSpent: 340000,
            contracts: 10,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Google Cloud',
            category: 'Infrastructure',
            totalSpent: 175000,
            contracts: 6,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Salesforce',
            category: 'Software',
            totalSpent: 95000,
            contracts: 4,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Oracle',
            category: 'Software',
            totalSpent: 280000,
            contracts: 9,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'VMware',
            category: 'Infrastructure',
            totalSpent: 145000,
            contracts: 5,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Adobe',
            category: 'Software',
            totalSpent: 68000,
            contracts: 3,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'IBM',
            category: 'Services',
            totalSpent: 52000,
            contracts: 2,
            status: 'inactive',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(vendors).values(sampleVendors);
    
    console.log('✅ Vendors seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});