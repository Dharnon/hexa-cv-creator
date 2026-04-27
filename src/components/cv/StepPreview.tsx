import { useCV } from '@/contexts/CVContext';
import { CVPreview } from './CVPreview';
import { CVPreviewFrame } from './CVPreviewFrame';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileDown, FileText } from 'lucide-react';
import { exportCvElementToPdf } from '@/lib/cvPdfExport';

export function StepPreview() {
  const { data, updateData } = useCV();

  const togglePersonalInfo = (v: boolean) => {
    updateData({ personalInfo: { ...data.personalInfo, showPersonalInfo: v } });
  };

  const exportPDF = async () => {
    const el = document.getElementById('cv-preview');
    if (!el) return;
    await exportCvElementToPdf(el, `CV_${data.personalInfo.fullName || 'Europass'}.pdf`);
  };

  const exportWord = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
    const { saveAs } = await import('file-saver');

    const sortedExp = [...data.workExperience].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const sortedEdu = [...data.education].sort((a, b) => b.startDate.localeCompare(a.startDate));

    const children: any[] = [];

    // Header
    children.push(new Paragraph({
      children: [new TextRun({ text: data.personalInfo.fullName || 'Nombre', bold: true, size: 32 })],
      heading: HeadingLevel.HEADING_1,
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: data.professionalProfile.jobTitle || '', color: '3B82D6', size: 24 })],
    }));
    children.push(new Paragraph({ text: '' }));

    // Personal info
    if (data.personalInfo.showPersonalInfo) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'INFORMACIÓN PERSONAL', bold: true, color: '3B82D6', size: 20 })],
      }));
      const fields = [
        ['Email', data.personalInfo.email],
        ['Teléfono', data.personalInfo.phone],
        ['Dirección', data.personalInfo.address],
        ['LinkedIn', data.personalInfo.linkedin],
        ['Nacionalidad', data.personalInfo.nationality],
      ].filter(([, v]) => v);
      fields.forEach(([label, value]) => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true, size: 20 }),
            new TextRun({ text: value as string, size: 20 }),
          ],
        }));
      });
      children.push(new Paragraph({ text: '' }));
    }

    // Summary
    if (data.professionalProfile.summary) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'PERFIL PROFESIONAL', bold: true, color: '3B82D6', size: 20 })],
      }));
      children.push(new Paragraph({ children: [new TextRun({ text: data.professionalProfile.summary, size: 20 })] }));
      children.push(new Paragraph({ text: '' }));
    }

    // Experience
    if (sortedExp.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'EXPERIENCIA LABORAL', bold: true, color: '3B82D6', size: 20 })],
      }));
      sortedExp.forEach(exp => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: exp.jobTitle, bold: true, size: 20 }),
            new TextRun({ text: ` — ${exp.company}${exp.location ? ', ' + exp.location : ''}`, size: 20 }),
          ],
        }));
        children.push(new Paragraph({
          children: [new TextRun({ text: `${exp.startDate} — ${exp.isCurrentJob ? 'Actualidad' : exp.endDate}`, italics: true, size: 18 })],
        }));
        exp.responsibilities.filter(Boolean).forEach(r => {
          children.push(new Paragraph({
            children: [new TextRun({ text: `• ${r}`, size: 20 })],
            indent: { left: 360 },
          }));
        });
        if (exp.technologies) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: 'Tecnologías: ', bold: true, size: 18 }),
              new TextRun({ text: exp.technologies, size: 18 }),
            ],
          }));
        }
        if (exp.isManager) {
          children.push(new Paragraph({
            children: [new TextRun({ text: `Responsable de equipo: ${exp.peopleManaged} personas${exp.teamDescription ? ' — ' + exp.teamDescription : ''}`, italics: true, size: 18 })],
          }));
        }
        children.push(new Paragraph({ text: '' }));
      });
    }

    // Education
    if (sortedEdu.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'EDUCACIÓN Y FORMACIÓN', bold: true, color: '3B82D6', size: 20 })],
      }));
      sortedEdu.forEach(ed => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: ed.qualification, bold: true, size: 20 }),
            new TextRun({ text: ` — ${ed.institution}`, size: 20 }),
          ],
        }));
        children.push(new Paragraph({
          children: [new TextRun({ text: `${ed.startDate} — ${ed.endDate}`, italics: true, size: 18 })],
        }));
        if (ed.subjects) {
          children.push(new Paragraph({ children: [new TextRun({ text: ed.subjects, size: 18 })] }));
        }
        children.push(new Paragraph({ text: '' }));
      });
    }

    // Competencies
    const compSections = [
      ['Competencias técnicas', data.competencies.technicalSkills],
      ['Competencias sociales', data.competencies.socialSkills],
      ['Competencias organizativas', data.competencies.organizationalSkills],
      ['Otros', data.competencies.otherSkills],
    ].filter(([, v]) => v);

    if (compSections.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'COMPETENCIAS', bold: true, color: '3B82D6', size: 20 })],
      }));
      compSections.forEach(([label, value]) => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true, size: 20 }),
            new TextRun({ text: value as string, size: 20 }),
          ],
        }));
      });
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CV_${data.personalInfo.fullName || 'Europass'}.docx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Vista Previa y Exportar</h2>
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

      <CVPreviewFrame>
        <CVPreview data={data} />
      </CVPreviewFrame>
    </div>
  );
}
