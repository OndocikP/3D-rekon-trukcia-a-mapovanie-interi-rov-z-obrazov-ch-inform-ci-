<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
=======
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
>>>>>>> 0382b05d008932b8d448808454b0daa9e0bf9cde
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import ProjectCard from '../components/ProjectCard';
import { useColors } from '../theme/ColorsProvider';
import { useAuth } from '../context/AuthContext';
import * as apiClient from '../api/client';

// Import loga pre web/React Native
import logoImage from '../assets/logo.png';

const folderIcon = require('../assets/folder.png');

export default function MainScreen() {
<<<<<<< HEAD
  const { colors } = useColors();
  const { logout, token, user } = useAuth();
  const [projects, setProjects] = useState<apiClient.Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Načítaj projekty na start
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      if (!token) {
        Alert.alert('Chyba', 'Token nie je dostupný');
        return;
      }

      const response = await apiClient.getUserProjects(token);
      if (response.data) {
        setProjects(response.data);
      } else {
        Alert.alert('Chyba', response.error || 'Nepodarilo sa načítať projekty');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Chyba', error instanceof Error ? error.message : 'Neznáma chyba');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };
=======
  const { colors, themeName } = useColors();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isLandscape = screenWidth > screenHeight;
>>>>>>> 0382b05d008932b8d448808454b0daa9e0bf9cde

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
      {/* USER INFO */}
      <View style={styles.userInfo}>
        <Text style={[styles.userGreeting, { color: colors.textSecondary }]}>
          👤 {user?.username || 'User'}
        </Text>
      </View>

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
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Žiadne projekty. Vytvor svoj prvý projekt!
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.projectsGrid}>
            {projects.map((item) => (
              <ProjectCard
                key={item.id}
                name={item.project_name}
                onPress={() => router.push(`/project/${item.id}`)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <AppButton
          icon="logout"
          variant="secondary"
          onPress={handleLogout}
        />
        <AppButton
<<<<<<< HEAD
=======
          icon="settings"
>>>>>>> 0382b05d008932b8d448808454b0daa9e0bf9cde
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

  userInfo: {
    marginBottom: 16,
  },

  userGreeting: {
    fontSize: 16,
    fontWeight: '600',
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

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  logoInverted: {
    tintColor: '#fff',
  },

});
