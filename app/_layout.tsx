import { Stack } from 'expo-router';
import { AuthProvider, AlertProvider } from '@/template';

export default function RootLayout() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen 
            name="trip/[id]" 
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: '#0A0E17' },
              headerTintColor: '#F9FAFB',
              title: 'Trip Details',
            }} 
          />
        </Stack>
      </AuthProvider>
    </AlertProvider>
  );
}
