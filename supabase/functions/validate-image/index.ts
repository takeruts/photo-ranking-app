// Supabase Edge Function for image validation using Google Cloud Vision API
// Deno runtime

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface ValidationRequest {
  imageBase64: string;
}

interface ValidationResponse {
  isValid: boolean;
  reason?: string;
  confidence?: number;
}

serve(async (req) => {
  // CORSヘッダー
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
  };

  // OPTIONSリクエスト（CORS preflight）への対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // リクエストボディを取得
    const { imageBase64 }: ValidationRequest = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({
          isValid: false,
          reason: '画像データが提供されていません',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Google Cloud Vision APIのキーを環境変数から取得
    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_CLOUD_API_KEY is not set');
      return new Response(
        JSON.stringify({
          isValid: false,
          reason: 'サーバー設定エラー',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Google Cloud Vision APIを呼び出し
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const visionRequest = {
      requests: [
        {
          image: {
            content: imageBase64,
          },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'FACE_DETECTION', maxResults: 10 },
            { type: 'IMAGE_PROPERTIES' },
            { type: 'SAFE_SEARCH_DETECTION' },
          ],
        },
      ],
    };

    const visionResponse = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visionRequest),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API error:', errorText);
      return new Response(
        JSON.stringify({
          isValid: false,
          reason: '画像検証サービスでエラーが発生しました',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const visionData = await visionResponse.json();
    const result = visionData.responses[0];

    // ラベル検出結果
    const labels = result.labelAnnotations || [];
    const labelDescriptions = labels.map(
      (l: any) => l.description?.toLowerCase() || ''
    );
    const labelScores = new Map(
      labels.map((l: any) => [l.description?.toLowerCase() || '', l.score || 0])
    );

    // デバッグ用: 検出されたラベルをログ出力
    console.log('Detected labels:', labels.slice(0, 10).map((l: any) => ({
      description: l.description,
      score: l.score,
    })));

    // 顔検出結果
    const faces = result.faceDetections || [];
    const hasFaces = faces.length > 0;
    console.log('Faces detected:', faces.length);

    // セーフサーチ検出
    const safeSearch = result.safeSearchAnnotation;

    // 1. 不適切なコンテンツチェック
    if (
      safeSearch?.adult === 'VERY_LIKELY' ||
      safeSearch?.adult === 'LIKELY' ||
      safeSearch?.violence === 'VERY_LIKELY'
    ) {
      return new Response(
        JSON.stringify({
          isValid: false,
          reason: '不適切なコンテンツが検出されました。',
        } as ValidationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. イラスト・漫画・アニメの検出
    // より厳格なキーワードのみを使用
    const illustrationKeywords = [
      'cartoon',
      'anime',
      'animated cartoon',
      'comic',
      'manga',
      'animation',
    ];

    // 写真かどうかを先に確認
    const photoKeywords = [
      'photograph',
      'photography',
      'photo',
      'selfie',
      'portrait',
    ];
    const hasPhotoLabels = photoKeywords.some((keyword) =>
      labelDescriptions.some((label: string) => label.includes(keyword))
    );

    // 写真ラベルがある場合は、イラスト検出の信頼度を高く設定
    const illustrationThreshold = hasPhotoLabels ? 0.9 : 0.85;

    const hasIllustrationLabels = illustrationKeywords.some((keyword) =>
      labelDescriptions.some((label: string) => label.includes(keyword))
    );

    if (hasIllustrationLabels) {
      const illustrationLabel = labelDescriptions.find((label: string) =>
        illustrationKeywords.some((keyword) => label.includes(keyword))
      );
      const confidence = labelScores.get(illustrationLabel || '') || 0;

      if (confidence > illustrationThreshold) {
        return new Response(
          JSON.stringify({
            isValid: false,
            reason:
              'イラスト、漫画、アニメは使用できません。実写の写真をアップロードしてください。',
            confidence,
          } as ValidationResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 3. AI生成画像の検出（間接的な方法）
    const aiGeneratedIndicators = [
      'computer-generated imagery',
      'cgi',
      'digital compositing',
      'synthetic',
    ];

    const hasAiIndicators = aiGeneratedIndicators.some((keyword) =>
      labelDescriptions.some((label: string) => label.includes(keyword))
    );

    if (hasAiIndicators) {
      return new Response(
        JSON.stringify({
          isValid: false,
          reason:
            'AI生成画像は使用できません。実写の写真をアップロードしてください。',
        } as ValidationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. 人物検出チェック（より広範な人物関連ラベルをチェック）
    const personRelatedLabels = [
      'person',
      'face',
      'human',
      'people',
      'portrait',
      'selfie',
      'hair',
      'smile',
      'happiness',
      'facial expression',
      'head',
      'skin',
      'eye',
      'nose',
      'mouth',
      'chin',
      'forehead',
      'eyebrow',
      'cheek',
      'lip',
      'ear',
      'neck',
      'shoulder',
      'beauty',
      'gesture',
      'finger',
      'hand',
      'arm',
    ];

    // 人物関連のラベルがあるかチェック
    const personLabelScore = Math.max(
      ...personRelatedLabels.map((label) => labelScores.get(label) || 0)
    );

    // 人物関連ラベルの数をカウント（0.3以上のスコアを持つもの）
    const personLabelCount = personRelatedLabels.filter(
      (label) => {
        const score = labelScores.get(label) as number | undefined;
        return score !== undefined && score !== null && score > 0.3;
      }
    ).length;

    console.log('Person detection - max score:', personLabelScore);
    console.log('Person detection scores:', {
      hasFaces,
      maxPersonScore: personLabelScore,
      personLabelCount,
      hasPhotoLabels,
    });

    // より緩い基準:
    // 1. 顔検出成功
    // 2. 人物関連ラベルが0.4以上
    // 3. 人物関連ラベルが2つ以上（0.3以上のスコア）
    // 4. 写真ラベルがあり、人物関連ラベルが1つ以上
    const hasPersonOrFace =
      hasFaces ||
      personLabelScore > 0.4 ||
      personLabelCount >= 2 ||
      (hasPhotoLabels && personLabelCount >= 1);

    if (!hasPersonOrFace) {
      console.log('Person detection failed - all labels:', labelDescriptions);
      return new Response(
        JSON.stringify({
          isValid: false,
          reason:
            '人物が検出されませんでした。人物が写っている写真をアップロードしてください。',
        } as ValidationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // すべてのチェックをパス
    return new Response(
      JSON.stringify({
        isValid: true,
      } as ValidationResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        isValid: false,
        reason: '画像の検証中にエラーが発生しました。もう一度お試しください。',
      } as ValidationResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
