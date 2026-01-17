import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CrmLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopColor: '#334155',
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Deals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agent"
        options={{
          title: 'Agent',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      {/* Hide detail/secondary screens from tab bar - accessed via push navigation */}
      <Tabs.Screen
        name="ai"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="caller"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="call-history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="call-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="event-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="calendar-sync"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
