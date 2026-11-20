import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  "https://meta-lead-ads-rn-poc.onrender.com";

function mergeLeads(existing, incoming) {
  const byId = new Map();

  for (const lead of existing) {
    byId.set(String(lead.id), lead);
  }
  for (const lead of incoming) {
    byId.set(String(lead.id), lead);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const timeA = new Date(a.created_time || 0).getTime();
    const timeB = new Date(b.created_time || 0).getTime();
    return timeB - timeA;
  });
}

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedOnce = useRef(false);

  const fetchLeads = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${BACKEND_URL}/leads`);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      const data = await res.json();
      setLeads((prev) => mergeLeads(prev, Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || "Failed to load leads");
    } finally {
      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true;
        setLoading(false);
      }
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
      fetchLeads();
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", () => {
      setConnected(false);
    });

    socket.on("new_lead", (lead) => {
      setLeads((prev) => mergeLeads(prev, [lead]));
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchLeads]);

  return {
    leads,
    connected,
    loading,
    refreshing,
    error,
    onRefresh,
  };
}