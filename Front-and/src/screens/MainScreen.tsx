import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import ProjectCard from '../components/ProjectCard';
import { useColors } from '../theme/ColorsProvider';
import { useAuth } from '../context/AuthContext';
import * as apiClient from '../api/client';

export default function MainScreen() {
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
      if (!token || !user) {
        Alert.alert('Chyba', 'Token alebo user nie sú dostupné');
        return;
      }

      const response = await apiClient.getUserProjects(user.id, token);
      if (response.data && Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        setProjects([]);
        if (response.error) {
          Alert.alert('Chyba', response.error);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
      Alert.alert('Chyba', error instanceof Error ? error.message : 'Neznáma chyba');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

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
          title="Logout"
          variant="secondary"
          onPress={handleLogout}
        />
        <AppButton
          icon="add"
          title="New"
          variant="secondary"
          onPress={() => router.push('/project/new')}
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
    paddingHorizontal: 80,
    paddingVertical: layout.padding,
    paddingTop: 40,
    paddingBottom: 20,
  },

  userInfo: {
    marginBottom: 20,
  },

  userGreeting: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  projectsCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    gap: 12,
    alignItems: 'flex-start',
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
});

