export async function exportCvElementToPdf(element: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();

  // Pixels per mm based on canvas width <-> page width
  const pxPerMm = canvas.width / pageWidthMm;
  const pageHeightPx = Math.floor(pageHeightMm * pxPerMm);

  let renderedHeightPx = 0;
  let pageIndex = 0;

  while (renderedHeightPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) break;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0, renderedHeightPx, canvas.width, sliceHeightPx,
      0, 0, canvas.width, sliceHeightPx,
    );

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    const sliceHeightMm = sliceHeightPx / pxPerMm;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, sliceHeightMm);

    renderedHeightPx += sliceHeightPx;
    pageIndex++;
  }

  pdf.save(filename);
}
