import bcrypt from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { upload } from '../../config/multerConfig'
import { env } from '../../env'
import { ClientError } from '../../errors/client-error'
import { prisma } from '../../lib/prisma'
import { authMiddleware } from '../../middleware/authMiddleWare'

export async function authRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/register',
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6)
        }),
      },
      preHandler: upload.single('profilePicture')
    },
    async (
      request,
      reply
    ) => {
      console.log('Request Body:', request.body);

      const { name, email, password } = request.body
      const profilePicture = request.file ? request.file.filename : null

      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        throw new ClientError('Email already in use.', 409)
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          profilePicture: profilePicture || null,
        },
      })

      return reply.status(201).send({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          profilePicture: newUser.profilePicture,
        },
      })
    }
  )

  app.withTypeProvider<ZodTypeProvider>().post(
    '/login',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        throw new ClientError('Invalid email or password.', 401)
      }

      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        throw new ClientError('Invalid email or password.', 401)
      }

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' })

      return reply.send({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
        },
      })
    }
  )

  app.withTypeProvider<ZodTypeProvider>().get(
    '/me',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      const userId = request.user?.id

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, profilePicture: true },
      })

      if (!user) {
        throw new ClientError('User not found.', 404)
      }

      return reply.send(user)
    }
  )
}
