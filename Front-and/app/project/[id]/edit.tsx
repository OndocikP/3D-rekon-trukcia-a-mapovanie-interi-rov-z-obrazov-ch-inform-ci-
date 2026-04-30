import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { layout } from '../../../src/theme/layout';
import { useColors } from '../../../src/theme/ColorsProvider';
import { useAuth } from '../../../src/context/AuthContext';
import * as api from '../../../src/api/client';

type ProjectImage = { 
  id: string; 
  uri: string; 
  isFromBackend?: boolean;
};

export default function ProjectEditScreen() {
  const { colors } = useColors();
  const { token } = useAuth();

  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const id = params.id ?? '';

  const PROJECTS: Record<string, string> = {
    '1': 'Project 1',
    '2': 'Project 2',
    '3': 'Kuchyňa',
    '4': 'Kúpeľňa',
    '5': 'Project 32',
  };

  const initialName = useMemo(() => {
    return (params.name ? String(params.name) : PROJECTS[id]) ?? 'Project';
  }, [params.name, id]);

  const [projectName, setProjectName] = useState('');
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setProjectName(initialName);
    loadProjectImages();
  }, [initialName, id, token]);

  /**
   * Načítaj obrázky projektu z backendu
   */
  const loadProjectImages = async () => {
    if (!token) return;
    
    setIsLoading(true);
    const result = await api.getProjectImages(id, token);
    
    if (result.data?.images) {
      const backendImages = result.data.images.map((filename) => ({
        id: filename,
        uri: api.getProjectImageUrl(id, filename, token),
        isFromBackend: true,
      }));
      setImages(backendImages);
    }
    setIsLoading(false);
  };

  /**
   * Vyber obrázky a nahraj ich na backend
   */
  const pickImages = async () => {
    if (!token) {
      Alert.alert('Chyba', 'Musíš byť prihlásený');
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Povolenie', 'Prosím, dovolí prístup k fotám.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 12,
      quality: 1,
    });

    if (!result.canceled) {
      uploadImages(result.assets);
    }
  };

  /**
   * Nahraj obrázky na backend
   */
  const uploadImages = async (assets: any[]) => {
    setIsUploading(true);
    let uploadedCount = 0;

    for (const asset of assets) {
      try {
        // Prekonvertuj URI na File objekt
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const file = new File([blob], asset.fileName || 'image.jpg', {
          type: blob.type,
        });

        const uploadResult = await api.uploadProjectImage(id, file, token!);

        if (uploadResult.data && uploadResult.data.filename) {
          // Pridaj obrázok do zoznamu
          setImages((prev) => [
            ...prev,
            {
              id: uploadResult.data!.filename,
              uri: api.getProjectImageUrl(id, uploadResult.data!.filename, token!),
              isFromBackend: true,
            },
          ]);
          uploadedCount++;
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setIsUploading(false);
    if (uploadedCount > 0) {
      Alert.alert(
        'Úspech',
        `${uploadedCount} obrázkov bolo nahraných`
      );
    }
  };

  const removeImage = async (imageId: string, isFromBackend: boolean) => {
    // TODO: Implementuj vymazanie obrázka z backendu
    setImages((prev) => prev.filter((x) => x.id !== imageId));
  };

  const handleDeleteProject = () => {
    console.log('🗑️  handleDeleteProject called');
    console.log('Token:', token ? 'Exists' : 'MISSING');
    console.log('Project ID:', id);
    console.log('Project Name:', projectName);
    
    // Na web platforme použi window.confirm namiesto Alert.alert
    const confirmed = window.confirm(
      `Are you sure you want to remove "${projectName}"?\n\nThis action cannot be undone. All images and data will be deleted permanently from the server.`
    );
    
    if (!confirmed) {
      console.log('User cancelled deletion');
      return;
    }

    // Pokračuj v mazaní
    deleteProjectConfirmed();
  };

  const deleteProjectConfirmed = async () => {
    console.log('Delete confirmed - proceeding with deletion');
    if (!token || !id) {
      console.log('ERROR: Missing token or id');
      window.alert('Error: Missing token or project ID');
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Calling deleteProject API...');
      const response = await api.deleteProject(id, token);
      console.log('API Response:', response);
      if (response.error) {
        window.alert(`Error: ${response.error}`);
      } else {
        window.alert('Project removed successfully');
        goHome();
      }
    } catch (err) {
      console.error('Delete error:', err);
      window.alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete project'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const goHome = () => router.replace('/main');

  const goGenerate = () => {
    router.push({
      pathname: '/generate',
      params: {
        id,
        name: projectName,
        images: JSON.stringify(images),
      },
    });
  };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <Text style={[styles.header, { color: colors.textPrimary }]}>
        Edit Project
      </Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Project name
      </Text>

      <TextInput
        value={projectName}
        onChangeText={setProjectName}
        placeholder="Project name"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.textPrimary,
            borderColor: colors.cardBorder,
          },
        ]}
      />

      <Pressable
        style={[
          styles.uploadBtn,
          { backgroundColor: colors.secondary, opacity: isUploading ? 0.6 : 1 },
        ]}
        onPress={pickImages}
        disabled={isUploading}
      >
        <Text style={[styles.uploadText, { color: colors.buttonText }]}>
          {isUploading ? 'Uploading...' : 'Upload files'}
        </Text>
      </Pressable>

      <Text style={[styles.countText, { color: colors.textSecondary }]}>
        Uploaded: {images.length}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.textPrimary} />
      ) : (
        <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => removeImage(item.id, item.isFromBackend || false)}
            style={styles.thumbWrap}
          >
            <Image
              source={{ uri: item.uri }}
              style={[styles.thumb, { backgroundColor: colors.card }]}
            />
            <Text style={[styles.removeHint, { color: colors.textSecondary }]}>
              hold to remove
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No images yet. Tap “Upload files”.
          </Text>
        }
      />
      )}

      {/* FOOTER */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.footerBtn, { backgroundColor: colors.card }]}
          onPress={goHome}
        >
          <Text style={[styles.footerBtnText, { color: colors.textPrimary }]}>
            Home
          </Text>
        </Pressable>

        <Pressable
          style={[styles.deleteFooterBtn, { backgroundColor: '#dc2626' }]}
          onPress={handleDeleteProject}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={[styles.footerBtnText, { color: '#ffffff' }]}>
              Remove
            </Text>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.footerBtn,
            {
              backgroundColor: colors.primary,
              opacity: projectName.trim() ? 1 : 0.6,
            },
          ]}
          onPress={goGenerate}
          disabled={!projectName.trim()}
        >
          <Text style={[styles.footerBtnText, { color: colors.buttonText }]}>
            Save
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: layout.padding,
    paddingTop: 42,
  },

  header: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },

  label: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
  },

  input: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
  },

  uploadBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  uploadText: {
    fontWeight: '800',
  },

  countText: {
    marginBottom: 10,
  },

  grid: {
    paddingBottom: 90,
  },

  thumbWrap: {
    width: '33.333%',
    padding: 6,
  },

  thumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },

  removeHint: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 10,
    textAlign: 'center',
  },

  footer: {
    position: 'absolute',
    left: layout.padding,
    right: layout.padding,
    bottom: 18,
    flexDirection: 'row',
    gap: 12,
  },

  footerBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteFooterBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerBtnText: {
    fontWeight: '900',
  },
});
