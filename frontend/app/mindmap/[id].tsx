import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView, ImageBackground, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Caption, H2, H3, Label } from '@/src/ui';
import { api, AnalysisResult, MindMapNode } from '@/src/api';
import { colors, fonts, radius, spacing } from '@/src/theme';

const TREE_IMAGE = 'https://customer-assets.emergentagent.com/job_furkan-docs/artifacts/tmoijzj2_Gemini_Generated_Image_eawg7aeawg7aeawg%20%281%29.png';

// Görseldeki TÜM boş oval çerçevelerin tam konumları (analiz ile doğrulandı)
// Bunlar 27 çerçevenin merkezleridir, 6 sıra halinde.
// Kullanıcının "asla taşmasın" isteği için: her düğüm bu konumlardan birine ve çerçeve çapına oturur.
type Frame = { x: number; y: number };
const ALL_FRAMES: Frame[] = [
  // Row 1 (top - 3 frames)
  { x: 0.32, y: 0.13 }, { x: 0.50, y: 0.09 }, { x: 0.68, y: 0.12 },
  // Row 2 (5 frames)
  { x: 0.23, y: 0.24 }, { x: 0.38, y: 0.24 }, { x: 0.56, y: 0.22 }, { x: 0.72, y: 0.22 }, { x: 0.86, y: 0.23 },
  // Row 3 (6 frames)
  { x: 0.14, y: 0.35 }, { x: 0.29, y: 0.35 }, { x: 0.45, y: 0.35 }, { x: 0.62, y: 0.35 }, { x: 0.77, y: 0.35 }, { x: 0.91, y: 0.36 },
  // Row 4 (5 frames)
  { x: 0.19, y: 0.48 }, { x: 0.33, y: 0.48 }, { x: 0.48, y: 0.47 }, { x: 0.65, y: 0.47 }, { x: 0.80, y: 0.48 },
  // Row 5 (5 frames)
  { x: 0.25, y: 0.62 }, { x: 0.39, y: 0.62 }, { x: 0.55, y: 0.62 }, { x: 0.71, y: 0.62 }, { x: 0.87, y: 0.63 },
  // Row 6 (bottom - 3 frames; merkez = self)
  { x: 0.32, y: 0.77 }, { x: 0.51, y: 0.76 }, { x: 0.72, y: 0.77 },
];

// Görseldeki tüm çerçevelerin standart çapı (image genişliğinin oranı olarak)
const FRAME_DIAMETER_RATIO = 0.085; // çerçeve içine biraz boşlukla sığsın diye <=0.09

// Self: gövdenin tam üstündeki merkez çerçeve (Row 6 col 2)
const SELF_FRAME: Frame = { x: 0.51, y: 0.76 };

// Önemli akrabalar için sabit çerçeve eşlemesi (görseldeki gerçek çerçevelerin tam üzerine)
const ANCESTOR_FRAMES: Record<string, Frame> = {
  // Ebeveynler: self'in alt sırasında, sol & sağ
  anne:           { x: 0.32, y: 0.77 },
  baba:           { x: 0.72, y: 0.77 },
  // Büyükanne/büyükbabalar: bir üst sırada
  anneanne:       { x: 0.39, y: 0.62 },
  anne_babasi:    { x: 0.25, y: 0.62 },
  babaanne:       { x: 0.71, y: 0.62 },
  baba_babasi:    { x: 0.87, y: 0.63 },
  // Teyze/dayı/hala/amca: bir üst sırada (4. sıra)
  teyze:          { x: 0.33, y: 0.48 },
  dayi:           { x: 0.19, y: 0.48 },
  hala:           { x: 0.65, y: 0.47 },
  amca:           { x: 0.80, y: 0.48 },
  // Büyük ataların ataları (3. sıra)
  anne_buyuk_anne:{ x: 0.29, y: 0.35 },
  anne_buyuk_dede:{ x: 0.14, y: 0.35 },
  baba_buyuk_anne:{ x: 0.77, y: 0.35 },
  baba_buyuk_dede:{ x: 0.91, y: 0.36 },
};

// Eşlenmeyen akrabalar için yedek çerçeve havuzu — sıraya göre tahsis edilir
// (Anne soyu için sol tarafa eğimli, Baba soyu için sağ tarafa eğimli)
const FALLBACK_FRAMES_MATERNAL: Frame[] = [
  { x: 0.48, y: 0.47 }, // 4. sıra merkez-sol
  { x: 0.55, y: 0.62 }, // 5. sıra merkez (boştaysa)
  { x: 0.45, y: 0.35 }, // 3. sıra merkez-sol
  { x: 0.23, y: 0.24 }, // 2. sıra sol
  { x: 0.38, y: 0.24 }, // 2. sıra sol-merkez
  { x: 0.32, y: 0.13 }, // 1. sıra sol
];
const FALLBACK_FRAMES_PATERNAL: Frame[] = [
  { x: 0.62, y: 0.35 }, // 3. sıra merkez-sağ
  { x: 0.56, y: 0.22 }, // 2. sıra merkez
  { x: 0.72, y: 0.22 }, // 2. sıra sağ
  { x: 0.86, y: 0.23 }, // 2. sıra en sağ
  { x: 0.68, y: 0.12 }, // 1. sıra sağ
  { x: 0.50, y: 0.09 }, // 1. sıra merkez (en tepe)
];

export default function TreeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selected, setSelected] = useState<MindMapNode | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const a = await api.getAnalysis(id);
    setAnalysis(a);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const nodes = useMemo(() => analysis?.mind_map?.nodes || [], [analysis]);

  // Görsel boyutu — kare aspect, ekran genişliğine sığacak şekilde
  const screenW = Dimensions.get('window').width;
  const W = Math.min(screenW, 480);
  const H = W; // 1:1

  // Düğüm pozisyonları (normalize → piksel)
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    pos['self'] = { x: SELF_FRAME.x * W, y: SELF_FRAME.y * H };

    let matFb = 0;
    let patFb = 0;
    nodes.forEach((n) => {
      if (n.id === 'self') return;
      const key = n.relation_key;
      if (key && ANCESTOR_FRAMES[key]) {
        const f = ANCESTOR_FRAMES[key];
        pos[n.id] = { x: f.x * W, y: f.y * H };
      } else if (n.side === 'maternal') {
        const f = FALLBACK_FRAMES_MATERNAL[matFb % FALLBACK_FRAMES_MATERNAL.length];
        pos[n.id] = { x: f.x * W, y: f.y * H };
        matFb++;
      } else {
        const f = FALLBACK_FRAMES_PATERNAL[patFb % FALLBACK_FRAMES_PATERNAL.length];
        pos[n.id] = { x: f.x * W, y: f.y * H };
        patFb++;
      }
    });
    return pos;
  }, [nodes, W, H]);

  // ANIMASYON: ağaç görseli fade-in, ardından düğümler staggered pulse
  const treeOpacity = useRef(new Animated.Value(0)).current;
  const nodeAnimsRef = useRef<{ opacity: Animated.Value; scale: Animated.Value; glow: Animated.Value }[]>([]);

  if (nodeAnimsRef.current.length !== nodes.length) {
    nodeAnimsRef.current = nodes.map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
      glow: new Animated.Value(0),
    }));
  }

  useEffect(() => {
    if (nodes.length === 0) return;
    // 1) Ağaç görseli yumuşak fade-in (1.5s ease-in)
    Animated.timing(treeOpacity, {
      toValue: 1,
      duration: 1500,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start();

    // 2) Düğümler — ağaç belirginleştikten sonra sırayla parla
    const anims = nodeAnimsRef.current.map((a) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(a.scale, {
            toValue: 1.22,
            duration: 480,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(a.scale, {
            toValue: 1,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Parlama efekti (glow halkası)
        Animated.sequence([
          Animated.timing(a.glow, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(a.glow, {
            toValue: 0,
            duration: 700,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    Animated.sequence([
      Animated.delay(1400),
      Animated.stagger(220, anims),
    ]).start();
  }, [nodes.length, treeOpacity]);

  if (!analysis) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Body>Soy ağacı hazırlanıyor…</Body>
        </View>
      </SafeAreaView>
    );
  }

  const matCount = nodes.filter((n) => n.side === 'maternal').length;
  const patCount = nodes.filter((n) => n.side === 'paternal').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E8DCBE' }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="back-btn" style={styles.backButton}>
          <Body style={{ color: colors.textPrimary, fontFamily: fonts.bodySemi }}>← Geri</Body>
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Caption style={{ color: '#8B6F47', letterSpacing: 3 }}>HAYAT AĞACI</Caption>
          <H3 style={{ color: '#4A3826' }}>Soy Ağacı</H3>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <View style={{ width: W, height: H, alignSelf: 'center', marginTop: spacing.sm }}>
          {/* Ağaç fotoğrafı arka plan (fade-in animasyonlu) */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, { opacity: treeOpacity }]}
            pointerEvents="none"
          >
            <ImageBackground
              source={{ uri: TREE_IMAGE }}
              style={{ width: W, height: H }}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Düğümler — çerçevelerin üzerine yerleştirilmiş tıklanabilir noktalar */}
          {nodes.map((n, i) => {
            const p = positions[n.id];
            if (!p) return null;
            const anim = nodeAnimsRef.current[i];
            const isSelf = n.type === 'self';
            // Düğüm boyutu: görsel genişliğinin yaklaşık %12'si (self biraz daha büyük)
            const size = isSelf ? Math.round(W * 0.13) : Math.round(W * 0.11);
            const r = size / 2;
            const hasIssue = (n.diseases?.length || 0) + (n.events?.length || 0) + (n.sins_admitted?.length || 0) > 0;
            const sideColor = n.side === 'maternal' ? '#C87971' : n.side === 'paternal' ? '#4F6D7A' : '#5C4126';
            const shortLabel = (n.relation || n.label || 'Kişi').split(' ')[0];

            // Glow halkası — parlama animasyonu sırasında genişler
            const glowOpacity = anim?.glow?.interpolate
              ? anim.glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] })
              : 0;
            const glowScale = anim?.glow?.interpolate
              ? anim.glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] })
              : 1;

            return (
              <View
                key={n.id}
                style={[
                  styles.nodeAbs,
                  { left: p.x - r, top: p.y - r, width: size, height: size },
                ]}
                pointerEvents="box-none"
              >
                {/* Parlama halkası */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.glow,
                    {
                      width: size,
                      height: size,
                      borderRadius: r,
                      backgroundColor: sideColor,
                      opacity: glowOpacity,
                      transform: [{ scale: glowScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={{
                    opacity: anim?.opacity ?? 1,
                    transform: [{ scale: anim?.scale ?? 1 }],
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setSelected(n)}
                    testID={`tree-node-${n.id}`}
                    style={[
                      styles.nodeBtn,
                      { width: size, height: size, borderRadius: r, borderColor: sideColor, borderWidth: isSelf ? 2.5 : 2 },
                      isSelf && styles.nodeSelf,
                    ]}
                  >
                    <Caption
                      numberOfLines={1}
                      style={[
                        styles.nodeText,
                        { color: sideColor, fontSize: isSelf ? 11 : 10 },
                      ]}
                    >
                      {shortLabel}
                    </Caption>
                    {hasIssue && <View style={[styles.issueDot, { backgroundColor: colors.errorVow }]} />}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            );
          })}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Body style={[styles.statNum, { color: '#C87971' }]}>{matCount}</Body>
            <Caption>Anne soyu</Caption>
          </View>
          <View style={styles.statBox}>
            <Body style={[styles.statNum, { color: '#4F6D7A' }]}>{patCount}</Body>
            <Caption>Baba soyu</Caption>
          </View>
          <View style={styles.statBox}>
            <Body style={[styles.statNum, { color: '#8B6F47' }]}>{matCount + patCount + 1}</Body>
            <Caption>Toplam</Caption>
          </View>
        </View>

        <Caption style={styles.tip}>
          Bir kişiyi incelemek için ağaçtaki çerçevesine dokunun.
        </Caption>
      </ScrollView>

      <NodeDetailModal node={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

function NodeDetailModal({ node, onClose }: { node: MindMapNode | null; onClose: () => void }) {
  if (!node) return null;
  const isSelf = node.type === 'self';
  const sideColor = node.side === 'maternal' ? '#C87971' : node.side === 'paternal' ? '#4F6D7A' : '#8B6F47';
  const sideBg = node.side === 'maternal' ? '#F2D5D1' : node.side === 'paternal' ? '#D0DEE5' : colors.bgSecondary;
  const burdenCount = (node.diseases?.length || 0) + (node.events?.length || 0) + (node.sins_admitted?.length || 0);

  return (
    <Modal visible={!!node} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ padding: spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.sideBadge, { backgroundColor: sideBg }]}>
                    <Caption style={{ color: sideColor, fontFamily: fonts.bodySemi }}>
                      {isSelf ? 'KENDİSİ' : node.side === 'maternal' ? 'ANNE SOYU' : 'BABA SOYU'}
                    </Caption>
                  </View>
                  <H2 style={{ color: sideColor, marginTop: spacing.sm }}>{node.label}</H2>
                  {node.relation && !isSelf && <Caption>{node.relation}</Caption>}
                </View>
                <TouchableOpacity onPress={onClose} testID="modal-close" hitSlop={10}>
                  <Body style={{ fontSize: 28, color: colors.textSecondary }}>×</Body>
                </TouchableOpacity>
              </View>

              <View style={[styles.summaryBox, { borderLeftColor: sideColor }]}>
                <Caption style={{ color: sideColor, fontFamily: fonts.bodySemi, letterSpacing: 1 }}>MANEVİ YÜK ÖZETİ</Caption>
                {burdenCount === 0 ? (
                  <Body style={{ marginTop: 4 }}>Bu kişide kayıtlı bir manevi yük bulunmuyor.</Body>
                ) : (
                  <Body style={{ marginTop: 4 }}>
                    {node.diseases?.length || 0} hastalık · {node.events?.length || 0} olay · {node.sins_admitted?.length || 0} bilinen günah
                  </Body>
                )}
              </View>

              {(node.diseases?.length || 0) > 0 && (
                <View style={styles.section}>
                  <Label style={{ marginBottom: spacing.sm }}>HASTALIKLARI</Label>
                  {node.diseases!.map((d, i) => <Caption key={i}>· {d}</Caption>)}
                </View>
              )}

              {(node.allergies?.length || 0) > 0 && (
                <View style={styles.section}>
                  <Label style={{ marginBottom: spacing.sm }}>ALERJİLER</Label>
                  {node.allergies!.map((d, i) => <Caption key={i}>· {d}</Caption>)}
                </View>
              )}

              {(node.events?.length || 0) > 0 && (
                <View style={styles.section}>
                  <Label style={{ marginBottom: spacing.sm }}>YAŞADIĞI OLAYLAR</Label>
                  {node.events!.map((d, i) => <Caption key={i}>· {d}</Caption>)}
                </View>
              )}

              {(node.sins_admitted?.length || 0) > 0 && (
                <View style={styles.section}>
                  <Label style={{ marginBottom: spacing.sm }}>BİLİNEN GÜNAHLAR / DURUMLAR</Label>
                  {node.sins_admitted!.map((d, i) => <Caption key={i}>· {d}</Caption>)}
                </View>
              )}

              {burdenCount === 0 && (
                <Caption style={{ marginTop: spacing.md, textAlign: 'center', fontStyle: 'italic' }}>
                  Bu kişi için ayrıntı eklenmemiş.
                </Caption>
              )}

              <Caption style={{ marginTop: spacing.lg, fontStyle: 'italic', textAlign: 'center', color: colors.textSecondary }}>
                {isSelf
                  ? 'Soy izleriniz bugüne sızıyor — anne ve baba taraflarından gelen yükleri gözden geçirin.'
                  : 'Bu atadan size sızan iz, manevi analizde değerlendirildi.'}
              </Caption>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#E8DCBE',
    borderBottomWidth: 1,
    borderBottomColor: '#C7B696',
  },
  backButton: { paddingVertical: 8, paddingHorizontal: 4, minWidth: 70 },

  nodeAbs: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  nodeBtn: {
    backgroundColor: 'rgba(242,228,200,0.78)', // krem yarı şeffaf — çerçevenin üzerinde
    alignItems: 'center',
    justifyContent: 'center',
    // Hafif gölge
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  nodeSelf: {
    backgroundColor: 'rgba(248,228,184,0.85)',
  },
  nodeText: {
    fontFamily: fonts.bodySemi,
    textAlign: 'center',
  },
  issueDot: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statBox: { alignItems: 'center' },
  statNum: { fontFamily: fonts.bodyBold, fontSize: 22, marginBottom: 2 },

  tip: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(44,53,49,0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bgPrimary, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  sideBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.round, alignSelf: 'flex-start' },
  summaryBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderLeftWidth: 4,
    borderRadius: radius.sm,
  },
  section: { marginTop: spacing.lg },
});
