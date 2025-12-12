import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';

import { colors } from '../src/theme/colors';
import { layout } from '../src/theme/layout';

type PickedImage = { uri: string };

export default function GenerateScreen() {

  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    images?: string;
  }>();

  const projectId = params.id ?? 'temp';
  const projectName = String(params.name ?? 'Project');

  const images: PickedImage[] = (() => {
    try {
      return params.images ? JSON.parse(String(params.images)) : [];
    } catch {
      return [];
    }
  })();

  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    generateProject();
  }, []);

  const generateProject = async () => {
    try {
      // 🔹 TU PRÍDE BACKEND CALL (zatiaľ fake delay)
      console.log('Generating project:', {
        projectId,
        projectName,
        images,
      });

      // simulácia backend práce
      await new Promise((res) => setTimeout(res, 2000));

      setStatus('done');

      // 🔹 po generovaní presun na detail projektu
      router.replace(`/project/${projectId}`);
    } catch (e) {
      setStatus('error');
      Alert.alert('Generation failed', 'Something went wrong.');
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <View style={styles.center}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.text}>Generating project…</Text>
          </>
        )}

        {status === 'error' && (
          <Text style={styles.text}>Generation failed</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: layout.padding,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
