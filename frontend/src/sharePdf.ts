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
    // **Topic:** body satırları da ayrı bullet olarak ele alınır
    if (/^\*\*[^*]+\*\*/.test(line)) {
      const text = line.replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
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

// Bullet gövdesini "(1) Title: body. (2) Title: body. Şifa için: ..." kalıbına göre ayırır
type SubPoint = { title?: string; body: string };
function splitBulletBody(body: string): { intro?: string; points: SubPoint[]; remedy?: string } {
  if (!body) return { points: [] };
  let work = body;
  let remedy: string | undefined;
  const rm = work.match(/(?:Şifa\s*için|Sifa\s*icin|Şifa\s*yolu|Çözüm)[:：]\s*(.+)$/i);
  if (rm && rm.index !== undefined) {
    remedy = rm[1].trim();
    work = work.slice(0, rm.index).trim();
  }
  // (1), (2), … gibi tek haneli numara açıcılarını bul; sıralı zinciri tut
  const markerRe = /\((\d)\)/g;
  const markers: { idx: number; n: number; end: number }[] = [];
  let mm: RegExpExecArray | null;
  while ((mm = markerRe.exec(work)) !== null) {
    const n = parseInt(mm[1], 10);
    if (n >= 1 && n <= 9) markers.push({ idx: mm.index, n, end: mm.index + mm[0].length });
  }
  const ordered: typeof markers = [];
  let expect = 1;
  for (const mk of markers) {
    if (mk.n === expect) { ordered.push(mk); expect += 1; }
  }
  if (ordered.length === 0) {
    return { intro: work.trim() || undefined, points: [], remedy };
  }
  const intro = work.slice(0, ordered[0].idx).trim() || undefined;
  const points: SubPoint[] = ordered.map((mk, i) => {
    const end = i + 1 < ordered.length ? ordered[i + 1].idx : work.length;
    const raw = work.slice(mk.end, end).trim().replace(/^[.\s]+/, '');
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

// "**Topic:** body" formatında ise topic ve body ayır
function parseBullet(raw: string): { topic?: string; body: string; intro?: string; points: SubPoint[]; remedy?: string } {
  const m = raw.match(/^\*\*([^*]+?)\*\*[:：]?\s*(.*)$/);
  if (m) {
    const topic = m[1].replace(/[:：]$/, '').trim();
    const body = (m[2] || '').trim();
    const split = splitBulletBody(body);
    return { topic, body, ...split };
  }
  // "Topic: body" eski formatı (parseAnalysisToSections içinde dönüştürülmüş)
  const m2 = raw.match(/^([A-ZĞÜŞİÖÇ][^:：]{2,50})[:：]\s*(.+)$/);
  if (m2) {
    const split = splitBulletBody(m2[2].trim());
    return { topic: m2[1].trim(), body: m2[2].trim(), ...split };
  }
  const split = splitBulletBody(raw);
  return { body: raw, ...split };
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
      const bullets = s.bullets.map((rawB) => {
        const b = parseBullet(rawB);
        const hasPoints = b.points && b.points.length > 0;
        if (hasPoints) {
          const intro = b.intro ? `<div class="sub-intro">${esc(b.intro)}</div>` : '';
          const pts = b.points
            .map((p, i) => `
              <div class="point">
                <span class="point-num" style="background:${color};">${i + 1}</span>
                <div class="point-body">
                  ${p.title ? `<div class="point-title" style="color:${color};">${esc(p.title)}</div>` : ''}
                  <div class="point-text">${esc(p.body)}</div>
                </div>
              </div>`)
            .join('');
          const remedy = b.remedy
            ? `<div class="remedy" style="background:${color}22;border-left-color:${color};">
                 <div class="remedy-label" style="color:${color};">ŞİFA İÇİN</div>
                 <div class="remedy-body">${esc(b.remedy)}</div>
               </div>`
            : '';
          return `
            <div class="bullet-card">
              ${b.topic ? `<div class="bullet-topic" style="color:${color};">${esc(b.topic.toUpperCase())}</div>` : ''}
              ${intro}
              ${pts}
              ${remedy}
            </div>`;
        }
        // Sayılı liste yoksa eski sade satır
        if (b.topic) {
          return `<li><b style="color:${color};">${esc(b.topic)}:</b> ${esc(b.body)}</li>`;
        }
        return `<li>${esc(b.body)}</li>`;
      });
      // List item'ları topla (sayısız bullet'lar) ve kartlardan ayır
      const cardItems = bullets.filter((h) => h.trimStart().startsWith('<div class="bullet-card"'));
      const listItems = bullets.filter((h) => h.trimStart().startsWith('<li>'));
      const listHtml = listItems.length ? `<ul>${listItems.join('')}</ul>` : '';
      const cardsHtml = cardItems.join('');
      return `
        <div class="section" style="border-left-color:${color};">
          <div class="section-head">
            <span class="title-bar" style="background:${color};"></span>
            <h2>${esc(s.title)}</h2>
          </div>
          ${listHtml}
          ${cardsHtml}
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

  /* Hastalık bullet kartı + numaralı alt-kartlar */
  .bullet-card {
    background: #FAF6EF;
    border-radius: 6px;
    padding: 10px 12px;
    margin-top: 10px;
    page-break-inside: avoid;
  }
  .bullet-topic {
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }
  .sub-intro {
    font-size: 11.5px;
    color: #5C6B64;
    font-style: italic;
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .point {
    display: flex;
    align-items: flex-start;
    background: #FFFFFF;
    border: 1px solid #EBE5D8;
    border-radius: 5px;
    padding: 8px 10px;
    margin-bottom: 6px;
    page-break-inside: avoid;
  }
  .point-num {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 9px;
    color: #FFFFFF;
    font-size: 10.5px;
    font-weight: 700;
    text-align: center;
    line-height: 18px;
    margin-right: 8px;
    margin-top: 1px;
  }
  .point-body { flex: 1; }
  .point-title {
    font-size: 11.5px;
    font-weight: 700;
    margin-bottom: 2px;
  }
  .point-text {
    font-size: 11px;
    color: #2D2A24;
    line-height: 1.5;
  }
  .remedy {
    border-left: 3px solid;
    border-radius: 5px;
    padding: 8px 10px;
    margin-top: 6px;
    page-break-inside: avoid;
  }
  .remedy-label {
    font-size: 9.5px;
    letter-spacing: 0.6px;
    font-weight: 700;
    margin-bottom: 3px;
  }
  .remedy-body {
    font-size: 11px;
    color: #2D2A24;
    line-height: 1.5;
  }
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
