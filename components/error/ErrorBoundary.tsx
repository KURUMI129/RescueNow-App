import React, { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary. Prevents a single render crash from
 * taking down the whole app — critical for an emergency app where
 * users must keep access to the SOS button even if something else
 * misbehaves.
 *
 * Note: error boundaries DO NOT catch errors inside event handlers,
 * async code, server-side rendering, or errors thrown in the boundary
 * itself. For those we rely on plain try/catch in services and hooks.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // In production this could be wired to a remote logger (Sentry, etc.)
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle" size={56} color="#DC2626" />
        </View>
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.subtitle}>
          La aplicación encontró un error inesperado. Si es una emergencia,
          marca al 911 desde tu teléfono.
        </Text>

        {this.state.error?.message ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText} numberOfLines={4}>
              {this.state.error.message}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={this.handleRetry}
          style={styles.retryBtn}
          accessibilityRole="button"
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B1120",
    padding: 24,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  errorBox: {
    width: "100%",
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    borderLeftWidth: 3,
    borderLeftColor: "#DC2626",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontFamily: "monospace",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DC2626",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
