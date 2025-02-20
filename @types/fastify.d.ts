import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string };
    file?: Express.Multer.File;
  }
}