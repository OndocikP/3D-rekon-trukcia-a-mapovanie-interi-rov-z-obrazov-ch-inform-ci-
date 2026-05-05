import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { layout } from '../theme/layout';
import AppButton from '../components/AppButton';
import { router } from 'expo-router';

// ✅ COLORS Z PROVIDERU (nie statický colors.ts)
import { useColors } from '../theme/ColorsProvider';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [forgotVisible, setForgotVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { colors, themeName } = useColors();
  const { login, forgotPassword, isLoggedIn, user } = useAuth();

  // Ak je user prihlásený, presmeruj na admin alebo main podľa role
  useEffect(() => {
    if (isLoggedIn && user) {
      console.log('👤 User prihlásenný, role:', user.role);
      if (user.role === 'admin') {
        console.log('🔓 Navigovanie na admin panel');
        router.replace('/admin');
      } else {
        console.log('📱 Navigovanie na main');
        router.replace('/main');
      }
    }
  }, [isLoggedIn, user]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Chyba', 'Prosím vyplň všetky polia');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Prihlasovanie:', username);
      await login(username, password);
      console.log('✅ Login úspešný - routing sa stará AuthContext');
      // Routing sa automaticky zmení cez useEffect na isLoggedIn zmenu
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Chyba pri prihlásení', 
        error instanceof Error ? error.message : 'Neznáma chyba');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Chyba', 'Prosím zadaj email');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert('Úspech', 'Email na obnovenie hesla bol zaslané (ak existuje)');
      setForgotVisible(false);
      setEmail('');
    } catch (error) {
      Alert.alert('Chyba', error instanceof Error ? error.message : 'Neznáma chyba');
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

      {/* Card s formulárom */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TextInput
          placeholder="Username"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={username}
          onChangeText={setUsername}
          editable={!loading}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.inputBackground }]}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <View style={styles.buttons}>
          <AppButton
            title="Register"
            variant="secondary"
            onPress={() => router.push('/register')}
            disabled={loading}
          />
          <AppButton
            title={loading ? "Prihlasovanie..." : "Login"}
            onPress={handleLogin}
            disabled={loading}
          />
        </View>

        {/* Forgot password link */}
        <View style={styles.linksContainer}>
          <Pressable onPress={() => setForgotVisible(true)} disabled={loading}>
            <Text
              style={[styles.forgot, { color: colors.textSecondary }]}
            >
              Zabudol som heslo?
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.modalCard }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Forgot password
            </Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              style={[styles.input, { backgroundColor: colors.inputBackground }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <AppButton
              title={loading ? "Posielam..." : "Send verification code"}
              onPress={handleForgotPassword}
              disabled={loading}
            />

            <Pressable onPress={() => setForgotVisible(false)} disabled={loading}>
              <Text style={[styles.forgot, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: layout.padding,
  },

  logoImage: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  card: {
    borderRadius: 30,
    padding: 25,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderWidth: 1,
  },

  input: {
    height: layout.inputHeight,
    borderRadius: layout.radius,
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },

  forgot: {
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    padding: 25,
    borderRadius: 25,
    width: '85%',
    maxWidth: 520,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
  },

  modalCancel: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
    textDecorationLine: 'underline',
  },

  logoInverted: {
    tintColor: '#fff',
  },

  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },

  divider: {
    fontSize: 16,
  },
});
