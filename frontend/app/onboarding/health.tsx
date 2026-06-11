import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Body, Button, Caption, Chip, H2, Input, KeyboardScroll, Label, ProgressBar, Screen } from '@/src/ui';
import { useOnboarding } from '@/src/store';
import { colors, spacing } from '@/src/theme';

export default function HealthStage() {
  const router = useRouter();
  const { current_diseases, symptoms, life_events, allergies, set } = useOnboarding();
  const [d, setD] = useState('');
  const [s, setS] = useState('');
  const [ev, setEv] = useState('');
  const [allergen, setAllergen] = useState('');
  const [since, setSince] = useState('');

  const addDisease = () => { if (d.trim()) { set({ current_diseases: [...current_diseases, d.trim()] }); setD(''); } };
  const addSymptom = () => { if (s.trim()) { set({ symptoms: [...symptoms, s.trim()] }); setS(''); } };
  const addEvent = () => { if (ev.trim()) { set({ life_events: [...life_events, ev.trim()] }); setEv(''); } };
  const addAllergy = () => {
    if (allergen.trim()) {
      set({ allergies: [...allergies, { allergen: allergen.trim(), since: since.trim() }] });
      setAllergen(''); setSince('');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Screen>
          <View style={{ paddingTop: spacing.md }}>
            <Caption style={{ color: colors.accentSage }}>2. AŞAMA / 3</Caption>
            <View style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
              <ProgressBar step={2} total={3} />
            </View>
            <H2>Sağlık, Alerji ve Olaylar</H2>
            <Body style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
              Mevcut hastalıklar, semptomlar, hayatınızdaki büyük olaylar ve alerjileriniz.
            </Body>
          </View>

          <KeyboardScroll>
            <Label style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>HASTALIKLAR</Label>
            <View style={styles.row}>
              <Input value={d} onChangeText={setD} placeholder="Örn: Şeker, Astım, Migren" style={{ flex: 1 }} testID="input-disease" onSubmitEditing={addDisease} />
              <Button title="+ Ekle" variant="secondary" onPress={addDisease} testID="add-disease" style={{ marginLeft: spacing.sm, marginBottom: spacing.md }} />
            </View>
            <View style={styles.chipWrap}>
              {current_diseases.map((it, i) => (
                <Chip key={`${it}-${i}`} label={it} side="self" onRemove={() => set({ current_diseases: current_diseases.filter((_, x) => x !== i) })} testID={`chip-disease-${i}`} />
              ))}
            </View>

            <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>SEMPTOMLAR</Label>
            <View style={styles.row}>
              <Input value={s} onChangeText={setS} placeholder="Örn: Sürekli baş ağrısı, çarpıntı" style={{ flex: 1 }} testID="input-symptom" onSubmitEditing={addSymptom} />
              <Button title="+ Ekle" variant="secondary" onPress={addSymptom} testID="add-symptom" style={{ marginLeft: spacing.sm, marginBottom: spacing.md }} />
            </View>
            <View style={styles.chipWrap}>
              {symptoms.map((it, i) => (
                <Chip key={`${it}-${i}`} label={it} side="self" onRemove={() => set({ symptoms: symptoms.filter((_, x) => x !== i) })} testID={`chip-symptom-${i}`} />
              ))}
            </View>

            <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>HAYATTAKİ OLAYLAR / TIKANIKLIKLAR</Label>
            <View style={styles.row}>
              <Input value={ev} onChangeText={setEv} placeholder="Örn: İş hayatında durgunluk, evlilik problemi" style={{ flex: 1 }} testID="input-event" onSubmitEditing={addEvent} />
              <Button title="+ Ekle" variant="secondary" onPress={addEvent} testID="add-event" style={{ marginLeft: spacing.sm, marginBottom: spacing.md }} />
            </View>
            <View style={styles.chipWrap}>
              {life_events.map((it, i) => (
                <Chip key={`${it}-${i}`} label={it} side="self" onRemove={() => set({ life_events: life_events.filter((_, x) => x !== i) })} testID={`chip-event-${i}`} />
              ))}
            </View>

            <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>ALERJİLER</Label>
            <View style={styles.row}>
              <Input value={allergen} onChangeText={setAllergen} placeholder="Örn: Polen, fıstık, toz, ilaç" style={{ flex: 1 }} testID="input-allergen" />
            </View>
            <View style={styles.row}>
              <Input value={since} onChangeText={setSince} placeholder="Ne zamandan beri? (örn: çocukluk, 2018)" style={{ flex: 1 }} testID="input-allergy-since" />
              <Button title="+ Ekle" variant="secondary" onPress={addAllergy} testID="add-allergy" style={{ marginLeft: spacing.sm, marginBottom: spacing.md }} />
            </View>
            <View style={styles.chipWrap}>
              {allergies.map((a, i) => (
                <Chip key={`${a.allergen}-${i}`} label={`${a.allergen}${a.since ? ` (${a.since})` : ''}`} side="self" onRemove={() => set({ allergies: allergies.filter((_, x) => x !== i) })} testID={`chip-allergy-${i}`} />
              ))}
            </View>
          </KeyboardScroll>

          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button title="Geri" variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} testID="back-btn" />
              <Button title="Devam Et" onPress={() => router.push('/onboarding/family')} style={{ flex: 1 }} testID="next-btn" />
            </View>
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  footer: { paddingBottom: spacing.md, paddingTop: spacing.sm },
});
