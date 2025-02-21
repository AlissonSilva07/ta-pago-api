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
import { getExpenses } from "./routes/expenses/getExpenses";
import { getExpenseById } from "./routes/expenses/getExpenseById";
import { deleteExpense } from "./routes/expenses/deleteExpense";
import { updateExpense } from "./routes/expenses/editExpense";

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
app.register(getExpenses)
app.register(getExpenseById)
app.register(deleteExpense)
app.register(updateExpense)

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.listen({ port: env.PORT }).then(() => {
    console.log('Server running!')
})