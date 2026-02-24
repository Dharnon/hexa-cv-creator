import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CVData, defaultCVData } from '@/types/cv';
import { CVPreview } from '@/components/cv/CVPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FileDown, FileText, Eye, Search, ArrowLeft } from 'lucide-react';
import hexaLogo from '@/assets/hexa-logo.png';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface EmployeeCV {
  user_id: string;
  full_name: string;
  email: string;
  data: CVData | null;
  updated_at: string;
}

export default function HRDashboard() {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewData, setPreviewData] = useState<CVData | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: cvs } = await supabase.from('cv_data').select('*');

    const cvMap = new Map(cvs?.map(cv => [cv.user_id, cv]) ?? []);

    const merged: EmployeeCV[] = (profiles ?? []).map(p => {
      const cv = cvMap.get(p.user_id);
      return {
        user_id: p.user_id,
        full_name: p.full_name || p.email,
        email: p.email,
        data: cv ? (cv.data as unknown as CVData) : null,
        updated_at: cv?.updated_at ?? p.created_at,
      };
    });

    setEmployees(merged);
    setLoading(false);
  };

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const exportPDF = async (cvData: CVData, name: string) => {
    setPreviewData(cvData);
    setPreviewName(name);
    // Wait for preview to render
    await new Promise(r => setTimeout(r, 300));
    const el = document.getElementById('hr-cv-preview');
    if (!el) return;
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`CV_${name.replace(/\s+/g, '_')}.pdf`);
    setPreviewData(null);
    toast.success('PDF descargado');
  };

  const exportWord = async (cvData: CVData, name: string) => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    const { saveAs } = await import('file-saver');

    const sortedExp = [...cvData.workExperience].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const sortedEdu = [...cvData.education].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const children: any[] = [];

    children.push(new Paragraph({ children: [new TextRun({ text: cvData.personalInfo.fullName || name, bold: true, size: 32 })], heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: cvData.professionalProfile.jobTitle || '', color: '3B82D6', size: 24 })] }));
    children.push(new Paragraph({ text: '' }));

    if (cvData.personalInfo.showPersonalInfo) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'INFORMACIÓN PERSONAL', bold: true, color: '3B82D6', size: 20 })] }));
      [['Email', cvData.personalInfo.email], ['Teléfono', cvData.personalInfo.phone], ['Dirección', cvData.personalInfo.address]].filter(([, v]) => v).forEach(([l, v]) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${l}: `, bold: true, size: 20 }), new TextRun({ text: v as string, size: 20 })] }));
      });
      children.push(new Paragraph({ text: '' }));
    }

    if (sortedExp.length > 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'EXPERIENCIA LABORAL', bold: true, color: '3B82D6', size: 20 })] }));
      sortedExp.forEach(exp => {
        children.push(new Paragraph({ children: [new TextRun({ text: exp.jobTitle, bold: true, size: 20 }), new TextRun({ text: ` — ${exp.company}`, size: 20 })] }));
        children.push(new Paragraph({ children: [new TextRun({ text: `${exp.startDate} — ${exp.isCurrentJob ? 'Actualidad' : exp.endDate}`, italics: true, size: 18 })] }));
        exp.responsibilities.filter(Boolean).forEach(r => {
          children.push(new Paragraph({ children: [new TextRun({ text: `• ${r}`, size: 20 })], indent: { left: 360 } }));
        });
        children.push(new Paragraph({ text: '' }));
      });
    }

    if (sortedEdu.length > 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'EDUCACIÓN Y FORMACIÓN', bold: true, color: '3B82D6', size: 20 })] }));
      sortedEdu.forEach(ed => {
        children.push(new Paragraph({ children: [new TextRun({ text: ed.qualification, bold: true, size: 20 }), new TextRun({ text: ` — ${ed.institution}`, size: 20 })] }));
        children.push(new Paragraph({ text: '' }));
      });
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CV_${name.replace(/\s+/g, '_')}.docx`);
    toast.success('Word descargado');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={hexaLogo} alt="Hexa Ingenieros" className="h-8 w-auto" />
            <div>
              <p className="font-semibold text-foreground">Panel de RRHH</p>
              <p className="text-xs text-muted-foreground">Gestión de CVs de empleados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Mi CV
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground">{filtered.length} empleados</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <div className="grid gap-4">
            {filtered.map(emp => (
              <Card key={emp.user_id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{emp.full_name}</p>
                    <p className="text-sm text-muted-foreground">{emp.email}</p>
                    {emp.data?.professionalProfile?.jobTitle && (
                      <p className="text-sm text-primary mt-0.5">{emp.data.professionalProfile.jobTitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {emp.data ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setPreviewData(emp.data); setPreviewName(emp.full_name); }}
                        >
                          <Eye className="w-4 h-4 mr-1" /> Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportPDF(emp.data!, emp.full_name)}
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportWord(emp.data!, emp.full_name)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin CV</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Preview dialog */}
      <Dialog open={!!previewData && !!previewName} onOpenChange={() => { setPreviewData(null); setPreviewName(''); }}>
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-auto">
          <DialogTitle>CV de {previewName}</DialogTitle>
          <div className="flex gap-2 mb-4">
            <Button size="sm" onClick={() => previewData && exportPDF(previewData, previewName)}>
              <FileDown className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => previewData && exportWord(previewData, previewName)}>
              <FileText className="w-4 h-4 mr-1" /> Word
            </Button>
          </div>
          {previewData && (
            <div id="hr-cv-preview">
              <CVPreview data={previewData} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
