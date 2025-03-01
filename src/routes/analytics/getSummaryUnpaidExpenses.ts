import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function getSummaryUnpaidExpenses(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/analytics/unpaid-summary",
    {
      preHandler: authMiddleware,
    },
    async (req, reply) => {
      const userId = req.user?.id;

      if (!userId) {
        return reply.status(400).send({ error: "O id do usuário é obrigatório." });
      }

      const unpaidExpenses = await prisma.expense.findMany({
        where: {
          userId,
          isPaid: false,
        },
        orderBy: {
          dueDate: "asc",
        },
        take: 3,
      });

      return reply.send(unpaidExpenses);
    }
  );
}