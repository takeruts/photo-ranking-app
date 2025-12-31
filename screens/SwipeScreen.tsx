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

export default function SwipeScreen() {
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewedPhotoIds, setViewedPhotoIds] = useState<string[]>([]);

  useEffect(() => {
    loadUserGenderAndPhoto();
  }, []);

  async function loadUserGenderAndPhoto() {
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

      // 異性の写真を読み込む
      await loadRandomPhoto(gender);
    } catch (error: any) {
      console.error('Error loading user gender:', error);
      showAlert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRandomPhoto(gender: 'male' | 'female') {
    try {
      // 異性の性別を決定
      const oppositeGender = gender === 'male' ? 'female' : 'male';

      // 異性の写真を取得（既に見た写真は除外）
      let query = supabase
        .from('photos')
        .select('*')
        .eq('gender', oppositeGender);

      // 既に見た写真を除外
      if (viewedPhotoIds.length > 0) {
        query = query.not('id', 'in', `(${viewedPhotoIds.join(',')})`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        // すべての写真を見終わったらリセット
        setViewedPhotoIds([]);
        showAlert('完了', 'すべての写真を評価しました！最初からやり直します。');
        await loadRandomPhoto(gender);
        return;
      }

      // ランダムに1枚選択
      const randomIndex = Math.floor(Math.random() * data.length);
      const selectedPhoto = data[randomIndex];
      setCurrentPhoto(selectedPhoto);

      // 既に見た写真リストに追加
      setViewedPhotoIds([...viewedPhotoIds, selectedPhoto.id]);
    } catch (error: any) {
      console.error('Error loading photo:', error);
      showAlert('エラー', error.message);
    }
  }

  async function handleSwipe(liked: boolean) {
    if (!currentPhoto || !userGender) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showAlert('エラー', 'ログインしてください');
        return;
      }

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

      // 次の写真を読み込む
      await loadRandomPhoto(userGender);
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

  if (!currentPhoto) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>写真が見つかりません</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadUserGenderAndPhoto}
        >
          <Text style={styles.retryButtonText}>再読み込み</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>付き合いたいですか？</Text>
      <Text style={styles.subtitle}>
        {userGender === 'male' ? '女性' : '男性'}の写真を評価中
      </Text>

      <View style={styles.photoContainer}>
        <Image
          source={{ uri: currentPhoto.image_url }}
          style={styles.photo}
          resizeMode="cover"
        />
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>Rating: {currentPhoto.rating}</Text>
        </View>
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
        残り: {viewedPhotoIds.length} 枚評価済み
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
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
    width: Math.min(width - 40, 400),
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
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
