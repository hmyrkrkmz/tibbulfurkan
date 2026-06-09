import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Body, Caption, H3 } from '@/src/ui';
import { colors, fonts, radius, spacing } from '@/src/theme';

type Bullet = {
  topic?: string; // örn. "Faiz Yükü"
  body: string;
};

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
    .replace(/[_]/g, '')
    .replace(EMOJI_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// "**Topic:** body" → { topic: "Topic", body: "body" }
function parseTopicLine(raw: string): Bullet | null {
  // Bold konu başlığı yakala (**Topic:** veya **Topic** prefix)
  const m = raw.match(/^\*\*([^*]+?)\*\*[:：]?\s*(.*)$/);
  if (m) {
    const topic = cleanText(m[1].replace(/[:：]$/, ''));
    const body = cleanText(m[2]);
    if (topic) return { topic, body };
  }
  // Bold yok ama sıradan "Topic: body" şeklinde başlıyorsa
  const m2 = raw.match(/^([A-ZĞÜŞİÖÇ][^:：]{2,40})[:：]\s*(.+)$/);
  if (m2 && m2[1].length < 50 && !m2[1].includes(' bir ') && !m2[1].includes(' ve ')) {
    return { topic: cleanText(m2[1]), body: cleanText(m2[2]) };
  }
  const body = cleanText(raw);
  if (!body) return null;
  return { body };
}

function parseAnalysis(md: string): { intro: string | null; sections: Section[]; closing: string | null } {
  if (!md) return { intro: null, sections: [], closing: null };

  // Kapanış cümlesini ayır
  let closing: string | null = null;
  let body = md;
  const closingPatterns = [
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

            {s.bullets.map((b, j) => (
              <View key={j} style={[styles.bulletCard, { borderLeftColor: meta.color + '55' }]}>
                {b.topic && (
                  <Caption style={[styles.topic, { color: meta.color }]} numberOfLines={2}>
                    {b.topic}
                  </Caption>
                )}
                {b.body ? <Body style={styles.bulletText}>{b.body}</Body> : null}
              </View>
            ))}
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
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 21,
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
