import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import ProjectCard from '../components/ProjectCard';

// ✅ COLORS Z PROVIDERU
import { useColors } from '../theme/ColorsProvider';

const folderIcon = require('../assets/folder.png');

const PROJECTS = [
  { id: '1', name: 'Project 1', icon: folderIcon },
  { id: '2', name: 'Project 2', icon: folderIcon },
  { id: '3', name: 'Kuchyňa', icon: folderIcon },
  { id: '4', name: 'Kúpeľňa', icon: folderIcon },
  { id: '5', name: 'Project 32', icon: folderIcon },
];

const logOut = () => {
  router.replace('/login');
};

export default function MainScreen() {
  const { colors } = useColors();

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
          variant="secondary"
          title="New project"
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
        <View style={styles.projectsGrid}>
          {PROJECTS.map((item) => (
            <ProjectCard
              key={item.id}
              name={item.name}
              onPress={() => router.push(`/project/${item.id}`)}
            />
          ))}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <AppButton
          title="Log out"
          variant="secondary"
          onPress={logOut}
        />
        <AppButton
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
    paddingVertical: 20,
    borderWidth: 1,
  },

  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 24,
    alignItems: 'flex-start',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
