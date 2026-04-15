import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '../theme/ColorsProvider';
import AppButton from '../components/AppButton';

interface Project {
  id: string;
  project_name: string;
  status: string;
  description?: string;
  image_count: number;
  created_at: string;
  updated_at: string;
}

interface UserDetail {
  id: string;
  username: string;
  email: string;
  created_at: string;
  projects_count: number;
  projects: Project[];
}

const API_URL = 'http://localhost:8000';

export default function AdminUserScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useColors();

  useEffect(() => {
    if (id) {
      fetchUserData(id as string);
    }
  }, [id]);

  const fetchUserData = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        Alert.alert('Chyba', 'Nemôžem načítať údaje užívateľa');
      }
    } catch (error) {
      Alert.alert('Chyba', 'Problém s pripojením');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'generating':
        return '#2196F3';
      case 'generated':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const renderProjectItem = ({ item }: { item: Project }) => (
    <View style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.projectHeader}>
        <View style={styles.projectInfo}>
          <Text style={[styles.projectName, { color: colors.textPrimary }]} numberOfLines={2}>
            📁 {item.project_name}
          </Text>
          <Text style={[styles.projectDesc, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.description || 'Bez popisu'}
          </Text>
        </View>
      </View>

      <View style={styles.projectStats}>
        <View style={styles.statBadge}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Status</Text>
          <Text
            style={[
              styles.statValue,
              { color: getStatusColor(item.status), fontWeight: 'bold' },
            ]}
          >
            {item.status}
          </Text>
        </View>

        <View style={styles.statBadge}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fotky</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {item.image_count}
          </Text>
        </View>

        <View style={styles.statBadge}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dátum</Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>
            {new Date(item.created_at).toLocaleDateString('sk-SK')}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Užívateľ nenajdený</Text>
        <AppButton
          title="Späť"
          onPress={() => router.back()}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header s údajmi užívateľa */}
      <View style={[styles.userHeader, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <AppButton
          title="← Späť"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
        />

        <View style={styles.userInfo}>
          <Text style={[styles.userIcon, { fontSize: 48 }]}>👤</Text>
          <Text style={[styles.username, { color: colors.textPrimary }]}>{user.username}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
          <Text style={[styles.registered, { color: colors.textTertiary }]}>
            Registrovaný: {new Date(user.created_at).toLocaleDateString('sk-SK')}
          </Text>
        </View>
      </View>

      {/* Počet projektov */}
      <View style={styles.statsBar}>
        <View style={[styles.statsBox, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.statsNumber, { color: colors.primary }]}>
            {user.projects_count}
          </Text>
          <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
            Projektov
          </Text>
        </View>
      </View>

      {/* Projekty */}
      <View style={styles.projectsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Projekty ({user.projects.length})
        </Text>

        {user.projects.length > 0 ? (
          <FlatList
            data={user.projects}
            renderItem={renderProjectItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        ) : (
          <Text style={[styles.noProjects, { color: colors.textSecondary }]}>
            Užívateľ nemá žiadne projekty
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  userHeader: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginBottom: 12,
  },
  userInfo: {
    alignItems: 'center',
  },
  userIcon: {
    marginBottom: 8,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 8,
  },
  registered: {
    fontSize: 12,
  },
  statsBar: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statsBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
  },
  projectsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  projectCard: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  projectHeader: {
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: 13,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBadge: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noProjects: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  },
});
