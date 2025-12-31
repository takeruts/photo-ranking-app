import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Photo, Profile } from '../types/database';

interface RankingItem extends Photo {
  profiles?: Profile;
  rank: number;
}

export default function RankingScreen() {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');

  useEffect(() => {
    loadRankings();
  }, [selectedGender]);

  async function loadRankings() {
    try {
      let query = supabase
        .from('photos')
        .select('*, profiles(*)');

      // 性別でフィルタリング
      if (selectedGender !== 'all') {
        query = query.eq('gender', selectedGender);
      }

      const { data, error } = await query
        .order('rating', { ascending: false })
        .limit(100);

      if (error) throw error;

      // ランク番号を追加
      const rankedData = data?.map((item, index) => ({
        ...item,
        rank: index + 1,
      })) || [];

      setRankings(rankedData);
    } catch (error: any) {
      console.error('Error loading rankings:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadRankings();
  }

  function getRankColor(rank: number): string {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#007AFF';
  }

  function renderItem({ item }: { item: RankingItem }) {
    return (
      <View style={styles.rankingItem}>
        <View style={styles.rankContainer}>
          <View
            style={[
              styles.rankBadge,
              { backgroundColor: getRankColor(item.rank) },
            ]}
          >
            <Text style={styles.rankText}>{item.rank}</Text>
          </View>
        </View>

        <Image source={{ uri: item.image_url }} style={styles.photo} />

        <View style={styles.infoContainer}>
          <Text style={styles.username}>
            {item.profiles?.username || '不明'}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Rating:</Text>
            <Text style={styles.ratingValue}>{item.rating}</Text>
          </View>
        </View>
      </View>
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
        <Text style={styles.title}>ランキング</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedGender === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedGender('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedGender === 'all' && styles.filterButtonTextActive,
            ]}
          >
            全体
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedGender === 'male' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedGender('male')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedGender === 'male' && styles.filterButtonTextActive,
            ]}
          >
            男性
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedGender === 'female' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedGender('female')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedGender === 'female' && styles.filterButtonTextActive,
            ]}
          >
            女性
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rankings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        style={styles.flatList}
        nestedScrollEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ランキングがありません</Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 10,
  },
  refreshButtonText: {
    fontSize: 24,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  flatList: {
    flex: 1,
  },
  listContainer: {
    padding: 15,
    flexGrow: 1,
  },
  rankingItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    justifyContent: 'center',
    marginRight: 15,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
