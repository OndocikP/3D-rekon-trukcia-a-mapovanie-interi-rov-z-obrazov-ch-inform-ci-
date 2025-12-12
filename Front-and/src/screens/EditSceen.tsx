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

import { useColors } from '../theme/ColorsProvider';

type PickedImage = {
  uri: string;
};

export default function ProjectFormScreen() {
  const { colors } = useColors();
  

  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    images?: string;
  }>();

  const projectId = params.id;
  const isEditMode = useMemo(() => !!projectId, [projectId]);

  const [projectName, setProjectName] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);

  useEffect(() => {
    if (params.name) setProjectName(String(params.name));

    if (params.images) {
      try {
        const parsed = JSON.parse(String(params.images));
        if (Array.isArray(parsed)) {
          setImages(
            parsed
              .map((x) => (typeof x === 'string' ? { uri: x } : { uri: String(x?.uri) }))
              .filter((x) => !!x.uri)
          );
        }
      } catch {}
    }
  }, [params.name, params.images]);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Please allow access to photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 12,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => ({ uri: a.uri }))]);
    }
  };

  const removeImage = (uri: string) =>
    setImages((prev) => prev.filter((x) => x.uri !== uri));

  const goHome = () => router.replace('/main');

  const goGenerate = () => {
    router.push({
      pathname: '/generate',
      params: {
        id: projectId ?? 'new',
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
        {isEditMode ? 'Edit Project' : 'New Project'}
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

      {/* UPLOAD */}
      <Pressable
        style={[styles.uploadBtn, { backgroundColor: colors.secondary }]}
        onPress={pickImages}
      >
        <Text style={[styles.uploadText, { color: colors.buttonText }]}>
          Upload files
        </Text>
      </Pressable>

      <Text style={[styles.countText, { color: colors.textSecondary }]}>
        Uploaded: {images.length}
      </Text>

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
            <Image
              source={{ uri: item.uri }}
              style={[
                styles.thumb,
                { backgroundColor: colors.card },
              ]}
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
          style={[styles.footerBtn, { backgroundColor: colors.card }]}
          onPress={goHome}
        >
          <Text style={[styles.footerBtnText, { color: colors.textPrimary }]}>
            Home
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.footerBtn,
            { backgroundColor: colors.primary, opacity: projectName ? 1 : 0.6 },
          ]}
          onPress={goGenerate}
          disabled={!projectName.trim()}
        >
          <Text style={[styles.footerBtnText, { color: colors.buttonText }]}>
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
    fontWeight: '700',
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
  footerBtnText: {
    fontWeight: '800',
  },
});
