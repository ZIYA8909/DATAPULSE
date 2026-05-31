import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔍 Checking database connection...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.slice(0, 40) + "...");

  // Count users
  const count = await prisma.user.count();
  console.log(`\n👥 Total users in DB: ${count}`);

  if (count === 0) {
    console.log("❌ No users found! Seed did not run correctly.");
    return;
  }

  // Find admin user
  const user = await prisma.user.findUnique({
    where: { email: "admin@datapulse.io" },
    select: { id: true, name: true, email: true, passwordHash: true, isActive: true, role: true },
  });

  if (!user) {
    console.log("❌ admin@datapulse.io not found in database!");
    const allUsers = await prisma.user.findMany({ select: { email: true, role: true } });
    console.log("Users in DB:", allUsers);
    return;
  }

  console.log(`\n✅ Found user: ${user.name} (${user.email})`);
  console.log(`   Role: ${user.role} | Active: ${user.isActive}`);
  console.log(`   Hash: ${user.passwordHash.slice(0, 20)}...`);

  // Test password
  const match = await bcrypt.compare("Admin@123!", user.passwordHash);
  console.log(`\n🔐 Password "Admin@123!" matches: ${match}`);

  if (!match) {
    console.log("❌ Password hash mismatch! Re-seeding needed.");
  } else {
    console.log("✅ All good — login should work!");
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
