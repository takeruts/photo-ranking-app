import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('エラー', 'ログインしてください');
        navigation.goBack();
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');

      // プロフィール情報を取得
      const { data, error } = await supabase
        .from('profiles')
        .select('username, gender')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUsername(data.username || '');
        setGender(data.gender || '');
      }
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!username.trim()) {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }

    if (!gender) {
      Alert.alert('エラー', '性別を選択してください');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          gender: gender,
        })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('成功', 'プロフィールを更新しました', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    Alert.alert(
      'アカウント削除の確認',
      'アカウントを削除すると、すべてのデータと写真が完全に削除されます。この操作は取り消せません。本当に削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  }

  async function confirmDeleteAccount() {
    setDeleting(true);

    try {
      // 1. ユーザーの写真を取得
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('id, image_url')
        .eq('user_id', userId);

      if (photosError) throw photosError;

      // 2. ストレージから写真を削除
      if (photos && photos.length > 0) {
        const filePaths = photos.map((photo) => {
          const url = photo.image_url;
          const match = url.match(/\/photos\/(.+)$/);
          return match ? match[1] : null;
        }).filter(Boolean) as string[];

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('photos')
            .remove(filePaths);

          if (storageError) {
            console.error('Storage deletion error:', storageError);
          }
        }
      }

      // 3. データベースから写真を削除
      const { error: photosDeleteError } = await supabase
        .from('photos')
        .delete()
        .eq('user_id', userId);

      if (photosDeleteError) throw photosDeleteError;

      // 4. 評価履歴を削除
      const { error: swipesDeleteError } = await supabase
        .from('swipes')
        .delete()
        .eq('voter_id', userId);

      if (swipesDeleteError) throw swipesDeleteError;

      // 5. プロフィールを論理削除（deleted_atを設定）
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileDeleteError) throw profileDeleteError;

      // 6. サインアウト
      await supabase.auth.signOut();

      Alert.alert(
        '完了',
        'アカウントが削除されました。\n\nすべての写真、評価履歴、プロフィール情報が削除され、ログアウトされました。',
        [
          {
            text: 'OK',
          },
        ]
      );
    } catch (error: any) {
      console.error('Account deletion error:', error);
      Alert.alert('エラー', `アカウント削除中にエラーが発生しました: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>プロフィール編集</Text>

        <Text style={styles.label}>メールアドレス</Text>
        <View style={styles.disabledInput}>
          <Text style={styles.disabledText}>{email}</Text>
        </View>
        <Text style={styles.hint}>メールアドレスは変更できません</Text>

        <Text style={styles.label}>ユーザー名</Text>
        <TextInput
          style={styles.input}
          placeholder="ユーザー名"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>性別 *</Text>
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

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={saveProfile}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>危険な操作</Text>
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.buttonDisabled]}
            onPress={deleteAccount}
            disabled={deleting}
          >
            <Text style={styles.deleteButtonText}>
              {deleting ? '削除中...' : 'アカウントを削除'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.deleteWarning}>
            削除すると、すべてのデータと写真が完全に削除されます。{'\n'}
            この操作は取り消せません。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
    color: '#333',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledText: {
    fontSize: 16,
    color: '#999',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginTop: 30,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerZone: {
    marginTop: 50,
    paddingTop: 30,
    borderTopWidth: 2,
    borderTopColor: '#FFEBEE',
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 15,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteWarning: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 5,
  },
});
