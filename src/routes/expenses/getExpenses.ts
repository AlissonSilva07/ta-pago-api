import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function getExpenses(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/expenses",
    {
      preHandler: authMiddleware,
      schema: {
        querystring: z.object({
          search: z.string().optional(),
          page: z.string().transform((val) => Number(val)).refine((val) => !isNaN(val), {
            message: "page must be a valid number"
          }).optional(),
          size: z.string().transform((val) => Number(val)).refine((val) => !isNaN(val), {
            message: "size must be a valid number"
          }).optional(),
          sortBy: z.enum(["title", "dueDate"]).optional().default("dueDate"),
          sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
        }),
      },
    },
    async (req, reply) => {
      const { search, page, size, sortBy, sortOrder } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return reply.status(400).send({ error: "O id do usuário é obrigatório." });
      }

      if (page === undefined || size === undefined) {
        return reply.status(400).send({ error: "Os campos page e size devem ser preenchidos." });
      }

      const where = {
        userId,
        ...(search && {
          title: {
            contains: search.toLowerCase()
          },
        }),
      };

      const orderBy = {
        [sortBy]: sortOrder,
      };

      const expenses = await prisma.expense.findMany({
        where,
        orderBy,
        skip: (page - 1) * size,
        take: size,
      });

      const totalExpenses = await prisma.expense.count({
        where,
      });

      return reply.send({
        expenses,
        totalExpenses,
        currentPage: page,
        totalPages: Math.ceil(totalExpenses / size),
      });
    }
  );
}
