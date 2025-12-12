// app/project/[id].tsx
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';

import { layout } from '../../src/theme/layout';
import AppButton from '../../src/components/AppButton';

// ✅ COLORS Z PROVIDERU
import { useColors } from '../../src/theme/ColorsProvider';

export default function ProjectDetailScreen() {
  const { colors } = useColors();

  // fallback dáta (kým nemáš backend)
  const PROJECTS: Record<string, string> = {
    '1': 'Project 1',
    '2': 'Project 2',
    '3': 'Kuchyňa',
    '4': 'Kúpeľňa',
    '5': 'Project 32',
  };

  const { id } = useLocalSearchParams<{ id?: string }>();
  const projectName = PROJECTS[id ?? ''] ?? 'Project';

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={[styles.logoIcon, { color: colors.textPrimary }]}>
            ⌁
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {projectName}
          </Text>
        </View>

        {/* PREVIEW IMAGE */}
        <View
          style={[
            styles.imageWrapper,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
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
            title="Main"
            onPress={() => router.replace('/main')}
          />
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
    padding: layout.padding,
    paddingBottom: 40,
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
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
  },

  roomImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 16 / 9,
  },

  infoCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
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
  },
});
