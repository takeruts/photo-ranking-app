import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

export default function AuthScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  async function handleAuth() {
    setError('');

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    if (isSignUp && password !== passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }

    if (isSignUp && !gender) {
      setError('性別を選択してください');
      return;
    }

    if (isSignUp && !agreedToTerms) {
      setError('利用規約とプライバシーポリシーに同意してください');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // サインアップ（プロフィールはトリガーで自動作成される）
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
              gender: gender,
            }
          }
        });

        // ユーザーが既に存在する場合、削除済みプロフィールをチェック
        if (error && error.message.includes('User already registered')) {
          // 既存のユーザーでサインインを試みる
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            // パスワードが違う場合
            setError('このメールアドレスは既に登録されています。パスワードが異なる場合はログインしてください。');
            return;
          }

          // サインイン成功、削除済みプロフィールをチェック
          if (signInData.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('deleted_at')
              .eq('id', signInData.user.id)
              .maybeSingle();

            if (!profile) {
              // プロフィールが存在しない場合は新規作成
              const { error: createError } = await (supabase as any)
                .from('profiles')
                .insert({
                  id: signInData.user.id,
                  username: username || email.split('@')[0],
                  gender: gender,
                  onboarding_completed: false,
                  created_at: new Date().toISOString(),
                });

              if (createError) throw createError;

              // プロフィール作成後、認証状態を再取得してonboarding画面に遷移
              // 一度サインアウトして再サインインすることで、onAuthStateChangeを発火させる
              console.log('Profile created, re-authenticating to trigger onboarding...');
              await supabase.auth.signOut();
              const { error: reSignInError } = await supabase.auth.signInWithPassword({ email, password });
              if (reSignInError) {
                console.error('Re-sign in error:', reSignInError);
                throw reSignInError;
              }
              console.log('Re-authenticated successfully');
              return;
            } else if ((profile as any).deleted_at) {
              // 削除済みプロフィールを復元
              const { error: restoreError } = await (supabase as any)
                .from('profiles')
                .update({
                  deleted_at: null,
                  username: username || email.split('@')[0],
                  gender: gender,
                  onboarding_completed: false,
                })
                .eq('id', signInData.user.id);

              if (restoreError) throw restoreError;

              // プロフィール復元後、認証状態を再取得してonboarding画面に遷移
              // 一度サインアウトして再サインインすることで、onAuthStateChangeを発火させる
              console.log('Profile restored, re-authenticating to trigger onboarding...');
              await supabase.auth.signOut();
              const { error: reSignInError } = await supabase.auth.signInWithPassword({ email, password });
              if (reSignInError) {
                console.error('Re-sign in error:', reSignInError);
                throw reSignInError;
              }
              console.log('Re-authenticated successfully');
              return;
            }
          }

          // 削除済みでない場合は通常のエラーメッセージ
          setError('このメールアドレスは既に登録されています');
          return;
        }

        if (error) throw error;

        // アカウント作成成功 - 認証状態の変更によりonboarding画面に自動遷移
      } else {
        // サインイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Photo Ranking</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {isSignUp && (
            <>
              <TextInput
                style={styles.input}
                placeholder="ユーザー名"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <Text style={styles.label}>性別</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'male' && styles.genderButtonSelected,
                  ]}
                  onPress={() => setGender('male')}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'male' && styles.genderButtonTextSelected,
                    ]}
                  >
                    男性
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'female' && styles.genderButtonSelected,
                  ]}
                  onPress={() => setGender('female')}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'female' && styles.genderButtonTextSelected,
                    ]}
                  >
                    女性
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxTouchable}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    以下に同意します：{'\n'}
                    • アップロードした写真が他のユーザーに公開されること{'\n'}
                    • 写真がランキングシステムで評価されること{'\n'}
                    •{' '}
                  </Text>
                  <TouchableOpacity onPress={() => (navigation as any).navigate('Terms')}>
                    <Text style={styles.termsLink}>利用規約とプライバシーポリシー</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="パスワード"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.passwordToggleText}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>

          {isSignUp && (
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="パスワード（確認）"
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secureTextEntry={!showPasswordConfirm}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
              >
                <Text style={styles.passwordToggleText}>
                  {showPasswordConfirm ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? '処理中...'
                : isSignUp
                ? 'アカウント作成'
                : 'ログイン'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchButtonText}>
              {isSignUp
                ? '既にアカウントをお持ちの方はこちら'
                : 'アカウントをお持ちでない方はこちら'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    marginTop: 5,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  passwordInput: {
    backgroundColor: '#fff',
    padding: 15,
    paddingRight: 50,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  passwordToggleText: {
    fontSize: 20,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  genderButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  genderButtonTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  checkboxTouchable: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  termsText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 20,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
