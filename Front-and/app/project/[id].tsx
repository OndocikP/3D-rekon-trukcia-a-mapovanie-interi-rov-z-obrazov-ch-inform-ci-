import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';

import { layout } from '../../src/theme/layout';
import AppButton from '../../src/components/AppButton';
import { useColors } from '../../src/theme/ColorsProvider';
import { useAuth } from '../../src/context/AuthContext';
import * as apiClient from '../../src/api/client';

export default function ProjectDetailScreen() {
  const { colors } = useColors();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [project, setProject] = useState<apiClient.Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [id, token]);

  const loadProject = async () => {
    if (!id || !token) {
      Alert.alert('Chyba', 'Projekt ID alebo token chýba');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.getProject(id, token);
      if (response.data) {
        setProject(response.data);
      } else {
        Alert.alert('Chyba', response.error || 'Nepodarilo sa načítať projekt');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert('Chyba', error instanceof Error ? error.message : 'Neznáma chyba');
    } finally {
      setLoading(false);
    }
  };

  const projectName = project?.project_name ?? 'Project';

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const isWeb = Platform.OS === 'web';

  const imageStyle = isWeb
    ? { width: Math.min(screenWidth * 0.5, 500), height: Math.min(screenWidth * 0.5, 500) }
    : { width: screenWidth - layout.padding * 2, height: (screenWidth - layout.padding * 2) * 0.75 };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
        </View>
      ) : !project ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            Projekt sa nepodarilo načítať
          </Text>
          <AppButton
            title="Späť"
            onPress={() => router.replace('/main')}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>

            {/* HEADER */}
            <View style={styles.headerRow}>
              <Text style={[styles.logoIcon, { color: colors.textPrimary }]}>⌁</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{projectName}</Text>
            </View>

            {/* PREVIEW IMAGE */}
            <View
              style={[
                styles.imageWrapper,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                imageStyle,
              ]}
            >
              <Image
                source={require('../../src/assets/sample-room.png')}
                style={styles.roomImage}
                resizeMode="cover"
              />
            </View>

            {/* INFO CARD */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                Object in room:
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                1x TV, 2x Sofa, 4x Table, 1x Plant, ...
              </Text>
            </View>

            {/* BUTTONS */}
            <View style={styles.buttonRow}>
              <AppButton
                icon="edit"
                title="Edit"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: `/project/${id}/edit`,
                    params: { name: projectName },
                  })
                }
              />
              <AppButton
                icon="home"
                title="Main"
                onPress={() => router.replace('/main')}
              />
            </View>

          </View>
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.padding,
  },

  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },

  scroll: {
    flexGrow: 1,
    padding: layout.padding,
    alignItems: 'center',
  },

  content: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },

  logoIcon: {
    fontSize: 28,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
  },

  imageWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  roomImage: {
    width: '100%',
    height: '100%',
  },

  infoCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    width: '100%',
    maxWidth: 600,
  },

  infoTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },

  infoText: {
    lineHeight: 18,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
});
