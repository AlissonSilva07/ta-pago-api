import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function updateExpense(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/expenses/:id",
    {
      preHandler: authMiddleware,
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          amount: z.number().optional(),
          title: z.string().min(6).optional(),
          description: z.string().min(6).optional(),
          category: z.string().min(6).optional(),
          isPaid: z.boolean().optional(),
          dueDate: z.coerce.date().optional(),
        }),
      },
    },
    async (req, reply) => {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!userId) {
        return reply.status(400).send({ error: "User ID is required" });
      }

      const expense = await prisma.expense.findUnique({
        where: { id },
      });

      if (!expense || expense.userId !== userId) {
        return reply.status(404).send({ error: "Expense not found or access denied" });
      }

      const updatedExpense = await prisma.expense.update({
        where: { id },
        data: updateData,
      });

      return { updatedExpense };
    }
  );
}
