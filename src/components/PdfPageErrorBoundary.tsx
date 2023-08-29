import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode; // Define the children prop
};

type ErrorBoundaryState = {
  hasError: boolean;
};


class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>  {
  state = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can log the error to an error reporting service
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


