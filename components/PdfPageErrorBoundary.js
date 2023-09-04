import React from "react";
class ErrorBoundary extends React.Component {
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
            return React.createElement("h1", null, "Something went wrong.");
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
//# sourceMappingURL=PdfPageErrorBoundary.js.map