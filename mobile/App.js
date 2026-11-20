import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useLeads } from "./hooks/useLeads";
import LeadCard from "./components/LeadCard";

function LeadsScreen() {
  const { leads, connected, loading, refreshing, error, onRefresh } =
    useLeads();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Meta Leads</Text>
          <Text style={styles.subtitle}>
            {leads.length} {leads.length === 1 ? "lead" : "leads"} received
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            connected ? styles.statusOnline : styles.statusOffline,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              connected ? styles.dotOnline : styles.dotOffline,
            ]}
          />
          <Text style={styles.statusText}>
            {connected ? "Live" : "Connecting..."}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && leads.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <LeadCard lead={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Waiting for leads...</Text>
              <Text style={styles.emptySubtitle}>
                Submit a test lead in Meta's Lead Ads Testing Tool to see it
                appear here in real time.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LeadsScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusOnline: {
    backgroundColor: "#DCFCE7",
  },
  statusOffline: {
    backgroundColor: "#FEF3C7",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: "#16A34A",
  },
  dotOffline: {
    backgroundColor: "#D97706",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  errorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
