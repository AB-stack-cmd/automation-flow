/**
 * Sanitizes input data.
 */
export declare function sanitizeValue(val: any, type: string): any;
/**
 * Validates form submission inputs against the form fields schema.
 * Returns an object with success boolean and error record.
 */
export declare function validateForm(fieldsJson: any[], inputData: Record<string, any>): {
    success: boolean;
    errors: Record<string, string>;
    data: Record<string, any>;
};
