// lib/cache/user.ts
import { prisma } from "@/lib/prisma";
import { redis } from "../../shared/redis";

const USER_TTL = 600;

export async function getCachedUserByEmail(email: string) {
  const cacheKey = `user:${email}`;

  // 1️⃣ Redis
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2️⃣ DB
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      password: true, // only needed internally
    },
  });

  if (!user) return null;

  // 3️⃣ Cache SAFE user (no password)
  const cacheUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
  };

  await redis.set(cacheKey, JSON.stringify(cacheUser), "EX", USER_TTL);

  return user; // return full user for login verification
}

export async function clearUserCache(email: string) {
  await redis.del(`user:${email}`);
}
