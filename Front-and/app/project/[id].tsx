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
import { API_BASE_URL } from '../../src/api/client';

export default function ProjectDetailScreen() {
  const { colors } = useColors();
  const { token, user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [media, setMedia] = useState<apiClient.ProjectMedia | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [project, setProject] = useState<apiClient.Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id, token, user]);

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
        setMedia({ videos: [], models: [], images: [], has_media: false, priority: null });
      }
    } catch (error) {
      console.error('[PROJECT] Error loading media:', error);
      setMedia({ videos: [], models: [], images: [], has_media: false, priority: null });
    } finally {
      setLoadingMedia(false);
    }
  };

  const projectName = project?.project_name ?? (id ? `Project ${id.substring(0, 8)}` : 'Project');

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const isWeb = Platform.OS === 'web';

  const handleDownload = async () => {
    if (!id || !token || !user?.id) {
      Alert.alert('Chyba', 'Project ID, user ID alebo token chýba');
      return;
    }

    try {
      setDownloading(true);
      console.log(`📦 Začínam download 3D modelu pre projekt: ${id}, user: ${user.id}`);
      
      const downloadUrl = `${API_BASE_URL}/api/projects/${user.id}/${id}/3d-model/download-all`;
      
      console.log(`🌐 URL: ${downloadUrl}`);

      // Vytvor bezpečný názov súboru bez medzier a špeciálnych znakov
      const safeProjectName = projectName
        .replace(/\s+/g, '_')  // Nahraď medzery podčiarkami
        .replace(/[^\w\-]/g, '') // Odstráň špeciálne znaky
        .substring(0, 50); // Limit na 50 znakov

      const zipFileName = `${safeProjectName}_3Dmodel.zip`;

      if (isWeb) {
        // WEB DOWNLOAD: Fetch ZIP a trigger browser download
        console.log('🌐 Web download...');
        const response = await fetch(downloadUrl);
        
        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Vytvor virtuálny <a> element a simuluj klik
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = zipFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        console.log(`✅ ZIP stiahnutý v prehliadači: ${zipFileName}`);
        Alert.alert('Úspech', 'ZIP bol stiahnutý');
      } else {
        // MOBILE DOWNLOAD: Použi expo-file-system
        console.log('📱 Mobile download...');
        const fileUri = `${FileSystem.documentDirectory}${zipFileName}`;
        
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
        <View style={styles.mainLayout}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <Text style={[styles.logoIcon, { color: colors.textPrimary }]}>⌁</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{projectName}</Text>
          </View>

          {/* THREE COLUMNS - Media Viewer (handles left/middle/right panels) */}
          {loadingMedia ? (
            <View style={[styles.mediaContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <ActivityIndicator size="large" color={colors.textPrimary} />
            </View>
          ) : media?.videos && media.videos.length > 0 ? (
            <View style={styles.mediaContainer}>
              <MediaViewer
                projectId={id || ''}
                token={token || ''}
                width={screenWidth - 48}
                height={screenHeight * 0.55}
              />
            </View>
          ) : media?.models && media.models.length > 0 ? (
            <View style={styles.mediaContainer}>
              <MediaViewer
                projectId={id || ''}
                token={token || ''}
                width={screenWidth - 48}
                height={screenHeight * 0.55}
              />
            </View>
          ) : media?.images && media.images.length > 0 ? (
            <View style={[styles.mediaContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder, width: screenWidth / 3 }]}>
              <Image
                source={{ uri: `${API_BASE_URL}/api/projects/${id}/media/image/${media.images[0].filename}` }}
                style={[
                  styles.roomImage,
                  { width: '100%', height: screenHeight * 0.55 }
                ]}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={[styles.mediaContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder, width: screenWidth / 3 }]}>
              <Image
                source={require('../../src/assets/sample-room.png')}
                style={[
                  styles.roomImage,
                  { width: '100%', height: screenHeight * 0.55 }
                ]}
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
              style={{ flex: 0.5, minWidth: 45 }}
            />
            <AppButton
              icon="download"
              title="Download"
              variant="secondary"
              disabled={downloading || !media?.has_media}
              onPress={handleDownload}
              style={{ flex: 0.6, minWidth: 65 }}
            />
            <AppButton
              icon="home"
              title="Main"
              onPress={() => router.replace('/main')}
              style={{ flex: 0.5, minWidth: 45 }}
            />
          </View>

        </View>
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

  mainLayout: {
    flex: 1,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
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

  mediaContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
    maxWidth: 400,
  },
});
