import fastify from "fastify";
import cors from '@fastify/cors';
import {
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'
import { errorHandler } from "./error-handler";
import { env } from "./env";
import { authRoutes } from "./routes/auth/authRoutes";
import { createExpense } from "./routes/expenses/createExpense";
import fastifyMultipart from '@fastify/multipart';

const app = fastify()

app.register(cors, {
    origin: '*'
})

app.register(fastifyMultipart, {
    attachFieldsToBody: 'keyValues'
});

app.register(authRoutes)
app.register(createExpense)

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.listen({ port: env.PORT }).then(() => {
    console.log('Server running!')
})