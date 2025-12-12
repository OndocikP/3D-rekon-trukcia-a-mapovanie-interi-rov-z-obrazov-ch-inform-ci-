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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

type PickedImage = {
  uri: string;
};

export default function ProjectFormScreen() {
  /**
   * Očakávané parametre (keď ideš do Edit módu):
   * - id: string (voliteľné)
   * - name: string (voliteľné)  -> predvyplní input
   * - images: string (voliteľné) -> JSON.stringify([{uri:"..."}, ...]) alebo JSON.stringify(["uri",...])
   */
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    images?: string;
  }>();

  const projectId = params.id;

  const [projectName, setProjectName] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);

  const isEditMode = useMemo(() => !!projectId, [projectId]);

  useEffect(() => {
    if (params.name) setProjectName(String(params.name));

    if (params.images) {
      try {
        const parsed = JSON.parse(String(params.images));
        // podporí ["uri", ...] aj [{uri:"..."}, ...]
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((x) =>
            typeof x === 'string' ? { uri: x } : { uri: String(x?.uri) }
          );
          setImages(normalized.filter((x) => !!x.uri));
        }
      } catch {
        // ignor
      }
    }
  }, [params.name, params.images]);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Povoľ prístup k fotkám.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 12, // môžeš zmeniť
    });

    if (result.canceled) return;

    const picked = result.assets.map((a) => ({ uri: a.uri }));
    setImages((prev) => [...prev, ...picked]);
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((x) => x.uri !== uri));
  };

  const goHome = () => router.replace('/'); // uprav podľa tvojej home route (napr. '/main')
  const goGenerate = () => {
    // sem pošli čo potrebuješ (id, name, images)
    router.push({
      pathname: '/generate', // uprav podľa route
      params: {
        id: projectId ?? 'new',
        name: projectName,
        images: JSON.stringify(images),
      },
    });
  };

  return (
    <LinearGradient colors={['#8E2DE2', '#1C0F2A']} style={styles.container}>
      <Text style={styles.header}>{isEditMode ? 'Edit Project' : 'New Project'}</Text>

      {/* INPUT */}
      <Text style={styles.label}>Project name</Text>
      <TextInput
        value={projectName}
        onChangeText={setProjectName}
        placeholder="Project name"
        placeholderTextColor="rgba(255,255,255,0.55)"
        style={styles.input}
      />

      {/* UPLOAD */}
      <Pressable style={styles.uploadBtn} onPress={pickImages}>
        <Text style={styles.uploadText}>Upload files</Text>
      </Pressable>

      {/* COUNT */}
      <Text style={styles.countText}>Uploaded: {images.length}</Text>

      {/* THUMBNAILS */}
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
            <Image source={{ uri: item.uri }} style={styles.thumb} />
            <Text style={styles.removeHint}>hold to remove</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No images yet. Tap “Upload files”.</Text>
        }
      />

      {/* BOTTOM BUTTONS */}
      <View style={styles.footer}>
        <Pressable style={[styles.footerBtn, styles.secondary]} onPress={goHome}>
          <Text style={styles.footerBtnText}>Home</Text>
        </Pressable>

        <Pressable
          style={[styles.footerBtn, styles.primary]}
          onPress={goGenerate}
          disabled={!projectName.trim()}
        >
          <Text style={styles.footerBtnText}>
            Generate
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    paddingTop: 42,
  },
  header: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.35)',
    marginBottom: 14,
  },

  uploadBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  uploadText: {
    color: '#fff',
    fontWeight: '700',
  },

  countText: {
    color: 'rgba(255,255,255,0.85)',
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  removeHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.65)',
    marginTop: 10,
  },

  footer: {
    position: 'absolute',
    left: 18,
    right: 18,
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
  primary: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  secondary: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  footerBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});
