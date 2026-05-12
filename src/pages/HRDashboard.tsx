import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { CVData } from '@/types/cv';
import { normalizeCVData } from '@/lib/normalizeCVData';
import { CVPreview } from '@/components/cv/CVPreview';
import { CVPreviewFrame } from '@/components/cv/CVPreviewFrame';
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
import { buildCvDocxParagraphs } from '@/lib/cvDocx';

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
    try {
      const res = await apiFetch('/api/hr/employees');
      if (!res.ok) {
        toast.error('No se pudieron cargar los empleados');
        setEmployees([]);
        return;
      }
      const rows = (await res.json()) as Array<{
        user_id: string;
        full_name: string;
        email: string;
        data: CVData | null;
        updated_at: string;
      }>;

      const merged: EmployeeCV[] = rows.map((row) => ({
        user_id: row.user_id,
        full_name: row.full_name,
        email: row.email,
        data: row.data ? normalizeCVData(row.data as CVData) : null,
        updated_at: row.updated_at,
      }));

      setEmployees(merged);
    } catch {
      toast.error('Error de conexión con el servidor');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
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
    const { Document, Packer } = await import('docx');
    const { saveAs } = await import('file-saver');
    const normalized = normalizeCVData(cvData);
    const preparedData = applyGlobalPreviewOptions(normalized);
    const children = await buildCvDocxParagraphs(preparedData);
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
        <DialogContent className="grid h-[95vh] w-[min(96vw,1200px)] max-w-[1200px] grid-rows-[auto,minmax(0,1fr)] gap-3 overflow-hidden p-4 sm:p-6">
          <DialogTitle className="pr-8 text-lg">CV de {previewName}</DialogTitle>
          {previewData && (
            <CVPreviewFrame key={previewName} className="min-h-0 h-full max-h-full">
              <CVPreview data={previewData} mode="screen" />
            </CVPreviewFrame>
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
