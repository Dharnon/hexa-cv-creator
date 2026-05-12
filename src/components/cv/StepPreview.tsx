import { useCV } from '@/contexts/CVContext';
import { CVPreview } from './CVPreview';
import { CVPreviewFrame } from './CVPreviewFrame';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileDown, FileText } from 'lucide-react';
import { exportCvElementToPdf } from '@/lib/cvPdfExport';
import { buildCvDocxParagraphs } from '@/lib/cvDocx';
import { ProposalRole } from '@/types/cv';
import { cn } from '@/lib/utils';

export function StepPreview() {
  const { data, updateData } = useCV();
  const role = data.role;

  const setRole = (r: ProposalRole) => updateData({ role: r });

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

      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/40">
        <Label className="text-sm font-semibold">Rol en este proyecto:</Label>
        {(['lead', 'member'] as ProposalRole[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
              role === r
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:border-primary/40',
            )}
          >
            {r === 'lead' ? 'Responsable principal' : 'Miembro del equipo'}
          </button>
        ))}
        <span className="text-xs text-muted-foreground">Cámbialo antes de exportar para distintas licitaciones.</span>
      </div>

      <CVPreviewFrame>
        <CVPreview data={data} />
      </CVPreviewFrame>
    </div>
  );
}

