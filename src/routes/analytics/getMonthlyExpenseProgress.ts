import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";
import dayjs from "dayjs";

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

      const startOfMonth = dayjs().startOf("month").toDate();
      const endOfMonth = dayjs().endOf("month").toDate();

      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        orderBy: { dueDate: "asc" },
      });

      const progress = expenses.reduce(
        (acc, expense) => {
          acc.total++;
          if (expense.isPaid) {
            acc.current++;
          }
          return acc;
        },
        { current: 0, total: 0 }
      );

      return reply.send(progress);
    }
  );
}