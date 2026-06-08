import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Body, Caption, H3 } from '@/src/ui';
import { colors, fonts, radius, spacing } from '@/src/theme';

type Section = {
  title: string;
  bullets: string[];
};

const SECTION_META: Record<string, { color: string }> = {
  'Aile Büyükleri & Soy Yükü': { color: colors.maternalPrimary },
  'Mali Durum': { color: '#B89B5E' },
  'Aile Hastalıkları': { color: '#9C6F8E' },
  'Ruhsal & Fiziksel Rahatsızlıklar': { color: '#7C8CA8' },
  'Manevi İşaretler': { color: colors.accentSage },
  'Genel Değerlendirme': { color: colors.textPrimary },
};

const FALLBACK_META = { color: colors.accentSage };

// Esnek başlık eşleştirici — küçük harf, "ve" / "&" / "ile" gibi farkları yok sayar
function matchMeta(title: string) {
  const t = title.toLowerCase().replace(/[&]/g, 've').replace(/\s+/g, ' ').trim();
  if (t.includes('aile büyük') || t.includes('soy yük')) return SECTION_META['Aile Büyükleri & Soy Yükü'];
  if (t.includes('mali')) return SECTION_META['Mali Durum'];
  if (t.includes('aile hastalık') || t.includes('ailedeki hastalık')) return SECTION_META['Aile Hastalıkları'];
  if (t.includes('ruhsal') || t.includes('fiziksel') || t.includes('rahatsızlık')) return SECTION_META['Ruhsal & Fiziksel Rahatsızlıklar'];
  if (t.includes('manevi işaret') || t.includes('manevi i̇şaret') || t.includes('manevi')) return SECTION_META['Manevi İşaretler'];
  if (t.includes('genel') || t.includes('değerlendirme') || t.includes('özet') || t.includes('sonuç')) return SECTION_META['Genel Değerlendirme'];
  return FALLBACK_META;
}

// Çöp karakterleri ve ayraçları temizle (emoji dahil)
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{2700}-\u{27BF}\u{FE0F}\u{200D}]/gu;
function cleanText(s: string): string {
  return s
    .replace(/\s*[-–—]{2,}\s*$/, '')
    .replace(/^\s*[-–—]{2,}\s*/, '')
    .replace(/[*_]/g, '')
    .replace(EMOJI_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Markdown'u yapılandırılmış bölümlere ayırır.
 * Beklenen format:
 *   ## Başlık
 *   - madde 1
 *   - madde 2
 *
 *   ## Diğer Başlık
 *   - ...
 *
 * Son satır: "Lütfen seans alınız." (ayrı tutulur)
 */
function parseAnalysis(md: string): { sections: Section[]; closing: string | null } {
  if (!md) return { sections: [], closing: null };

  // "Lütfen seans alınız" varsa ayır
  const closingRegex = /lütfen\s*seans\s*alınız\.?/i;
  let closing: string | null = null;
  let body = md;
  const m = md.match(closingRegex);
  if (m) {
    closing = 'Lütfen seans alınız.';
    body = md.slice(0, m.index).trim();
  }

  // Satır satır ayır
  const lines = body.split('\n').map((l) => l.trim());
  const sections: Section[] = [];
  let current: Section | null = null;
  let preamble: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    // "---" veya "===" gibi yatay çizgileri at
    if (/^[-–—=*]{2,}$/.test(line)) continue;

    // Başlık (## veya # ile)
    if (/^#{1,3}\s+/.test(line)) {
      // Sonlandır mevcut bölümü
      if (current) sections.push(current);
      const title = cleanText(line.replace(/^#{1,3}\s+/, ''));
      current = { title, bullets: [] };
      continue;
    }

    // Bullet (- veya • veya * ile)
    if (/^[-•*]\s+/.test(line)) {
      const text = cleanText(line.replace(/^[-•*]\s+/, '').replace(/^\*\*([^*]+)\*\*:?\s*/, '$1: '));
      if (text && current) current.bullets.push(text);
      else if (text) preamble.push(text);
      continue;
    }

    // Düz metin satırı — mevcut bölüm varsa son bullet'a ekle, yoksa preamble'a
    const cleaned = cleanText(line);
    if (!cleaned) continue;
    if (current) {
      if (current.bullets.length > 0) {
        current.bullets[current.bullets.length - 1] += ' ' + cleaned;
      } else {
        current.bullets.push(cleaned);
      }
    } else {
      preamble.push(cleaned);
    }
  }
  if (current) sections.push(current);

  // Preamble varsa, "Önsöz" bölümü olarak en başa koyma — boş bölümleri at
  const result = sections.filter((s) => s.bullets.length > 0);
  if (preamble.length > 0 && result.length === 0) {
    // Hiç başlık yoksa, tüm metni "Genel" başlık altında topla
    result.push({ title: 'Genel Değerlendirme', bullets: preamble });
  }

  return { sections: result, closing };
}

export function AnalysisDisplay({ markdown }: { markdown: string }) {
  const { sections, closing } = useMemo(() => parseAnalysis(markdown), [markdown]);

  if (sections.length === 0) {
    // Fallback — düz metin
    return (
      <View style={styles.fallbackCard}>
        <Body style={{ lineHeight: 22 }}>{markdown}</Body>
      </View>
    );
  }

  return (
    <View>
      {sections.map((s, i) => {
        const meta = matchMeta(s.title);
        return (
          <View key={`${s.title}-${i}`} style={[styles.sectionCard, { borderLeftColor: meta.color }]}>
            <View style={styles.headerRow}>
              <View style={[styles.titleBar, { backgroundColor: meta.color }]} />
              <H3 style={styles.sectionTitle}>{s.title}</H3>
            </View>
            <View style={styles.divider} />
            {s.bullets.map((b, j) => (
              <View key={j} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: meta.color }]} />
                <Body style={styles.bulletText}>{b}</Body>
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

  sectionCard: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: colors.borderSubtle,
    borderRightColor: colors.borderSubtle,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  titleBar: { width: 4, height: 18, borderRadius: 2, marginRight: spacing.sm },
  sectionTitle: { fontSize: 17, color: colors.textPrimary, flex: 1 },

  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
    opacity: 0.6,
  },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3,
    marginTop: 8, marginRight: spacing.sm,
  },
  bulletText: { flex: 1, fontSize: 14.5, lineHeight: 22, color: colors.textPrimary },

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
  closingText: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.accentSage, letterSpacing: 0.5 },
});
