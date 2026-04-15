import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';
import { useColors } from '../theme/ColorsProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8000';

export default function AdminLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, themeName } = useColors();

  const handleAdminLogin = async () => {
    if (!username || !password) {
      Alert.alert('Chyba', 'Prosím vyplň všetky polia');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Admin login:', username);
      
      const response = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Chyba', data.detail || 'Prihlásenie zlyhalo');
        return;
      }

      console.log('✅ Admin login úspešný');
      
      // Ulož admin token a údaje
      await AsyncStorage.setItem('adminToken', data.access_token);
      await AsyncStorage.setItem('adminUser', JSON.stringify(data.user));
      
      router.replace('/admin');
    } catch (error) {
      Alert.alert('Chyba', 'Problém s pripojením na server');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.gradientBottom]}
      style={styles.container}
    >
      {/* LOGO */}
      <Image
        source={require('../assets/logo.png')}
        style={[
          styles.logoImage,
          themeName === 'black' && styles.logoInverted,
        ]}
        resizeMode="contain"
      />

      <Text style={[styles.title, { color: colors.textPrimary }]}>Admin Panel</Text>

      {/* Card s formulárom */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TextInput
          placeholder="Admin Username"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
          value={username}
          onChangeText={setUsername}
          editable={!loading}
        />
        <TextInput
          placeholder="Admin Password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <View style={styles.buttons}>
          <AppButton
            title="Späť"
            variant="secondary"
            onPress={() => router.back()}
            disabled={loading}
          />
          <AppButton
            title={loading ? "Prihlasovanie..." : "Admin Login"}
            onPress={handleAdminLogin}
            disabled={loading}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  logoInverted: {
    tintColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 350,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  input: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
});
