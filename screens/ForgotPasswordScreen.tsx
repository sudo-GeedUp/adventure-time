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
import { authService } from '@/services/authService';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authService.sendPasswordReset(email);
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  if (emailSent) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>
          <View style={styles.successContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.success + '20' }]}>
              <Feather name="check-circle" size={48} color={theme.success} />
            </View>
            
            <ThemedText style={[Typography.h2, styles.successTitle]}>
              Check Your Email
            </ThemedText>
            
            <ThemedText style={[styles.successMessage, { color: theme.tabIconDefault }]}>
              We've sent password reset instructions to:
            </ThemedText>
            
            <ThemedText style={[styles.email, { color: theme.primary }]}>
              {email}
            </ThemedText>
            
            <ThemedText style={[styles.instructions, { color: theme.tabIconDefault }]}>
              Click the link in the email to reset your password. If you don't see the email, check your spam folder.
            </ThemedText>

            <Pressable
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleBackToLogin}
            >
              <Feather name="arrow-left" size={20} color="white" />
              <ThemedText style={styles.buttonText}>Back to Login</ThemedText>
            </Pressable>

            <Pressable
              style={styles.resendButton}
              onPress={() => {
                setEmailSent(false);
                handleResetPassword();
              }}
            >
              <ThemedText style={[styles.resendText, { color: theme.primary }]}>
                Resend Email
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleBackToLogin} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            
            <ThemedText style={[Typography.h1, styles.title]}>
              Forgot Password?
            </ThemedText>
            
            <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
              Enter your email address and we'll send you instructions to reset your password.
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email Address</ThemedText>
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
                  autoFocus
                />
              </View>
            </View>

            {/* Reset Button */}
            <Pressable
              style={[
                styles.button,
                { backgroundColor: theme.primary },
                loading && styles.disabledButton,
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <ThemedText style={styles.buttonText}>Send Reset Link</ThemedText>
                  <Feather name="send" size={20} color="white" />
                </>
              )}
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
  backButton: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  successTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  email: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  resendButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
