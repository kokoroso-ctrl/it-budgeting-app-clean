import { db } from '@/db';
import { budgets } from '@/db/schema';

async function main() {
    const categories = ['Hardware', 'Software', 'Personnel', 'Services', 'Infrastructure', 'Website'];
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    const statusDistribution = [
        { status: 'approved', weight: 60 },
        { status: 'pending', weight: 25 },
        { status: 'draft', weight: 15 }
    ];
    
    const indonesianNames = [
        'Budi Santoso',
        'Siti Nurhaliza',
        'Ahmad Hidayat',
        'Rina Kusuma',
        'Dedi Prasetyo',
        'Lina Marlina',
        'Agus Setiawan',
        'Dewi Sartika',
        'Hendra Gunawan',
        'Ratna Sari',
        'Bambang Wijaya',
        'Maya Anggraini'
    ];
    
    const approverNames = [
        'Ir. Bambang Suryanto, M.Kom',
        'Dr. Siti Rahmawati, S.T., M.T',
        'Drs. Ahmad Dahlan, M.M',
        'Prof. Dr. Rina Indiastuti'
    ];
    
    const budgetDetails = {
        Hardware: [
            { name: 'Pengadaan Hardware Server dan Storage', desc: 'Pembelian server rack 2U dan storage NAS untuk data center', amount: 450000000 },
            { name: 'Procurement Laptop dan Desktop Karyawan', desc: 'Pengadaan 30 unit laptop dan 20 unit desktop untuk staff IT', amount: 380000000 },
            { name: 'Upgrade Networking Equipment', desc: 'Upgrade switch core dan access point WiFi 6 untuk seluruh gedung', amount: 275000000 },
            { name: 'Pembelian UPS dan Cooling System', desc: 'Pengadaan UPS 10KVA dan sistem pendingin ruang server', amount: 185000000 }
        ],
        Software: [
            { name: 'Lisensi Microsoft 365 Enterprise', desc: 'Perpanjangan lisensi Microsoft 365 E3 untuk 150 users', amount: 225000000 },
            { name: 'Software Development Tools dan IDE', desc: 'Lisensi JetBrains, Visual Studio Professional, dan tools development', amount: 95000000 },
            { name: 'Database dan Middleware Licenses', desc: 'Lisensi Oracle Database, MongoDB Enterprise, dan Redis Enterprise', amount: 420000000 },
            { name: 'Security Software dan Antivirus', desc: 'Lisensi Kaspersky Endpoint Security dan firewall software', amount: 165000000 }
        ],
        Personnel: [
            { name: 'Pelatihan Sertifikasi IT Staff', desc: 'Pelatihan AWS Certified Solutions Architect dan Azure Administrator', amount: 125000000 },
            { name: 'Training Cybersecurity dan DevOps', desc: 'Workshop cybersecurity awareness dan DevOps practices', amount: 85000000 },
            { name: 'Rekrutmen IT Specialist', desc: 'Biaya rekrutmen 5 software engineer dan 2 network administrator', amount: 75000000 },
            { name: 'Program Pengembangan Kompetensi', desc: 'In-house training dan workshop teknikal untuk tim IT', amount: 95000000 }
        ],
        Services: [
            { name: 'Kontrak Maintenance Hardware', desc: 'Kontrak maintenance tahunan untuk server, storage, dan networking', amount: 185000000 },
            { name: 'IT Consulting dan System Integration', desc: 'Jasa konsultan untuk implementasi ERP dan system integration', amount: 325000000 },
            { name: 'Managed Services dan NOC', desc: 'Layanan managed services 24/7 dan Network Operations Center', amount: 245000000 },
            { name: 'Support dan Help Desk Outsourcing', desc: 'Outsourcing help desk support level 1 dan technical support', amount: 145000000 }
        ],
        Infrastructure: [
            { name: 'Cloud Services AWS dan Azure', desc: 'Biaya operasional cloud computing, storage, dan database services', amount: 385000000 },
            { name: 'Data Center Colocation', desc: 'Biaya sewa rack space, power, dan cooling di data center tier 3', amount: 295000000 },
            { name: 'Network Bandwidth dan Internet', desc: 'Biaya internet dedicated 1Gbps dan backup connection', amount: 175000000 },
            { name: 'Backup dan Disaster Recovery', desc: 'Implementasi backup solution dan disaster recovery site', amount: 225000000 }
        ],
        Website: [
            { name: 'Web Hosting dan CDN Services', desc: 'Biaya hosting production dan CDN untuk website perusahaan', amount: 65000000 },
            { name: 'Domain dan SSL Certificates', desc: 'Perpanjangan domain dan SSL certificates untuk semua website', amount: 25000000 },
            { name: 'Website Development dan Maintenance', desc: 'Pengembangan fitur baru dan maintenance website corporate', amount: 155000000 },
            { name: 'CMS dan Web Application Licenses', desc: 'Lisensi WordPress premium plugins dan web application framework', amount: 85000000 }
        ]
    };
    
    const getRandomStatus = () => {
        const rand = Math.random() * 100;
        let cumulative = 0;
        
        for (const { status, weight } of statusDistribution) {
            cumulative += weight;
            if (rand <= cumulative) return status;
        }
        return 'draft';
    };
    
    const getRandomName = () => indonesianNames[Math.floor(Math.random() * indonesianNames.length)];
    const getRandomApprover = () => approverNames[Math.floor(Math.random() * approverNames.length)];
    
    const getRandomDate = (start: Date, end: Date) => {
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toISOString();
    };
    
    const startDate = new Date('2024-12-01');
    const endDate = new Date('2025-01-31');
    
    const sampleBudgets = [];
    
    categories.forEach((category) => {
        const categoryBudgets = budgetDetails[category as keyof typeof budgetDetails];
        
        quarters.forEach((quarter, qIndex) => {
            const budgetItem = categoryBudgets[qIndex];
            const status = getRandomStatus();
            const createdAt = getRandomDate(startDate, endDate);
            const createdDate = new Date(createdAt);
            const updatedAt = new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
            
            sampleBudgets.push({
                name: `${quarter} 2025 ${budgetItem.name}`,
                year: 2025,
                quarter: quarter,
                category: category,
                amount: budgetItem.amount,
                status: status,
                createdBy: getRandomName(),
                approver: status === 'draft' ? null : getRandomApprover(),
                description: budgetItem.desc,
                createdAt: createdAt,
                updatedAt: updatedAt
            });
        });
    });

    await db.insert(budgets).values(sampleBudgets);
    
    console.log('✅ Budgets seeder completed successfully - 24 budget entries created');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});