import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';

import { layout } from '../../src/theme/layout';
import AppButton from '../../src/components/AppButton';
import { useColors } from '../../src/theme/ColorsProvider';

export default function ProjectDetailScreen() {
  const { colors } = useColors();

  const PROJECTS: Record<string, string> = {
    '1': 'Project 1',
    '2': 'Project 2',
    '3': 'Kuchyňa',
    '4': 'Kúpeľňa',
    '5': 'Project 32',
  };

  const { id } = useLocalSearchParams<{ id?: string }>();
  const projectName = PROJECTS[id ?? ''] ?? 'Project';

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const isWeb = Platform.OS === 'web';

  // Veľkosť obrázka: na webe fixná max 500px, na mobile plná šírka s paddingom
  const imageStyle = isWeb
    ? { width: Math.min(screenWidth * 0.5, 500), height: Math.min(screenWidth * 0.5, 500) }
    : { width: screenWidth - layout.padding * 2, height: (screenWidth - layout.padding * 2) * 0.75 }; // pomer 4:3

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
