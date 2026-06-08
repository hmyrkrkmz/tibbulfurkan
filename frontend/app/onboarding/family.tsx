import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Body, Button, Caption, Card, Chip, H2, H3, Input, Label, ProgressBar, Screen } from '@/src/ui';
import { useOnboarding } from '@/src/store';
import { colors, fonts, radius, spacing } from '@/src/theme';
import { api } from '@/src/api';
import type { Ancestor } from '@/src/api';

// Sabit hızlı seçenekler — sadece Anne ve Baba. Diğer akrabaları kullanıcı manuel ekler.
const MATERNAL_RELATIONS = [
  { key: 'anne', label: 'Anne' },
];

const PATERNAL_RELATIONS = [
  { key: 'baba', label: 'Baba' },
];

// Kullanıcı yazısından akrabalık anahtarı tespiti — zihin haritası ağacı için
const MATERNAL_KEYWORDS: Record<string, string> = {
  anne: 'anne',
  anneanne: 'anneanne',
  'anne tarafı dede': 'anne_dedesi',
  'anne dede': 'anne_dedesi',
  dede: 'anne_dedesi',
  teyze: 'teyze',
  dayı: 'dayi',
  dayi: 'dayi',
  'anne büyük anne': 'anne_buyuk_anne',
  'anne büyük dede': 'anne_buyuk_dede',
};

const PATERNAL_KEYWORDS: Record<string, string> = {
  baba: 'baba',
  babaanne: 'babaanne',
  'baba tarafı dede': 'baba_dedesi',
  'baba dede': 'baba_dedesi',
  dede: 'baba_dedesi',
  hala: 'hala',
  amca: 'amca',
  'baba büyük anne': 'baba_buyuk_anne',
  'baba büyük dede': 'baba_buyuk_dede',
};

function detectRelationKey(text: string, side: 'maternal' | 'paternal'): string | undefined {
  const t = text.trim().toLowerCase();
  if (!t) return undefined;
  const map = side === 'maternal' ? MATERNAL_KEYWORDS : PATERNAL_KEYWORDS;
  // Önce tam eşleşme
  if (map[t]) return map[t];
  // Sonra alt-dize eşleşmesi (en uzun önce)
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (t.includes(k)) return map[k];
  }
  return undefined;
}

export default function FamilyStage() {
  const router = useRouter();
  const state = useOnboarding();
  const { ancestors, set, toCreatePayload, source_form_id } = state;
  const fromAnaliz = !!source_form_id;
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Ancestor | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customMaternal, setCustomMaternal] = useState('');
  const [customPaternal, setCustomPaternal] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!state.first_name) {
      Alert.alert('Eksik bilgi', 'Lütfen önce 1. aşamadan başlayın.');
      return;
    }
    setLoading(true);
    try {
      const payload = toCreatePayload();
      const profile = await api.createProfile(payload);
      router.replace(`/profile/${profile.id}`);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Profil oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const openWithRelation = (relation: string, side: 'maternal' | 'paternal', relation_key?: string) => {
    setEditingIndex(null);
    setEditing({
      relation,
      relation_key,
      side,
      name: '',
      diseases: [],
      events: [],
      unfulfilled_vows: [],
      sins_admitted: [],
      is_alive: true,
    });
    setModal(true);
  };

  const openExisting = (idx: number) => {
    const a = ancestors[idx];
    if (!a) return;
    setEditingIndex(idx);
    setEditing({
      ...a,
      diseases: [...(a.diseases || [])],
      events: [...(a.events || [])],
      unfulfilled_vows: [...(a.unfulfilled_vows || [])],
      sins_admitted: [...(a.sins_admitted || [])],
    });
    setModal(true);
  };

  const addCustom = (side: 'maternal' | 'paternal') => {
    const text = (side === 'maternal' ? customMaternal : customPaternal).trim();
    if (!text) return;
    openWithRelation(text, side); // relation_key boş → manuel akrabalık
    if (side === 'maternal') setCustomMaternal('');
    else setCustomPaternal('');
  };

  const saveAncestor = () => {
    if (!editing) return;
    if (editingIndex !== null) {
      // Mevcut atayı güncelle
      const copy = [...ancestors];
      copy[editingIndex] = editing;
      set({ ancestors: copy });
    } else {
      // Yeni ata ekle
      set({ ancestors: [...ancestors, editing] });
    }
    setEditing(null);
    setEditingIndex(null);
    setModal(false);
  };

  const closeModal = () => {
    setEditing(null);
    setEditingIndex(null);
    setModal(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Screen>
          <View style={{ paddingTop: spacing.md }}>
            {fromAnaliz ? (
              <>
                <Caption style={{ color: colors.maternalPrimary, letterSpacing: 2 }}>SOY AĞACI</Caption>
                <View style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
                  <ProgressBar step={1} total={1} />
                </View>
                <H2>Aile & Soy Ağacı</H2>
                <Body style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
                  Analiz formundan gelen anne-baba bilgileri aşağıda hazırlandı. Soy ağacınızı zenginleştirmek için anne ve baba soyundan başka kişiler ekleyebilirsiniz.
                </Body>
              </>
            ) : (
              <>
                <Caption style={{ color: colors.accentSage }}>3. AŞAMA / 3</Caption>
                <View style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
                  <ProgressBar step={3} total={3} />
                </View>
                <H2>Aile & Soy Ağacı</H2>
                <Body style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
                  Anne, baba ve ataların hastalıkları, yaşadıkları olaylar ve bilinen günahları.
                </Body>
              </>
            )}
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
            {/* Anne soyu */}
            <Label style={{ marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.maternalPrimary }}>
              ANNE SOYU
            </Label>
            <View style={styles.chipWrap}>
              {MATERNAL_RELATIONS.map((r) => (
                <TouchableOpacity key={r.key} onPress={() => openWithRelation(r.label, 'maternal', r.key)} testID={`add-rel-${r.key}`}>
                  <View style={[styles.relChip, { backgroundColor: colors.maternalLight, borderColor: colors.maternalPrimary }]}>
                    <Body style={{ color: colors.maternalPrimary, fontFamily: fonts.bodyMedium, fontSize: 13 }}>+ {r.label}</Body>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Input
                value={customMaternal}
                onChangeText={setCustomMaternal}
                placeholder="Soydan başkasını ekle (ör: anneanne, teyze, dayı, dede...)"
                style={{ flex: 1 }}
                testID="custom-maternal"
              />
              <Button title="+ Ekle" variant="secondary" onPress={() => addCustom('maternal')} style={{ marginLeft: spacing.sm, marginBottom: spacing.md }} testID="add-custom-maternal" />
            </View>

            {/* Baba soyu */}
            <Label style={{ marginTop: spacing.md, marginBottom: spacing.sm, color: colors.paternalPrimary }}>
              BABA SOYU
            </Label>
            <View style={styles.chipWrap}>
              {PATERNAL_RELATIONS.map((r) => (
                <TouchableOpacity key={r.key} onPress={() => openWithRelation(r.label, 'paternal', r.key)} testID={`add-rel-${r.key}`}>
                  <View style={[styles.relChip, { backgroundColor: colors.paternalLight, borderColor: colors.paternalPrimary }]}>
                    <Body style={{ color: colors.paternalPrimary, fontFamily: fonts.bodyMedium, fontSize: 13 }}>+ {r.label}</Body>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Input
                value={customPaternal}
                onChangeText={setCustomPaternal}
                placeholder="Soydan başkasını ekle (ör: babaanne, hala, amca, dede...)"
                style={{ flex: 1 }}
                testID="custom-paternal"
              />
              <Button title="+ Ekle" variant="secondary" onPress={() => addCustom('paternal')} style={{ marginLeft: spacing.sm, marginBottom: spacing.md }} testID="add-custom-paternal" />
            </View>

            <Label style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>EKLENEN ATALAR ({ancestors.length})</Label>
            {ancestors.length === 0 ? (
              <Card><Caption style={{ textAlign: 'center' }}>Henüz ata eklenmedi.</Caption></Card>
            ) : (
              ancestors.map((a, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => openExisting(i)}
                  testID={`ancestor-card-${i}`}
                >
                  <Card style={[styles.ancestorCard, { borderLeftColor: a.side === 'maternal' ? colors.maternalPrimary : colors.paternalPrimary }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <H3 style={{ fontSize: 18 }}>{a.relation}{a.name ? ` · ${a.name}` : ''}</H3>
                        <Caption style={{ color: a.side === 'maternal' ? colors.maternalPrimary : colors.paternalPrimary }}>
                          {a.side === 'maternal' ? 'Anne soyu' : 'Baba soyu'}{a.relation_key ? ` · ${a.relation_key}` : ' · özel'}  ·  Düzenle ›
                        </Caption>
                        {(a.diseases?.length || 0) > 0 && <Caption style={{ marginTop: 4 }}>Hastalıklar: {a.diseases?.join(', ')}</Caption>}
                        {(a.events?.length || 0) > 0 && <Caption>Olaylar: {a.events?.join(', ')}</Caption>}
                        {(a.sins_admitted?.length || 0) > 0 && <Caption>Bilinen günahlar: {a.sins_admitted?.join(', ')}</Caption>}
                      </View>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); set({ ancestors: ancestors.filter((_, x) => x !== i) }); }}
                        testID={`remove-ancestor-${i}`}
                        hitSlop={8}
                      >
                        <Body style={{ color: colors.errorVow, fontSize: 22, paddingHorizontal: 6 }}>×</Body>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button title="Geri" variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} testID="back-btn" />
              <Button title={loading ? 'Analiz Ediliyor…' : 'Analizi Tamamla'} onPress={submit} disabled={loading} style={{ flex: 1.4 }} testID="submit-btn" />
            </View>
          </View>
        </Screen>
      </KeyboardAvoidingView>

      <AncestorEditModal
        visible={modal}
        ancestor={editing}
        isEditing={editingIndex !== null}
        onChange={(a) => setEditing(a)}
        onClose={closeModal}
        onSave={saveAncestor}
      />
    </SafeAreaView>
  );
}

function AncestorEditModal({ visible, ancestor, isEditing, onChange, onClose, onSave }: {
  visible: boolean;
  ancestor: Ancestor | null;
  isEditing: boolean;
  onChange: (a: Ancestor) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [d, setD] = useState('');
  const [ev, setEv] = useState('');
  const [sin, setSin] = useState('');

  if (!ancestor) return null;
  const sideColor = ancestor.side === 'maternal' ? colors.maternalPrimary : colors.paternalPrimary;

  const addTo = (key: 'diseases' | 'events' | 'unfulfilled_vows' | 'sins_admitted', val: string, reset: () => void) => {
    if (!val.trim()) return;
    onChange({ ...ancestor, [key]: [...(ancestor[key] || []), val.trim()] });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <H3 style={{ color: sideColor }}>{ancestor.relation}</H3>
                <Caption style={{ color: colors.textSecondary }}>
                  {ancestor.side === 'maternal' ? 'Anne soyu' : 'Baba soyu'}
                </Caption>
              </View>
              <TouchableOpacity onPress={onClose} testID="modal-close" hitSlop={10}>
                <Body style={{ fontSize: 28, color: colors.textSecondary }}>×</Body>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              indicatorStyle="black"
            >
              <Input
                label="AKRABALIK İLİŞKİSİ"
                value={ancestor.relation}
                onChangeText={(t) => onChange({ ...ancestor, relation: t })}
                placeholder="Örn: Teyze, Dayı, Hala, Amca, Kuzen…"
                testID="ancestor-relation"
              />
              <Input
                label="İSİM (OPSİYONEL)"
                value={ancestor.name || ''}
                onChangeText={(t) => onChange({ ...ancestor, name: t })}
                placeholder="Örn: Ayşe Nine"
                testID="ancestor-name"
              />

              <Label style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>HASTALIKLARI</Label>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Input value={d} onChangeText={setD} placeholder="Örn: Şeker" style={{ flex: 1 }} testID="ancestor-disease-input" />
                <Button title="+" variant="secondary" onPress={() => addTo('diseases', d, () => setD(''))} style={{ marginLeft: spacing.sm, marginBottom: spacing.md, paddingHorizontal: 16 }} testID="ancestor-add-disease" />
              </View>
              <View style={styles.chipWrap}>
                {ancestor.diseases?.map((it, i) => (
                  <Chip key={i} label={it} side={ancestor.side} onRemove={() => onChange({ ...ancestor, diseases: ancestor.diseases?.filter((_, x) => x !== i) })} />
                ))}
              </View>

              <Label style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>YAŞADIĞI OLAYLAR</Label>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Input value={ev} onChangeText={setEv} placeholder="Örn: Eşi vefat etti, miras kavgası" style={{ flex: 1 }} />
                <Button title="+" variant="secondary" onPress={() => addTo('events', ev, () => setEv(''))} style={{ marginLeft: spacing.sm, marginBottom: spacing.md, paddingHorizontal: 16 }} />
              </View>
              <View style={styles.chipWrap}>
                {ancestor.events?.map((it, i) => (
                  <Chip key={i} label={it} side={ancestor.side} onRemove={() => onChange({ ...ancestor, events: ancestor.events?.filter((_, x) => x !== i) })} />
                ))}
              </View>

              <Label style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>BİLİNEN GÜNAHLAR / DURUMLAR</Label>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Input value={sin} onChangeText={setSin} placeholder="Örn: Faiz alıp verdi, zekat vermedi" style={{ flex: 1 }} />
                <Button title="+" variant="secondary" onPress={() => addTo('sins_admitted', sin, () => setSin(''))} style={{ marginLeft: spacing.sm, marginBottom: spacing.md, paddingHorizontal: 16 }} />
              </View>
              <View style={styles.chipWrap}>
                {ancestor.sins_admitted?.map((it, i) => (
                  <Chip key={i} label={it} side={ancestor.side} onRemove={() => onChange({ ...ancestor, sins_admitted: ancestor.sins_admitted?.filter((_, x) => x !== i) })} />
                ))}
              </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.modalFooter}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
                <Button title="İptal" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                <Button title={isEditing ? '✓ Kaydet' : '✓ Atayı Ekle'} onPress={onSave} testID="save-ancestor" style={{ flex: 1.4 }} />
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  relChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.round, borderWidth: 1, marginRight: spacing.sm, marginBottom: spacing.sm },
  ancestorCard: { borderLeftWidth: 4 },
  footer: { paddingBottom: spacing.md, paddingTop: spacing.sm },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(44,53,49,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bgPrimary, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.bgPrimary,
    paddingBottom: spacing.sm,
  },
});
