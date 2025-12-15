const { PrismaClient } = require('@prisma/client-parent-portal');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function checkConfig() {
  try {
    console.log('Checking StudentActionConfig for update-info action...\n');
    
    const configs = await prisma.studentActionConfig.findMany({
      where: {
        actionKey: 'update-info'
      },
      orderBy: {
        educationType: 'asc'
      }
    });
    
    if (configs.length === 0) {
      console.log('❌ No update-info actions found in database!');
      console.log('\nAll action configs:');
      const all = await prisma.studentActionConfig.findMany({
        select: {
          id: true,
          educationType: true,
          actionKey: true,
          isEnabled: true,
          displayOrder: true,
          configJson: true
        },
        orderBy: [
          { educationType: 'asc' },
          { displayOrder: 'asc' }
        ]
      });
      console.log(JSON.stringify(all, null, 2));
    } else {
      console.log(`Found ${configs.length} update-info action(s):\n`);
      configs.forEach(config => {
        console.log(`ID: ${config.id}`);
        console.log(`Education Type: ${config.educationType}`);
        console.log(`Action Key: ${config.actionKey}`);
        console.log(`Is Enabled: ${config.isEnabled}`);
        console.log(`Display Order: ${config.displayOrder}`);
        console.log(`Config JSON:`);
        
        try {
          const parsed = JSON.parse(config.configJson || '{}');
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(`  [Invalid JSON: ${config.configJson}]`);
        }
        console.log('\n---\n');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfig();
