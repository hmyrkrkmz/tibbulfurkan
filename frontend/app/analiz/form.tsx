import React, { useMemo, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Body, Button, Caption, Card, H2, H3, Input, Label, ProgressBar } from '@/src/ui';
import { useFormStore, serializeForBackend, ElderKey, YNKey, computeCompletion } from '@/src/formStore';
import { formApi } from '@/src/formApi';
import { colors, fonts, radius, spacing } from '@/src/theme';

const ELDERS: Array<{ key: ElderKey; label: string }> = [
  { key: 'anne', label: 'Anne' },
  { key: 'baba', label: 'Baba' },
  { key: 'anneanne', label: 'Anneanne' },
  { key: 'anne_babasi', label: 'Annenin Babası' },
  { key: 'babaanne', label: 'Babaanne' },
  { key: 'baba_babasi', label: 'Babanın Babası' },
];

// Tam 17 soru — Tıbb-ul Furkan formundaki Sorular bölümü
const QUESTIONS: Array<{ key: YNKey; label: string }> = [
  { key: 'adak_yemin', label: 'Geçmişte adak adamış mı? Yemin edip bozmuş mu?' },
  { key: 'muska_okunmus_su', label: 'Muska takmış mı? Okunmuş su içmiş mi?' },
  { key: 'miras_sorunu', label: 'Akrabalar arası miras sorunu var mı?' },
  { key: 'beddua_hak_haram', label: 'Herhangi birine beddua veya hak haram etmiş mi?' },
  { key: 'intihar', label: 'İntihar girişimi oldu mu?' },
  { key: 'anne_baba_ofke', label: 'Anne-babaya karşı öfke var mı?' },
  { key: 'es_soguklugu', label: 'Eşine karşı aşırı soğukluk / evlilikte problem var mı?' },
  { key: 'sehvet', label: 'Şehvet yüksekliği var mı?' },
  { key: 'duygusallik', label: 'Duygusallık var mı?' },
  { key: 'kin', label: 'Kin – geçmişi unutamama var mı?' },
  { key: 'kusme_alinganlik', label: 'İnat – küsme – alınganlık var mı?' },
  { key: 'ofke', label: 'Öfke var mı?' },
  { key: 'nefret', label: 'Nefret duygusu var mı?' },
  { key: 'supheci', label: 'Şüphecilik var mı?' },
  { key: 'uyku_sorunu', label: 'Uykusuzluk veya çok uyuma isteği var mı?' },
  { key: 'aniden_parlama', label: 'Aniden parlama var mı?' },
  { key: 'alaycilik', label: 'Alaycılık var mı?' },
];

export default function AnalizForm() {
  const router = useRouter();
  const state = useFormStore();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const faizValidationError = useMemo(() => {
    if (state.faiz === 'evet' && !state.faiz_aciklama.trim()) {
      return 'Faizli kredi için Evet seçildi — lütfen kısa bir açıklama yazın.';
    }
    return '';
  }, [state.faiz, state.faiz_aciklama]);

  // Tamamlanma yüzdesi (her değişiklikte yeniden hesaplanır)
  const completion = useMemo(() => computeCompletion(state), [state]);
  const progressColor =
    completion.percent < 30 ? '#C97A6A'
    : completion.percent < 70 ? '#B89B5E'
    : colors.accentSage;

  const submit = async () => {
    setErr('');
    if (faizValidationError) {
      setErr(faizValidationError);
      return;
    }
    setLoading(true);
    try {
      const payload = serializeForBackend(state);
      const submission = await formApi.create(payload as any);
      router.replace(`/analiz/sonuc/${submission.id}`);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Form gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.body}>
          <Caption style={{ color: colors.accentSage }}>2. AŞAMA / 2</Caption>
          <View style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
            <ProgressBar step={2} total={2} />
          </View>
          <H2>Tespit Formu</H2>
          <Body style={{ color: colors.textSecondary, marginTop: 4 }}>
            Aile büyükleri, mali durum, hastalıklar ve manevi sorular.
          </Body>

          {/* TAMAMLANMA YÜZDESİ */}
          <View style={styles.completionWrap}>
            <View style={styles.completionRow}>
              <Caption style={{ color: colors.textSecondary, letterSpacing: 1 }}>
                FORM TAMAMLANMA
              </Caption>
              <Caption style={[styles.completionPct, { color: progressColor }]}>
                %{completion.percent}  ·  {completion.filled}/{completion.total}
              </Caption>
            </View>
            <View style={styles.completionTrack}>
              <View
                style={[
                  styles.completionFill,
                  { width: `${completion.percent}%`, backgroundColor: progressColor },
                ]}
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
            {/* AİLE BÜYÜKLERİ */}
            <Card>
              <H3 style={{ fontSize: 16 }}>Aile Büyükleri</H3>
              <Caption style={{ marginBottom: spacing.md }}>Her büyüğünüz için "Sağ" veya "Vefat" seçin; ardından yaşını veya vefat yılını girin.</Caption>
              {ELDERS.map((e) => {
                const elder = state[e.key];
                return (
                  <View key={e.key} style={styles.elderRow}>
                    <Label>{e.label.toUpperCase()}</Label>
                    <View style={styles.radioRow}>
                      <RadioPill
                        label="● Sağ"
                        active={elder.status === 'sag'}
                        onPress={() => state.setElder(e.key, { status: 'sag', value: elder.status === 'sag' ? elder.value : '' })}
                        testID={`${e.key}-sag`}
                      />
                      <RadioPill
                        label="✕ Vefat"
                        active={elder.status === 'vefat'}
                        onPress={() => state.setElder(e.key, { status: 'vefat', value: elder.status === 'vefat' ? elder.value : '' })}
                        testID={`${e.key}-vefat`}
                      />
                    </View>
                    {elder.status ? (
                      <Input
                        value={elder.value}
                        onChangeText={(t) => state.setElder(e.key, { value: t.replace(/\D/g, '').slice(0, 4) })}
                        placeholder={elder.status === 'sag' ? 'Yaşı (Örn: 65)' : 'Vefat yılı (Örn: 2010)'}
                        keyboardType="number-pad"
                        style={styles.softInput}
                      />
                    ) : null}
                  </View>
                );
              })}
            </Card>

            {/* MALİ DURUM */}
            <Card>
              <H3 style={{ fontSize: 16 }}>Mali Durum</H3>

              <View style={styles.qBlock}>
                <Label>ZEKATINI VERİYOR MU?</Label>
                <View style={styles.radioRow}>
                  <RadioPill label="Evet" active={state.zekat === 'evet'} onPress={() => state.set({ zekat: 'evet' })} testID="zekat-evet" />
                  <RadioPill label="Hayır" active={state.zekat === 'hayir'} onPress={() => state.set({ zekat: 'hayir' })} testID="zekat-hayir" />
                </View>
              </View>

              <View style={styles.qBlock}>
                <Label>FAİZLİ KREDİ ÇEKTİ Mİ?</Label>
                <View style={styles.radioRow}>
                  <RadioPill
                    label="Evet"
                    active={state.faiz === 'evet'}
                    onPress={() => state.set({ faiz: 'evet' })}
                    testID="faiz-evet"
                  />
                  <RadioPill
                    label="Hayır"
                    active={state.faiz === 'hayir'}
                    onPress={() => state.set({ faiz: 'hayir', faiz_aciklama: '' })}
                    testID="faiz-hayir"
                  />
                </View>
                {state.faiz === 'evet' ? (
                  <Input
                    value={state.faiz_aciklama}
                    onChangeText={(t) => state.set({ faiz_aciklama: t })}
                    placeholder="Açıklama (zorunlu): ne zaman, miktarı, kapatıldı mı?"
                    style={[
                      styles.softInput,
                      !state.faiz_aciklama.trim() ? { borderBottomColor: colors.errorVow } : null,
                    ]}
                    multiline
                  />
                ) : null}
              </View>
            </Card>

            {/* AİLEDEKİ HASTALIKLAR */}
            <Card>
              <H3 style={{ fontSize: 16 }}>Ailedeki Hastalıklar</H3>
              <Caption style={{ marginBottom: spacing.sm }}>Tüm detayları yazabilirsiniz (varsa hangi hastalık, ne zamandır).</Caption>
              <Input
                label="ANNEDE HASTALIK VAR MI?"
                value={state.anne_hastalik}
                onChangeText={(t) => state.set({ anne_hastalik: t })}
                placeholder="Örn: Tansiyon, şeker, romatizma — yok"
                multiline
                style={styles.softInput}
              />
              <Input
                label="BABADA HASTALIK VAR MI?"
                value={state.baba_hastalik}
                onChangeText={(t) => state.set({ baba_hastalik: t })}
                placeholder="Örn: Kalp, prostat, astım — yok"
                multiline
                style={styles.softInput}
              />
              <Input
                label="ÇOCUKLARDA HASTALIK VAR MI?"
                value={state.cocuk_hastalik}
                onChangeText={(t) => state.set({ cocuk_hastalik: t })}
                placeholder="Örn: Hangi çocukta ne — yok"
                multiline
                style={styles.softInput}
              />
            </Card>

            {/* YAŞANILAN RUHSAL VE FİZİKSEL RAHATSIZLIKLAR */}
            <Card>
              <H3 style={{ fontSize: 16 }}>Yaşanılan Ruhsal ve Fiziksel Rahatsızlıklar</H3>
              <Caption style={{ marginBottom: spacing.sm }}>
                Mevcut hastalıklar, semptomlar, korkular, geçmiş travmalar — detaylı yazınız.
              </Caption>
              <Input
                value={state.rahatsizliklar}
                onChangeText={(t) => state.set({ rahatsizliklar: t })}
                placeholder="Örn: Migren, panik atak, uyku sorunu, eşle iletişim problemi, sık baş ağrısı…"
                multiline
                style={[styles.softInput, { minHeight: 110, textAlignVertical: 'top' }]}
              />
            </Card>

            {/* 17 SORU */}
            <Card>
              <H3 style={{ fontSize: 16 }}>Sorular</H3>
              <Caption style={{ marginBottom: spacing.md }}>
                Her soru için Evet/Hayır seçiniz. Açıklama alanı opsiyoneldir.
              </Caption>
              {QUESTIONS.map((q, idx) => {
                const yn = state[q.key];
                return (
                  <View key={q.key as string} style={styles.qBlock}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                      <Caption style={styles.qNum}>{idx + 1}.</Caption>
                      <Caption style={styles.qLabel}>{q.label}</Caption>
                    </View>
                    <View style={styles.radioRow}>
                      <RadioPill
                        label="Evet"
                        active={yn.status === 'evet'}
                        onPress={() => state.setYN(q.key, { status: 'evet' })}
                        testID={`${q.key}-evet`}
                      />
                      <RadioPill
                        label="Hayır"
                        active={yn.status === 'hayir'}
                        onPress={() => state.setYN(q.key, { status: 'hayir', note: '' })}
                        testID={`${q.key}-hayir`}
                      />
                    </View>
                    {/* Şeffaf açıklama — sadece "Evet"te göster, opsiyonel */}
                    {yn.status === 'evet' ? (
                      <Input
                        value={yn.note}
                        onChangeText={(t) => state.setYN(q.key, { note: t })}
                        placeholder="Açıklama (opsiyonel) — detay vermek isterseniz"
                        style={styles.softInput}
                        multiline
                      />
                    ) : null}
                  </View>
                );
              })}
            </Card>

            {err ? (
              <View style={styles.errBox}>
                <Body style={{ color: colors.errorVow }}>⚠ {err}</Body>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {/* Footer'da küçük yüzde özeti */}
            <Caption style={styles.footerHint}>
              {completion.percent === 100 ? '✓ Form eksiksiz' : `Form %${completion.percent} dolduruldu`}
            </Caption>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button title="Geri" variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} testID="back-btn" />
              <Button
                title={loading ? 'Gönderiliyor…' : 'Analizi Başlat'}
                onPress={submit}
                disabled={loading}
                style={{ flex: 1.4 }}
                testID="submit-btn"
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RadioPill({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]} testID={testID} activeOpacity={0.7}>
      <Caption style={[styles.pillText, active && { color: colors.bgPrimary }]}>{label}</Caption>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  elderRow: { marginBottom: spacing.md },
  qBlock: { marginBottom: spacing.md },

  qNum: { fontFamily: fonts.bodyBold, color: colors.accentSage, width: 22, marginTop: 1 },
  qLabel: { fontFamily: fonts.bodyMedium, color: colors.textPrimary, fontSize: 14, flex: 1, lineHeight: 19 },

  radioRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.xs },

  pill: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: radius.round,
    borderWidth: 1, borderColor: colors.borderSubtle,
    backgroundColor: colors.bgCard,
    minWidth: 78, alignItems: 'center',
  },
  pillActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  pillText: { color: colors.textPrimary, fontFamily: fonts.bodyMedium, fontSize: 13 },

  // Şeffaf, soluk görünümlü açıklama girdisi
  softInput: {
    backgroundColor: 'rgba(248, 244, 235, 0.55)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 4,
  },

  errBox: { padding: spacing.md, borderRadius: radius.md, backgroundColor: '#F8E1DE', borderWidth: 1, borderColor: colors.errorVow, marginTop: spacing.sm },

  footer: { paddingBottom: spacing.md, paddingTop: spacing.sm },
  footerHint: { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xs, fontStyle: 'italic' },

  completionWrap: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  completionPct: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.5 },
  completionTrack: { height: 6, borderRadius: 3, backgroundColor: colors.bgSecondary, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 3 },
});
