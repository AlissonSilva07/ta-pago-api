import fastify from "fastify";
import cors from '@fastify/cors';
import {
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'
import { errorHandler } from "./error-handler";
import { env } from "./env";

const app = fastify()

app.register(cors, {
    origin: '*'
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.listen({ port: env.PORT }).then(() => {
    console.log('Server running!')
})