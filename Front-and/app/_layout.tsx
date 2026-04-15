import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ColorsProvider } from '../src/theme/ColorsProvider';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, isLoading, user } = useAuth();

  // Počas načítavania authStatu pokazuj loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isAdmin = isLoggedIn && user?.role === 'admin';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // Neprihlásený user vidí len login a register
          <>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="forgotPassword" options={{ headerShown: false }} />
          </>
        ) : isAdmin ? (
          // Prihlásený admin vidí admin panel
          <>
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="admin-user/[id]" options={{ headerShown: false }} />
          </>
        ) : (
          // Prihlásený user vidí main a tabs
          <>
            <Stack.Screen name="main" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="generate" options={{ headerShown: false }} />
            <Stack.Screen name="project" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ColorsProvider>
        <RootLayoutNav />
      </ColorsProvider>
    </AuthProvider>
  );
}
