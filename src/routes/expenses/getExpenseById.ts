import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function getExpenseById(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/expenses/:id",
    {
      preHandler: authMiddleware,
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (req, reply) => {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return reply.status(400).send({ error: "User ID is required" });
      }

      const expense = await prisma.expense.findUnique({
        where: { id },
      });

      if (!expense || expense.userId !== userId) {
        return reply.status(404).send({ error: "Expense not found or access denied" });
      }

      return { expense };
    }
  );
}
