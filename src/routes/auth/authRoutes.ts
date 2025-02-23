import bcrypt from 'bcryptjs'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { env } from '../../env'
import { ClientError } from '../../errors/client-error'
import { prisma } from '../../lib/prisma'
import { authMiddleware } from '../../middleware/authMiddleWare'
import fastifyMultipart from '@fastify/multipart'

export async function authRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart);

  app.post('/register', async (request, reply) => {
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
      throw new ClientError('Missing required fields', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ClientError('Email already in use.', 409);
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
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        profilePicture: profilePicture ? profilePicture.toString('base64') : null, // Convert BLOB to Base64
      },
    });
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
        body: loginSchema
      },
    },
    async (request: LoginRequest, reply: FastifyReply) => {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new ClientError('Invalid email or password.', 401);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new ClientError('Invalid email or password.', 401);
      }

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

      return reply.send({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture ? user.profilePicture.toString() : null,
        },
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
      throw new ClientError('User not found.', 404);
    }

    return reply.send({
      ...user,
      profilePicture: user.profilePicture ? user.profilePicture.toString() : null,
    });
  });
}
