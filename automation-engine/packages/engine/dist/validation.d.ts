import { WorkflowDefinition } from './graph';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    cyclePath?: string[];
}
export declare function validateWorkflowGraph(workflow: WorkflowDefinition): ValidationResult;
