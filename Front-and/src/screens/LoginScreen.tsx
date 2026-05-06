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

      {/* MAIN CONTENT - Info + Card */}
      <View style={styles.mainContent}>
        {/* LEFT INFO */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
            📱 Mapovanie Interiérov
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Profesionálne 3D mapovanie a rekonštrukcia interiérov z fotografických informácií.
          </Text>
          <Text style={[styles.infoSubtitle, { color: colors.textPrimary }]}>
            Ako to funguje:
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Nahraj fotografie interiéru
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Aplikácia spracuje obrazy
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Vygeneruje 3D model
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Pozri si výsledok v 3D vieweri
          </Text>
        </View>

        {/* LOGIN CARD */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Sign In</Text>

        <TextInput
          placeholder="Username"
          placeholderTextColor={colors.placeholder}
          autoComplete="username"
          textContentType="username"
          style={[
            styles.input,
            { 
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.textPrimary,
            }
          ]}
          value={username}
          onChangeText={setUsername}
          editable={!loading}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          style={[
            styles.input,
            { 
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.textPrimary,
            }
          ]}
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
            title={loading ? "Signing in..." : "Login"}
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

      {/* END MAIN CONTENT */}
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
    justifyContent: 'flex-start',
    padding: layout.padding,
    paddingTop: 20,
  },

  logoImage: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 30,
  },

  card: {
    borderRadius: 20,
    padding: 32,
    flex: 1,
    maxWidth: 420,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  input: {
    height: layout.inputHeight,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 15,
    borderWidth: 1,
  },

  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },

  forgot: {
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    padding: 28,
    borderRadius: 20,
    width: '85%',
    maxWidth: 520,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },

  modalCancel: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  logoInverted: {
    tintColor: '#fff',
  },

  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },

  divider: {
    fontSize: 16,
    fontWeight: '300',
  },

  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    flex: 1,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },

  infoSection: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  infoSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.2,
  },

  infoText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
});
