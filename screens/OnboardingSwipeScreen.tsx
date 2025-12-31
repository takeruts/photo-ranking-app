import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Photo } from '../types/database';

const { width } = Dimensions.get('window');

// Web対応のアラート関数
function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

interface OnboardingSwipeScreenProps {
  navigation: any;
}

export default function OnboardingSwipeScreen({ navigation }: OnboardingSwipeScreenProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialPhotos();
  }, []);

  async function loadInitialPhotos() {
    setLoading(true);

    try {
      // ログインユーザーの性別を取得
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showAlert('エラー', 'ログインしてください');
        return;
      }

      // プロフィールから性別を取得
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const gender = profile?.gender as 'male' | 'female';
      setUserGender(gender);

      // 異性の写真をランダムに5枚取得
      const oppositeGender = gender === 'male' ? 'female' : 'male';
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('gender', oppositeGender)
        .limit(100);

      if (error) throw error;

      if (!data || data.length < 10) {
        showAlert('エラー', '評価できる写真が不足しています（最低10枚必要です）');
        // 写真が足りない場合はスキップしてホームへ
        navigation.replace('Home');
        return;
      }

      // ランダムに10枚選択
      const shuffled = data.sort(() => 0.5 - Math.random());
      setPhotos(shuffled.slice(0, 10));
    } catch (error: any) {
      console.error('Error loading photos:', error);
      showAlert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSwipe(liked: boolean) {
    if (!photos[currentIndex] || !userGender) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showAlert('エラー', 'ログインしてください');
        return;
      }

      const currentPhoto = photos[currentIndex];

      // レーティングを更新（いいね：+10、よくない：-5）
      const ratingChange = liked ? 10 : -5;
      const newRating = currentPhoto.rating + ratingChange;

      // データベースを更新
      await supabase
        .from('photos')
        .update({ rating: newRating })
        .eq('id', currentPhoto.id);

      // スワイプ履歴を保存
      await supabase.from('swipes').insert({
        voter_id: user.id,
        photo_id: currentPhoto.id,
        liked: liked,
      });

      // 次の写真へ
      if (currentIndex < photos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // 5枚の評価が完了したらonboarding_completedをtrueに更新
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);

        // ホーム画面へ
        showAlert('完了', '評価が完了しました！アプリをお楽しみください。');
        navigation.replace('Home');
      }
    } catch (error: any) {
      console.error('Error handling swipe:', error);
      showAlert('エラー', error.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>写真が見つかりません</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.retryButtonText}>ホームへ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPhoto = photos[currentIndex];
  const progress = ((currentIndex + 1) / photos.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>初回評価</Text>
        <Text style={styles.headerSubtitle}>
          {currentIndex + 1} / {photos.length}
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.title}>この人と付き合いたいですか？</Text>
      <Text style={styles.subtitle}>
        {userGender === 'male' ? '女性' : '男性'}の写真を評価中
      </Text>

      <View style={styles.photoContainer}>
        <Image
          source={{ uri: currentPhoto.image_url }}
          style={styles.photo}
          resizeMode="cover"
        />
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.dislikeButton]}
          onPress={() => handleSwipe(false)}
        >
          <Text style={styles.buttonIcon}>👎</Text>
          <Text style={styles.buttonText}>よくない</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe(true)}
        >
          <Text style={styles.buttonIcon}>👍</Text>
          <Text style={styles.buttonText}>いいね！</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.infoText}>
        残り {photos.length - currentIndex - 1} 枚
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  photoContainer: {
    width: '100%',
    maxWidth: 400,
    height: Math.min(width - 40, 400) * 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 30,
    alignSelf: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  actionButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  likeButton: {
    backgroundColor: '#34C759',
  },
  dislikeButton: {
    backgroundColor: '#FF3B30',
  },
  buttonIcon: {
    fontSize: 48,
    marginBottom: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
