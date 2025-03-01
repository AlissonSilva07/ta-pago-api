import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function createExpense(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/expenses",
    {
      preHandler: authMiddleware,
      schema: {
        body: z.object({
          amount: z.number(),
          title: z.string().min(6),
          description: z.string().min(6),
          category: z.string().min(3),
          isPaid: z.boolean(),
          dueDate: z.coerce.date(),
        }),
      },
    },
    async (req, reply) => {
      const { amount, title, description, category, isPaid, dueDate } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return reply.status(400).send({ error: "O id do usuário é obrigatório." });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado." });
      }

      const expense = await prisma.expense.create({
        data: { amount, title, description, category, isPaid, dueDate, createdAt: new Date(), userId },
      });

      return { expenseId: expense.id };
    }
  );
}
