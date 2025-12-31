import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { INITIAL_RATING } from '../lib/elo';
import { Photo } from '../types/database';

// Web対応のアラート関数
function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// 確認ダイアログ
function showConfirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', onPress: onConfirm, style: 'destructive' },
    ]);
  }
}

export default function UploadScreen() {
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadUploadedPhotos();
  }, []);

  async function loadUploadedPhotos() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showAlert('エラー', 'ログインしてください');
        return;
      }

      // 自分がアップロードした写真を取得
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      setUploadedPhotos(data || []);
    } catch (error: any) {
      console.error('Error loading photos:', error);
      showAlert('エラー', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadUploadedPhotos();
  }

  async function pickAndUploadImage() {
    if (uploadedPhotos.length >= 5) {
      showAlert('制限', '最大5枚までアップロードできます。\n既存の写真を削除してから新しい写真をアップロードしてください。');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('エラー', 'カメラロールへのアクセス許可が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showAlert('エラー', 'ログインしてください');
        return;
      }

      // ユーザーの性別を取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData?.gender) {
        showAlert('エラー', 'プロフィールに性別が設定されていません。プロフィール編集で性別を設定してください。');
        return;
      }

      const imageUri = result.assets[0].uri;
      const filePath = `${user.id}/${Date.now()}.jpg`;

      let uploadData: Blob | Uint8Array;

      if (Platform.OS === 'web') {
        // Webの場合はfetchを使用
        const response = await fetch(imageUri);
        uploadData = await response.blob();
      } else {
        // モバイルの場合はFileSystemを使用してBase64で読み込む
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Base64をバイナリデータに変換
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        uploadData = new Uint8Array(byteNumbers);
      }

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, uploadData, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 公開URLを取得
      const {
        data: { publicUrl },
      } = supabase.storage.from('photos').getPublicUrl(filePath);

      // データベースに保存（性別を含める）
      const { error: dbError } = await supabase.from('photos').insert({
        user_id: user.id,
        image_url: publicUrl,
        rating: INITIAL_RATING,
        gender: profileData.gender,
      });

      if (dbError) throw dbError;

      showAlert('成功', '写真をアップロードしました');
      loadUploadedPhotos();
    } catch (error: any) {
      console.error('Upload error:', error);
      showAlert('エラー', error.message);
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(photo: Photo) {
    showConfirm(
      '削除確認',
      'この写真を削除してもよろしいですか？',
      async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            showAlert('エラー', 'ログインしてください');
            return;
          }

          // ストレージからファイルを削除
          // URLから相対パスを抽出
          const url = new URL(photo.image_url);
          const pathParts = url.pathname.split('/');
          const storagePath = `${user.id}/${pathParts[pathParts.length - 1]}`;

          const { error: storageError } = await supabase.storage
            .from('photos')
            .remove([storagePath]);

          if (storageError) {
            console.error('Storage delete error:', storageError);
            // ストレージ削除エラーは無視（既に削除されている可能性）
          }

          // データベースから削除
          const { error: dbError } = await supabase
            .from('photos')
            .delete()
            .eq('id', photo.id)
            .eq('user_id', user.id); // 自分の写真のみ削除可能

          if (dbError) throw dbError;

          showAlert('成功', '写真を削除しました');
          loadUploadedPhotos();
        } catch (error: any) {
          console.error('Delete error:', error);
          showAlert('エラー', error.message);
        }
      }
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>マイ写真</Text>
        <Text style={styles.subtitle}>
          {uploadedPhotos.length} / 5 枚
        </Text>
      </View>

      <ScrollView
        style={styles.photoList}
        contentContainerStyle={styles.photoListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {uploadedPhotos.map((photo) => (
          <View key={photo.id} style={styles.photoCard}>
            <Image source={{ uri: photo.image_url }} style={styles.photo} />
            <View style={styles.photoInfo}>
              <Text style={styles.ratingText}>Rating: {photo.rating}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePhoto(photo)}
              >
                <Text style={styles.deleteButtonText}>🗑️ 削除</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {uploadedPhotos.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              まだ写真をアップロードしていません
            </Text>
            <Text style={styles.emptySubtext}>
              下のボタンから写真を追加しましょう
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (uploading || uploadedPhotos.length >= 5) && styles.buttonDisabled,
          ]}
          onPress={pickAndUploadImage}
          disabled={uploading || uploadedPhotos.length >= 5}
        >
          <Text style={styles.uploadButtonText}>
            {uploading
              ? 'アップロード中...'
              : uploadedPhotos.length >= 5
              ? '上限に達しました (5枚)'
              : '📸 写真を追加'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
    color: '#666',
  },
  photoList: {
    flex: 1,
  },
  photoListContent: {
    padding: 15,
  },
  photoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: 250,
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});
