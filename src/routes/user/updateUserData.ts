import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { ClientError } from "../../errors/client-error";
import fastifyMultipart from '@fastify/multipart';
import { authMiddleware } from "../../middleware/authMiddleWare";

export async function updateUserData(app: FastifyInstance) {
    app.register(fastifyMultipart, {
        limits: { fileSize: 10 * 1024 * 1024 }
    });

    app.put('/user', { preHandler: authMiddleware }, async (request, reply) => {
        try {
            const userId = request.user?.id;

            if (!userId) {
                return reply.status(401).send({ message: 'Usuário não autenticado.' });
            }

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
                    const chunks: Buffer[] = [];
                    for await (const chunk of part.file) {
                        chunks.push(chunk);
                    }
                    profilePicture = Buffer.concat(chunks);
                }
            }

            // Fetch the current user from the database
            const currentUser = await prisma.user.findUnique({ where: { id: userId } });
            if (!currentUser) {
                throw new ClientError('Usuário não encontrado.', 404);
            }

            // Only update the provided fields
            const updatedData = {
                name: name ?? currentUser.name,
                email: email ?? currentUser.email,
                password: password ? await bcrypt.hash(password, 10) : currentUser.password,
                profilePicture: profilePicture ?? currentUser.profilePicture,
            };

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updatedData,
            });

            return reply.status(200).send({
                message: 'Dados do usuário atualizados com sucesso.'
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
}