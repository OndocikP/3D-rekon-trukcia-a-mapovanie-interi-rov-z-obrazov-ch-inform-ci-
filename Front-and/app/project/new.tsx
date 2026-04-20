import React, { useState } from 'react';
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
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { layout } from '../../src/theme/layout';
import { useColors } from '../../src/theme/ColorsProvider';
import { useAuth } from '../../src/context/AuthContext';
import * as apiClient from '../../src/api/client';

type PickedImage = {
  uri: string;
};

export default function ProjectNewScreen() {
  const { colors } = useColors();
  const { token } = useAuth();

  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Please allow access to photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 12,
      quality: 1,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map(a => ({ uri: a.uri }))]);
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  const goHome = () => router.replace('/(tabs)');

  const goGenerate = async () => {
    if (!projectName.trim()) {
      Alert.alert('Chyba', 'Zadaj meno projektu');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Chyba', 'Pridaj aspoň jeden obrázok');
      return;
    }

    if (!token) {
      Alert.alert('Chyba', 'Token nie je dostupný');
      return;
    }

    setLoading(true);
    try {
      // 1. Vytvor projekt
      const projectResponse = await apiClient.createProject(
        { project_name: projectName, description },
        token
      );

      if (!projectResponse.data) {
        Alert.alert('Chyba', projectResponse.error || 'Nepodarilo sa vytvoriť projekt');
        return;
      }

      const projectId = projectResponse.data.id;

      // 2. Nahraj obrázky
      setUploading(true);
      let successCount = 0;
      let failedCount = 0;
      const failedImages: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        try {
          console.log(`[${i + 1}/${images.length}] Nahrávam obrázok...`);
          
          // Konvertuj URI na File
          const response = await fetch(image.uri);
          const blob = await response.blob();
          const file = new File([blob], `image-${i + 1}.jpg`, { type: 'image/jpeg' });

          const uploadResponse = await apiClient.uploadProjectImage(
            projectId,
            file,
            token
          );

          if (uploadResponse.data) {
            console.log(`✓ Obrázok ${i + 1} úspešne nahraný:`, uploadResponse.data.filename);
            successCount++;
          } else {
            console.error(`✗ Chyba pri nahraní obrázka ${i + 1}:`, uploadResponse.error);
            failedImages.push(`Obrázok ${i + 1}: ${uploadResponse.error}`);
            failedCount++;
          }
        } catch (err) {
          console.error(`✗ Exception pri obrázku ${i + 1}:`, err);
          failedImages.push(`Obrázok ${i + 1}: ${err instanceof Error ? err.message : 'Neznáma chyba'}`);
          failedCount++;
        }
      }

      setUploading(false);
      console.log(`✓ Priebeh: ${successCount} OK, ${failedCount} FAILED z ${images.length} obrázkov`);
      
      let statusMessage = `Úspech! ${successCount}/${images.length} obrázkov nahraných.`;
      if (failedCount > 0) {
        statusMessage += `\n\n❌ Zlyhalo: ${failedCount}\n${failedImages.join('\n')}`;
      }
      
      Alert.alert(
        successCount === images.length ? 'Úspech' : 'Čiastočný úspech',
        statusMessage
      );

      // Presmeruj na generate alebo project detail
      router.push(`/project/${projectId}`);
    } catch (error) {
      Alert.alert('Chyba', error instanceof Error ? error.message : 'Neznáma chyba');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <Text style={[styles.header, { color: colors.textPrimary }]}>
        New Project
      </Text>

      {/* PROJECT NAME */}
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
        autoFocus
        editable={!loading && !uploading}
      />

      {/* DESCRIPTION */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Description (optional)
      </Text>

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Project description"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.textPrimary,
            borderColor: colors.cardBorder,
          },
        ]}
        multiline
        editable={!loading && !uploading}
      />

      {/* UPLOAD */}
      <Pressable
        style={[
          styles.uploadBtn,
          {
            backgroundColor: colors.secondary,
            opacity: loading || uploading ? 0.5 : 1,
          },
        ]}
        onPress={pickImages}
        disabled={loading || uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={colors.buttonText} />
        ) : (
          <Text style={[styles.uploadText, { color: colors.buttonText }]}>
            Upload files
          </Text>
        )}
      </Pressable>

      {/* COUNT */}
      <Text style={[styles.countText, { color: colors.textSecondary }]}>
        Uploaded: {images.length} {uploading && '(uploading)'}
      </Text>

      {/* IMAGES GRID */}
      <FlatList
        data={images}
        keyExtractor={(item) => item.uri}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => removeImage(item.uri)}
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

      {/* FOOTER */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.footerBtn,
            {
              backgroundColor: colors.primary,
              opacity: loading || uploading ? 0.5 : 1,
            },
          ]}
          onPress={goHome}
          disabled={loading || uploading}
        >
          <Text style={[styles.footerBtnText, { color: colors.buttonText }]}>
            Home
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.footerBtn,
            {
              backgroundColor: colors.primary,
              opacity:
                projectName.trim() && images.length > 0 && !loading && !uploading
                  ? 1
                  : 0.5,
            },
          ]}
          onPress={goGenerate}
          disabled={
            !projectName.trim() ||
            images.length === 0 ||
            loading ||
            uploading
          }
        >
          {loading || uploading ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <Text style={[styles.footerBtnText, { color: colors.buttonText }]}>
              {loading ? 'Creating...' : uploading ? 'Uploading...' : 'Generate'}
            </Text>
          )}
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

  footerBtnText: {
    fontWeight: '900',
  },
});
