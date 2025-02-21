import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function getExpenses(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/expenses",
    {
      preHandler: authMiddleware,
    },
    async (req, reply) => {
      const userId = req.user?.id;

      if (!userId) {
        return reply.status(400).send({ error: "User ID is required" });
      }

      const expenses = await prisma.expense.findMany({
        where: { userId },
        orderBy: { dueDate: "asc" },
      });

      return { expenses };
    }
  );
}