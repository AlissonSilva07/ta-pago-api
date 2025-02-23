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
import { getMonthlyExpenseProgress } from "./routes/analytics/getMonthlyExpenseProgress";
import { getTotalExpensesPerMonth } from "./routes/analytics/getTotalExpensesPerMonth";
import { getUserData } from "./routes/user/getUserData";
import { updateUserData } from "./routes/user/updateUserData";


const app = fastify()

app.register(cors)

app.register(authRoutes)
app.register(createExpense)
app.register(getExpenses)
app.register(getExpenseById)
app.register(deleteExpense)
app.register(updateExpense)
app.register(getMonthlyExpenseProgress)
app.register(getTotalExpensesPerMonth)
app.register(getUserData)
app.register(updateUserData)

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.listen({ port: env.PORT }).then(() => {
    console.log('Server running!')
})