import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function getTotalExpensesPerMonth(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/analytics/total-expenses",
    {
      preHandler: authMiddleware,
    },
    async (req, reply) => {
      const userId = req.user?.id;

      if (!userId) {
        return reply.status(400).send({ error: "User ID is required" });
      }

      const expenses = await prisma.expense.groupBy({
        by: ["dueDate"],
        where: { userId },
        _sum: { amount: true },
        orderBy: { dueDate: "asc" },
      });

      const monthlyTotals = expenses.reduce((acc, expense) => {
        const yearMonth = expense.dueDate.toISOString().slice(0, 7); // YYYY-MM format
        acc[yearMonth] = (acc[yearMonth] || 0) + (expense._sum.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      return { monthlyTotals };
    }
  );
}
