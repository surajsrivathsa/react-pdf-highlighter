import React from "react";
type ErrorBoundaryProps = {
    children: React.ReactNode;
};
type ErrorBoundaryState = {
    hasError: boolean;
};
declare class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: {
        hasError: boolean;
    };
    static getDerivedStateFromError(error: any): {
        hasError: boolean;
    };
    componentDidCatch(error: any, errorInfo: any): void;
    render(): string | number | boolean | Iterable<React.ReactNode> | React.JSX.Element | null | undefined;
}
export default ErrorBoundary;
