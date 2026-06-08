import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView, ImageBackground, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path, G, Ellipse } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Caption, H2, H3, Label } from '@/src/ui';
import { api, AnalysisResult, MindMapNode } from '@/src/api';
import { colors, fonts, radius, spacing } from '@/src/theme';

const PARCHMENT_URL = 'https://images.pexels.com/photos/16557322/pexels-photo-16557322.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=900';

// Düğüm pozisyonlama: hayat ağacı düzeni — alt: self (gövdenin tepesinde), üst: atalar (taç içinde)
type Pos = { x: number; y: number };

const ANCESTOR_LAYOUT_KEYS: Record<string, Pos> = {
  // x: -1..1 (sol-sağ), y: 0..1 (alt-üst, 0 = self yakını, 1 = tepe)
  anne:           { x: -0.30, y: 0.30 },
  baba:           { x:  0.30, y: 0.30 },
  anneanne:       { x: -0.55, y: 0.62 },
  anne_babasi:    { x: -0.18, y: 0.62 },
  babaanne:       { x:  0.18, y: 0.62 },
  baba_babasi:    { x:  0.55, y: 0.62 },
  anne_buyuk_anne:{ x: -0.70, y: 0.88 },
  anne_buyuk_dede:{ x: -0.42, y: 0.92 },
  baba_buyuk_anne:{ x:  0.42, y: 0.92 },
  baba_buyuk_dede:{ x:  0.70, y: 0.88 },
  teyze:          { x: -0.78, y: 0.45 },
  dayi:           { x: -0.78, y: 0.30 },
  hala:           { x:  0.78, y: 0.45 },
  amca:           { x:  0.78, y: 0.30 },
};

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

  // Canvas boyutu: ekrana göre, ama sabit yüksek aspect-ratio
  const screenW = Dimensions.get('window').width;
  const W = Math.min(screenW, 480);
  const H = Math.round(W * 1.25);

  // Düğüm pozisyonları
  const positions = useMemo(() => {
    const pos: Record<string, Pos> = {};
    const cx = W / 2;
    const trunkTop = H * 0.78; // self düğümü gövdenin tepesinde
    const canopyTop = H * 0.10; // taçın tepe sınırı
    const canopyHeight = trunkTop - canopyTop;

    pos['self'] = { x: cx, y: trunkTop };

    const placed = new Set<string>(['self']);
    const otherMaternal: MindMapNode[] = [];
    const otherPaternal: MindMapNode[] = [];

    nodes.forEach((n) => {
      if (n.id === 'self') return;
      const key = n.relation_key;
      if (key && ANCESTOR_LAYOUT_KEYS[key]) {
        const layout = ANCESTOR_LAYOUT_KEYS[key];
        pos[n.id] = {
          x: cx + layout.x * (W * 0.42),
          y: trunkTop - layout.y * canopyHeight,
        };
        placed.add(n.id);
      } else {
        if (n.side === 'maternal') otherMaternal.push(n);
        else otherPaternal.push(n);
      }
    });

    // Manuel akrabalar — kenar yaylara yerleştir
    otherMaternal.forEach((n, i) => {
      const t = (i + 1) / (otherMaternal.length + 1);
      pos[n.id] = {
        x: cx - W * 0.42,
        y: trunkTop - canopyHeight * (0.20 + t * 0.55),
      };
    });
    otherPaternal.forEach((n, i) => {
      const t = (i + 1) / (otherPaternal.length + 1);
      pos[n.id] = {
        x: cx + W * 0.42,
        y: trunkTop - canopyHeight * (0.20 + t * 0.55),
      };
    });

    return pos;
  }, [nodes, W, H]);

  // ANIMASYON: Gövde fade-in (0→1, 1500ms), sonra düğümler staggered pulse
  const trunkOpacity = useRef(new Animated.Value(0)).current;
  const canopyOpacity = useRef(new Animated.Value(0)).current;
  const nodeAnimsRef = useRef<{ opacity: Animated.Value; scale: Animated.Value }[]>([]);

  // Düğümler için animasyon değerleri (lazy init / nodes değişince yenile)
  if (nodeAnimsRef.current.length !== nodes.length) {
    nodeAnimsRef.current = nodes.map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.4),
    }));
  }

  useEffect(() => {
    if (nodes.length === 0) return;
    // Gövde + kök fade-in (0 → 1, 1.5s ease-in)
    Animated.timing(trunkOpacity, {
      toValue: 1,
      duration: 1500,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Yaprak/dal — gövdenin biraz öncesinden belirir
    Animated.timing(canopyOpacity, {
      toValue: 1,
      duration: 1400,
      delay: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Düğümler: gövde tamamlandıktan sonra staggered pulse ile beliriyor
    const anims = nodeAnimsRef.current.map((a, i) =>
      Animated.sequence([
        Animated.delay(1400 + i * 180),
        Animated.parallel([
          Animated.timing(a.opacity, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(a.scale, {
              toValue: 1.18,
              duration: 480,
              easing: Easing.out(Easing.back(1.6)),
              useNativeDriver: true,
            }),
            Animated.timing(a.scale, {
              toValue: 1,
              duration: 380,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    );
    Animated.stagger(0, anims).start();
  }, [nodes.length, trunkOpacity, canopyOpacity]);

  if (!analysis) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Body>Soy ağacı hazırlanıyor…</Body>
        </View>
      </SafeAreaView>
    );
  }

  // Sayılar
  const matCount = nodes.filter((n) => n.side === 'maternal').length;
  const patCount = nodes.filter((n) => n.side === 'paternal').length;

  // Çizim koordinatları
  const cx = W / 2;
  const trunkBase = H * 0.95;
  const trunkTop = H * 0.78;

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
        <ImageBackground
          source={{ uri: PARCHMENT_URL }}
          imageStyle={{ opacity: 0.55, resizeMode: 'cover' }}
          style={[styles.parchment, { width: W, height: H, alignSelf: 'center' }]}
        >
          {/* Sıcak ton overlay */}
          <View style={[styles.warmOverlay, { width: W, height: H }]} pointerEvents="none" />

          {/* Ağaç gövdesi & dallar SVG (animasyon ile fade-in) */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { opacity: trunkOpacity },
            ]}
            pointerEvents="none"
          >
            <Svg width={W} height={H}>
              {/* Kökler */}
              <G>
                <Path
                  d={`M ${cx} ${trunkBase} C ${cx - 30} ${trunkBase + 10} ${cx - 70} ${trunkBase + 5} ${cx - 110} ${trunkBase + 20}`}
                  stroke="#5C4A33" strokeWidth={4} fill="none" strokeLinecap="round"
                />
                <Path
                  d={`M ${cx} ${trunkBase} C ${cx + 30} ${trunkBase + 10} ${cx + 70} ${trunkBase + 5} ${cx + 110} ${trunkBase + 20}`}
                  stroke="#5C4A33" strokeWidth={4} fill="none" strokeLinecap="round"
                />
                <Path
                  d={`M ${cx} ${trunkBase} C ${cx - 8} ${trunkBase + 12} ${cx - 18} ${trunkBase + 18} ${cx - 35} ${trunkBase + 28}`}
                  stroke="#6B5236" strokeWidth={2.5} fill="none" strokeLinecap="round"
                />
                <Path
                  d={`M ${cx} ${trunkBase} C ${cx + 8} ${trunkBase + 12} ${cx + 18} ${trunkBase + 18} ${cx + 35} ${trunkBase + 28}`}
                  stroke="#6B5236" strokeWidth={2.5} fill="none" strokeLinecap="round"
                />
              </G>

              {/* Ana gövde */}
              <Path
                d={`M ${cx - 24} ${trunkBase} C ${cx - 22} ${trunkBase - 60} ${cx - 18} ${trunkBase - 120} ${cx - 14} ${trunkTop + 10} L ${cx + 14} ${trunkTop + 10} C ${cx + 18} ${trunkBase - 120} ${cx + 22} ${trunkBase - 60} ${cx + 24} ${trunkBase} Z`}
                fill="#6B4E2F"
                stroke="#4A3520"
                strokeWidth={1}
              />
              {/* Gövde dokusu */}
              <Path
                d={`M ${cx - 10} ${trunkBase - 30} L ${cx - 8} ${trunkTop + 20}`}
                stroke="#4A3520" strokeWidth={1} fill="none" strokeOpacity={0.4}
              />
              <Path
                d={`M ${cx + 6} ${trunkBase - 20} L ${cx + 8} ${trunkTop + 30}`}
                stroke="#4A3520" strokeWidth={1} fill="none" strokeOpacity={0.4}
              />
            </Svg>
          </Animated.View>

          {/* Dallar ve yapraklar */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, { opacity: canopyOpacity }]}
            pointerEvents="none"
          >
            <Svg width={W} height={H}>
              {/* Ana dallar — self'ten her bir düğüme curve */}
              {nodes.map((n) => {
                if (n.id === 'self') return null;
                const p = positions[n.id];
                if (!p) return null;
                // Bezier ile yumuşak dal
                const startX = cx;
                const startY = trunkTop + 5;
                const ctrlX = (startX + p.x) / 2;
                const ctrlY = (startY + p.y) / 2 + 15;
                const branchColor = '#5C4126';
                return (
                  <Path
                    key={`b-${n.id}`}
                    d={`M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${p.x} ${p.y}`}
                    stroke={branchColor}
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    strokeOpacity={0.85}
                  />
                );
              })}

              {/* Yaprak kümeleri — düğümlerin etrafına */}
              {nodes.map((n) => {
                if (n.id === 'self') return null;
                const p = positions[n.id];
                if (!p) return null;
                const leaves: React.ReactNode[] = [];
                const leafColors = ['#8FA982', '#7A9472', '#A5BC95', '#6E8C68'];
                // Her düğümün etrafına 6-8 yaprak
                for (let i = 0; i < 7; i++) {
                  const angle = (i / 7) * Math.PI * 2;
                  const dist = 38 + (i % 2) * 8;
                  const lx = p.x + Math.cos(angle) * dist;
                  const ly = p.y + Math.sin(angle) * dist;
                  const rotation = (angle * 180) / Math.PI + 30;
                  const color = leafColors[i % leafColors.length];
                  leaves.push(
                    <Ellipse
                      key={`leaf-${n.id}-${i}`}
                      cx={lx}
                      cy={ly}
                      rx={9}
                      ry={5}
                      fill={color}
                      opacity={0.85}
                      transform={`rotate(${rotation} ${lx} ${ly})`}
                    />,
                  );
                }
                return <G key={`leaves-${n.id}`}>{leaves}</G>;
              })}

              {/* Gövdenin tepesinde yaprak kümesi (self yakını) */}
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const dist = 30 + (i % 3) * 6;
                const lx = cx + Math.cos(angle) * dist;
                const ly = trunkTop - 5 + Math.sin(angle) * dist * 0.6;
                const rotation = (angle * 180) / Math.PI + 30;
                const colors2 = ['#8FA982', '#A5BC95'];
                return (
                  <Ellipse
                    key={`tl-${i}`}
                    cx={lx}
                    cy={ly}
                    rx={8}
                    ry={4}
                    fill={colors2[i % 2]}
                    opacity={0.7}
                    transform={`rotate(${rotation} ${lx} ${ly})`}
                  />
                );
              })}
            </Svg>
          </Animated.View>

          {/* Düğümler — Animated.View overlay'leri, tıklanabilir oval çerçeveler */}
          {nodes.map((n, i) => {
            const p = positions[n.id];
            if (!p) return null;
            const anim = nodeAnimsRef.current[i];
            const isSelf = n.type === 'self';
            const r = isSelf ? 34 : 28;
            const hasIssue = (n.diseases?.length || 0) + (n.events?.length || 0) + (n.sins_admitted?.length || 0) > 0;
            const sideColor = n.side === 'maternal' ? '#C87971' : n.side === 'paternal' ? '#4F6D7A' : '#8B6F47';
            // Kısa label
            const shortLabel = (n.relation || n.label || 'Kişi').split(' ')[0];
            return (
              <Animated.View
                key={n.id}
                pointerEvents="box-none"
                style={[
                  styles.nodeWrap,
                  {
                    left: p.x - r,
                    top: p.y - r,
                    width: r * 2,
                    height: r * 2,
                    opacity: anim?.opacity ?? 1,
                    transform: [{ scale: anim?.scale ?? 1 }],
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelected(n)}
                  testID={`tree-node-${n.id}`}
                  style={[
                    styles.nodeFrame,
                    isSelf && styles.nodeSelf,
                    { width: r * 2, height: r * 2, borderRadius: r },
                  ]}
                >
                  <View style={[styles.nodeInner, { width: r * 2 - 8, height: r * 2 - 8, borderRadius: r - 4 }]}>
                    <Caption
                      numberOfLines={1}
                      style={[styles.nodeText, { color: sideColor, fontSize: isSelf ? 11 : 10 }]}
                    >
                      {shortLabel}
                    </Caption>
                    {hasIssue && (
                      <View style={[styles.issueDot, { backgroundColor: colors.errorVow }]} />
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ImageBackground>

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
  const burdenCount = (node.diseases?.length || 0) + (node.events?.length || 0) + (node.sins_admitted?.length || 0) + (node.unfulfilled_vows?.length || 0);

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

              {/* Manevi yük özeti */}
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

  parchment: {
    backgroundColor: '#D9C695',
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  warmOverlay: {
    position: 'absolute',
    top: 0, left: 0,
    backgroundColor: '#C9A85B',
    opacity: 0.18,
  },

  nodeWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeFrame: {
    backgroundColor: '#A8895F',
    borderWidth: 2.5,
    borderColor: '#5C4126',
    alignItems: 'center',
    justifyContent: 'center',
    // Hafif ortam gölgesi (web/iOS)
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  nodeSelf: {
    borderColor: '#3F2C18',
    borderWidth: 3,
    backgroundColor: '#C8A86C',
  },
  nodeInner: {
    backgroundColor: '#F2E4C8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B89968',
  },
  nodeText: {
    fontFamily: fonts.bodySemi,
    textAlign: 'center',
  },
  issueDot: {
    position: 'absolute',
    top: 2,
    right: 4,
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
