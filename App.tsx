import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import AuthScreen from './screens/AuthScreen';
import UploadScreen from './screens/UploadScreen';
import SwipeScreen from './screens/SwipeScreen';
import RankingScreen from './screens/RankingScreen';
import ProfileScreen from './screens/ProfileScreen';
import SampleDataScreen from './screens/SampleDataScreen';
import OnboardingSwipeScreen from './screens/OnboardingSwipeScreen';
import DailySwipeScreen from './screens/DailySwipeScreen';

const Stack = createStackNavigator();

function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 現在のユーザー情報を取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photo Ranking</Text>
      <Text style={styles.subtitle}>写真ランキングアプリ</Text>

      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{user.email}</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Swipe')}
        >
          <Text style={styles.menuButtonText}>🔄 写真を評価</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Ranking')}
        >
          <Text style={styles.menuButtonText}>🏆 ランキング</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Upload')}
        >
          <Text style={styles.menuButtonText}>📸 写真をアップロード</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuButtonText}>👤 プロフィール編集</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.sampleButton]}
          onPress={() => navigation.navigate('SampleData')}
        >
          <Text style={styles.menuButtonText}>🧪 サンプルデータ管理</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [needsDailySwipe, setNeedsDailySwipe] = useState<boolean>(false);

  useEffect(() => {
    // 初期化時にユーザーの認証状態を確認
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);

      // ユーザーがログインしている場合、onboarding状態と日次評価状態を確認
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, last_daily_swipe_date')
          .eq('id', session.user.id)
          .single();

        setOnboardingCompleted(profile?.onboarding_completed ?? false);

        // 今日の日付と最後の日次評価日を比較
        const today = new Date().toISOString().split('T')[0];
        const lastSwipeDate = profile?.last_daily_swipe_date;
        setNeedsDailySwipe(profile?.onboarding_completed && lastSwipeDate !== today);
      }

      setIsReady(true);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);

        // ログイン時にonboarding状態と日次評価状態を確認
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed, last_daily_swipe_date')
            .eq('id', session.user.id)
            .single();

          setOnboardingCompleted(profile?.onboarding_completed ?? false);

          // 今日の日付と最後の日次評価日を比較
          const today = new Date().toISOString().split('T')[0];
          const lastSwipeDate = profile?.last_daily_swipe_date;
          setNeedsDailySwipe(profile?.onboarding_completed && lastSwipeDate !== today);
        } else {
          setOnboardingCompleted(true);
          setNeedsDailySwipe(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          // ログインしていない場合は認証画面のみ
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : !onboardingCompleted ? (
          // 新規ユーザー: 10枚の初回評価が必要
          <>
            <Stack.Screen
              name="OnboardingSwipe"
              component={OnboardingSwipeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Upload"
              component={UploadScreen}
              options={{ title: '写真アップロード' }}
            />
            <Stack.Screen
              name="Swipe"
              component={SwipeScreen}
              options={{ title: '写真評価' }}
            />
            <Stack.Screen
              name="Ranking"
              component={RankingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'プロフィール編集' }}
            />
            <Stack.Screen
              name="SampleData"
              component={SampleDataScreen}
              options={{ title: 'サンプルデータ管理' }}
            />
          </>
        ) : needsDailySwipe ? (
          // 既存ユーザー: その日初めてのログイン（5枚の日次評価が必要）
          <>
            <Stack.Screen
              name="DailySwipe"
              component={DailySwipeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Upload"
              component={UploadScreen}
              options={{ title: '写真アップロード' }}
            />
            <Stack.Screen
              name="Swipe"
              component={SwipeScreen}
              options={{ title: '写真評価' }}
            />
            <Stack.Screen
              name="Ranking"
              component={RankingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'プロフィール編集' }}
            />
            <Stack.Screen
              name="SampleData"
              component={SampleDataScreen}
              options={{ title: 'サンプルデータ管理' }}
            />
          </>
        ) : (
          // 日次評価完了済み: 通常のアプリ画面
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Upload"
              component={UploadScreen}
              options={{ title: '写真アップロード' }}
            />
            <Stack.Screen
              name="Swipe"
              component={SwipeScreen}
              options={{ title: '写真評価' }}
            />
            <Stack.Screen
              name="Ranking"
              component={RankingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'プロフィール編集' }}
            />
            <Stack.Screen
              name="SampleData"
              component={SampleDataScreen}
              options={{ title: 'サンプルデータ管理' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
  },
  menuButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sampleButton: {
    backgroundColor: '#FF9500',
  },
});
