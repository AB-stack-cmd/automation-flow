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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePath = resolvePath;
exports.evaluateExpression = evaluateExpression;
/**
 * Resolves properties from an item's JSON payload by path.
 */
function resolvePath(path, item) {
    let cleanPath = path.trim();
    if (cleanPath.startsWith('$json.')) {
        cleanPath = cleanPath.slice(6);
    }
    const parts = cleanPath.split('.');
    let val = item.json;
    // Fallback: If first part is not in item.json but is in item.json.body
    if (val && val.body !== undefined && val[parts[0]] === undefined) {
        val = val.body;
    }
    for (const part of parts) {
        if (val === null || val === undefined)
            return undefined;
        val = val[part];
    }
    return val;
}
/**
 * Evaluates template expressions (e.g. {{$json.email}} or Hello {{$json.name}}) against an item's data.
 */
function evaluateExpression(expr, item) {
    if (typeof expr !== 'string') {
        return expr;
    }
    // Exact match to return raw non-string types
    const exactMatch = expr.match(/^\{\{([^}]+)\}\}$/);
    if (exactMatch) {
        const path = exactMatch[1];
        return resolvePath(path, item);
    }
    // String interpolation
    return expr.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
        const val = resolvePath(path, item);
        return val !== undefined ? String(val) : '';
    });
}
__exportStar(require("./validation"), exports);
