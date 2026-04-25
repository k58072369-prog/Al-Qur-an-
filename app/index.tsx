import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppStore } from '../src/store/AppStore';
import { useTheme } from '../src/theme';

export default function Index() {
  const { state } = useAppStore();
  const Colors = useTheme();

  if (!state.isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!state.isOnboarded) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Redirect href={'/onboarding' as any} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Redirect href={'/(tabs)/dashboard' as any} />;
}
