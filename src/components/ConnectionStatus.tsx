// ConnectionStatus - Shows real-time connection status indicator
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeContext } from './RealtimeProvider';

interface ConnectionStatusProps {
  compact?: boolean;
}

export function ConnectionStatus({ compact = false }: ConnectionStatusProps) {
  const { isConnected, connectionError, reconnect } = useRealtimeContext();

  if (compact) {
    return (
      <View style={[styles.compactContainer, isConnected ? styles.connected : styles.disconnected]}>
        <View style={[styles.dot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, isConnected ? styles.connected : styles.disconnected]}
      onPress={!isConnected ? reconnect : undefined}
      disabled={isConnected}
    >
      <Ionicons
        name={isConnected ? 'cloud-done' : 'cloud-offline'}
        size={16}
        color={isConnected ? '#10B981' : '#EF4444'}
      />
      <Text style={[styles.text, isConnected ? styles.textConnected : styles.textDisconnected]}>
        {isConnected ? 'Live' : connectionError || 'Offline'}
      </Text>
      {!isConnected && (
        <Ionicons name="refresh" size={14} color="#EF4444" style={styles.refreshIcon} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compactContainer: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connected: {
    backgroundColor: '#10B98120',
  },
  disconnected: {
    backgroundColor: '#EF444420',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnected: {
    backgroundColor: '#10B981',
  },
  dotDisconnected: {
    backgroundColor: '#EF4444',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  textConnected: {
    color: '#10B981',
  },
  textDisconnected: {
    color: '#EF4444',
  },
  refreshIcon: {
    marginLeft: 4,
  },
});

export default ConnectionStatus;
