import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Defs, Marker, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Caption, Card, H2, H3, Label } from '@/src/ui';
import { api, AnalysisResult, MindMapNode } from '@/src/api';
import { colors, fonts, radius, spacing } from '@/src/theme';

type Pos = { x: number; y: number };

// Akrabalık ağacında ebeveyn ilişkisi
const PARENT_MAP: Record<string, string> = {
  anne: 'self',
  baba: 'self',
  anneanne: 'anne',
  anne_dedesi: 'anne',
  teyze: 'anneanne',
  dayi: 'anneanne',
  babaanne: 'baba',
  baba_dedesi: 'baba',
  hala: 'babaanne',
  amca: 'babaanne',
  anne_buyuk_anne: 'anneanne',
  anne_buyuk_dede: 'anne_dedesi',
  baba_buyuk_anne: 'babaanne',
  baba_buyuk_dede: 'baba_dedesi',
};

// Düğüm içinde gösterilecek kısa etiket (akrabalık tarafı renkle ayırt edilir)
const NODE_LABEL: Record<string, string> = {
  anne: 'Anne',
  baba: 'Baba',
  anneanne: 'Anneanne',
  anne_dedesi: 'Dede',
  teyze: 'Teyze',
  dayi: 'Dayı',
  babaanne: 'Babaanne',
  baba_dedesi: 'Dede',
  hala: 'Hala',
  amca: 'Amca',
  anne_buyuk_anne: 'B.Anne',
  anne_buyuk_dede: 'B.Dede',
  baba_buyuk_anne: 'B.Anne',
  baba_buyuk_dede: 'B.Dede',
};

export default function MindMapScreen() {
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

  // Sabit geniş canvas — 2D pannable (yatay + dikey ScrollView içine sığar)
  const W = 1200;
  const H = 1000;
  const cx = W / 2;
  const cy = H / 2;
  const R = 200; // taban yarıçap — düğümler arasında geniş mesafe

  // Akrabalık ağacı ile pozisyonlama
  const { positions, edges } = useMemo(() => {
    const pos: Record<string, Pos> = {};
    pos['self'] = { x: cx, y: cy };

    // relation_key → node
    const byKey: Record<string, MindMapNode> = {};
    nodes.forEach((n) => {
      if (n.id !== 'self' && n.relation_key) byKey[n.relation_key] = n;
    });

    const parentIdOf = (n: MindMapNode): string => {
      if (!n.relation_key) return 'self';
      const pKey = PARENT_MAP[n.relation_key];
      if (!pKey || pKey === 'self') return 'self';
      if (byKey[pKey]) return byKey[pKey].id;
      // fallback
      if (n.side === 'maternal') return byKey['anne']?.id || 'self';
      return byKey['baba']?.id || 'self';
    };

    // Children grupla
    const childrenOf: Record<string, MindMapNode[]> = {};
    nodes.forEach((n) => {
      if (n.id === 'self') return;
      const pid = parentIdOf(n);
      if (!childrenOf[pid]) childrenOf[pid] = [];
      childrenOf[pid].push(n);
    });

    // Recursive yerleştirme: bir parent etrafında çocukları yarımdaire yay
    const place = (parentId: string, parentPos: Pos, dirAngle: number, spread: number, radius: number, depth: number) => {
      const kids = childrenOf[parentId] || [];
      if (kids.length === 0) return;
      // Çocuk sayısına göre minimum yarıçap (iç içe girmesin)
      const minR = 100 + kids.length * 12;
      const r = Math.max(radius, minR);
      kids.forEach((k, i) => {
        const t = kids.length === 1 ? 0 : i / (kids.length - 1) - 0.5;
        const angle = dirAngle + t * spread;
        const x = parentPos.x + Math.cos(angle) * r;
        const y = parentPos.y + Math.sin(angle) * r;
        pos[k.id] = { x, y };
        // Çocuğun çocukları için aynı yönde devam et (dış dünyaya)
        place(k.id, pos[k.id], angle, spread * 0.7, r * 0.85, depth + 1);
      });
    };

    // Direkt self çocukları: anne sol, baba sağ
    const selfKids = childrenOf['self'] || [];
    const anneNode = byKey['anne'];
    const babaNode = byKey['baba'];

    if (anneNode) pos[anneNode.id] = { x: cx - R * 1.2, y: cy };
    if (babaNode) pos[babaNode.id] = { x: cx + R * 1.2, y: cy };

    // Anne ve baba'nın torunları — geniş yayılım, iç içe girmesin
    if (anneNode) place(anneNode.id, pos[anneNode.id], Math.PI, Math.PI * 1.0, R * 1.0, 1);
    if (babaNode) place(babaNode.id, pos[babaNode.id], 0, Math.PI * 1.0, R * 1.0, 1);

    // Anne/baba dışındaki self çocukları (manuel akrabalık veya anne/baba eklenmemiş ama atalar var)
    const otherSelfKids = selfKids.filter((n) => n.id !== anneNode?.id && n.id !== babaNode?.id);
    const matOthers = otherSelfKids.filter((n) => n.side === 'maternal');
    const patOthers = otherSelfKids.filter((n) => n.side === 'paternal');

    matOthers.forEach((n, i) => {
      // Sol alt fan
      const angle = Math.PI - (Math.PI * 0.4) * ((i + 1) / (matOthers.length + 1) - 0.5);
      pos[n.id] = { x: cx + Math.cos(angle) * R * 1.8, y: cy + Math.sin(angle) * R * 1.8 };
    });
    patOthers.forEach((n, i) => {
      const angle = 0 + (Math.PI * 0.4) * ((i + 1) / (patOthers.length + 1) - 0.5);
      pos[n.id] = { x: cx + Math.cos(angle) * R * 1.8, y: cy + Math.sin(angle) * R * 1.8 };
    });

    // Pozisyonu hesaplanmamış kalanlar (zinciri kopuk - fallback)
    nodes.forEach((n, i) => {
      if (n.id === 'self') return;
      if (!pos[n.id]) {
        const side = n.side === 'maternal' ? -1 : 1;
        pos[n.id] = { x: cx + side * R * 2.6, y: cy + (i - nodes.length / 2) * 80 };
      }
    });

    // Edges: child → parent (parent → child ok yönü ile)
    const eds = nodes.filter((n) => n.id !== 'self').map((n) => ({
      from: parentIdOf(n),
      to: n.id,
      side: n.side,
    }));

    return { positions: pos, edges: eds };
  }, [nodes, cx, cy, R]);

  if (!analysis) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Body>Zihin haritası hazırlanıyor…</Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          testID="back-btn"
          style={styles.backButton}
        >
          <Body style={{ color: colors.textSecondary }}>← Geri</Body>
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Caption style={{ color: colors.accentSage, letterSpacing: 2 }}>ZİHİN HARİTASI</Caption>
          <H3>Soy Yükü Ağı</H3>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.maternalPrimary }]} />
          <Caption>Anne soyu</Caption>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.paternalPrimary }]} />
          <Caption>Baba soyu</Caption>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.textPrimary }]} />
          <Caption>Kendisi</Caption>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Harita kutusu — 2D pannable (sağa/sola + yukarı/aşağı) */}
        <View style={styles.mapBox}>
          <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
            <ScrollView showsVerticalScrollIndicator nestedScrollEnabled>
              <Svg width={W} height={H}>
                <Defs>
                  <Marker id="arrowMat" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <Path d="M0,0 L10,5 L0,10 Z" fill={colors.maternalPrimary} />
                  </Marker>
                  <Marker id="arrowPat" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <Path d="M0,0 L10,5 L0,10 Z" fill={colors.paternalPrimary} />
                  </Marker>
                </Defs>

                {/* Edges (oklarla) */}
                {edges.map((e, i) => {
                  const from = positions[e.from];
                  const to = positions[e.to];
                  if (!from || !to) return null;
                  const stroke = e.side === 'maternal' ? colors.maternalPrimary : colors.paternalPrimary;
                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const startR = e.from === 'self' ? 42 : 32;
                  const endR = 36;
                  const sx = from.x + (dx / len) * startR;
                  const sy = from.y + (dy / len) * startR;
                  const tx = to.x - (dx / len) * endR;
                  const ty = to.y - (dy / len) * endR;
                  return (
                    <Line
                      key={i}
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke={stroke}
                      strokeWidth={2}
                      strokeOpacity={0.75}
                      markerEnd={e.side === 'maternal' ? 'url(#arrowMat)' : 'url(#arrowPat)'}
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map((n) => {
                  const p = positions[n.id];
                  if (!p) return null;
                  const isSelf = n.type === 'self';
                  const fill = n.side === 'maternal' ? colors.maternalLight : n.side === 'paternal' ? colors.paternalLight : colors.bgCard;
                  const stroke = n.side === 'maternal' ? colors.maternalPrimary : n.side === 'paternal' ? colors.paternalPrimary : colors.textPrimary;
                  const r = isSelf ? 40 : 32;
                  const hasIssue = (n.unfulfilled_vows?.length || 0) > 0 || (n.sins_admitted?.length || 0) > 0 || (n.diseases?.length || 0) > 0;
                  // Kısa düğüm etiketi: relation_key varsa ondan, yoksa relation'dan ilk kelime
                  const shortLabel = isSelf
                    ? (n.label?.split(' ')[0] || 'Kişi')
                    : (n.relation_key && NODE_LABEL[n.relation_key]) || (n.relation || n.label || '').split(' ')[0];
                  return (
                    <G key={n.id} onPress={() => setSelected(n)}>
                      {hasIssue && (
                        <Circle cx={p.x} cy={p.y} r={r + 6} fill="transparent" stroke={colors.errorVow} strokeWidth={1.2} strokeOpacity={0.45} strokeDasharray="3,3" />
                      )}
                      <Circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth={2.2} />
                      <SvgText
                        x={p.x}
                        y={p.y + 4}
                        fontSize={isSelf ? 12 : 11}
                        fontWeight="600"
                        textAnchor="middle"
                        fill={stroke}
                      >
                        {shortLabel}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>
            </ScrollView>
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <Caption style={{ color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>
            Haritayı sağa-sola ve yukarı-aşağı kaydırabilirsiniz. Oklar ebeveynden çocuğa (üst soydan kişiye sızan iz) yönelir.
          </Caption>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Label style={{ marginBottom: spacing.sm }}>SOY YÜKÜ ENVANTERİ</Label>
          {nodes.filter((n) => n.id !== 'self').map((n) => (
            <TouchableOpacity key={n.id} onPress={() => setSelected(n)} testID={`node-${n.id}`}>
              <Card style={[styles.invCard, { borderLeftColor: n.side === 'maternal' ? colors.maternalPrimary : colors.paternalPrimary }]}>
                <H3 style={{ fontSize: 16 }}>{n.relation || n.label}</H3>
                <Caption style={{ color: n.side === 'maternal' ? colors.maternalPrimary : colors.paternalPrimary }}>
                  {n.side === 'maternal' ? 'Anne soyu' : 'Baba soyu'}{n.label && n.relation && n.label !== n.relation ? ` · ${n.label}` : ''}
                </Caption>
                {((n.diseases?.length || 0) + (n.unfulfilled_vows?.length || 0) + (n.events?.length || 0) + (n.sins_admitted?.length || 0)) === 0 ? (
                  <Caption style={{ marginTop: 4 }}>Detay girilmedi</Caption>
                ) : (
                  <Caption style={{ marginTop: 4 }}>
                    {n.diseases?.length || 0} hastalık · {n.unfulfilled_vows?.length || 0} yarım adak · {n.events?.length || 0} olay · {n.sins_admitted?.length || 0} günah
                  </Caption>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <NodeDetailModal node={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

function NodeDetailModal({ node, onClose }: { node: MindMapNode | null; onClose: () => void }) {
  if (!node) return null;
  const isSelf = node.type === 'self';
  const sideColor = node.side === 'maternal' ? colors.maternalPrimary : node.side === 'paternal' ? colors.paternalPrimary : colors.textPrimary;
  const sideBg = node.side === 'maternal' ? colors.maternalLight : node.side === 'paternal' ? colors.paternalLight : colors.bgSecondary;

  return (
    <Modal visible={!!node} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView style={{ maxHeight: 540 }} contentContainerStyle={{ padding: spacing.lg }}>
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
                <TouchableOpacity onPress={onClose} testID="modal-close"><Body style={{ fontSize: 26 }}>×</Body></TouchableOpacity>
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

              {(node.unfulfilled_vows?.length || 0) > 0 && (
                <View style={styles.section}>
                  <Label style={{ marginBottom: spacing.sm, color: colors.errorVow }}>YARIM KALAN ADAKLAR</Label>
                  {node.unfulfilled_vows!.map((d, i) => <Caption key={i} style={{ color: colors.errorVow }}>⌛ {d}</Caption>)}
                </View>
              )}

              {(node.vows?.length || 0) > 0 && (
                <View style={styles.section}>
                  <Label style={{ marginBottom: spacing.sm, color: colors.errorVow }}>YARIM ADAKLAR</Label>
                  {node.vows!.map((d, i) => <Caption key={i} style={{ color: colors.errorVow }}>⌛ {d}</Caption>)}
                </View>
              )}

              {(node.sins_admitted?.length || 0) > 0 && (
                <View style={styles.section}>
                  <Label style={{ marginBottom: spacing.sm }}>BİLİNEN GÜNAHLAR</Label>
                  {node.sins_admitted!.map((d, i) => <Caption key={i}>· {d}</Caption>)}
                </View>
              )}

              {((node.diseases?.length || 0) + (node.events?.length || 0) + (node.unfulfilled_vows?.length || 0) + (node.sins_admitted?.length || 0) + (node.allergies?.length || 0) + (node.vows?.length || 0)) === 0 && (
                <Caption style={{ marginTop: spacing.md, textAlign: 'center' }}>Bu düğüm için ayrıntı eklenmemiş.</Caption>
              )}

              <Caption style={{ marginTop: spacing.lg, fontStyle: 'italic', textAlign: 'center', color: colors.textSecondary }}>
                {isSelf ? 'Soy izleriniz bugüne sızıyor — anne ve baba taraflarından gelen yükleri gözden geçirin.' : 'Bu atadan size sızan yük, hastalık-sebep eşleştirmesinde değerlendirildi.'}
              </Caption>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 70,
  },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, paddingBottom: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  invCard: { borderLeftWidth: 4 },
  mapBox: {
    height: 520,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(44,53,49,0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bgPrimary, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  sideBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.round, alignSelf: 'flex-start' },
  section: { marginTop: spacing.lg },
});
