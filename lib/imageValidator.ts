import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export interface ImageValidationResult {
  isValid: boolean;
  reason?: string;
  confidence?: number;
}

/**
 * Google Cloud Vision APIを使用して画像が実写の人物写真かどうかを検証
 * Supabase Edge Functionを経由して検証を実行
 */
export async function validateRealPhoto(
  imageUri: string
): Promise<ImageValidationResult> {
  try {
    // 1. 基本的なクライアント側チェック
    const basicValidation = await performBasicValidation(imageUri);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // 2. 画像をBase64に変換
    const imageBase64 = await imageUriToBase64(imageUri);

    // 3. 現在のセッションを取得
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 4. Supabase Edge Functionを呼び出し
    // セッションがあればアクセストークン、なければanon keyを使用
    const authToken = session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const { data, error } = await supabase.functions.invoke('validate-image', {
      body: { imageBase64 },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // エラーメッセージをユーザーに表示
      let errorMessage = '画像の検証中にエラーが発生しました。';

      if (error.message) {
        errorMessage += `\n詳細: ${error.message}`;
      }

      return {
        isValid: false,
        reason: errorMessage,
      };
    }

    console.log('Validation result:', data);
    return data as ImageValidationResult;
  } catch (error) {
    console.error('画像検証エラー:', error);
    return {
      isValid: false,
      reason: '画像の検証中にエラーが発生しました。別の写真でもう一度お試しください。',
    };
  }
}

/**
 * 基本的なクライアント側の検証
 */
async function performBasicValidation(
  imageUri: string
): Promise<ImageValidationResult> {
  try {
    // ファイル名チェック（スクリーンショット検出）
    const filenameCheck = detectSuspiciousFilename(imageUri);
    if (filenameCheck.isSuspicious) {
      return {
        isValid: false,
        reason: filenameCheck.reason,
      };
    }

    // 画像サイズチェック
    const imageInfo = await getImageInfo(imageUri);

    if (imageInfo.width < 200 || imageInfo.height < 200) {
      return {
        isValid: false,
        reason:
          '画像が小さすぎます。最低200x200ピクセル以上の写真をアップロードしてください。',
      };
    }

    if (imageInfo.width > 4000 || imageInfo.height > 4000) {
      return {
        isValid: false,
        reason:
          '画像が大きすぎます。4000x4000ピクセル以下の写真をアップロードしてください。',
      };
    }

    // アスペクト比チェック
    const aspectRatio = imageInfo.width / imageInfo.height;
    if (aspectRatio < 0.5 || aspectRatio > 2.0) {
      return {
        isValid: false,
        reason:
          '画像のアスペクト比が不適切です。通常の写真をアップロードしてください。',
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Basic validation error:', error);
    // 基本検証でエラーが出ても、メイン検証は続行
    return { isValid: true };
  }
}

/**
 * 画像URIをBase64に変換
 */
async function imageUriToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    // Webの場合
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    // モバイルの場合
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  }
}

/**
 * 画像の情報を取得
 */
async function getImageInfo(uri: string): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      // Webの場合
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = uri;
    } else {
      // React Nativeの場合
      import('react-native').then((RN) => {
        RN.Image.getSize(
          uri,
          (width, height) => {
            resolve({ width, height });
          },
          (error) => {
            // エラー時はデフォルト値を返す
            console.warn('Could not get image size:', error);
            resolve({ width: 1000, height: 1000 });
          }
        );
      });
    }
  });
}

/**
 * ファイル名から画像の種類を推測
 * スクリーンショットやダウンロード画像を検出
 */
export function detectSuspiciousFilename(uri: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  const lowerUri = uri.toLowerCase();

  // スクリーンショットの典型的なパターン
  const screenshotPatterns = [
    'screenshot',
    'screen_shot',
    'screen-shot',
    'スクリーンショット',
  ];

  // ダウンロード画像の典型的なパターン
  const downloadPatterns = ['download', 'saved_image', 'received_'];

  for (const pattern of screenshotPatterns) {
    if (lowerUri.includes(pattern)) {
      return {
        isSuspicious: true,
        reason:
          'スクリーンショットではなく、カメラで撮影した写真を使用してください。',
      };
    }
  }

  for (const pattern of downloadPatterns) {
    if (lowerUri.includes(pattern)) {
      return {
        isSuspicious: true,
        reason:
          'ダウンロードした画像ではなく、カメラで撮影した写真を使用してください。',
      };
    }
  }

  return { isSuspicious: false };
}
