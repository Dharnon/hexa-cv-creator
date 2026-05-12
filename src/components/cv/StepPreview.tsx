import { useCV } from '@/contexts/CVContext';
import { CVPreview } from './CVPreview';
import { CVPreviewFrame } from './CVPreviewFrame';
import { Button } from '@/components/ui/button';
import { FileDown, FileText } from 'lucide-react';
import { exportCvElementToPdf } from '@/lib/cvPdfExport';
import { buildCvDocxParagraphs } from '@/lib/cvDocx';

export function StepPreview() {
  const { data } = useCV();

  const exportPDF = async () => {
    const el = document.getElementById('cv-preview');
    if (!el) return;
    await exportCvElementToPdf(el, `CV_${data.professionalProfile.fullName || 'Europass'}.pdf`);
  };

  const exportWord = async () => {
    const { Document, Packer } = await import('docx');
    const { saveAs } = await import('file-saver');
    const children = await buildCvDocxParagraphs(data);
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CV_${data.professionalProfile.fullName || 'Europass'}.docx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Vista previa y exportar</h2>
          <p className="text-sm text-muted-foreground mt-1">Revisa tu CV y expórtalo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportPDF} size="sm">
            <FileDown className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button onClick={exportWord} size="sm" variant="outline">
            <FileText className="w-4 h-4 mr-1" /> Word
          </Button>
        </div>
      </div>

      <CVPreviewFrame>
        <CVPreview data={data} />
      </CVPreviewFrame>
    </div>
  );
}
