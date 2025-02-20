import fastify from "fastify";
import cors from '@fastify/cors';
import {
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'
import { errorHandler } from "./error-handler";
import { env } from "./env";
import { authRoutes } from "./routes/authRoutes";
import fastifyMulter from 'fastify-multer';

const app = fastify()

app.register(cors, {
    origin: '*'
})

  app.register(fastifyMulter.contentParser)


app.register(authRoutes)

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.listen({ port: env.PORT }).then(() => {
    console.log('Server running!')
})