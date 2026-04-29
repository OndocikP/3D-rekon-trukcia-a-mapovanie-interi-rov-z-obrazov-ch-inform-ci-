import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';

import { layout } from '../../src/theme/layout';
import AppButton from '../../src/components/AppButton';
import { ThreeDViewer } from '../../src/components/ThreeDViewer';
import { useColors } from '../../src/theme/ColorsProvider';
import { useAuth } from '../../src/context/AuthContext';
import * as apiClient from '../../src/api/client';

export default function ProjectDetailScreen() {
  const { colors } = useColors();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [project, setProject] = useState<apiClient.Project | null>(null);
  const [model3D, setModel3D] = useState<apiClient.Model3DInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingModel, setLoadingModel] = useState(false);

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
        // Skontroluj 3D model
        load3DModel(id, token);
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

  const load3DModel = async (projectId: string, userToken: string) => {
    try {
      setLoadingModel(true);
      console.log(`[PROJECT] Checking 3D model for project: ${projectId}`);
      const response = await apiClient.check3DModel(projectId, userToken);
      console.log('[PROJECT] 3D Model check response:', response);
      if (response.data) {
        console.log(`[PROJECT] 3D Model info:`, response.data);
        setModel3D(response.data);
        if (response.data.exists) {
          console.log(`[PROJECT] ✅ 3D Model exists - URL will be: ${apiClient.get3DModelUrl(projectId, userToken)}`);
        } else {
          console.log(`[PROJECT] ℹ️ No 3D model for this project yet`);
        }
      } else {
        console.warn('[PROJECT] No data in response:', response.error);
      }
    } catch (error) {
      console.error('[PROJECT] Error loading 3D model:', error);
    } finally {
      setLoadingModel(false);
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

            {/* 3D MODEL OR IMAGE */}
            {loadingModel ? (
              <View
                style={[
                  styles.imageWrapper,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  imageStyle,
                ]}
              >
                <ActivityIndicator size="large" color={colors.textPrimary} />
              </View>
            ) : model3D?.exists ? (
              <View
                style={[
                  styles.imageWrapper,
                  { borderColor: colors.cardBorder },
                  imageStyle,
                ]}
              >
                <ThreeDViewer
                  modelUrl={apiClient.get3DModelUrl(id || '', token || '')}
                  token={token || ''}
                  width={imageStyle.width}
                  height={imageStyle.height}
                />
              </View>
            ) : (
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
            )}

            {/* INFO CARD */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                Status:
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {model3D?.exists ? '✅ 3D Model dostupný' : '📷 Fotky projektu'}
                {project && model3D?.exists && `\t Fotky: ${project.image_count}`}
              </Text>
              {project && (
                <>
                  <Text style={[styles.infoTitle, { color: colors.textPrimary, marginTop: 8 }]}>
                    Object in room:
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary, marginTop: 4 }]}>
                    {project.objects && project.objects !== '' 
                      ? `Objekty: ${project.objects}` 
                      : "Object recognition hasn't been started yet."}
                  </Text>
                </>
              )}
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
