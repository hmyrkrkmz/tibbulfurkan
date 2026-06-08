import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, RefreshControl, ImageBackground, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Body, Caption, Card, H1, H3, Label } from '@/src/ui';
import { api, Profile } from '@/src/api';
import { formApi, FormSubmission } from '@/src/formApi';
import { colors, fonts, radius, spacing } from '@/src/theme';
import { useOnboarding } from '@/src/store';
import { useFormStore } from '@/src/formStore';

const PATTERN_URL = 'https://static.prod-images.emergentagent.com/jobs/a8e0387a-3118-42ae-a69b-79e3d2f34d2c/images/94e5609f6cf42b3524e9ba410942cfc792b2971de9c67cea6dab6426d058193c.png';

export default function Home() {
  const router = useRouter();
  const resetOnboarding = useOnboarding((s) => s.reset);
  const resetForm = useFormStore((s) => s.reset);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pData, fData] = await Promise.all([
        api.listProfiles().catch(() => []),
        formApi.list().catch(() => []),
      ]);
      setProfiles(pData);
      setForms(fData);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const startAnaliz = () => {
    resetForm();
    router.push('/analiz/personal');
  };

  const startSoyAgaci = () => {
    if (loading) return;
    resetOnboarding();
    router.push('/onboarding/select-analiz');
  };

  const deleteForm = (id: string, name: string) => {
    Alert.alert('Sil', `${name} formunu silmek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try { await formApi.remove(id); load(); } catch {}
        },
      },
    ]);
  };

  const deleteProfile = (id: string, name: string) => {
    Alert.alert('Sil', `${name} profilini silmek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try { await api.deleteProfile(id); load(); } catch {}
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bgPrimary }}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.textPrimary} />}
      >
        <ImageBackground
          source={{ uri: PATTERN_URL }}
          imageStyle={{ opacity: 0.08, resizeMode: 'cover' }}
          style={styles.hero}
        >
          <View style={styles.heroInner}>
            <Caption style={{ letterSpacing: 4, color: colors.accentSage }}>ﺗﺐ ﺍﻟﻔﺮﻗﺎﻥ</Caption>
            <H1 style={styles.title} testID="app-title">Tıbb-ul Furkan</H1>
            <Body style={styles.subtitle}>
              Şifaya açılan kapı, genetik yüklerden arınma vakti
            </Body>
          </View>
        </ImageBackground>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <Label style={{ marginBottom: spacing.sm }}>BAŞLA</Label>

          {/* İKİ ANA BÖLÜM: Analiz · Soy Ağacı */}
          <View style={styles.twoCol}>
            <TouchableOpacity onPress={startAnaliz} activeOpacity={0.85} style={[styles.bigCard, styles.cardAnaliz]} testID="start-analiz-btn">
              <Caption style={{ color: colors.accentSage, letterSpacing: 2 }}>✦  TESPİT</Caption>
              <H3 style={styles.bigCardTitle}>Analiz</H3>
              <Body style={styles.bigCardDesc}>
                Form üzerinden yapay zekâ destekli soy yükü tespiti.
              </Body>
              <Body style={styles.cta}>Forma başla  ›</Body>
            </TouchableOpacity>

            <TouchableOpacity onPress={startSoyAgaci} activeOpacity={0.85} style={[styles.bigCard, styles.cardSoy]} testID="start-soy-btn">
              <Caption style={{ color: colors.maternalPrimary, letterSpacing: 2 }}>⌘  HARİTA</Caption>
              <H3 style={styles.bigCardTitle}>Soy Ağacı</H3>
              <Body style={styles.bigCardDesc}>
                Anne-baba soyunu görselleştir, etkileşimli zihin haritası oluştur.
              </Body>
              <Body style={styles.cta}>Ağacı oluştur  ›</Body>
            </TouchableOpacity>
          </View>

          {/* ANALİZ KAYITLARI */}
          {forms.length > 0 && (
            <>
              <Label style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>SON ANALİZLER ({forms.length})</Label>
              {forms.slice(0, 10).map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => router.push(`/analiz/sonuc/${f.id}`)}
                  onLongPress={() => deleteForm(f.id, f.ad_soyad)}
                  testID={`form-${f.id}`}
                >
                  <Card style={styles.listCard}>
                    <View style={[styles.dot, { backgroundColor: colors.accentSage }]} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <H3 style={{ fontSize: 17 }}>{f.ad_soyad}</H3>
                      <Caption>
                        {f.ai_analysis ? '✓ Analiz tamamlandı' : '○ Henüz analiz edilmedi'}
                        {f.dogum_tarihi ? `  ·  ${f.dogum_tarihi}` : ''}
                      </Caption>
                    </View>
                    <Body style={styles.arrow}>›</Body>
                  </Card>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* SOY AĞACI KAYITLARI */}
          {profiles.length > 0 && (
            <>
              <Label style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>SOY AĞAÇLARI ({profiles.length})</Label>
              {profiles.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/profile/${item.id}`)}
                  onLongPress={() => deleteProfile(item.id, `${item.first_name} ${item.last_name}`)}
                  testID={`profile-${item.id}`}
                >
                  <Card style={styles.listCard}>
                    <View style={styles.avatar}>
                      <Body style={{ color: colors.bgPrimary, fontFamily: fonts.bodyBold }}>
                        {(item.first_name?.[0] || '?').toUpperCase()}
                      </Body>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <H3 style={{ fontSize: 17 }}>{item.first_name} {item.last_name}</H3>
                      <Caption>
                        {item.gender === 'erkek' ? '♂ Erkek' : '♀ Kadın'}  ·  {item.ancestors?.length || 0} ata
                      </Caption>
                    </View>
                    <Body style={styles.arrow}>›</Body>
                  </Card>
                </TouchableOpacity>
              ))}
            </>
          )}

          {forms.length === 0 && profiles.length === 0 && !loading && (
            <Card style={{ marginTop: spacing.lg }}>
              <Body style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Henüz kayıt yok. Yukarıdan &quot;Analiz&quot; veya &quot;Soy Ağacı&quot; ile başlayabilirsiniz.
              </Body>
            </Card>
          )}

          <Caption style={{ marginTop: spacing.lg, textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic' }}>
            Bir kaydı silmek için üzerine basılı tutun.
          </Caption>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 240, backgroundColor: colors.bgSecondary, marginBottom: spacing.lg },
  heroInner: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'flex-end', paddingBottom: spacing.lg },
  title: { fontSize: 42, marginTop: spacing.sm },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs, fontFamily: fonts.body, fontStyle: 'italic' },

  twoCol: { flexDirection: 'row', gap: spacing.sm },
  bigCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 168,
    justifyContent: 'space-between',
  },
  cardAnaliz: { backgroundColor: colors.bgCard, borderColor: colors.accentSage },
  cardSoy: { backgroundColor: colors.bgCard, borderColor: colors.maternalPrimary },
  bigCardTitle: { fontSize: 24, marginTop: spacing.xs },
  bigCardDesc: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
  cta: { fontFamily: fonts.bodySemi, color: colors.textPrimary, marginTop: spacing.sm },

  listCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  avatar: {
    width: 40, height: 40, borderRadius: radius.round,
    backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center',
  },
  arrow: { fontSize: 22, color: colors.accentSage, marginLeft: spacing.sm },
});
