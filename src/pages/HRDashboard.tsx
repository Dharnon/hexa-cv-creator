import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { CVData, ProposalRole } from '@/types/cv';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileDown, FileText, Eye, Search, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import hexaLogo from '@/assets/hexa-logo.png';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { exportCvElementToPdf } from '@/lib/cvPdfExport';
import { buildCvDocxParagraphs } from '@/lib/cvDocx';

const ACTIVE_TENDER_KEY = 'hexa-hr-active-tender-id';
const NONE_TENDER_VALUE = '__none__';

interface EmployeeCV {
  user_id: string;
  full_name: string;
  email: string;
  data: CVData | null;
  updated_at: string;
}

interface Tender {
  id: string;
  label: string;
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
  const [showName, setShowName] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [activeTenderId, setActiveTenderId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_TENDER_KEY);
    } catch {
      return null;
    }
  });
  const [newTenderLabel, setNewTenderLabel] = useState('');

  useEffect(() => {
    loadEmployees();
    loadTenders();
  }, []);

  useEffect(() => {
    try {
      if (activeTenderId) {
        localStorage.setItem(ACTIVE_TENDER_KEY, activeTenderId);
      } else {
        localStorage.removeItem(ACTIVE_TENDER_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [activeTenderId]);

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

  const loadTenders = async () => {
    try {
      const res = await apiFetch('/api/tenders');
      if (!res.ok) {
        setTenders([]);
        return;
      }
      const rows = (await res.json()) as Tender[];
      setTenders(rows);
      if (activeTenderId && !rows.some((t) => t.id === activeTenderId)) {
        setActiveTenderId(null);
      }
    } catch {
      setTenders([]);
    }
  };

  const addTender = async () => {
    const label = newTenderLabel.trim();
    if (!label) return;
    try {
      const res = await apiFetch('/api/tenders', {
        method: 'POST',
        body: JSON.stringify({ label }),
      });
      if (!res.ok) {
        toast.error('No se pudo crear la licitación');
        return;
      }
      const created = (await res.json()) as Tender;
      setTenders((prev) => [...prev, created].sort((a, b) => a.label.localeCompare(b.label)));
      setActiveTenderId(created.id);
      setNewTenderLabel('');
    } catch {
      toast.error('Error de conexión con el servidor');
    }
  };

  const deleteTender = async (id: string) => {
    try {
      const res = await apiFetch(`/api/tenders/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('No se pudo eliminar la licitación');
        return;
      }
      setTenders((prev) => prev.filter((t) => t.id !== id));
      if (activeTenderId === id) setActiveTenderId(null);
    } catch {
      toast.error('Error de conexión con el servidor');
    }
  };

  const updateEmployeeRole = async (userId: string, role: ProposalRole) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.user_id === userId && e.data ? { ...e, data: { ...e.data, role } } : e,
      ),
    );
    try {
      const res = await apiFetch(`/api/hr/employees/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        toast.error('No se pudo actualizar el rol');
        await loadEmployees();
      }
    } catch {
      toast.error('Error de conexión con el servidor');
      await loadEmployees();
    }
  };

  const filtered = employees.filter(
    (employee) =>
      employee.full_name.toLowerCase().includes(search.toLowerCase()) ||
      employee.email.toLowerCase().includes(search.toLowerCase()),
  );

  const activeTenderLabel = useMemo(
    () => tenders.find((t) => t.id === activeTenderId)?.label,
    [tenders, activeTenderId],
  );

  const exportPDF = async (cvData: CVData, name: string) => {
    const normalized = normalizeCVData(cvData);
    setPdfRenderData(normalized);

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
    const children = await buildCvDocxParagraphs(normalized, {
      showName,
      tenderLabel: activeTenderLabel,
    });
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
              <CardContent className="space-y-4 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Opciones globales de visualización</p>
                  <p className="text-xs text-muted-foreground">
                    Se aplican a la vista previa y a las descargas PDF/Word. El rol se gestiona por empleado abajo.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Licitación activa</Label>
                    <Select
                      value={activeTenderId ?? NONE_TENDER_VALUE}
                      onValueChange={(v) => setActiveTenderId(v === NONE_TENDER_VALUE ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin licitación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_TENDER_VALUE}>Sin licitación</SelectItem>
                        {tenders.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-3">
                    <Switch checked={showName} onCheckedChange={setShowName} />
                    <Label>Mostrar nombre en cabecera</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Nueva licitación</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={newTenderLabel}
                      onChange={(e) => setNewTenderLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void addTender();
                        }
                      }}
                      placeholder="Ej. Licitación CNMT 2026"
                      className="max-w-md flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void addTender()}
                      disabled={!newTenderLabel.trim()}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Añadir
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Rol:</Label>
                    {(['auto', 'principal', 'miembro'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          setGlobalPreviewOptions((current) => ({ ...current, projectRole: r }))
                        }
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          globalPreviewOptions.projectRole === r
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:border-primary/40'
                        }`}
                      >
                        {r === 'auto' ? 'Por CV' : r === 'principal' ? 'Responsable' : 'Miembro'}
                      </button>
                    ))}
                  </div>
                </div>

                {tenders.length > 0 && (
                  <ul className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
                    {tenders.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2">
                        <span>
                          <span className="font-medium">{t.label}</span>
                          {t.id === activeTenderId && (
                            <span className="ml-2 text-xs text-primary">(activa)</span>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => void deleteTender(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : (
              <div className="grid gap-4">
                {filtered.map((employee) => (
                  <Card key={employee.user_id} className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{employee.full_name}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        {employee.data?.professionalProfile?.jobTitle && (
                          <p className="mt-0.5 text-sm text-primary">
                            {employee.data.professionalProfile.jobTitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {employee.data && (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={employee.data.role === 'lead'}
                              onCheckedChange={(v) =>
                                void updateEmployeeRole(employee.user_id, v ? 'lead' : 'member')
                              }
                            />
                            <Label className="text-xs whitespace-nowrap">
                              {employee.data.role === 'lead' ? 'Responsable' : 'Miembro'}
                            </Label>
                          </div>
                        )}
                        {employee.data ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewData(normalizeCVData(employee.data!));
                              setPreviewName(employee.full_name);
                            }}
                          >
                            <Eye className="mr-1 h-4 w-4" /> Ver / exportar
                          </Button>
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
        <DialogContent className="grid h-[95vh] w-[min(96vw,1200px)] max-w-[1200px] grid-rows-[auto,auto,minmax(0,1fr)] gap-3 overflow-hidden p-4 sm:p-6">
          <DialogTitle className="pr-8 text-lg">CV de {previewName}</DialogTitle>
          {previewData && (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b pb-3">
                <span className="text-xs text-muted-foreground mr-2">
                  Descarga con la licitación activa{activeTenderLabel ? ` "${activeTenderLabel}"` : ''}:
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    void exportPDF(previewData, previewName);
                  }}
                >
                  <FileDown className="mr-1 h-4 w-4" /> PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void exportWord(previewData, previewName);
                  }}
                >
                  <FileText className="mr-1 h-4 w-4" /> Word
                </Button>
              </div>
              <CVPreviewFrame key={previewName} className="min-h-0 h-full max-h-full overflow-auto">
                <CVPreview
                  data={previewData}
                  mode="screen"
                  showName={showName}
                  tenderLabel={activeTenderLabel}
                />
              </CVPreviewFrame>
            </>
          )}
        </DialogContent>
      </Dialog>
      {pdfRenderData && (
        <div style={{ position: 'fixed', left: '-10000px', top: 0, width: '210mm', background: '#fff' }}>
          <div id="pdf-export-preview">
            <CVPreview
              data={pdfRenderData}
              mode="export"
              showName={showName}
              tenderLabel={activeTenderLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
