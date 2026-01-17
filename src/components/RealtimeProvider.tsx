// RealtimeProvider - Wraps the app to provide WebSocket connectivity
import React, { createContext, useContext, ReactNode } from 'react';
import { useRealtime } from '../hooks/useRealtime';

interface RealtimeContextValue {
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  connectionError: null,
  reconnect: async () => {},
});

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const realtime = useRealtime({
    showNotifications: true,
    vibrateOnUpdate: false,
  });

  return (
    <RealtimeContext.Provider value={realtime}>
      {children}
    </RealtimeContext.Provider>
  );
}

export default RealtimeProvider;
