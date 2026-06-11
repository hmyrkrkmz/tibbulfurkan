import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Button, Caption, Card, H1, Label } from '@/src/ui';
import { formApi, FormSubmission } from '@/src/formApi';
import { colors, fonts, radius, spacing } from '@/src/theme';
import { AnalysisDisplay } from '@/src/AnalysisDisplay';
import { shareAnalysisAsPdf, shareAnalysisAsText } from '@/src/sharePdf';

export default function AnalizSonuc() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [running, setRunning] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const runningRef = useRef(false);
  const pollTimerRef = useRef<any>(null);
  const tickRef = useRef<any>(null);
  const startedAtRef = useRef<number>(0);

  // GET form
  const load = useCallback(async () => {
    if (!id) return;
    try {
      const s = await formApi.get(id);
      setSubmission(s);
      if (s.ai_analysis) {
        setAnalysis(s.ai_analysis);
      }
      return s;
    } catch (e: any) {
      setErrorMsg(e.message || 'Form yüklenemedi');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Süreyi say (saniye)
  const startTicker = () => {
    startedAtRef.current = Date.now();
    setElapsed(0);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
  };
  const stopTicker = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  // Polling: arka planda analizi DB'den kontrol et
  const startPolling = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    let attempts = 0;
    pollTimerRef.current = setInterval(async () => {
      attempts++;
      try {
        const s = await formApi.get(id!);
        if (s.ai_analysis) {
          setAnalysis(s.ai_analysis);
          setSubmission(s);
          finishRun();
          return;
        }
      } catch {}
      // Maks 36 deneme (~3 dk) — sonra vazgeç
      if (attempts >= 36) {
        finishRun('Sunucu yanıt vermiyor. Lütfen birkaç dakika sonra "Tekrar Analiz Et" deyiniz.');
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
  };

  const finishRun = (err?: string) => {
    stopTicker();
    stopPolling();
    runningRef.current = false;
    setRunning(false);
    if (err) setErrorMsg(err);
  };

  const runAnalysis = async (force = false) => {
    if (!id) return;
    if (runningRef.current) return; // çoklu istek koruması
    runningRef.current = true;
    setErrorMsg('');
    setRunning(true);
    startTicker();

    // Polling'i hemen başlat — fetch takılırsa devreye girer
    startPolling();

    try {
      // 110sn timeout — proxy'nin altında kal
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 110000);
      try {
        const res = await formApi.analyze(id, { force, signal: controller.signal });
        clearTimeout(tid);
        if (res?.ai_analysis) {
          setAnalysis(res.ai_analysis);
          finishRun();
        }
      } catch (fetchErr: any) {
        clearTimeout(tid);
        // Fetch düştü ama backend tamamlamış olabilir — polling devam ediyor
        // Polling onu yakalayacak; burada erken hata gösterme
        if (fetchErr?.name !== 'AbortError') {
          // gerçek hata ise polling'e biraz daha şans ver
        }
      }
    } catch (e: any) {
      // Polling devam ediyor olabilir, hemen failed olarak işaretleme
    }
  };

  // İlk açılışta otomatik başlat (sadece analiz yoksa)
  useEffect(() => {
    if (submission && !submission.ai_analysis && !analysis && !runningRef.current) {
      runAnalysis(false);
    }
    return () => { stopTicker(); stopPolling(); };
  }, [submission?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sayfa kapanırken temizle
  useEffect(() => () => { stopTicker(); stopPolling(); }, []);

  if (!submission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.textPrimary} />
          <Body style={{ marginTop: spacing.sm }}>Yükleniyor…</Body>
        </View>
      </SafeAreaView>
    );
  }

  const progressText =
    elapsed < 10 ? 'Bilgi tabanı taranıyor…'
    : elapsed < 25 ? 'Form verileriniz yorumlanıyor…'
    : elapsed < 50 ? 'Bilgi tabanındaki örüntülerle karşılaştırılıyor…'
    : elapsed < 90 ? 'Analiz tamamlanmak üzere…'
    : 'Sonuç hazırlanıyor — biraz daha sabır…';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')} testID="home-btn">
          <Body style={{ color: colors.accentSage }}>‹ Ana sayfa</Body>
        </TouchableOpacity>
        <Caption style={{ color: colors.accentSage, letterSpacing: 2 }}>ANALİZ</Caption>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>
        <H1 style={{ fontSize: 32, marginTop: spacing.sm }}>{submission.ad_soyad}</H1>
        <Caption>
          {submission.cinsiyet === 'erkek' ? '♂ Erkek' : submission.cinsiyet === 'kadın' ? '♀ Kadın' : ''}
          {submission.dogum_tarihi ? `  ·  Doğum: ${submission.dogum_tarihi}` : ''}
        </Caption>

        {running && (
          <Card style={{ marginTop: spacing.lg, backgroundColor: colors.bgSecondary, borderColor: colors.accentSage, alignItems: 'center', paddingVertical: spacing.lg }}>
            <ActivityIndicator color={colors.textPrimary} size="large" />
            <Body style={{ marginTop: spacing.sm, fontStyle: 'italic', textAlign: 'center' }}>{progressText}</Body>
            <Caption style={{ marginTop: 4, color: colors.textSecondary }}>{elapsed} sn  ·  ortalama 30–90 sn sürer</Caption>
            <Caption style={{ marginTop: spacing.xs, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', fontSize: 12 }}>
              Sayfa açık kalsın — sonuç hazır olunca otomatik görünecek.
            </Caption>
          </Card>
        )}

        {analysis && !running && (
          <View style={{ marginTop: spacing.lg }}>
            <Label style={{ color: colors.accentSage, marginBottom: spacing.sm, letterSpacing: 2 }}>
              OLASI TESPİTLER
            </Label>
            <AnalysisDisplay markdown={analysis} />

            {/* PAYLAŞIM ARAÇLARI */}
            <View style={styles.shareRow}>
              <TouchableOpacity
                onPress={() => shareAnalysisAsPdf({
                  ad_soyad: submission.ad_soyad,
                  cinsiyet: submission.cinsiyet,
                  dogum_tarihi: submission.dogum_tarihi,
                  analysis,
                })}
                style={[styles.shareBtn, styles.shareBtnPrimary]}
                testID="share-pdf"
                activeOpacity={0.85}
              >
                <Caption style={styles.shareLabelLight}>PDF İndir / Yazdır</Caption>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => shareAnalysisAsText({ ad_soyad: submission.ad_soyad, analysis })}
                style={[styles.shareBtn, styles.shareBtnSecondary]}
                testID="share-whatsapp"
                activeOpacity={0.85}
              >
                <Caption style={styles.shareLabelDark}>WhatsApp ile Paylaş</Caption>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {errorMsg ? (
          <Card style={{ marginTop: spacing.md, borderColor: colors.errorVow, backgroundColor: '#F8E1DE' }}>
            <Body style={{ color: colors.errorVow }}>⚠ {errorMsg}</Body>
          </Card>
        ) : null}

        {!analysis && !running && (
          <Button title="Analizi Başlat" onPress={() => runAnalysis(false)} style={{ marginTop: spacing.lg }} testID="run-analysis" />
        )}

        {analysis && !running && (
          <Button
            title="Yeniden Analiz Et"
            variant="secondary"
            onPress={() => runAnalysis(true)}
            style={{ marginTop: spacing.md }}
            testID="rerun-analysis"
          />
        )}

        <Caption style={{ marginTop: spacing.lg, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>
          Bu içerik tıbbi tavsiye değildir, yalnızca manevi yönden olası işaretleri sunar.
        </Caption>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  shareRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  shareBtn: {
    flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  shareBtnPrimary: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  shareBtnSecondary: { backgroundColor: '#25D366', borderColor: '#25D366' },
  shareIcon: { fontSize: 22, marginBottom: 2 },
  shareLabelLight: { color: colors.bgPrimary, fontFamily: fonts.bodySemi, letterSpacing: 0.5, fontSize: 12, textAlign: 'center' },
  shareLabelDark: { color: '#FFFFFF', fontFamily: fonts.bodySemi, letterSpacing: 0.5, fontSize: 12, textAlign: 'center' },
});
