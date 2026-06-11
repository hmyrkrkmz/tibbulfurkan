import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type Section = { title: string; bullets: string[] };

function parseAnalysisToSections(md: string): { sections: Section[]; closing: string | null } {
  if (!md) return { sections: [], closing: null };

  // Yeni & eski kapanış kalıpları
  const closingPatterns = [
    /\*\*Adak[^*]*seans\s*alınması\s*önerilir\.?\*\*/i,
    /Adak[^.]*seans\s*alınması\s*önerilir\.?/i,
    /\*\*Kesin\s+tespit[^*]+\*\*\.?/i,
    /Kesin\s+tespit[^.]+\.?/i,
    /lütfen\s*seans\s*alınız\.?/i,
  ];
  let closing: string | null = null;
  let body = md;
  for (const re of closingPatterns) {
    const m = md.match(re);
    if (m) {
      closing = m[0].replace(/\*\*/g, '').trim();
      body = md.slice(0, m.index).trim();
      break;
    }
  }

  const lines = body.split('\n').map((l) => l.trim());
  const sections: Section[] = [];
  let current: Section | null = null;

  const clean = (s: string) =>
    s.replace(/\s*[-–—]{2,}\s*$/, '').replace(/^\s*[-–—]{2,}\s*/, '').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();

  for (const line of lines) {
    if (!line) continue;
    if (/^[-–—=*]{2,}$/.test(line)) continue;
    if (/^#{1,3}\s+/.test(line)) {
      if (current) sections.push(current);
      current = { title: clean(line.replace(/^#{1,3}\s+/, '')), bullets: [] };
      continue;
    }
    if (/^[-•*]\s+/.test(line)) {
      const text = clean(line.replace(/^[-•*]\s+/, '').replace(/^\*\*([^*]+)\*\*:?\s*/, '$1: '));
      if (text && current) current.bullets.push(text);
      continue;
    }
    const cl = clean(line);
    if (current && cl) {
      if (current.bullets.length > 0) current.bullets[current.bullets.length - 1] += ' ' + cl;
      else current.bullets.push(cl);
    }
  }
  if (current) sections.push(current);
  return { sections: sections.filter((s) => s.bullets.length > 0), closing };
}

const SECTION_COLOR: Record<string, string> = {
  aile_buyukleri: '#7B9A8E',
  mali: '#B89B5E',
  hastalik: '#9C6F8E',
  rahatsizlik: '#7C8CA8',
  manevi: '#5C8474',
  genel: '#2D2A24',
};

function pickKey(title: string): string {
  const t = title.toLowerCase().replace(/[&]/g, 've').trim();
  if (t.includes('aile büyük') || t.includes('soy yük')) return 'aile_buyukleri';
  if (t.includes('mali')) return 'mali';
  if (t.includes('aile hastalık') || t.includes('ailedeki hastalık')) return 'hastalik';
  if (t.includes('ruhsal') || t.includes('fiziksel') || t.includes('rahatsızlık')) return 'rahatsizlik';
  if (t.includes('manevi') || t.includes('işaret')) return 'manevi';
  return 'genel';
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(opts: {
  ad_soyad: string;
  cinsiyet?: string;
  dogum_tarihi?: string;
  analysis: string;
}): string {
  const { sections, closing } = parseAnalysisToSections(opts.analysis);

  const sectionsHtml = sections
    .map((s) => {
      const key = pickKey(s.title);
      const color = SECTION_COLOR[key];
      const bullets = s.bullets.map((b) => `<li>${esc(b)}</li>`).join('');
      return `
        <div class="section" style="border-left-color:${color};">
          <div class="section-head">
            <span class="title-bar" style="background:${color};"></span>
            <h2>${esc(s.title)}</h2>
          </div>
          <ul>${bullets}</ul>
        </div>
      `;
    })
    .join('');

  const cinsiyet = opts.cinsiyet === 'erkek' ? '♂ Erkek' : opts.cinsiyet === 'kadın' ? '♀ Kadın' : '';
  const meta = [cinsiyet, opts.dogum_tarihi ? `Doğum: ${opts.dogum_tarihi}` : ''].filter(Boolean).join('  ·  ');

  return `<!DOCTYPE html>
<html lang="tr"><head>
<meta charset="UTF-8" />
<style>
  @page { margin: 24mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: #2D2A24;
    line-height: 1.55;
    margin: 0;
    background: #FAF6EF;
  }
  .header {
    text-align: center;
    border-bottom: 2px solid #5C8474;
    padding-bottom: 14px;
    margin-bottom: 22px;
  }
  .header img.logo {
    max-width: 180px;
    max-height: 90px;
    margin: 0 auto 8px;
    display: block;
  }
  .brand {
    color: #8A8378;
    font-size: 10px;
    letter-spacing: 2px;
    font-style: italic;
    opacity: 0.7;
    margin-bottom: 4px;
  }
  .brand-name {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 26px;
    font-weight: 700;
    color: #2D2A24;
  }
  .person { margin: 8px 0 18px; text-align: center; }
  .person h1 {
    font-family: Georgia, serif;
    font-size: 30px;
    margin: 0 0 4px;
    color: #2D2A24;
  }
  .person .meta { font-size: 13px; color: #6B6358; }
  .label {
    color: #5C8474;
    letter-spacing: 2px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    text-align: center;
    margin: 18px 0 14px;
  }
  .section {
    background: #FFFFFF;
    border-radius: 8px;
    border-left: 5px solid #5C8474;
    border-top: 1px solid #EBE5D8;
    border-right: 1px solid #EBE5D8;
    border-bottom: 1px solid #EBE5D8;
    padding: 12px 16px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }
  .section-head { display: flex; align-items: center; gap: 8px; }
  .title-bar { width: 4px; height: 18px; border-radius: 2px; display: inline-block; }
  .section h2 {
    font-family: Georgia, serif;
    font-size: 15px;
    margin: 0;
    color: #2D2A24;
  }
  .section ul { margin: 8px 0 0; padding-left: 18px; }
  .section li { margin-bottom: 6px; font-size: 12.5px; color: #2D2A24; line-height: 1.55; }
  .closing {
    background: #F5EFE2;
    border: 1.5px solid #5C8474;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    margin-top: 16px;
    page-break-inside: avoid;
  }
  .closing .text {
    font-family: Georgia, serif;
    font-size: 16px;
    color: #5C8474;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .footer {
    text-align: center;
    font-size: 10px;
    color: #8A8378;
    margin-top: 24px;
    font-style: italic;
  }
</style>
</head>
<body>
  <div class="header">
    <img class="logo" src="https://customer-assets.emergentagent.com/job_furkan-docs/artifacts/g5eybie1_Adsiz-tasarim-8-e1772656467876.png" alt="Tıbb-ul Furkan" />
    <div class="brand-name">Soy Yükü Analizi</div>
  </div>

  <div class="person">
    <h1>${esc(opts.ad_soyad)}</h1>
    <div class="meta">${esc(meta)}</div>
  </div>

  <div class="label">Olası Tespitler</div>

  ${sectionsHtml}

  ${closing ? `<div class="closing"><div class="text">${esc(closing)}</div></div>` : ''}

  <div class="footer">
    Bu içerik tıbbi tavsiye değildir, yalnızca manevi yönden olası işaretleri sunar.
  </div>
</body></html>`;
}

function buildTextSummary(opts: { ad_soyad: string; analysis: string }): string {
  const { sections, closing } = parseAnalysisToSections(opts.analysis);
  let out = `*Tıbb-ul Furkan — Soy Yükü Analizi*\n`;
  out += `_${opts.ad_soyad}_\n\n`;
  for (const s of sections) {
    out += `*${s.title}*\n`;
    for (const b of s.bullets) out += `• ${b}\n`;
    out += `\n`;
  }
  if (closing) out += `*${closing}*\n`;
  return out.trim();
}

/**
 * Generate PDF & open share sheet (WhatsApp, Mail, Files, etc.)
 * On web: open print preview (user can Save as PDF)
 */
export async function shareAnalysisAsPdf(opts: {
  ad_soyad: string;
  cinsiyet?: string;
  dogum_tarihi?: string;
  analysis: string;
}): Promise<void> {
  const html = buildHtml(opts);

  if (Platform.OS === 'web') {
    // Web: open print dialog → user "Save as PDF"
    const w = window.open('', '_blank');
    if (!w) {
      Alert.alert('Hata', 'Tarayıcı yeni sekmeyi engelledi. Lütfen izin verin.');
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try { w.focus(); w.print(); } catch {}
    }, 400);
    return;
  }

  try {
    const file = await Print.printToFileAsync({
      html,
      base64: false,
      width: 595, // A4 width in points
      height: 842,
    });
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Paylaşım', `PDF kaydedildi:\n${file.uri}`);
      return;
    }
    await Sharing.shareAsync(file.uri, {
      dialogTitle: 'Analizi paylaş',
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
  } catch (e: any) {
    Alert.alert('Hata', e.message || 'PDF oluşturulamadı');
  }
}

/**
 * Share analysis as plain text — WhatsApp-friendly format
 */
export async function shareAnalysisAsText(opts: { ad_soyad: string; analysis: string }) {
  const text = buildTextSummary(opts);

  if (Platform.OS === 'web') {
    // Web: WhatsApp Web URL
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    return;
  }

  try {
    // expo-sharing requires a file URI; we write text to cache then share
    const FileSystem = await import('expo-file-system');
    const path = `${FileSystem.cacheDirectory}analiz-${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(path, text);
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Paylaşım', 'Cihazda paylaşım desteklenmiyor.');
      return;
    }
    await Sharing.shareAsync(path, { dialogTitle: 'Analizi paylaş', mimeType: 'text/plain' });
  } catch (e: any) {
    Alert.alert('Hata', e.message || 'Paylaşılamadı');
  }
}
