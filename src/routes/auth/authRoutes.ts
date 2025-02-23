import bcrypt from 'bcryptjs';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../env';
import { ClientError } from '../../errors/client-error';
import { prisma } from '../../lib/prisma';
import { authMiddleware } from '../../middleware/authMiddleWare';
import fastifyMultipart from '@fastify/multipart';

export async function authRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart, { 
    limits: { fileSize: 10 * 1024 * 1024 }
  });

  app.post('/register', async (request, reply) => {
    try {
      const parts = request.parts();

      let name: string | null = null;
      let email: string | null = null;
      let password: string | null = null;
      let profilePicture: Buffer | null = null;

      for await (const part of parts) {
        if (part.type === 'field' && typeof part.value === 'string') {
          if (part.fieldname === 'name') name = part.value;
          if (part.fieldname === 'email') email = part.value;
          if (part.fieldname === 'password') password = part.value;
        } else if (part.type === 'file') {
          const chunks = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          profilePicture = Buffer.concat(chunks);
        }
      }

      if (!name || !email || !password) {
        throw new ClientError('Preencha todos os campos antes de prosseguir.', 400);
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ClientError('Email já em uso.', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          profilePicture,
        },
      });

      return reply.status(201).send({
        message: 'Sucesso ao registrar o usuário(a).',
        user: {
          id: newUser.id,
          name: newUser.name,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('request file too large')) {
        return reply.status(400).send({ message: 'Arquivo muito grande. O tamanho máximo permitido é 10MB.' });
      }

      if (error instanceof ClientError) {
        return reply.status(error.statusCode || 400).send({ message: error.message });
      }

      console.error(error);
      return reply.status(500).send({ message: 'Erro interno do servidor.' });
    }
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  type LoginRequest = FastifyRequest<{
    Body: z.infer<typeof loginSchema>;
  }>;

  app.post(
    '/login',
    {
      schema: {
        body: loginSchema,
      },
    },
    async (request: LoginRequest, reply: FastifyReply) => {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new ClientError('Email ou senha inválidos.', 401);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new ClientError('Email ou senha inválidos.', 401);
      }

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

      return reply.send({
        message: 'Sucesso ao fazer login.',
        token,
      });
    }
  );

  app.get('/me', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, profilePicture: true },
    });

    if (!user) {
      throw new ClientError('Usuário não encontrado.', 404);
    }

    return reply.send({
      ...user,
      profilePicture: user.profilePicture ? user.profilePicture.toString() : null,
    });
  });
}
