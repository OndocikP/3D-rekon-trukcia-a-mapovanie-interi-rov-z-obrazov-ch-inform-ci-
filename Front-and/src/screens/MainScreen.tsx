import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import ProjectCard from '../components/ProjectCard';
import { useColors } from '../theme/ColorsProvider';

// Import loga pre web/React Native
import logoImage from '../assets/logo.png';

const folderIcon = require('../assets/folder.png');

const PROJECTS = [
  { id: '1', name: 'Project 1', icon: folderIcon },
  { id: '2', name: 'Project 2', icon: folderIcon },
  { id: '3', name: 'Kuchyňa', icon: folderIcon },
  { id: '4', name: 'Kúpeľňa', icon: folderIcon },
  { id: '5', name: 'Project 32', icon: folderIcon },
  { id: '6', name: 'Project 33', icon: folderIcon },
  { id: '7', name: 'Project 34', icon: folderIcon },
  { id: '8', name: 'Project 35', icon: folderIcon },
  { id: '9', name: 'Project 36', icon: folderIcon },
];

const logOut = () => {
  router.replace('/login');
};

export default function MainScreen() {
  const { colors, themeName } = useColors();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isLandscape = screenWidth > screenHeight;

  if (isLandscape) {
    return (
      <LinearGradient
        colors={[colors.gradientTop, colors.gradientBottom]}
        style={[styles.container, { flexDirection: 'row', gap: 40, padding: 40 }]}
      >
        {/* LEFT SIDE - Projects */}
        <View style={{ flex: 2 }}>
          <Text style={[styles.title, { color: colors.textPrimary, marginBottom: 16 }]}>Projects</Text>
          <View
            style={[
              styles.projectsCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder, height: '100%' },
            ]}
          >
            <ScrollView contentContainerStyle={styles.projectsGrid}>
              {PROJECTS.map((item) => (
                <ProjectCard
                  key={item.id}
                  name={item.name}
                  onPress={() => router.push(`/project/${item.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* RIGHT SIDE - Logo + Buttons */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
          {/* Logo */}
          <Image
            source={logoImage}
            style={[
              { width: 350, height: 350, marginBottom: 30 },
              themeName === 'black' && styles.logoInverted, // invertovanie loga pri dark mode
            ]}
            resizeMode="contain"
          />

          {/* Buttons stacked vertically */}
          <View style={{ width: '80%', gap: 16 }}>
            <AppButton
              icon="add"
              title="New project"
              variant="secondary"
              onPress={() => router.push('/project/new')}
            />
            <AppButton
              icon="settings"
              title="Settings"
              variant="secondary"
              onPress={() => router.push('/settings')}
            />
            <AppButton
              icon="logout"
              title="Logout"
              variant="secondary"
              onPress={logOut}
            />
          </View>
        </View>
      </LinearGradient>
    );
  }

  // PORTRAIT MODE
  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Projects
        </Text>
        <AppButton
          icon="add"
          title="New project"
          variant="secondary"
          onPress={() => router.push('/project/new')}
        />
      </View>

      {/* PROJECTS ZONE */}
      <View
        style={[
          styles.projectsCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.projectsGrid}>
          {PROJECTS.map((item) => (
            <ProjectCard
              key={item.id}
              name={item.name}
              onPress={() => router.push(`/project/${item.id}`)}
            />
          ))}
        </ScrollView>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <AppButton
          icon="logout"
          variant="secondary"
          onPress={logOut}
        />
        <AppButton
          icon="settings"
          title="Settings"
          variant="secondary"
          onPress={() => router.push('/settings')}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: layout.padding,
    paddingTop: 40,
    paddingBottom: 24,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
  },

  projectsCard: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    gap: 16,
    alignItems: 'flex-start',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  logoInverted: {
    tintColor: '#fff',
  },

});
