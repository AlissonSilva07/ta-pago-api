import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { env } from '../env'
import { ClientError } from '../errors/client-error'

interface AuthPayload {
  userId: string
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    throw new ClientError('Unauthorized: No token provided.', 401)
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload
    request.user = { id: decoded.userId }
  } catch (error) {
    throw new ClientError('Unauthorized: Invalid token.', 401)
  }
}
