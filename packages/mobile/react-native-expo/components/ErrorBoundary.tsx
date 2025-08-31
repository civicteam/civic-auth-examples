import React from "react";
import { View, Text, ScrollView } from "react-native";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.log("=== ErrorBoundary caught error ===");
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);

    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log("=== componentDidCatch ===");
    console.log("Error:", error);
    console.log("Error Info:", errorInfo);
    console.log("Component Stack:", errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 20, paddingTop: 100 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            Something went wrong
          </Text>
          <ScrollView>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>
              {this.state.error?.toString()}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "monospace" }}>
              {this.state.error?.stack}
            </Text>
            {this.state.errorInfo && (
              <Text
                style={{ fontSize: 12, fontFamily: "monospace", marginTop: 20 }}
              >
                Component Stack: {this.state.errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
