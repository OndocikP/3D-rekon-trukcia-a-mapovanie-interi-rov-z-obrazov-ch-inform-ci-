// app/project/[id].tsx
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';

import { colors } from '../../src/theme/colors';
import { layout } from '../../src/theme/layout';
import AppButton from '../../src/components/AppButton';


export default function ProjectDetailScreen() {

  // neskôr sem kľudne doplníme fetch reálnych dát podľa id
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
        {/* Horný riadok – mini logo + názov */}
        <View style={styles.headerRow}>
          <Text style={styles.logoIcon}>⌁</Text>
          <Text style={styles.title}>{projectName}</Text>
        </View>

        {/* Preview obrázok projektu */}
        <View style={styles.imageWrapper}>
          <Image
            source={require('../../src/assets/sample-room.png')}
            style={styles.roomImage}
            resizeMode="cover"
          />
        </View>

        {/* Karta s info o objekte */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Object in room:</Text>
          <Text style={styles.infoText}>
            1x TV, 2x Sofa, 4x Table, 1x Plant, ...{/* neskôr nahradíme reálnymi dátami */}
          </Text>
        </View>

        {/* Tlačidlá dole */}
        <View style={styles.buttonRow}>
          <AppButton
            title="Edit"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: `/project/${id}/edit`,
                params: { name: projectName },
              })
            }// zatiaľ len pripravené
          />
          <AppButton
            title="Main"
            onPress={() => router.replace('/main')} // späť na hlavnú „Projects“ scénu
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
    color: colors.textPrimary,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  previewImage: {
    width: '100%',
    borderRadius: 16,
    height: 210,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 30,
  },
  infoTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  infoText: {
    color: colors.textSecondary,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
   imageWrapper: {
    width: '100%',
    maxWidth: 1000,      // nech to nie je cez celý ultrawide
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',  // zaoblí aj samotný obrázok
    marginBottom: 20,
  },
  roomImage: {
    width: '100%',
    height: undefined,   // výška sa dopočíta z pomeru strán
    aspectRatio: 16 / 9, // alebo 4/3 podľa obrázka
  },
});
