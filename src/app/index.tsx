import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Route based on user role
  const userRole = user?.roles?.[0] || user?.role || 'employee';

  if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'sales_admin') {
    return <Redirect href="/(admin)" />;
  } else if (userRole === 'manager' || userRole === 'team_lead' || userRole === 'sales_manager' || userRole === 'pt_manager') {
    return <Redirect href="/(manager)" />;
  } else {
    return <Redirect href="/(employee)" />;
  }
}
