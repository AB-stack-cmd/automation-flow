"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("../trpc");
const workflow_1 = require("./workflow");
exports.appRouter = (0, trpc_1.router)({
    workflow: workflow_1.workflowRouter,
});
