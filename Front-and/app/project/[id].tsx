import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, Platform, ActivityIndicator, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';

import { layout } from '../../src/theme/layout';
import AppButton from '../../src/components/AppButton';
import { MediaViewer } from '../../src/components/MediaViewer';
import { useColors } from '../../src/theme/ColorsProvider';
import { useAuth } from '../../src/context/AuthContext';
import * as apiClient from '../../src/api/client';
import { API_URL } from '../../src/utils/config';

export default function ProjectDetailScreen() {
  const { colors } = useColors();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [media, setMedia] = useState<apiClient.ProjectMedia | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [project, setProject] = useState<apiClient.Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id, token]);

  const loadProject = async () => {
    if (!id || !token) {
      Alert.alert('Chyba', 'Projekt ID alebo token chýba');
      return;
    }

    try {
      setLoadingProject(true);
      
      // Načítaj projekt info z backendu
      const projectResponse = await apiClient.getProjectInfo(id);
      if (projectResponse.data) {
        setProject(projectResponse.data);
        console.log('[PROJECT] Project loaded:', projectResponse.data);
      } else {
        console.warn('[PROJECT] Failed to load project:', projectResponse.error);
        Alert.alert('Upozornenie', 'Nepodarilo sa načítať info o projekte');
      }
      
      // Načítaj médiá (videá a modely)
      await loadMedia(id, token);
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert('Chyba', error instanceof Error ? error.message : 'Neznáma chyba');
    } finally {
      setLoadingProject(false);
    }
  };

  const loadMedia = async (projectId: string, userToken: string) => {
    try {
      setLoadingMedia(true);
      console.log(`[PROJECT] Loading media for project: ${projectId}`);
      const response = await apiClient.getProjectMedia(projectId);
      console.log('[PROJECT] Media check response:', response);
      if (response.data) {
        console.log(`[PROJECT] Media info:`, response.data);
        setMedia(response.data);
        if (response.data.has_media) {
          console.log(`[PROJECT] ✅ Media available`);
        } else {
          console.log(`[PROJECT] ℹ️ No media for this project yet`);
        }
      } else {
        console.warn('[PROJECT] No data in response:', response.error);
        setMedia({ videos: [], models: [], has_media: false, priority: null });
      }
    } catch (error) {
      console.error('[PROJECT] Error loading media:', error);
      setMedia({ videos: [], models: [], has_media: false, priority: null });
    } finally {
      setLoadingMedia(false);
    }
  };

  const projectName = project?.project_name ?? (id ? `Project ${id.substring(0, 8)}` : 'Project');

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const isWeb = Platform.OS === 'web';

  const handleDownload = async () => {
    if (!id || !token) {
      Alert.alert('Chyba', 'Project ID alebo token chýba');
      return;
    }

    try {
      setDownloading(true);
      console.log(`📦 Začínam download 3D modelu pre projekt: ${id}`);
      
      const downloadUrl = `${API_URL}/projects/${id}/3d-model/download-all`;
      
      console.log(`🌐 URL: ${downloadUrl}`);
      
      // Stiahni ZIP
      const fileUri = `${FileSystem.documentDirectory}project_${id}_3dmodel.zip`;
      
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri
      );
      
      if (downloadResult.status === 200) {
        console.log(`✅ ZIP stiahnutý: ${fileUri}`);
        
        // Share/Save ZIP
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/zip',
            dialogTitle: 'Uložiť 3D model',
          });
          console.log(`✅ ZIP zdieľaný`);
        } else {
          Alert.alert('Úspech', `3D model stiahnutý: ${fileUri}`);
        }
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      Alert.alert('Chyba', error instanceof Error ? error.message : 'Nepodarilo sa stiahnuť model');
    } finally {
      setDownloading(false);
    }
  };

  const imageStyle = isWeb
    ? { width: Math.min(screenWidth * 0.5, 500), height: Math.min(screenWidth * 0.5, 500) }
    : { width: screenWidth - layout.padding * 2, height: (screenWidth - layout.padding * 2) * 0.75 };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      {loadingProject ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>

            {/* HEADER */}
            <View style={styles.headerRow}>
              <Text style={[styles.logoIcon, { color: colors.textPrimary }]}>⌁</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{projectName}</Text>
            </View>

            {/* MEDIA VIEWER (VIDEOS + 3D MODELS) */}
            {loadingMedia ? (
              <View
                style={[
                  styles.imageWrapper,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  imageStyle,
                ]}
              >
                <ActivityIndicator size="large" color={colors.textPrimary} />
              </View>
            ) : media?.has_media ? (
              <View
                style={[
                  styles.imageWrapper,
                  { borderColor: colors.cardBorder },
                  imageStyle,
                ]}
              >
                <MediaViewer
                  projectId={id || ''}
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

            {/* INFO CARD WITH DESCRIPTION AND OBJECTS */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              {project?.description ? (
                <View>
                  <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                    Description:
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {project.description}
                  </Text>
                </View>
              ) : null}
              {project?.objects ? (
                <View>
                  <Text style={[styles.infoTitle, { color: colors.textPrimary, marginTop: project?.description ? 8 : 0 }]}>
                    Object in room:
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary, marginTop: 4 }]}>
                    {project.objects}
                  </Text>
                </View>
              ) : null}
              {!project?.description && !project?.objects ? (
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Žiadne informácie k dispozícii
                </Text>
              ) : null}
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
                style={{ flex: 1, minWidth: 90 }}
              />
              <AppButton
                icon="download"
                title="Download"
                variant="secondary"
                disabled={downloading || !media?.has_media}
                onPress={handleDownload}
                style={{ flex: 1.2, minWidth: 130 }}
              />
              <AppButton
                icon="home"
                title="Main"
                onPress={() => router.replace('/main')}
                style={{ flex: 1, minWidth: 90 }}
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
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 800,
  },
});
