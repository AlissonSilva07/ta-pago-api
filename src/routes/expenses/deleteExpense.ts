import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function deleteExpense(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
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
        return reply.status(400).send({ error: "O id do usuário é obrigatório." });
      }

      const expense = await prisma.expense.findUnique({
        where: { id },
      });

      if (!expense || expense.userId !== userId) {
        return reply.status(404).send({ error: "Gasto não encontrado. Tente novamente." });
      }

      await prisma.expense.delete({
        where: { id },
      });

      return reply.status(200).send({ 
        message: "Sucesso ao deletar o gasto.",
        nome_gasto: expense.title
       });
    }
  );
}
