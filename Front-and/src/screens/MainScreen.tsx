import React from 'react';
import { View, Text, StyleSheet,Image  } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

import AppButton from '../components/AppButton';
import ProjectCard from '../components/ProjectCard';

const folderIcon = require('../assets/folder.png');

const PROJECTS = [
  { id: '1', name: 'Project 1', icon: folderIcon },
  { id: '2', name: 'Project 2', icon: folderIcon },
  { id: '3', name: 'Kuchyňa',   icon: folderIcon },
  { id: '4', name: 'Kúpeľňa',   icon: folderIcon },
  { id: '5', name: 'Project 32',icon: folderIcon },
];

const logOut = () => {
  router.replace('/login');
};

export default function MainScreen() {
  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <AppButton
          title="New project"
          onPress={() => router.push('/project/new')}
        />
      </View>

      {/* ZÓNA S PROJEKTAMI */}
      <View style={styles.projectsCard}>
        <View style={styles.projectsGrid}>
          {PROJECTS.map((item) => (
            <ProjectCard
              key={item.id}
              name={item.name}
              /*icon={item.icon}*/
              onPress={() => router.push(`/project/${item.id}`)}
            />
          ))}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <AppButton
          title="Settings"
          variant="secondary"
          onPress={() => console.log('Settings')}
        />
        <AppButton
          title="Log out"
          variant="secondary"
          onPress={logOut}
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
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },

  projectsCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 24,
    paddingVertical: 20,
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
