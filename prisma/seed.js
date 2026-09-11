const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("admin123", 10);

    await prisma.account.upsert({
        where: { email: "admin@nexapos.com" },
        update: {},
        create: {
            email: "admin@nexapos.com",
            passwordHash,
            role: "SUPER_ADMIN",
        },
    });

    console.log("Seeded Super Admin: admin@nexapos.com / admin123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });