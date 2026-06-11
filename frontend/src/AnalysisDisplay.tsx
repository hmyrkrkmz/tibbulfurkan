import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Body, Caption, H3 } from '@/src/ui';
import { colors, fonts, radius, spacing } from '@/src/theme';

type SubPoint = {
  title?: string;
  body: string;
};

type Bullet = {
  topic?: string; // örn. "Faiz Yükü"
  body: string;
  intro?: string;
  points?: SubPoint[];
  remedy?: string;
};

// Uzun gövdeyi (1)…(2)… kalıplarına göre alt-kartlara böler
function splitBulletBody(body: string): { intro?: string; points?: SubPoint[]; remedy?: string } {
  if (!body) return {};

  // Önce "Şifa için:" kısmını ayır (kapanış cümlesi)
  let remedy: string | undefined;
  let work = body;
  const remedyRe = /(?:Şifa\s*için|Sifa\s*icin|Şifa\s*yolu|Çözüm|Cozum)[:：]\s*(.+)$/i;
  const rm = work.match(remedyRe);
  if (rm) {
    remedy = rm[1].trim();
    work = work.slice(0, rm.index).trim();
  }

  // Sıralı (1), (2), (3)... işaretçilerini bul (sadece numaralı bölüm açıcılar)
  // İç parantezler (örn. "(hasar)") atlanır, çünkü 1-9 dışındaki içerik filtrelenir.
  const markerRe = /\((\d)\)/g;
  const markers: { idx: number; n: number; end: number }[] = [];
  let mm: RegExpExecArray | null;
  while ((mm = markerRe.exec(work)) !== null) {
    const n = parseInt(mm[1], 10);
    if (n >= 1 && n <= 9) markers.push({ idx: mm.index, n, end: mm.index + mm[0].length });
  }

  // Sadece sıralı olarak artan zinciri tut: 1, 2, 3, ...
  const ordered: { idx: number; n: number; end: number }[] = [];
  let expect = 1;
  for (const mk of markers) {
    if (mk.n === expect) {
      ordered.push(mk);
      expect += 1;
    }
  }

  if (ordered.length === 0) {
    return { intro: work.trim() || undefined, remedy };
  }

  const intro = work.slice(0, ordered[0].idx).trim() || undefined;

  const points: SubPoint[] = ordered.map((mk, i) => {
    const end = i + 1 < ordered.length ? ordered[i + 1].idx : work.length;
    const raw = work.slice(mk.end, end).trim().replace(/^[.\s]+/, '');
    // "Title: body" formatını yakala (Title 60 karakteri geçmesin)
    const t = raw.match(/^([^:：]{2,60})[:：]\s*(.+)$/s);
    if (t) {
      return {
        title: t[1].trim().replace(/\s+/g, ' '),
        body: t[2].trim().replace(/\s+/g, ' '),
      };
    }
    return { body: raw.replace(/\s+/g, ' ').trim() };
  });

  return { intro, points, remedy };
}

type Section = {
  title: string;
  bullets: Bullet[];
};

const SECTION_META: Record<string, { color: string; icon: string }> = {
  'Rızık ve Bereketteki Engeller':  { color: '#B89B5E', icon: '◈' },
  'Ailede Yaşanan Sıkıntılar':      { color: '#C87971', icon: '✦' },
  'Gönül ve Ruh Halindeki İşaretler': { color: '#9C6F8E', icon: '❋' },
  'Manevi Yükler':                  { color: '#7C8CA8', icon: '⟁' },
  'Şifaya Açılan Kapı':             { color: '#7A9472', icon: '✿' },
  'Genel Değerlendirme':            { color: '#4A6A55', icon: '◆' },
  'Aile Büyükleri & Soy Yükü':      { color: '#C87971', icon: '✦' },
  'Mali Durum':                     { color: '#B89B5E', icon: '◈' },
  'Aile Hastalıkları':              { color: '#9C6F8E', icon: '❋' },
  'Ruhsal & Fiziksel Rahatsızlıklar': { color: '#7C8CA8', icon: '⟁' },
  'Manevi İşaretler':               { color: '#7A9472', icon: '✿' },
};

const FALLBACK_META = { color: colors.accentSage, icon: '•' };

function matchMeta(title: string) {
  const t = title.toLowerCase().replace(/[&]/g, 've').replace(/\s+/g, ' ').trim();
  if (t.includes('rızık') || t.includes('bereket') || t.includes('mali')) return SECTION_META['Rızık ve Bereketteki Engeller'];
  if (t.includes('aile') && (t.includes('sıkıntı') || t.includes('yük') || t.includes('büyük'))) return SECTION_META['Ailede Yaşanan Sıkıntılar'];
  if (t.includes('gönül') || t.includes('ruh')) return SECTION_META['Gönül ve Ruh Halindeki İşaretler'];
  if (t.includes('manevi yük') || t.includes('manevi i̇şaret') || t.includes('manevi')) return SECTION_META['Manevi Yükler'];
  if (t.includes('şifa') || t.includes('sifa')) return SECTION_META['Şifaya Açılan Kapı'];
  if (t.includes('aile hastalık') || t.includes('ailedeki hastalık')) return SECTION_META['Aile Hastalıkları'];
  if (t.includes('ruhsal') || t.includes('fiziksel') || t.includes('rahatsızlık')) return SECTION_META['Ruhsal & Fiziksel Rahatsızlıklar'];
  if (t.includes('genel') || t.includes('değerlendirme') || t.includes('özet') || t.includes('sonuç')) return SECTION_META['Genel Değerlendirme'];
  return FALLBACK_META;
}

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{2700}-\u{27BF}\u{FE0F}\u{200D}]/gu;
function cleanText(s: string): string {
  return s
    .replace(/\s*[-–—]{2,}\s*$/, '')
    .replace(/^\s*[-–—]{2,}\s*/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1') // inline **bold** → düz metin
    .replace(/[*_]/g, '')
    .replace(EMOJI_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// "**Topic:** body" → { topic: "Topic", body: "body", points/remedy }
function parseTopicLine(raw: string): Bullet | null {
  // Bold konu başlığı yakala (**Topic:** veya **Topic** prefix)
  const m = raw.match(/^\*\*([^*]+?)\*\*[:：]?\s*(.*)$/);
  if (m) {
    const topic = cleanText(m[1].replace(/[:：]$/, ''));
    const body = cleanText(m[2]);
    if (topic) {
      const split = splitBulletBody(body);
      return { topic, body, ...split };
    }
  }
  // Bold yok ama sıradan "Topic: body" şeklinde başlıyorsa
  const m2 = raw.match(/^([A-ZĞÜŞİÖÇ][^:：]{2,40})[:：]\s*(.+)$/);
  if (m2 && m2[1].length < 50 && !m2[1].includes(' bir ') && !m2[1].includes(' ve ')) {
    const body = cleanText(m2[2]);
    const split = splitBulletBody(body);
    return { topic: cleanText(m2[1]), body, ...split };
  }
  const body = cleanText(raw);
  if (!body) return null;
  const split = splitBulletBody(body);
  return { body, ...split };
}

function parseAnalysis(md: string): { intro: string | null; sections: Section[]; closing: string | null } {
  if (!md) return { intro: null, sections: [], closing: null };

  // Kapanış cümlesini ayır
  let closing: string | null = null;
  let body = md;
  const closingPatterns = [
    /\*\*Adak[^*]*seans\s*alınması\s*önerilir\.?\*\*/i,
    /Adak[^.]*seans\s*alınması\s*önerilir\.?/i,
    /\*\*Kesin\s+tespit[^*]+\*\*\.?/i,
    /lütfen\s*seans\s*alınız\.?/i,
    /seans\s+alınması\s+önerilir\.?/i,
  ];
  for (const re of closingPatterns) {
    const m = md.match(re);
    if (m) {
      closing = cleanText(m[0].replace(/\*\*/g, ''));
      body = md.slice(0, m.index).trim();
      break;
    }
  }

  const lines = body.split('\n').map((l) => l.trim());
  const sections: Section[] = [];
  let current: Section | null = null;
  let introLines: string[] = [];

  for (const raw of lines) {
    if (!raw) continue;
    if (/^[-–—=*]{2,}$/.test(raw)) continue;

    // Başlık
    if (/^#{1,3}\s+/.test(raw)) {
      if (current) sections.push(current);
      const title = cleanText(raw.replace(/^#{1,3}\s+/, ''));
      current = { title, bullets: [] };
      continue;
    }

    // Bullet (- veya • veya * ile başlayan)
    let line = raw;
    let isBullet = false;
    if (/^[-•*]\s+/.test(line)) {
      line = line.replace(/^[-•*]\s+/, '');
      isBullet = true;
    }

    // Bold "**Topic:**" başlangıçlıysa yeni bullet say
    const isTopicLine = /^\*\*[^*]+\*\*/.test(line);

    if (current) {
      if (isBullet || isTopicLine) {
        const parsed = parseTopicLine(line);
        if (parsed) current.bullets.push(parsed);
      } else {
        // Düz metin — son bullet'a ekle veya yeni body olarak başlat
        const cleaned = cleanText(line);
        if (!cleaned) continue;
        if (current.bullets.length > 0) {
          current.bullets[current.bullets.length - 1].body =
            (current.bullets[current.bullets.length - 1].body + ' ' + cleaned).trim();
        } else {
          current.bullets.push({ body: cleaned });
        }
      }
    } else {
      // Başlık öncesi giriş
      const cleaned = cleanText(line.replace(/^\*\*([^*]+)\*\*:?\s*/, ''));
      if (cleaned) introLines.push(cleaned);
    }
  }
  if (current) sections.push(current);

  const result = sections.filter((s) => s.bullets.length > 0);
  return {
    intro: introLines.length > 0 ? introLines.join(' ') : null,
    sections: result,
    closing,
  };
}

export function AnalysisDisplay({ markdown }: { markdown: string }) {
  const { intro, sections, closing } = useMemo(() => parseAnalysis(markdown), [markdown]);

  if (sections.length === 0 && !intro) {
    return (
      <View style={styles.fallbackCard}>
        <Body style={{ lineHeight: 22 }}>{markdown}</Body>
      </View>
    );
  }

  return (
    <View>
      {intro && (
        <View style={styles.introCard}>
          <View style={styles.introQuoteBar} />
          <Body style={styles.introText}>{intro}</Body>
        </View>
      )}

      {sections.map((s, i) => {
        const meta = matchMeta(s.title);
        return (
          <View key={`${s.title}-${i}`} style={[styles.sectionCard, { borderLeftColor: meta.color }]}>
            <View style={styles.headerRow}>
              <View style={[styles.iconBadge, { backgroundColor: meta.color }]}>
                <Body style={styles.iconChar}>{meta.icon}</Body>
              </View>
              <H3 style={styles.sectionTitle}>{s.title}</H3>
            </View>

            {s.bullets.map((b, j) => {
              const hasPoints = (b.points?.length || 0) > 0;
              return (
                <View key={j} style={[styles.bulletCard, { borderLeftColor: meta.color + '55' }]}>
                  {b.topic && (
                    <Caption style={[styles.topic, { color: meta.color }]} numberOfLines={3}>
                      {b.topic.toLocaleUpperCase('tr-TR')}
                    </Caption>
                  )}

                  {/* Numaralı alt-noktalar varsa kartlara böl */}
                  {hasPoints ? (
                    <>
                      {b.intro ? <Body style={styles.introBody}>{b.intro}</Body> : null}
                      <View style={styles.pointList}>
                        {b.points!.map((p, k) => (
                          <View key={k} style={[styles.pointCard, { borderColor: meta.color + '33' }]}>
                            <View style={[styles.pointIndex, { backgroundColor: meta.color }]}>
                              <Body style={styles.pointIndexText}>{k + 1}</Body>
                            </View>
                            <View style={styles.pointContent}>
                              {p.title ? (
                                <Body style={[styles.pointTitle, { color: meta.color }]}>{p.title}</Body>
                              ) : null}
                              <Body style={styles.pointBody}>{p.body}</Body>
                            </View>
                          </View>
                        ))}
                      </View>
                      {b.remedy ? (
                        <View style={[styles.remedyCard, { backgroundColor: meta.color + '14', borderLeftColor: meta.color }]}>
                          <Caption style={[styles.remedyLabel, { color: meta.color }]}>ŞİFA İÇİN</Caption>
                          <Body style={styles.remedyBody}>{b.remedy}</Body>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    b.body ? <Body style={styles.bulletText}>{b.body}</Body> : null
                  )}
                </View>
              );
            })}
          </View>
        );
      })}

      {closing && (
        <View style={styles.closingCard}>
          <Body style={styles.closingText}>{closing}</Body>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackCard: {
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  // Giriş paragrafı
  introCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    paddingLeft: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  introQuoteBar: {
    width: 3,
    backgroundColor: colors.accentSage,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  introText: {
    flex: 1,
    fontStyle: 'italic',
    lineHeight: 22,
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Ana bölüm kartı
  sectionCard: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: colors.borderSubtle,
    borderRightColor: colors.borderSubtle,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.lg,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconChar: {
    color: colors.bgPrimary,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    flex: 1,
  },

  // İç mini-kart (her konu)
  bulletCard: {
    backgroundColor: colors.bgPrimary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  topic: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },

  // Numaralı alt kartlar (uzun açıklamalar için)
  introBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary || colors.textPrimary,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  pointList: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pointCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm + 2,
    alignItems: 'flex-start',
  },
  pointIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  pointIndexText: {
    color: colors.bgPrimary,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 14,
  },
  pointContent: {
    flex: 1,
  },
  pointTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 2,
  },
  pointBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  remedyCard: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  remedyLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  remedyBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },

  // Kapanış
  closingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accentSage,
    marginTop: spacing.sm,
  },
  closingText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.accentSage,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 22,
  },
});
