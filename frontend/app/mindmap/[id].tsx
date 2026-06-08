import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView, ImageBackground, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Caption, H2, H3, Label } from '@/src/ui';
import { api, AnalysisResult, MindMapNode } from '@/src/api';
import { colors, fonts, radius, spacing } from '@/src/theme';

const TREE_IMAGE = 'https://customer-assets.emergentagent.com/job_furkan-docs/artifacts/zu71oc24_1000113809.jpeg';

// Yeni görsel: önceden tanımlı çerçeve yok — düğümler dalların üzerine yerleşir.
// Görsel kare; ağaç tacı yaklaşık y=0.05..0.78 arasında, gövde y=0.78..0.97, kökler altta.
// Self: gövdenin başladığı yer (tacın altı), atalar yukarı doğru artan kuşak halinde.

// Self konumu: gövde başlangıcı / tacın hemen altı
const SELF_FRAME = { x: 0.50, y: 0.74 };

// Önemli akrabalar için sabit konum (tacın içinde yerleştirilmiş)
const ANCESTOR_FRAMES: Record<string, { x: number; y: number }> = {
  // 1. kuşak — ebeveynler: tacın alt seviyesinde, gövdenin iki yanında
  anne:           { x: 0.32, y: 0.66 },
  baba:           { x: 0.68, y: 0.66 },
  // 2. kuşak — büyük-anne / büyük-baba: orta seviyede
  anneanne:       { x: 0.22, y: 0.50 },
  anne_babasi:    { x: 0.40, y: 0.45 },
  babaanne:       { x: 0.60, y: 0.45 },
  baba_babasi:    { x: 0.78, y: 0.50 },
  // Yan akrabalar — alt köşelerde
  teyze:          { x: 0.13, y: 0.62 },
  dayi:           { x: 0.13, y: 0.46 },
  hala:           { x: 0.87, y: 0.46 },
  amca:           { x: 0.87, y: 0.62 },
  // 3. kuşak — büyük dede/anne: tacın üst kısmında
  anne_buyuk_anne:{ x: 0.30, y: 0.30 },
  anne_buyuk_dede:{ x: 0.42, y: 0.22 },
  baba_buyuk_anne:{ x: 0.58, y: 0.22 },
  baba_buyuk_dede:{ x: 0.70, y: 0.30 },
};

// Eşlenmeyen akrabalar için yedek konum havuzu
const FALLBACK_FRAMES_MATERNAL = [
  { x: 0.20, y: 0.36 }, { x: 0.30, y: 0.55 }, { x: 0.40, y: 0.55 }, { x: 0.13, y: 0.30 },
];
const FALLBACK_FRAMES_PATERNAL = [
  { x: 0.80, y: 0.36 }, { x: 0.70, y: 0.55 }, { x: 0.60, y: 0.55 }, { x: 0.87, y: 0.30 },
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
              resizeMode="contain"
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
