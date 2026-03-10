import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CVData } from '@/types/cv';
import { CVPreview } from '@/components/cv/CVPreview';
import { SapUserReportSection } from '@/components/hr/SapUserReportSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: cvs } = await supabase.from('cv_data').select('*');

    const cvMap = new Map(cvs?.map((cv) => [cv.user_id, cv]) ?? []);

    const merged: EmployeeCV[] = (profiles ?? []).map((profile) => {
      const cv = cvMap.get(profile.user_id);
      return {
        user_id: profile.user_id,
        full_name: profile.full_name || profile.email,
        email: profile.email,
        data: cv ? (cv.data as unknown as CVData) : null,
        updated_at: cv?.updated_at ?? profile.created_at,
      };
    });

    setEmployees(merged);
    setLoading(false);
  };

  const filtered = employees.filter(
    (employee) =>
      employee.full_name.toLowerCase().includes(search.toLowerCase()) ||
      employee.email.toLowerCase().includes(search.toLowerCase()),
  );

  const exportPDF = async (cvData: CVData, name: string) => {
    setPreviewData(cvData);
    setPreviewName(name);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const element = document.getElementById('hr-cv-preview');
    if (!element) {
      return;
    }

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`CV_${name.replace(/\s+/g, '_')}.pdf`);
    setPreviewData(null);
    toast.success('PDF descargado');
  };

  const exportWord = async (cvData: CVData, name: string) => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    const { saveAs } = await import('file-saver');

    const sortedExperience = [...cvData.workExperience].sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
    const sortedEducation = [...cvData.education].sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: cvData.personalInfo.fullName || name, bold: true, size: 32 }),
        ],
        heading: HeadingLevel.HEADING_1,
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.professionalProfile.jobTitle || '',
            color: '3B82D6',
            size: 24,
          }),
        ],
      }),
    );
    children.push(new Paragraph({ text: '' }));

    if (cvData.personalInfo.showPersonalInfo) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'INFORMACION PERSONAL', bold: true, color: '3B82D6', size: 20 }),
          ],
        }),
      );
      [['Email', cvData.personalInfo.email], ['Telefono', cvData.personalInfo.phone], ['Direccion', cvData.personalInfo.address]]
        .filter(([, value]) => value)
        .forEach(([label, value]) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${label}: `, bold: true, size: 20 }),
                new TextRun({ text: value as string, size: 20 }),
              ],
            }),
          );
        });
      children.push(new Paragraph({ text: '' }));
    }

    if (sortedExperience.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'EXPERIENCIA LABORAL', bold: true, color: '3B82D6', size: 20 }),
          ],
        }),
      );
      sortedExperience.forEach((experience) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: experience.jobTitle, bold: true, size: 20 }),
              new TextRun({ text: ` - ${experience.company}`, size: 20 }),
            ],
          }),
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${experience.startDate} - ${experience.isCurrentJob ? 'Actualidad' : experience.endDate}`,
                italics: true,
                size: 18,
              }),
            ],
          }),
        );
        experience.responsibilities.filter(Boolean).forEach((responsibility) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `- ${responsibility}`, size: 20 })],
              indent: { left: 360 },
            }),
          );
        });
        children.push(new Paragraph({ text: '' }));
      });
    }

    if (sortedEducation.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'EDUCACION Y FORMACION', bold: true, color: '3B82D6', size: 20 }),
          ],
        }),
      );
      sortedEducation.forEach((education) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: education.qualification, bold: true, size: 20 }),
              new TextRun({ text: ` - ${education.institution}`, size: 20 }),
            ],
          }),
        );
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={hexaLogo} alt="Hexa Ingenieros" className="h-8 w-auto" />
            <div>
              <p className="font-semibold text-foreground">Panel de RRHH</p>
              <p className="text-xs text-muted-foreground">Gestion de CVs y reportes SAP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Mi CV
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              Cerrar sesion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Tabs defaultValue="cvs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cvs">CVs</TabsTrigger>
            <TabsTrigger value="sap">SAP</TabsTrigger>
          </TabsList>

          <TabsContent value="cvs" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">{filtered.length} empleados</p>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : (
              <div className="grid gap-4">
                {filtered.map((employee) => (
                  <Card key={employee.user_id} className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{employee.full_name}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        {employee.data?.professionalProfile?.jobTitle && (
                          <p className="mt-0.5 text-sm text-primary">
                            {employee.data.professionalProfile.jobTitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {employee.data ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPreviewData(employee.data);
                                setPreviewName(employee.full_name);
                              }}
                            >
                              <Eye className="mr-1 h-4 w-4" /> Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportPDF(employee.data!, employee.full_name)}
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportWord(employee.data!, employee.full_name)}
                            >
                              <FileText className="h-4 w-4" />
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
          </TabsContent>

          <TabsContent value="sap">
            <SapUserReportSection />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog
        open={!!previewData && !!previewName}
        onOpenChange={() => {
          setPreviewData(null);
          setPreviewName('');
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[900px] overflow-auto">
          <DialogTitle>CV de {previewName}</DialogTitle>
          <div className="mb-4 flex gap-2">
            <Button size="sm" onClick={() => previewData && exportPDF(previewData, previewName)}>
              <FileDown className="mr-1 h-4 w-4" /> PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => previewData && exportWord(previewData, previewName)}
            >
              <FileText className="mr-1 h-4 w-4" /> Word
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
