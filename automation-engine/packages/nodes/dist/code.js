"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeNode = void 0;
const vm = __importStar(require("vm"));
exports.CodeNode = {
    description: {
        displayName: 'Code',
        name: 'logic.code',
        group: ['logic'],
        version: 1,
        description: 'Execute custom JavaScript code',
        defaults: {
            name: 'Code',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'JavaScript Code',
                name: 'jsCode',
                type: 'string',
                default: '// Loop through all items and update them\nreturn inputData.map(item => {\n  item.json.processed = true;\n  return item;\n});',
                required: true,
            },
        ],
    },
    async execute() {
        const inputs = this.getInputData();
        const jsCode = this.getNodeParameter('jsCode', 0, '');
        const sandbox = {
            inputData: inputs.map((item, index) => ({
                json: { ...item.json },
                binary: item.binary,
                index,
            })),
            console,
        };
        let result;
        try {
            const scriptCode = `
        (function() {
          ${jsCode}
        })()
      `;
            result = vm.runInNewContext(scriptCode, sandbox, { timeout: 3000 });
        }
        catch (err) {
            throw new Error(`Code node execution failed: ${err.message}`);
        }
        const outputItems = [];
        if (Array.isArray(result)) {
            for (let i = 0; i < result.length; i++) {
                const resItem = result[i];
                if (resItem && typeof resItem === 'object') {
                    outputItems.push({
                        json: resItem.json || resItem,
                        binary: resItem.binary,
                        pairedItem: { item: i },
                    });
                }
                else {
                    outputItems.push({
                        json: { value: resItem },
                        pairedItem: { item: i },
                    });
                }
            }
        }
        else if (result !== null && result !== undefined) {
            outputItems.push({
                json: result.json || (typeof result === 'object' ? result : { value: result }),
                pairedItem: { item: 0 },
            });
        }
        return [outputItems];
    },
};
