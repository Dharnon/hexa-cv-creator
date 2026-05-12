import { useState } from 'react';
import { useCV } from '@/contexts/CVContext';
import { CVPreview } from './CVPreview';
import { CVPreviewFrame } from './CVPreviewFrame';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileDown, FileText, Trash2 } from 'lucide-react';
import { exportCvElementToPdf } from '@/lib/cvPdfExport';
import { buildCvDocxParagraphs } from '@/lib/cvDocx';
import type { ProposalRole } from '@/types/cv';

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export function StepPreview() {
  const { data, updateData } = useCV();
  const [newProposalLabel, setNewProposalLabel] = useState('');
  const [newProposalRole, setNewProposalRole] = useState<ProposalRole>('member');

  const togglePersonalInfo = (v: boolean) => {
    updateData({ personalInfo: { ...data.personalInfo, showPersonalInfo: v } });
  };

  const pp = data.proposalPresentation;

  const setActiveEntry = (id: string) => {
    updateData({ proposalPresentation: { ...pp, activeEntryId: id } });
  };

  const addProposalEntry = () => {
    const label = newProposalLabel.trim() || 'Propuesta';
    const id = generateId();
    updateData({
      proposalPresentation: {
        entries: [...pp.entries, { id, label, role: newProposalRole }],
        activeEntryId: id,
      },
    });
    setNewProposalLabel('');
    setNewProposalRole('member');
  };

  const removeProposalEntry = (id: string) => {
    if (pp.entries.length <= 1) return;
    const entries = pp.entries.filter((e) => e.id !== id);
    const activeEntryId = entries.some((e) => e.id === pp.activeEntryId)
      ? pp.activeEntryId!
      : entries[0].id;
    updateData({ proposalPresentation: { entries, activeEntryId } });
  };

  const exportPDF = async () => {
    const el = document.getElementById('cv-preview');
    if (!el) return;
    await exportCvElementToPdf(el, `CV_${data.personalInfo.fullName || 'Europass'}.pdf`);
  };

  const exportWord = async () => {
    const { Document, Packer } = await import('docx');
    const { saveAs } = await import('file-saver');
    const children = await buildCvDocxParagraphs(data);
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CV_${data.personalInfo.fullName || 'Europass'}.docx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Vista previa y exportar</h2>
          <p className="text-sm text-muted-foreground mt-1">Revisa tu CV y expórtalo</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={data.personalInfo.showPersonalInfo}
              onCheckedChange={togglePersonalInfo}
            />
            <Label className="text-sm">Info personal</Label>
          </div>
          <Button onClick={exportPDF} size="sm">
            <FileDown className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button onClick={exportWord} size="sm" variant="outline">
            <FileText className="w-4 h-4 mr-1" /> Word
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Rol en propuesta (licitación)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Define cómo te presentas en cada propuesta. Cambia el contexto activo para la vista previa y el PDF.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2 min-w-[200px] flex-1">
              <Label className="text-xs">Contexto activo</Label>
              <Select value={pp.activeEntryId ?? ''} onValueChange={setActiveEntry}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {pp.entries.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label} ({e.role === 'lead' ? 'Responsable principal' : 'Miembro'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-2 flex-1 min-w-[160px]">
              <Label className="text-xs">Nueva propuesta / licitación</Label>
              <Input
                value={newProposalLabel}
                onChange={(e) => setNewProposalLabel(e.target.value)}
                placeholder="Ej. Licitación CNMT 2025"
              />
            </div>
            <RadioGroup
              value={newProposalRole}
              onValueChange={(v) => setNewProposalRole(v as ProposalRole)}
              className="flex gap-4 py-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="lead" id="r-lead" />
                <Label htmlFor="r-lead" className="text-sm font-normal">
                  Responsable principal
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="member" id="r-member" />
                <Label htmlFor="r-member" className="text-sm font-normal">
                  Miembro del equipo
                </Label>
              </div>
            </RadioGroup>
            <Button type="button" size="sm" variant="secondary" onClick={addProposalEntry}>
              Añadir contexto
            </Button>
          </div>
          <ul className="text-sm space-y-2 border rounded-md p-3 bg-muted/30">
            {pp.entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2">
                <span>
                  <span className="font-medium">{e.label}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    — {e.role === 'lead' ? 'Responsable principal' : 'Miembro del equipo'}
                  </span>
                  {e.id === pp.activeEntryId && (
                    <span className="text-xs text-primary ml-2">(activo)</span>
                  )}
                </span>
                {pp.entries.length > 1 && (
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeProposalEntry(e.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <CVPreviewFrame>
        <CVPreview data={data} />
      </CVPreviewFrame>
    </div>
  );
}
