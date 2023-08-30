"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
class ErrorBoundary extends react_1.default.Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        // You can log the error to an error reporting service
        console.log(error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return react_1.default.createElement("h1", null, "Something went wrong.");
        }
        return this.props.children;
    }
}
exports.default = ErrorBoundary;
//# sourceMappingURL=PdfPageErrorBoundary.js.map