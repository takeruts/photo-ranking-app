import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TermsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>利用規約・プライバシーポリシー</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>利用規約</Text>

        <Text style={styles.heading}>1. サービスの概要</Text>
        <Text style={styles.paragraph}>
          本サービスは、ユーザーが写真をアップロードし、他のユーザーと相互に評価するマッチングアプリケーションです。
        </Text>

        <Text style={styles.heading}>2. 写真の公開について</Text>
        <Text style={styles.paragraph}>
          • アップロードした写真は、異性のユーザーに対して公開されます{'\n'}
          • 公開された写真は、他のユーザーによって評価（ライク/ディスライク）されます{'\n'}
          • 写真の削除はいつでも可能ですが、削除前の評価履歴は保持されます
        </Text>

        <Text style={styles.heading}>3. ランキングシステム</Text>
        <Text style={styles.paragraph}>
          • 各写真はEloレーティングシステムに基づいて評価されます{'\n'}
          • 初期レーティングは1500ポイントです{'\n'}
          • ライクされると+10ポイント、ディスライクされると-5ポイント変動します{'\n'}
          • レーティングはランキング画面で公開されます
        </Text>

        <Text style={styles.heading}>4. 禁止事項</Text>
        <Text style={styles.paragraph}>
          以下の行為を禁止します：{'\n'}
          • 他人の写真の無断使用{'\n'}
          • イラスト、漫画、AI生成画像のアップロード{'\n'}
          • 不適切なコンテンツ（アダルト、暴力的な内容）のアップロード{'\n'}
          • 人物が写っていない写真のアップロード{'\n'}
          • サービスの不正利用または妨害行為
        </Text>

        <Text style={styles.heading}>5. アカウントの停止・削除</Text>
        <Text style={styles.paragraph}>
          禁止事項に違反した場合、予告なくアカウントを停止または削除することがあります。
        </Text>

        <Text style={styles.heading}>6. 免責事項</Text>
        <Text style={styles.paragraph}>
          • 本サービスは「現状のまま」提供されます{'\n'}
          • サービスの中断、エラー、データの消失について、運営者は責任を負いません{'\n'}
          • ユーザー間のトラブルについて、運営者は一切の責任を負いません{'\n'}
          • 評価結果やランキングの正確性を保証するものではありません{'\n'}
          • 本サービスの利用により生じた損害について、運営者は賠償責任を負いません{'\n'}
          • 外部サービス（Google Cloud Vision API、Supabaseなど）の障害による影響について責任を負いません
        </Text>

        <Text style={styles.heading}>7. サービスの変更・終了</Text>
        <Text style={styles.paragraph}>
          運営者は、事前の通知なくサービスの内容を変更、または終了することができます。
        </Text>

        <Text style={styles.heading}>8. 準拠法・管轄裁判所</Text>
        <Text style={styles.paragraph}>
          本規約は日本法に準拠し、本サービスに関する紛争については、運営者の所在地を管轄する裁判所を専属的合意管轄裁判所とします。
        </Text>

        <Text style={styles.sectionTitle}>プライバシーポリシー</Text>

        <Text style={styles.heading}>1. 収集する情報</Text>
        <Text style={styles.paragraph}>
          以下の情報を収集します：{'\n'}
          • メールアドレス{'\n'}
          • ユーザー名{'\n'}
          • 性別{'\n'}
          • アップロードした写真{'\n'}
          • 評価履歴（ライク/ディスライク）{'\n'}
          • レーティングスコア
        </Text>

        <Text style={styles.heading}>2. 情報の使用目的</Text>
        <Text style={styles.paragraph}>
          収集した情報は以下の目的で使用します：{'\n'}
          • サービスの提供・運営{'\n'}
          • ユーザー間のマッチング{'\n'}
          • ランキングの表示{'\n'}
          • サービスの改善・分析{'\n'}
          • 不正利用の防止
        </Text>

        <Text style={styles.heading}>3. 情報の共有</Text>
        <Text style={styles.paragraph}>
          • アップロードした写真は、異性のユーザーに公開されます{'\n'}
          • レーティングスコアは、ランキング画面で公開されます{'\n'}
          • ユーザー名は、他のユーザーに表示される場合があります{'\n'}
          • 法的要請がある場合を除き、第三者に個人情報を提供しません
        </Text>

        <Text style={styles.heading}>4. データの保管と削除</Text>
        <Text style={styles.paragraph}>
          • データはSupabase（クラウドサービス）に安全に保管されます{'\n'}
          • アカウント削除時、個人情報とアップロードした写真は削除されます{'\n'}
          • 評価履歴は匿名化された状態で統計目的のため保持される場合があります
        </Text>

        <Text style={styles.heading}>5. セキュリティ</Text>
        <Text style={styles.paragraph}>
          • パスワードは暗号化されて保存されます{'\n'}
          • 通信はHTTPS/TLSで暗号化されます{'\n'}
          • 不正アクセス防止のため、適切なセキュリティ対策を実施しています
        </Text>

        <Text style={styles.heading}>6. Cookie・トラッキング</Text>
        <Text style={styles.paragraph}>
          本サービスは、サービス改善のため最小限のトラッキングを行う場合があります。
        </Text>

        <Text style={styles.heading}>7. お問い合わせ</Text>
        <Text style={styles.paragraph}>
          プライバシーポリシーに関するご質問やお問い合わせは、以下のメールアドレスまでご連絡ください。{'\n'}
          {'\n'}
          お問い合わせ先: admin@tarotai.jp
        </Text>

        <Text style={styles.footer}>
          最終更新日: 2026年1月1日{'\n'}
          本規約は予告なく変更される場合があります。{'\n'}
          {'\n'}
          お問い合わせ: admin@tarotai.jp
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 10,
  },
  footer: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    lineHeight: 20,
  },
});
