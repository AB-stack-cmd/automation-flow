export interface ItemData {
    json: Record<string, any>;
    binary?: Record<string, {
        data: string | Buffer;
        mimeType: string;
        fileName?: string;
    }>;
    pairedItem?: {
        item: number;
        input?: number;
    };
}
export interface INode {
    id: string;
    name: string;
    type: string;
    parameters: Record<string, any>;
    credentials?: Record<string, string>;
}
export interface INodeType {
    description: {
        displayName: string;
        name: string;
        group: string[];
        version: number;
        description: string;
        defaults: {
            name: string;
        };
        inputs: string[];
        outputs: string[];
        properties: any[];
    };
    execute(this: IExecuteFunctions): Promise<ItemData[][]>;
}
export interface IExecuteFunctions {
    getInputData(portIndex?: number): ItemData[];
    getNodeParameter(name: string, itemIndex: number, defaultValue?: any): any;
    getCredentials(type: string): Promise<Record<string, string>>;
    helpers: {
        httpRequest(options: any): Promise<any>;
        returnJsonArray(data: any | any[]): ItemData[];
    };
}
/**
 * Resolves properties from an item's JSON payload by path.
 */
export declare function resolvePath(path: string, item: ItemData): any;
/**
 * Evaluates template expressions (e.g. {{$json.email}} or Hello {{$json.name}}) against an item's data.
 */
export declare function evaluateExpression(expr: any, item: ItemData): any;
export * from './validation';
