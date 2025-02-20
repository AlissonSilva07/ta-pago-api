import z from "zod";
import { config } from "dotenv";

config()

const envSchema = z.object({
  DATABASE_URL: z.string(),
  API_BASE_URL: z.string().url(),
  WEB_BASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3333),
  JWT_SECRET: z.string(),
})

export const env = envSchema.parse(process.env)