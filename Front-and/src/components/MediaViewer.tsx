import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, ScrollView, Text, TouchableOpacity } from 'react-native';
import * as apiClient from '../api/client';

interface MediaViewerProps {
  projectId: string;
  token: string;
  width: number;
  height: number;
}

type DisplayMode = 'video' | 'model' | 'none';

export const MediaViewer: React.FC<MediaViewerProps> = ({ projectId, token, width, height }) => {
  const [media, setMedia] = useState<apiClient.ProjectMedia | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('none');
  const [loading, setLoading] = useState(true);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  useEffect(() => {
    loadMedia();
  }, [projectId]);

  const loadMedia = async () => {
    try {
      setLoading(false);
      const response = await apiClient.getProjectMedia(projectId);
      console.log('[MEDIA VIEWER] Media loaded:', response.data);
      
      if (response.data) {
        setMedia(response.data);
        
        // Set initial display mode based on priority
        if (response.data.priority === 'video' && response.data.videos.length > 0) {
          setDisplayMode('video');
        } else if (response.data.models.length > 0) {
          setDisplayMode('model');
        } else {
          setDisplayMode('none');
        }
      }
    } catch (error) {
      console.error('[MEDIA VIEWER] Error loading media:', error);
      setMedia({ videos: [], models: [], has_media: false, priority: null });
      setDisplayMode('none');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { width, height }]}>
        <ActivityIndicator size="large" color="#999" />
      </View>
    );
  }

  if (!media || !media.has_media) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.placeholder}>Žiadne médiá dostupné</Text>
      </View>
    );
  }

  const hasVideos = media.videos.length > 0;
  const hasModels = media.models.length > 0;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Main Display Area */}
      <View style={[styles.displayArea, { height: height * 0.85 }]}>
        {displayMode === 'none' && (
          <Text style={styles.placeholder}>Vyberte médiá na zobrazenie</Text>
        )}
        {displayMode === 'video' && hasVideos && (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.placeholder}>
              🎬 Video: {media.videos[selectedVideoIndex]?.filename}
            </Text>
            <Text style={styles.hint}>
              Videá sa nahrávajú v mobilnej aplikácii
            </Text>
          </View>
        )}
        {displayMode === 'model' && hasModels && (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.placeholder}>
              🧊 Model: {media.models[selectedModelIndex]?.filename}
            </Text>
            <Text style={styles.hint}>
              PLY modely sa zobrazujú v mobilnej aplikácii
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <ScrollView style={[styles.controls, { height: height * 0.15 }]} horizontal showsHorizontalScrollIndicator={false}>
        {/* Video Button */}
        {hasVideos && (
          <TouchableOpacity
            style={[
              styles.button,
              displayMode === 'video' && styles.buttonActive,
            ]}
            onPress={() => setDisplayMode('video')}
          >
            <Text style={[styles.buttonText, displayMode === 'video' && styles.buttonTextActive]}>
              🎬 Video ({media.videos.length})
            </Text>
          </TouchableOpacity>
        )}

        {/* Model Button */}
        {hasModels && (
          <TouchableOpacity
            style={[
              styles.button,
              displayMode === 'model' && styles.buttonActive,
            ]}
            onPress={() => setDisplayMode('model')}
          >
            <Text style={[styles.buttonText, displayMode === 'model' && styles.buttonTextActive]}>
              🧊 Model ({media.models.length})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Selection Dropdowns */}
      {displayMode === 'video' && hasVideos && media.videos.length > 1 && (
        <View style={styles.selectorArea}>
          <Text style={styles.selectorLabel}>Video:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {media.videos.map((video, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.selectorItem,
                  selectedVideoIndex === idx && styles.selectorItemActive,
                ]}
                onPress={() => setSelectedVideoIndex(idx)}
              >
                <Text
                  style={[
                    styles.selectorItemText,
                    selectedVideoIndex === idx && styles.selectorItemTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {video.filename}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {displayMode === 'model' && hasModels && media.models.length > 1 && (
        <View style={styles.selectorArea}>
          <Text style={styles.selectorLabel}>Model:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {media.models.map((model, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.selectorItem,
                  selectedModelIndex === idx && styles.selectorItemActive,
                ]}
                onPress={() => setSelectedModelIndex(idx)}
              >
                <Text
                  style={[
                    styles.selectorItemText,
                    selectedModelIndex === idx && styles.selectorItemTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {model.filename}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  displayArea: {
    backgroundColor: '#1e3c72',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholder: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  buttonTextActive: {
    color: 'white',
  },
  selectorArea: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectorLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  selectorItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    marginBottom: 4,
  },
  selectorItemActive: {
    backgroundColor: '#4CAF50',
  },
  selectorItemText: {
    fontSize: 11,
    color: '#333',
  },
  selectorItemTextActive: {
    color: 'white',
  },
});
