import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CVData } from '@/types/cv';
import { CVPreview } from '@/components/cv/CVPreview';
import { SapUserReportSection } from '@/components/hr/SapUserReportSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, FileText, Eye, Search, ArrowLeft } from 'lucide-react';
import hexaLogo from '@/assets/hexa-logo.png';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { exportCvElementToPdf } from '@/lib/cvPdfExport';

interface EmployeeCV {
  user_id: string;
  full_name: string;
  email: string;
  data: CVData | null;
  updated_at: string;
}

function FitToScreenPreview({ children }: { children: React.ReactNode }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const updateScale = () => {
      const viewportWidth = viewport.clientWidth;
      const viewportHeight = viewport.clientHeight;
      const contentWidth = content.offsetWidth;
      const contentHeight = content.offsetHeight;

      if (!viewportWidth || !viewportHeight || !contentWidth || !contentHeight) return;

      const a4HeightForWidth = contentWidth * (297 / 210);
      const scaleReferenceHeight = Math.min(contentHeight, a4HeightForWidth);
      const nextScale = Math.min(
        viewportWidth / contentWidth,
        viewportHeight / scaleReferenceHeight,
        1,
      );
      setScale(nextScale);
      setContentSize({ width: contentWidth, height: contentHeight });
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    observer.observe(content);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [children]);

  return (
    <div ref={viewportRef} className="relative flex-1 overflow-auto rounded-md border bg-muted/20 p-3">
      <div
        className="mx-auto"
        style={{
          width: contentSize.width ? contentSize.width * scale : undefined,
          height: contentSize.height ? contentSize.height * scale : undefined,
        }}
      >
        <div
          ref={contentRef}
          className="origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function normalizeCVData(cvData: CVData): CVData {
  return {
    ...cvData,
    personalInfo: {
      ...cvData.personalInfo,
      showName: cvData.personalInfo.showName ?? true,
      showPersonalInfo: cvData.personalInfo.showPersonalInfo ?? true,
    },
  };
}

export default function HRDashboard() {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewData, setPreviewData] = useState<CVData | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [pdfRenderData, setPdfRenderData] = useState<CVData | null>(null);
  const [globalPreviewOptions, setGlobalPreviewOptions] = useState({
    showName: true,
    showPersonalInfo: true,
  });

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
        data: cv ? normalizeCVData(cv.data as unknown as CVData) : null,
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

  const applyGlobalPreviewOptions = (cvData: CVData): CVData => ({
    ...cvData,
    personalInfo: {
      ...cvData.personalInfo,
      showName: globalPreviewOptions.showName,
      showPersonalInfo: globalPreviewOptions.showPersonalInfo,
    },
  });

  const exportPDF = async (cvData: CVData, name: string) => {
    const normalized = normalizeCVData(cvData);
    const preparedData = applyGlobalPreviewOptions(normalized);
    setPdfRenderData(preparedData);

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

    const element = document.getElementById('pdf-export-preview');
    if (!element) return;

    try {
      await exportCvElementToPdf(element, `CV_${name.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF descargado');
    } finally {
      setPdfRenderData(null);
    }
  };

  const exportWord = async (cvData: CVData, name: string) => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    const { saveAs } = await import('file-saver');
    const normalized = normalizeCVData(cvData);
    const preparedData = applyGlobalPreviewOptions(normalized);

    const sortedExperience = [...preparedData.workExperience].sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
    const sortedEducation = [...preparedData.education].sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    );
    const children: InstanceType<typeof Paragraph>[] = [];

    if (preparedData.personalInfo.showName) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: preparedData.personalInfo.fullName || name, bold: true, size: 32 }),
          ],
          heading: HeadingLevel.HEADING_1,
        }),
      );
    }
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: preparedData.professionalProfile.jobTitle || '',
            color: '3B82D6',
            size: 24,
          }),
        ],
      }),
    );
    children.push(new Paragraph({ text: '' }));

    if (preparedData.personalInfo.showPersonalInfo) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'INFORMACION PERSONAL', bold: true, color: '3B82D6', size: 20 }),
          ],
        }),
      );
      [['Email', preparedData.personalInfo.email], ['Telefono', preparedData.personalInfo.phone], ['Direccion', preparedData.personalInfo.address]]
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
            <Card>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Opciones globales de visualizacion</p>
                  <p className="text-xs text-muted-foreground">
                    Se aplican para todos al abrir vista previa y descargar PDF/Word.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={globalPreviewOptions.showName}
                      onCheckedChange={(value) =>
                        setGlobalPreviewOptions((current) => ({ ...current, showName: value }))
                      }
                    />
                    <Label>Mostrar nombre en cabecera</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={globalPreviewOptions.showPersonalInfo}
                      onCheckedChange={(value) =>
                        setGlobalPreviewOptions((current) => ({
                          ...current,
                          showPersonalInfo: value,
                        }))
                      }
                    />
                    <Label>Mostrar informacion personal</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                                const normalized = normalizeCVData(employee.data);
                                setPreviewData(applyGlobalPreviewOptions(normalized));
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
        <DialogContent className="grid h-[95vh] max-w-[1100px] grid-rows-[auto,minmax(0,1fr)] gap-3 overflow-hidden p-4 sm:p-6">
          <DialogTitle>CV de {previewName}</DialogTitle>
          {previewData && (
            <FitToScreenPreview>
              <div id="hr-cv-preview">
                <CVPreview data={previewData} mode="export" />
              </div>
            </FitToScreenPreview>
          )}
        </DialogContent>
      </Dialog>
      {pdfRenderData && (
        <div style={{ position: 'fixed', left: '-10000px', top: 0, width: '210mm', background: '#fff' }}>
          <div id="pdf-export-preview">
            <CVPreview data={pdfRenderData} mode="export" />
          </div>
        </div>
      )}
    </div>
  );
}
