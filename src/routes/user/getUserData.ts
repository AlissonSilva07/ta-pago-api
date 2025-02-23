import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function getUserData(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/user",
    {
      preHandler: authMiddleware,
    },
    async (req, reply) => {
      const userId = req.user?.id;

      if (!userId) {
        return reply.status(400).send({ error: "O id do usuário é obrigatório." });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado. Tente novamente." });
      }

      return { user };
    }
  );
}