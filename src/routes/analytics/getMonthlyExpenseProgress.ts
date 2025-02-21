import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function getMonthlyExpenseProgress(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/analytics/expense-progress",
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

      const progress = expenses.reduce((acc, expense) => {
        const yearMonth = expense.dueDate.toISOString().slice(0, 7);

        if (!acc[yearMonth]) {
          acc[yearMonth] = { current: 0, total: 0 };
        }

        acc[yearMonth].total++;
        if (expense.isPaid) {
          acc[yearMonth].current++;
        }

        return acc;
      }, {} as Record<string, { current: number; total: number }>);

      return { progress };
    }
  );
}
