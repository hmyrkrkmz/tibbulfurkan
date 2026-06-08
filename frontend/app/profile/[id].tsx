import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Button, Caption, Card, H1, H3, Label, Screen } from '@/src/ui';
import { api, Profile } from '@/src/api';
import { colors, fonts, radius, spacing } from '@/src/theme';

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await api.getProfile(id);
      setProfile(p);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = () => {
    Alert.alert('Soy Ağacını Sil', 'Bu soy ağacı silinecek. Emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await api.deleteProfile(id!);
          router.replace('/');
        },
      },
    ]);
  };

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Body>{loading ? 'Yükleniyor...' : 'Profil bulunamadı.'}</Body>
        </View>
      </SafeAreaView>
    );
  }

  const maternalCount = profile.ancestors?.filter((a) => a.side === 'maternal').length || 0;
  const paternalCount = profile.ancestors?.filter((a) => a.side === 'paternal').length || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.replace('/')} testID="home-btn" style={styles.backButton}>
              <Body style={{ color: colors.textSecondary }}>← Geri</Body>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} testID="delete-btn">
              <Caption style={{ color: colors.errorVow }}>Sil</Caption>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Caption style={{ color: colors.accentSage, letterSpacing: 2 }}>SOY AĞACI</Caption>
            <H1 style={{ fontSize: 36, marginTop: spacing.xs }}>
              {profile.first_name} {profile.last_name}
            </H1>
            <Caption>
              {profile.gender === 'erkek' ? '♂ Erkek' : '♀ Kadın'} · Doğum: {profile.birth_date}
            </Caption>
          </View>

          <Card style={{ marginTop: spacing.lg }}>
            <Label style={{ marginBottom: spacing.sm }}>SOY DAĞILIMI</Label>
            <View style={styles.row}>
              <View style={styles.statCol}>
                <View style={[styles.dot, { backgroundColor: colors.maternalPrimary }]} />
                <H3 style={{ fontSize: 22, marginTop: 4 }}>{maternalCount}</H3>
                <Caption>Anne soyu</Caption>
              </View>
              <View style={styles.statCol}>
                <View style={[styles.dot, { backgroundColor: colors.paternalPrimary }]} />
                <H3 style={{ fontSize: 22, marginTop: 4 }}>{paternalCount}</H3>
                <Caption>Baba soyu</Caption>
              </View>
              <View style={styles.statCol}>
                <View style={[styles.dot, { backgroundColor: colors.textPrimary }]} />
                <H3 style={{ fontSize: 22, marginTop: 4 }}>{profile.ancestors?.length || 0}</H3>
                <Caption>Toplam</Caption>
              </View>
            </View>
          </Card>

          <Button
            title="Soy Ağacını Aç"
            onPress={() => router.push(`/mindmap/${id}`)}
            style={{ marginTop: spacing.md }}
            testID="mindmap-btn"
          />

          <Caption style={{ marginTop: spacing.lg, textAlign: 'center', color: colors.textSecondary, fontStyle: 'italic' }}>
            Detaylı manevi analiz için ana sayfadaki "Analiz" bölümünü kullanın.
          </Caption>
        </ScrollView>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statCol: { alignItems: 'center', flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
