"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const client_1 = require("@prisma/client");
const engine_1 = require("engine");
const client_2 = require("../../app/api/inngest/client");
const prisma = new client_1.PrismaClient();
exports.workflowRouter = (0, trpc_1.router)({
    list: trpc_1.publicProcedure.query(async () => {
        return prisma.workflow.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }),
    create: trpc_1.publicProcedure
        .input(zod_1.z.object({
        name: zod_1.z.string(),
        projectId: zod_1.z.string(),
        definition: zod_1.z.string(),
    }))
        .mutation(async ({ input }) => {
        return prisma.workflow.create({
            data: {
                name: input.name,
                projectId: input.projectId,
                definition: input.definition,
                isActive: true,
            },
        });
    }),
    execute: trpc_1.publicProcedure
        .input(zod_1.z.object({
        workflowId: zod_1.z.string(),
        triggerNodeName: zod_1.z.string(),
        payload: zod_1.z.any(),
    }))
        .mutation(async ({ input }) => {
        // Emit Inngest background event
        await client_2.inngest.send({
            name: 'workflow/run',
            data: {
                workflowId: input.workflowId,
                triggerNodeName: input.triggerNodeName,
                payload: input.payload,
            },
        });
        // Execute synchronous runner for direct response
        const result = await (0, engine_1.executeWorkflow)(input.workflowId, input.triggerNodeName, input.payload);
        return result;
    }),
    getExecutionLogs: trpc_1.publicProcedure
        .input(zod_1.z.object({
        executionId: zod_1.z.string(),
    }))
        .query(async ({ input }) => {
        return prisma.execution.findUnique({
            where: { id: input.executionId },
            include: { executionData: true },
        });
    }),
});
