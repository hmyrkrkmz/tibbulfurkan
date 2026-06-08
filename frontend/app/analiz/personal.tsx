import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Body, Button, Caption, H2, Input, Label, ProgressBar } from '@/src/ui';
import { useFormStore, formatBirthDate } from '@/src/formStore';
import { colors, fonts, radius, spacing } from '@/src/theme';

export default function AnalizPersonal() {
  const router = useRouter();
  const state = useFormStore();
  const [error, setError] = useState('');

  const onNext = () => {
    if (!state.ad_soyad.trim() || !state.dogum_tarihi.trim() || !state.cinsiyet) {
      setError('Ad-soyad, doğum tarihi ve cinsiyet zorunludur.');
      return;
    }
    if (state.dogum_tarihi.replace(/\D/g, '').length !== 8) {
      setError('Doğum tarihini GG.AA.YYYY biçiminde tam giriniz.');
      return;
    }
    setError('');
    router.push('/analiz/form');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.body}>
          <Caption style={{ color: colors.accentSage }}>1. AŞAMA / 2</Caption>
          <View style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}><ProgressBar step={1} total={2} /></View>
          <H2>Kişisel Bilgiler</H2>
          <Body style={{ color: colors.textSecondary, marginTop: 4 }}>
            Ad-Soyad, doğum tarihi ve cinsiyet zorunludur. Diğer alanlar opsiyoneldir.
          </Body>

          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
            <View style={{ marginTop: spacing.lg }}>
              <Input
                label="AD SOYAD"
                value={state.ad_soyad}
                onChangeText={(t) => state.set({ ad_soyad: t })}
                placeholder="Örn: Ahmet Yılmaz"
                testID="ad-soyad"
              />
              <Input
                label="YAŞ"
                value={state.yas}
                onChangeText={(t) => state.set({ yas: t.replace(/\D/g, '').slice(0, 3) })}
                keyboardType="number-pad"
                placeholder="Örn: 35"
                testID="yas"
              />
              <Input
                label="DOĞUM TARİHİ  ·  GG.AA.YYYY"
                value={state.dogum_tarihi}
                onChangeText={(t) => state.set({ dogum_tarihi: formatBirthDate(t) })}
                keyboardType="number-pad"
                placeholder="01.01.1990"
                maxLength={10}
                testID="dogum-tarihi"
              />
              <Input
                label="TELEFON"
                value={state.tlf}
                onChangeText={(t) => state.set({ tlf: t })}
                keyboardType="phone-pad"
                placeholder="Örn: 0555 555 55 55"
                testID="tlf"
              />
              <Input
                label="MEDENİ DURUM"
                value={state.medeni_durum}
                onChangeText={(t) => state.set({ medeni_durum: t })}
                placeholder="Evli / Bekâr / Dul / Boşanmış"
                testID="medeni"
              />
              <Input
                label="ÇOCUK SAYISI"
                value={state.cocuk_sayisi}
                onChangeText={(t) => state.set({ cocuk_sayisi: t.replace(/\D/g, '').slice(0, 2) })}
                keyboardType="number-pad"
                placeholder="0"
                testID="cocuk-sayisi"
              />
              <Input
                label="MEMLEKET"
                value={state.memleket}
                onChangeText={(t) => state.set({ memleket: t })}
                placeholder="Örn: Konya"
                testID="memleket"
              />

              <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>CİNSİYET</Label>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {(['erkek', 'kadın'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => state.set({ cinsiyet: g })}
                    style={[styles.gBtn, state.cinsiyet === g && styles.gActive]}
                    testID={`g-${g}`}
                  >
                    <Body style={[styles.gText, state.cinsiyet === g && { color: colors.bgPrimary }]}>
                      {g === 'erkek' ? '♂  Erkek' : '♀  Kadın'}
                    </Body>
                  </TouchableOpacity>
                ))}
              </View>

              {error ? (
                <View style={styles.err}>
                  <Body style={{ color: colors.errorVow }}>⚠ {error}</Body>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button title="Geri" variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} testID="back-btn" />
              <Button title="Devam Et" onPress={onNext} style={{ flex: 1.4 }} testID="next-btn" />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  gBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center', backgroundColor: colors.bgCard,
  },
  gActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  gText: { fontFamily: fonts.bodyMedium },
  err: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#F8E1DE', borderWidth: 1, borderColor: colors.errorVow },
  footer: { paddingBottom: spacing.md, paddingTop: spacing.sm },
});
