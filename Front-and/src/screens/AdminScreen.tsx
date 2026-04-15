import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '../theme/ColorsProvider';
import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface Project {
  id: string;
  project_name: string;
  status: string;
  image_count: number;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  total_projects: number;
  projects_by_status: Record<string, number>;
}

const API_URL = 'http://localhost:8000';

export default function AdminScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { colors } = useColors();
  const { logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Načítaj užívateľov
      const usersRes = await fetch(`${API_URL}/api/admin/users`);
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Načítaj štatistiku
      const statsRes = await fetch(`${API_URL}/api/admin/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error) {
      Alert.alert('Chyba', 'Nemôžem načítať dáta');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => router.push(`/admin-user/${item.id}`)}
    >
      <View style={styles.userHeader}>
        <View>
          <Text style={[styles.username, { color: colors.textPrimary }]}>👤 {item.username}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
        </View>
        <Text style={[styles.arrow, { color: colors.textSecondary }]}>›</Text>
      </View>
      <Text style={[styles.date, { color: colors.textTertiary }]}>
        Registrovaný: {new Date(item.created_at).toLocaleDateString('sk-SK')}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🔐 Admin Panel</Text>
        <AppButton
          title="Odhlásiť sa"
          variant="secondary"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>

      {/* Štatistika */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.total_users}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Užívatelia</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{stats.total_projects}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Projekty</Text>
          </View>
        </View>
      )}

      {/* Projekty podľa statusu */}
      {stats && (
        <View style={styles.statusSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Projekty podľa statusu</Text>
          <View style={styles.statusGrid}>
            {Object.entries(stats.projects_by_status).map(([status, count]) => (
              <View key={status} style={[styles.statusBadge, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.statusName, { color: colors.textPrimary }]}>{status}</Text>
                <Text style={[styles.statusCount, { color: colors.primary }]}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Zoznam užívateľov */}
      <View style={styles.usersSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Všetci užívatelia ({users.length})
        </Text>
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    minWidth: 120,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusSection: {
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusBadge: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  statusCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  usersSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  userCard: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
  },
  arrow: {
    fontSize: 24,
  },
  date: {
    fontSize: 12,
    marginTop: 8,
  },
  separator: {
    height: 0,
  },
});
