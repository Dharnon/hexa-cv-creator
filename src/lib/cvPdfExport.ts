/**
 * PDF desde captura: html2canvas + jsPDF.
 * Misma anchura que A4 en el DOM; multipágina a escala 1:1.
 *
 * Cortes de página:
 * 1) Preferencia: filas donde ningún bloque `[data-pdf-atomic]` queda partido (solo entre bloques).
 * 2) Respaldo: filas con poca tinta (hueco visual), como antes.
 */

type PdfBlock = { top: number; bottom: number };

/** DOM rects suelen quedar cortos respecto al bitmap de html2canvas; margen en px de canvas para no cortar por la tinta. */
const PDF_BLOCK_BOTTOM_SLACK_PX = 8;

// #region agent log
function dbgPdf(hypothesisId: string, message: string, data: Record<string, unknown>) {
  fetch('http://127.0.0.1:7898/ingest/4cd7a7b5-6400-4980-a0d7-d0951224f4a7', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'e89795' },
    body: JSON.stringify({
      sessionId: 'e89795',
      hypothesisId,
      location: 'cvPdfExport.ts',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

function domRectRelativeToRoot(el: HTMLElement, root: HTMLElement): { top: number; bottom: number } {
  const rr = root.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  const top = er.top - rr.top + root.scrollTop;
  const bottom = er.bottom - rr.top + root.scrollTop;
  return { top, bottom };
}

function collectScaledAtomicRects(root: HTMLElement, canvasHeight: number): PdfBlock[] {
  const domHScroll = Math.max(1, root.scrollHeight);
  const domHOffset = Math.max(1, root.offsetHeight);
  const domHClient = Math.max(1, root.getBoundingClientRect().height);
  const scaleScroll = canvasHeight / domHScroll;
  const scaleOffset = canvasHeight / domHOffset;
  const scale = scaleScroll;
  const nodes = root.querySelectorAll('[data-pdf-atomic]');
  const blocks: PdfBlock[] = [];
  nodes.forEach((node) => {
    const el = node as HTMLElement;
    const r = domRectRelativeToRoot(el, root);
    const top = r.top * scale;
    const bottom = r.bottom * scale;
    if (bottom <= top + 1) return;
    blocks.push({ top: Math.floor(top), bottom: Math.ceil(bottom) });
  });
  // #region agent log
  dbgPdf('H1', 'collectScaledAtomicRects', {
    canvasHeight,
    domHScroll,
    domHOffset,
    domHClient,
    scaleScroll,
    scaleOffset,
    scaleDelta: Math.abs(scaleScroll - scaleOffset),
    atomicCount: nodes.length,
    blockCount: blocks.length,
    firstBlocks: blocks.slice(0, 4),
    lastBlocks: blocks.slice(-3),
  });
  // #endregion
  return blocks;
}

/** Corte en fila `end` (inicio de la siguiente página): ningún bloque (con margen inferior) cruza la línea. */
function isCutBetweenBlocks(end: number, blocks: PdfBlock[]): boolean {
  const s = PDF_BLOCK_BOTTOM_SLACK_PX;
  return blocks.every((b) => b.bottom + s <= end || b.top >= end);
}

function countBlockViolations(end: number, blocks: PdfBlock[]): number {
  const s = PDF_BLOCK_BOTTOM_SLACK_PX;
  return blocks.reduce((n, b) => n + (b.bottom + s <= end || b.top >= end ? 0 : 1), 0);
}

function findSliceEndDom(
  yStart: number,
  targetEnd: number,
  canvasH: number,
  blocks: PdfBlock[],
  minEnd: number,
): number | null {
  if (blocks.length === 0) return null;
  /** Buscar en todo el tramo útil; la ventana corta (~720px) omitía cortes válidos mucho más arriba (H4). */
  const lookStart = minEnd;
  for (let end = Math.floor(targetEnd); end >= lookStart; end -= 1) {
    if (end <= yStart + 2) break;
    if (isCutBetweenBlocks(end, blocks)) return end;
  }
  return null;
}

/** Bloque que empieza en esta página y sobresale del tope ideal: cortar en su `top` para moverlo entero a la siguiente página. */
function findSliceEndBeforeOverflowingBlock(
  yStart: number,
  targetEnd: number,
  blocks: PdfBlock[],
  minEnd: number,
): number | null {
  const t = Math.floor(targetEnd);
  let best: number | null = null;
  for (const b of blocks) {
    if (b.top <= yStart || b.top >= t) continue;
    if (b.bottom <= t) continue;
    const end = b.top;
    if (end < minEnd || end <= yStart + 2) continue;
    if (!isCutBetweenBlocks(end, blocks)) continue;
    if (best == null || end > best) best = end;
  }
  return best;
}

function rowInkRatioFromData(imageData: ImageData, sampleStep: number): number {
  const { data: d, width } = imageData;
  let dark = 0;
  let n = 0;
  for (let x = 0; x < width; x += sampleStep) {
    const i = x * 4;
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (lum < 250) dark += 1;
    n += 1;
  }
  return n > 0 ? dark / n : 0;
}

function buildRowInkTable(src: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Float32Array {
  const h = src.height;
  const w = src.width;
  const table = new Float32Array(h);
  for (let y = 0; y < h; y += 2) {
    const ink = rowInkRatioFromData(ctx.getImageData(0, y, w, 1), 2);
    table[y] = ink;
    if (y + 1 < h) {
      table[y + 1] = ink;
    }
  }
  return table;
}

function windowAvgInk(table: Float32Array, mid: number, half: number): number {
  let sum = 0;
  let count = 0;
  for (let y = mid - half; y <= mid + half; y += 1) {
    if (y < 0 || y >= table.length) continue;
    sum += table[y]!;
    count += 1;
  }
  return count > 0 ? sum / count : 1;
}

function findSliceEndInk(
  yStart: number,
  preferredPx: number,
  table: Float32Array,
  thresholds: readonly number[],
): number {
  const H = table.length;
  const remaining = H - yStart;
  if (remaining <= preferredPx) {
    return H;
  }

  const target = yStart + preferredPx;
  const minEnd = yStart + Math.min(remaining, Math.max(40, Math.floor(preferredPx * 0.14)));
  const lookStart = Math.max(minEnd, Math.floor(target - Math.min(400, preferredPx * 0.5)));

  for (const th of thresholds) {
    for (let end = Math.floor(target); end >= lookStart; end -= 1) {
      const mid = end - 1;
      if (windowAvgInk(table, mid, 14) < th) {
        return end;
      }
    }
  }

  return Math.floor(target);
}

function resolveSliceEnd(
  yStart: number,
  preferredPx: number,
  canvasH: number,
  blocks: PdfBlock[],
  inkTable: Float32Array,
  thresholds: readonly number[],
): { end: number; source: 'dom' | 'dom-push' | 'ink' | 'tail' } {
  const remaining = canvasH - yStart;
  if (remaining <= preferredPx) {
    return { end: canvasH, source: 'tail' };
  }

  const target = yStart + preferredPx;
  const minEnd = yStart + Math.min(remaining, Math.max(40, Math.floor(preferredPx * 0.14)));

  const domEnd = findSliceEndDom(yStart, target, canvasH, blocks, minEnd);
  if (domEnd != null) {
    return { end: domEnd, source: 'dom' };
  }

  const domLoose = findSliceEndDom(yStart, target, canvasH, blocks, yStart + 12);
  if (domLoose != null) {
    return { end: domLoose, source: 'dom' };
  }

  const pushEnd = findSliceEndBeforeOverflowingBlock(yStart, target, blocks, minEnd);
  if (pushEnd != null) {
    // #region agent log
    dbgPdf('H3', 'domPushOverflowBlock', { yStart, target, minEnd, pushEnd });
    // #endregion
    return { end: pushEnd, source: 'dom-push' };
  }

  const pushLoose = findSliceEndBeforeOverflowingBlock(yStart, target, blocks, yStart + 12);
  if (pushLoose != null) {
    // #region agent log
    dbgPdf('H3', 'domPushOverflowBlockLoose', { yStart, target, pushLoose });
    // #endregion
    return { end: pushLoose, source: 'dom-push' };
  }

  // #region agent log
  dbgPdf('H4', 'inkFallbackNoDomCut', { yStart, target, minEnd });
  // #endregion

  const inkEnd = findSliceEndInk(yStart, preferredPx, inkTable, thresholds);
  return { end: inkEnd, source: 'ink' };
}

export async function exportCvElementToPdf(element: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (_clonedDoc, referenceElement) => {
      let node: HTMLElement | null = referenceElement as HTMLElement;
      while (node) {
        node.style.overflow = 'visible';
        node.style.maxHeight = 'none';
        node.style.height = 'auto';
        node.style.minHeight = '0';
        if (node.tagName === 'BODY' || node.tagName === 'HTML') {
          node.style.backgroundColor = '#ffffff';
        }
        node = node.parentElement;
      }
    },
  });

  const srcCtx = canvas.getContext('2d');
  if (!srcCtx) {
    return;
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const imgWidthMm = pageWidthMm;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  const imgData = canvas.toDataURL('image/png');

  if (imgHeightMm <= pageHeightMm + 0.25) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
    pdf.save(filename);
    return;
  }

  const blocks = collectScaledAtomicRects(element, canvas.height);
  // #region agent log
  dbgPdf('H6', 'domCanvasSlack', { slackPx: PDF_BLOCK_BOTTOM_SLACK_PX });
  // #endregion
  const pxPerPage = Math.max(1, Math.floor((pageHeightMm / imgHeightMm) * canvas.height));
  const maxBlockH = blocks.reduce((m, b) => Math.max(m, b.bottom - b.top), 0);
  const tallBlocks = blocks.filter((b) => b.bottom - b.top > pxPerPage).length;
  // #region agent log
  dbgPdf('H3', 'pageVsBlocks', { pxPerPage, maxBlockH, tallBlocks, canvasH: canvas.height });
  // #endregion
  const inkTable = buildRowInkTable(canvas, srcCtx);
  const thresholds = [0.012, 0.022, 0.035] as const;

  let yPx = 0;
  let pageIndex = 0;

  while (yPx < canvas.height) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const preferred = Math.min(pxPerPage, canvas.height - yPx);
    const { end: endPx, source: sliceSource } = resolveSliceEnd(
      yPx,
      preferred,
      canvas.height,
      blocks,
      inkTable,
      thresholds,
    );
    const slicePx = Math.max(1, endPx - yPx);
    const violations = countBlockViolations(endPx, blocks);
    const slack = PDF_BLOCK_BOTTOM_SLACK_PX;
    const blocksSpanningCut = blocks.filter((b) => b.top < endPx && b.bottom + slack > endPx).length;
    const blocksTallerThanPreferred = blocks.filter((b) => b.bottom - b.top > preferred).length;
    // #region agent log
    dbgPdf('H2', 'pageSlice', {
      pageIndex,
      yPx,
      preferred,
      endPx,
      slicePx,
      sliceSource,
      violations,
      blocksSpanningCut,
      blocksTallerThanPreferred,
      canvasH: canvas.height,
    });
    // #endregion
    const sliceHeightMm = (slicePx / canvas.height) * imgHeightMm;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = slicePx;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) {
      break;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, yPx, canvas.width, slicePx, 0, 0, canvas.width, slicePx);

    pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidthMm, sliceHeightMm);

    yPx += slicePx;
    pageIndex += 1;
    if (pageIndex > 80) {
      break;
    }
  }

  pdf.save(filename);
}
