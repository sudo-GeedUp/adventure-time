import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[Typography.h1, styles.title]}>Welcome Back</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
              Sign in to continue your adventure
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="mail" size={20} color={theme.tabIconDefault} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="your@email.com"
                  placeholderTextColor={theme.tabIconDefault}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="lock" size={20} color={theme.tabIconDefault} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.tabIconDefault}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.tabIconDefault}
                  />
                </Pressable>
              </View>
            </View>

            {/* Forgot Password */}
            <Pressable onPress={handleForgotPassword} disabled={loading}>
              <ThemedText style={[styles.forgotPassword, { color: theme.primary }]}>
                Forgot Password?
              </ThemedText>
            </Pressable>

            {/* Login Button */}
            <Pressable
              style={[
                styles.loginButton,
                { backgroundColor: theme.primary },
                loading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
                  <Feather name="arrow-right" size={20} color="white" />
                </>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.tabIconDefault }]} />
              <ThemedText style={[styles.dividerText, { color: theme.tabIconDefault }]}>
                or
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.tabIconDefault }]} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <Pressable
                style={[styles.socialButton, { backgroundColor: theme.backgroundSecondary }]}
                disabled
              >
                <Feather name="chrome" size={20} color={theme.text} />
                <ThemedText style={styles.socialButtonText}>Google</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.socialButton, { backgroundColor: theme.backgroundSecondary }]}
                disabled
              >
                <Feather name="smartphone" size={20} color={theme.text} />
                <ThemedText style={styles.socialButtonText}>Apple</ThemedText>
              </Pressable>
            </View>

            <ThemedText style={[styles.comingSoon, { color: theme.tabIconDefault }]}>
              Social login coming soon
            </ThemedText>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <ThemedText style={{ color: theme.tabIconDefault }}>
              Don't have an account?{' '}
            </ThemedText>
            <Pressable onPress={handleSignUp} disabled={loading}>
              <ThemedText style={[styles.signUpLink, { color: theme.primary }]}>
                Sign Up
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    height: 56,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: Spacing.xl,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    opacity: 0.5,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoon: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpLink: {
    fontSize: 16,
    fontWeight: '700',
  },
});
