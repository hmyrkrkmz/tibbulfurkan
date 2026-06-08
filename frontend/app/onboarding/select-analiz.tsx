import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Body, Button, Caption, Card, H2, H3, Label } from '@/src/ui';
import { formApi, FormSubmission } from '@/src/formApi';
import { useOnboarding } from '@/src/store';
import { colors, fonts, spacing } from '@/src/theme';

export default function SelectAnalizScreen() {
  const router = useRouter();
  const prefillFromForm = useOnboarding((s) => s.prefillFromForm);
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await formApi.list().catch(() => [] as FormSubmission[]);
      setForms(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onContinue = () => {
    if (!selectedId) return;
    const form = forms.find((f) => f.id === selectedId);
    if (!form) return;
    prefillFromForm(form);
    router.push('/onboarding/family');
  };

  const onGoAnaliz = () => router.replace('/analiz/personal');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
          <Body style={styles.backText}>← Geri</Body>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Caption style={{ color: colors.maternalPrimary, letterSpacing: 2 }}>SOY AĞACI</Caption>
        <H2 style={{ marginTop: spacing.xs }}>Analizi Seçin</H2>
        <Body style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
          Soy ağacınız, daha önce yaptığınız analiz formundaki verilerle oluşturulacaktır. Devam etmek için lütfen aşağıdan bir analiz seçin.
        </Body>

        <ScrollView
          style={{ flex: 1, marginTop: spacing.lg }}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.textPrimary} />}
        >
          {forms.length === 0 && !loading ? (
            <Card style={styles.emptyCard}>
              <H3 style={{ fontSize: 18, color: colors.accentSage }}>Henüz analiz yok</H3>
              <Body style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
                Soy ağacı oluşturabilmek için önce bir Analiz yapmalısınız. Form üzerinden bilgileri doldurun, ardından ağacınızı oluşturabilirsiniz.
              </Body>
              <Button title="Analize Git" onPress={onGoAnaliz} style={{ marginTop: spacing.md }} testID="go-analiz-btn" />
            </Card>
          ) : (
            <>
              <Label style={{ marginBottom: spacing.sm }}>MEVCUT ANALİZLER ({forms.length})</Label>
              {forms.map((f) => {
                const active = selectedId === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedId(f.id)}
                    testID={`select-form-${f.id}`}
                  >
                    <Card style={[styles.row, active && styles.rowActive]}>
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <H3 style={{ fontSize: 17 }}>{f.ad_soyad || 'İsimsiz analiz'}</H3>
                        <Caption>
                          {f.ai_analysis ? '✓ Analiz tamamlandı' : '○ Analiz beklemede'}
                          {f.dogum_tarihi ? `  ·  ${f.dogum_tarihi}` : ''}
                          {f.cinsiyet ? `  ·  ${f.cinsiyet}` : ''}
                        </Caption>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>

        {forms.length > 0 && (
          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button title="Yeni Analiz" variant="secondary" onPress={onGoAnaliz} style={{ flex: 1 }} testID="new-analiz-btn" />
              <Button
                title="Devam Et"
                onPress={onContinue}
                disabled={!selectedId}
                style={{ flex: 1.4, opacity: selectedId ? 1 : 0.5 }}
                testID="continue-btn"
              />
            </View>
            <Caption style={styles.hint}>
              Devam Et&apos;e bastığınızda, seçili analiz verileri soy ağacı düzenleme ekranına aktarılır.
            </Caption>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm, paddingHorizontal: spacing.lg },
  backBtn: { paddingVertical: spacing.xs, paddingRight: spacing.md },
  backText: { color: colors.textPrimary, fontFamily: fonts.bodySemi, fontSize: 16 },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  emptyCard: { marginTop: spacing.md, paddingVertical: spacing.lg, alignItems: 'flex-start' },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  rowActive: { borderColor: colors.maternalPrimary, borderWidth: 2 },

  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.maternalPrimary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.maternalPrimary },

  footer: { paddingBottom: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  hint: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.sm },
});
