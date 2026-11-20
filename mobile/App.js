import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
} from "react-native";
import { io } from "socket.io-client";

const BACKEND_URL = "https://meta-lead-ads-rn-poc.onrender.com";

export default function App() {
  const [leads, setLeads] = useState([]);
  const [connected, setConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/leads`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();

    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("new_lead", (lead) => {
      setLeads((prev) => {
        if (prev.some((item) => item.id === lead.id)) {
          return prev;
        }
        return [lead, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchLeads]);

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? isoString : date.toLocaleString();
  };

  const renderLead = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.full_name || "Unnamed Lead"}</Text>
        <Text style={styles.time}>{formatTime(item.created_time)}</Text>
      </View>

      {item.email ? (
        <Text style={styles.detail}>Email: {item.email}</Text>
      ) : null}
      {item.phone_number ? (
        <Text style={styles.detail}>Phone: {item.phone_number}</Text>
      ) : null}
      <Text style={styles.leadId}>ID: {item.id}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      <FlatList
        data={leads}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderLead}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 11,
    color: "#6B7280",
  },
  detail: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  leadId: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
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