export async function exportCvElementToPdf(element: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidthMm = pageWidth;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  if (imgHeightMm <= pageHeight + 0.5) {
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
    pdf.save(filename);
    return;
  }

  let yMm = 0;
  let pageIndex = 0;

  while (yMm < imgHeightMm - 0.1) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const sliceHeightMm = Math.min(pageHeight, imgHeightMm - yMm);
    const srcY = (yMm / imgHeightMm) * canvas.height;
    const srcH = (sliceHeightMm / imgHeightMm) * canvas.height;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.max(1, Math.ceil(srcH));
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) {
      pdf.save(filename);
      return;
    }
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const sliceData = pageCanvas.toDataURL('image/png');
    pdf.addImage(sliceData, 'PNG', 0, 0, imgWidthMm, sliceHeightMm);

    yMm += sliceHeightMm;
    pageIndex += 1;
  }

  pdf.save(filename);
}
