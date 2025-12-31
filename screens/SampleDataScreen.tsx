import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { INITIAL_RATING } from '../lib/elo';

export default function SampleDataScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  // サンプルユーザーのUUID
  const SAMPLE_USER_ID = '00000000-0000-0000-0000-000000000001';

  // サンプル画像URL（プレースホルダー画像）
  const samplePhotos = {
    male: [
      'https://i.pravatar.cc/300?img=1',
      'https://i.pravatar.cc/300?img=3',
      'https://i.pravatar.cc/300?img=5',
      'https://i.pravatar.cc/300?img=7',
      'https://i.pravatar.cc/300?img=8',
      'https://i.pravatar.cc/300?img=11',
      'https://i.pravatar.cc/300?img=12',
      'https://i.pravatar.cc/300?img=13',
      'https://i.pravatar.cc/300?img=14',
      'https://i.pravatar.cc/300?img=15',
    ],
    female: [
      'https://i.pravatar.cc/300?img=2',
      'https://i.pravatar.cc/300?img=4',
      'https://i.pravatar.cc/300?img=6',
      'https://i.pravatar.cc/300?img=9',
      'https://i.pravatar.cc/300?img=10',
      'https://i.pravatar.cc/300?img=16',
      'https://i.pravatar.cc/300?img=20',
      'https://i.pravatar.cc/300?img=23',
      'https://i.pravatar.cc/300?img=24',
      'https://i.pravatar.cc/300?img=25',
    ],
  };

  async function createSampleData() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('エラー', 'ログインしてください');
        return;
      }

      // 既存のサンプルデータを削除
      await supabase
        .from('photos')
        .delete()
        .eq('user_id', SAMPLE_USER_ID);

      let totalCreated = 0;

      // 男性のサンプル写真を作成
      for (let i = 0; i < samplePhotos.male.length; i++) {
        const { error } = await supabase.from('photos').insert({
          user_id: SAMPLE_USER_ID,
          image_url: samplePhotos.male[i],
          rating: INITIAL_RATING,
          gender: 'male',
        });

        if (error) {
          console.error('Error creating male sample:', error);
        } else {
          totalCreated++;
        }
      }

      // 女性のサンプル写真を作成
      for (let i = 0; i < samplePhotos.female.length; i++) {
        const { error } = await supabase.from('photos').insert({
          user_id: SAMPLE_USER_ID,
          image_url: samplePhotos.female[i],
          rating: INITIAL_RATING,
          gender: 'female',
        });

        if (error) {
          console.error('Error creating female sample:', error);
        } else {
          totalCreated++;
        }
      }

      Alert.alert(
        '成功',
        `${totalCreated}枚のサンプル写真を作成しました\n（男性: ${samplePhotos.male.length}枚、女性: ${samplePhotos.female.length}枚）`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSampleData() {
    Alert.alert(
      '確認',
      'すべてのサンプル写真を削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('photos')
                .delete()
                .eq('user_id', SAMPLE_USER_ID);

              if (error) throw error;

              Alert.alert('成功', 'サンプル写真を削除しました');
            } catch (error: any) {
              Alert.alert('エラー', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>サンプルデータ管理</Text>
        <Text style={styles.description}>
          テスト用のサンプル写真を作成・削除できます。
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📸 作成されるサンプル</Text>
          <Text style={styles.infoText}>• 男性の写真: 10枚</Text>
          <Text style={styles.infoText}>• 女性の写真: 10枚</Text>
          <Text style={styles.infoText}>• 初期レーティング: 1500</Text>
          <Text style={styles.infoText}>• ユーザーID: 00000...001 (サンプル用)</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ サンプルデータは特別なUUID「00000000-0000-0000-0000-000000000001」で保存されます。
            既存のサンプルデータは上書きされます。
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={createSampleData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>サンプルデータを作成</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.buttonDisabled]}
          onPress={deleteSampleData}
          disabled={loading}
        >
          <Text style={styles.deleteButtonText}>サンプルデータを削除</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
