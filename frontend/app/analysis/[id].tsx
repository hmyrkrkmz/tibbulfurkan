import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Button, Caption, Card, H2, H3, Label } from '@/src/ui';
import { api, AnalysisResult, DiseaseMatch } from '@/src/api';
import { colors, fonts, radius, spacing } from '@/src/theme';

export default function AnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmText, setLlmText] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const a = await api.getAnalysis(id);
    setAnalysis(a);
    if (a.llm_analysis) setLlmText(a.llm_analysis);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const runLLM = async () => {
    if (!id) return;
    setLlmLoading(true);
    try {
      const res = await api.llmAnalysis(id);
      setLlmText(res.llm_analysis);
    } catch (e: any) {
      Alert.alert('Hata', 'Detaylı analiz alınamadı: ' + e.message);
    } finally {
      setLlmLoading(false);
    }
  };

  if (!analysis) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Body>Yükleniyor…</Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="back-btn">
          <Body style={{ color: colors.accentSage }}>‹ Geri</Body>
        </TouchableOpacity>
        <Caption style={{ color: colors.accentSage, letterSpacing: 2 }}>DETAYLI ANALİZ</Caption>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>
        <H2 style={{ marginTop: spacing.sm }}>Soy Yükü Detayları</H2>
        <Caption style={{ color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md, fontStyle: 'italic' }}>
          Aşağıdaki bağlantılar; sağlık bilgilerinizden hareketle bilgi tabanı eşleştirmesi sonucudur. Yalnızca manevi içerik amaçlıdır, tıbbi tavsiye yerine geçmez.
        </Caption>

        {/* LLM Analiz */}
        <Card style={styles.llmCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <H3 style={{ fontSize: 18 }}>Yapay Zekâ Yorumu</H3>
            {llmLoading ? <ActivityIndicator color={colors.textPrimary} /> : null}
          </View>
          {llmText ? (
            <Body style={{ marginTop: spacing.sm, lineHeight: 24 }}>{llmText}</Body>
          ) : (
            <>
              <Caption style={{ marginTop: spacing.sm }}>
                Detaylı, kişiye özel manevi yorum için yapay zekâ analizi başlatın. Tüm verileriniz (anne soyu, baba soyu, adaklar, hastalıklar) değerlendirilir.
              </Caption>
              <Button title={llmLoading ? 'Hazırlanıyor…' : '✦ Detaylı Yorumu Başlat'} onPress={runLLM} disabled={llmLoading} style={{ marginTop: spacing.md }} testID="llm-btn" />
            </>
          )}
        </Card>

        <Label style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>TESPİT EDİLEN BAĞLANTILAR ({analysis.matches.length})</Label>

        {analysis.matches.length === 0 ? (
          <Card><Caption style={{ textAlign: 'center' }}>Mevcut verilerinize göre eşleşme bulunamadı. Daha fazla hastalık/atalar bilgisi girerseniz analiz zenginleşir.</Caption></Card>
        ) : (
          analysis.matches.map((m, i) => <DiseaseRow key={i} match={m} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DiseaseRow({ match }: { match: DiseaseMatch }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <TouchableOpacity onPress={() => setOpen((v) => !v)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <H3 style={{ fontSize: 18 }}>{match.disease}</H3>
            <Caption>{match.category}</Caption>
          </View>
          <View style={styles.scorePill}><Caption style={{ color: colors.bgPrimary, fontFamily: fonts.bodyBold }}>{match.total_score}</Caption></View>
        </View>
      </TouchableOpacity>
      {open && (
        <View style={{ marginTop: spacing.md }}>
          <Label style={{ marginBottom: spacing.sm }}>EŞLEŞEN MANEVİ SEBEPLER</Label>
          {match.matched_causes.map((c, i) => (
            <View key={i} style={styles.causeRow}>
              <View style={[styles.sideTag, { backgroundColor: c.source_side === 'maternal' ? colors.maternalLight : c.source_side === 'paternal' ? colors.paternalLight : colors.bgSecondary }]}>
                <Caption style={{ color: c.source_side === 'maternal' ? colors.maternalPrimary : c.source_side === 'paternal' ? colors.paternalPrimary : colors.textPrimary, fontSize: 9, fontFamily: fonts.bodyBold }}>
                  {c.source_side === 'maternal' ? 'ANNE' : c.source_side === 'paternal' ? 'BABA' : 'KENDİSİ'}
                </Caption>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Caption style={{ fontFamily: fonts.bodyMedium, color: colors.textPrimary }}>{c.category_label} · ağırlık {c.weight}</Caption>
                <Caption style={{ marginTop: 2 }}>{c.detail}</Caption>
              </View>
            </View>
          ))}
          <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>ÖNERİLEN MANEVİ KEFARET</Label>
          <Body style={{ fontStyle: 'italic', color: colors.textSecondary }}>{match.remedy}</Body>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  scorePill: { backgroundColor: colors.textPrimary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.round, minWidth: 36, alignItems: 'center' },
  causeRow: { flexDirection: 'row', marginBottom: spacing.sm, alignItems: 'flex-start' },
  sideTag: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: radius.round, minWidth: 50, alignItems: 'center' },
  llmCard: { backgroundColor: colors.bgSecondary, borderColor: colors.accentSage },
});
