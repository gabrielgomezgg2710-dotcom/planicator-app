import { jsPDF } from 'jspdf';

const PRIMARY   = [99,  102, 241];
const DARK      = [24,  24,  27];
const GRAY      = [113, 113, 122];
const LIGHT     = [244, 244, 245];
const PRIMARY_L = [235, 236, 253];
const WHITE     = [255, 255, 255];

const TYPE_LABELS   = { carousel: 'Carrusel', reel: 'Reel', static: 'Estático', story: 'Story' };
const STATUS_LABELS = { pending: 'Pendiente', review: 'En revisión', approved: 'Aprobado', published: 'Publicado' };

const M = 14; // margin

function header(doc, W) {
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 6, 'F');
}

function footer(doc, W, H, cur, total) {
  doc.setFillColor(...LIGHT);
  doc.rect(0, H - 11, W, 11, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Planicator · Agency Social Media Planning', M, H - 3.5);
  doc.text(`${cur} / ${total}`, W - M, H - 3.5, { align: 'right' });
}

function checkY(doc, y, needed, W, H) {
  if (y + needed > H - 14) {
    doc.addPage();
    header(doc, W);
    return 18;
  }
  return y;
}

export function exportPDF(planning) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const W    = doc.internal.pageSize.getWidth();
  const H    = doc.internal.pageSize.getHeight();
  const CW   = W - M * 2;

  const posts = planning.posts || [];
  const clientName = planning.clientName || 'Cliente';
  const month = planning.month || '';

  // Count by type
  const counts = { carousel: 0, reel: 0, static: 0, story: 0 };
  posts.forEach(p => { if (counts[p.type] !== undefined) counts[p.type]++; });

  // ── COVER ─────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 85, 'F');

  // Logo text
  doc.setTextColor(...WHITE);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('P', M, 32);
  doc.setFontSize(22);
  doc.text('Planicator', M + 14, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Agency Social Media Planning', M, 42);

  // Client
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  const nameLines = doc.splitTextToSize(clientName, CW);
  doc.text(nameLines, M, 70);

  // White area
  doc.setFillColor(...WHITE);
  doc.rect(0, 85, W, H - 85, 'F');

  // Month + posts count
  doc.setTextColor(...DARK);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(month, M, 104);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`${posts.length} posts`, M, 113);

  // Type stat pills
  let sx = M;
  const sy = 128;
  Object.entries(counts).filter(([, v]) => v > 0).forEach(([type, count]) => {
    doc.setFillColor(...PRIMARY_L);
    doc.roundedRect(sx, sy, 40, 22, 3, 3, 'F');
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(count), sx + 20, sy + 12, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(TYPE_LABELS[type], sx + 20, sy + 19, { align: 'center' });
    sx += 44;
  });

  // ── POSTS (grouped by week) ──────────────────────────────────
  const byWeek = {};
  posts.forEach(p => {
    const w = p.week || 1;
    (byWeek[w] = byWeek[w] || []).push(p);
  });

  Object.keys(byWeek)
    .sort((a, b) => Number(a) - Number(b))
    .forEach(week => {
      // ── Week separator page
      doc.addPage();
      header(doc, W);

      doc.setFillColor(...PRIMARY);
      doc.rect(0, 6, W, 52, 'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(clientName, M, 22);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(`Semana ${week}`, M, 40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${byWeek[week].length} posts`, M, 50);

      let y = 72;

      byWeek[week].forEach((post, idx) => {
        if (idx > 0) {
          y = checkY(doc, y, 30, W, H);
        }

        // ── Type badge row
        doc.setFillColor(...LIGHT);
        doc.roundedRect(M, y, CW, 9, 1.5, 1.5, 'F');
        doc.setFillColor(...PRIMARY);
        doc.roundedRect(M + 2, y + 1.5, 22, 6, 1.5, 1.5, 'F');
        doc.setTextColor(...WHITE);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text((TYPE_LABELS[post.type] || post.type).toUpperCase(), M + 13, y + 5.8, { align: 'center' });

        // Status
        const statusLabel = STATUS_LABELS[post.status] || 'Pendiente';
        doc.setTextColor(...GRAY);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(statusLabel, W - M - 2, y + 5.8, { align: 'right' });

        y += 13;

        // ── Title
        y = checkY(doc, y, 12, W, H);
        doc.setTextColor(...DARK);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(post.title || post.topic || 'Sin título', CW);
        doc.text(titleLines, M, y);
        y += titleLines.length * 5.5 + 3;

        // ── Meta row
        y = checkY(doc, y, 8, W, H);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY);
        const meta = [];
        if (post.assignedTo) meta.push(`Responsable: ${post.assignedTo}`);
        if (post.platform)   meta.push(`Plataforma: ${post.platform}`);
        if (post.date)       meta.push(`Fecha: ${post.date}`);
        if (meta.length) { doc.text(meta.join('   ·   '), M, y); y += 7; }

        // ── Divider
        y = checkY(doc, y, 4, W, H);
        doc.setDrawColor(228, 228, 231);
        doc.line(M, y, W - M, y);
        y += 5;

        // ── Copy
        if (post.copy) {
          const copyLines = doc.splitTextToSize(post.copy, CW);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...DARK);
          copyLines.forEach(line => {
            y = checkY(doc, y, 5, W, H);
            doc.text(line, M, y);
            y += 4.5;
          });
          y += 3;
        }

        // ── Slides (carousel)
        if (post.slides && post.slides.length > 0) {
          y = checkY(doc, y, 10, W, H);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...PRIMARY);
          doc.text('SLIDES', M, y);
          y += 5;

          post.slides.forEach((slide, si) => {
            const sTitle = typeof slide === 'string' ? slide : (slide.titulo || slide.title || '');
            const sText  = typeof slide === 'object' ? (slide.texto || slide.text || slide.content || '') : '';

            y = checkY(doc, y, 8, W, H);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...DARK);
            doc.text(`Slide ${si + 1}${sTitle ? ': ' + sTitle : ''}`, M + 4, y);
            y += 4.5;

            if (sText) {
              const stLines = doc.splitTextToSize(sText, CW - 6);
              doc.setFont('helvetica', 'normal');
              stLines.forEach(line => {
                y = checkY(doc, y, 4.5, W, H);
                doc.text(line, M + 4, y);
                y += 4;
              });
            }
          });
          y += 3;
        }

        y += 10; // gap between posts
      });
    });

  // ── Footer pass (add to all pages with correct total) ─────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    footer(doc, W, H, i, total);
  }

  // ── Save ──────────────────────────────────────────────────────
  const safeName  = clientName.replace(/[^a-z0-9]/gi, '_');
  const safeMonth = month.replace(/[^a-z0-9]/gi, '_');
  doc.save(`Planicator_${safeName}_${safeMonth}.pdf`);
}
