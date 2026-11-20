import React from "react";
import { StyleSheet, Text, View } from "react-native";

const RESERVED_KEYS = new Set([
  "id",
  "created_time",
  "full_name",
  "email",
  "phone_number",
]);

function formatTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? isoString : date.toLocaleString();
}

function formatFieldLabel(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function LeadCard({ lead }) {
  const extraFields = Object.entries(lead).filter(
    ([key, value]) => !RESERVED_KEYS.has(key) && value !== "" && value != null,
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>
          {lead.full_name || lead.email || "Unnamed Lead"}
        </Text>
        <Text style={styles.time}>{formatTime(lead.created_time)}</Text>
      </View>

      {lead.email ? (
        <Text style={styles.detail}>Email: {lead.email}</Text>
      ) : null}
      {lead.phone_number ? (
        <Text style={styles.detail}>Phone: {lead.phone_number}</Text>
      ) : null}

      {extraFields.map(([key, value]) => (
        <Text key={key} style={styles.detail}>
          {formatFieldLabel(key)}: {String(value)}
        </Text>
      ))}

      <Text style={styles.leadId}>ID: {lead.id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
