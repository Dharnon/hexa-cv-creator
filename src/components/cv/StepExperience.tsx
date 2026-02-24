import { useCV } from '@/contexts/CVContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { WorkExperience } from '@/types/cv';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function StepExperience() {
  const { data, updateData } = useCV();
  const experiences = data.workExperience;

  const addExperience = () => {
    const newExp: WorkExperience = {
      id: generateId(),
      startDate: '',
      endDate: '',
      isCurrentJob: false,
      jobTitle: '',
      company: '',
      location: '',
      responsibilities: [''],
      technologies: '',
      sector: '',
      isManager: false,
      peopleManaged: 0,
      teamDescription: '',
    };
    updateData({ workExperience: [...experiences, newExp] });
  };

  const updateExp = (id: string, field: string, value: any) => {
    updateData({
      workExperience: experiences.map(e =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    });
  };

  const removeExp = (id: string) => {
    updateData({ workExperience: experiences.filter(e => e.id !== id) });
  };

  const updateResponsibility = (expId: string, index: number, value: string) => {
    const exp = experiences.find(e => e.id === expId);
    if (!exp) return;
    const newResp = [...exp.responsibilities];
    newResp[index] = value;
    updateExp(expId, 'responsibilities', newResp);
  };

  const addResponsibility = (expId: string) => {
    const exp = experiences.find(e => e.id === expId);
    if (!exp) return;
    updateExp(expId, 'responsibilities', [...exp.responsibilities, '']);
  };

  const removeResponsibility = (expId: string, index: number) => {
    const exp = experiences.find(e => e.id === expId);
    if (!exp) return;
    updateExp(expId, 'responsibilities', exp.responsibilities.filter((_, i) => i !== index));
  };

  // Auto-sort by start date descending
  const sortedExperiences = [...experiences].sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0;
    return b.startDate.localeCompare(a.startDate);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Experiencia Laboral</h2>
          <p className="text-sm text-muted-foreground mt-1">Se ordena automáticamente por fecha (más reciente primero)</p>
        </div>
        <Button onClick={addExperience} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Añadir
        </Button>
      </div>

      {sortedExperiences.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay experiencias añadidas.</p>
          <Button onClick={addExperience} variant="outline" className="mt-3">
            <Plus className="w-4 h-4 mr-1" /> Añadir experiencia
          </Button>
        </div>
      )}

      {sortedExperiences.map((exp, idx) => (
        <Card key={exp.id}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Experiencia {idx + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeExp(exp.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio *</Label>
                <Input type="month" value={exp.startDate} onChange={(e) => updateExp(exp.id, 'startDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="month"
                    value={exp.endDate}
                    onChange={(e) => updateExp(exp.id, 'endDate', e.target.value)}
                    disabled={exp.isCurrentJob}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Checkbox
                      checked={exp.isCurrentJob}
                      onCheckedChange={(v) => {
                        updateExp(exp.id, 'isCurrentJob', v);
                        if (v) updateExp(exp.id, 'endDate', '');
                      }}
                    />
                    <Label className="text-xs">Actualidad</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Puesto *</Label>
                <Input value={exp.jobTitle} onChange={(e) => updateExp(exp.id, 'jobTitle', e.target.value)} placeholder="Ingeniero de Proyectos" />
              </div>
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Input value={exp.company} onChange={(e) => updateExp(exp.id, 'company', e.target.value)} placeholder="Hexa Ingenieros" />
              </div>
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input value={exp.location} onChange={(e) => updateExp(exp.id, 'location', e.target.value)} placeholder="Madrid, España" />
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Input value={exp.sector} onChange={(e) => updateExp(exp.id, 'sector', e.target.value)} placeholder="Ingeniería / Energía" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tecnologías / Herramientas</Label>
              <Input value={exp.technologies} onChange={(e) => updateExp(exp.id, 'technologies', e.target.value)} placeholder="AutoCAD, MS Project, SAP..." />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Responsabilidades</Label>
                <Button variant="ghost" size="sm" onClick={() => addResponsibility(exp.id)}>
                  <Plus className="w-3 h-3 mr-1" /> Añadir
                </Button>
              </div>
              {exp.responsibilities.map((resp, ri) => (
                <div key={ri} className="flex gap-2">
                  <Input
                    value={resp}
                    onChange={(e) => updateResponsibility(exp.id, ri, e.target.value)}
                    placeholder="Descripción de la responsabilidad..."
                  />
                  {exp.responsibilities.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeResponsibility(exp.id, ri)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Switch
                checked={exp.isManager}
                onCheckedChange={(v) => updateExp(exp.id, 'isManager', v)}
              />
              <Label className="text-sm">Puesto de responsable / gestión de equipo</Label>
            </div>

            {exp.isManager && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label>Personas a cargo</Label>
                  <Input
                    type="number"
                    min={0}
                    value={exp.peopleManaged}
                    onChange={(e) => updateExp(exp.id, 'peopleManaged', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción del equipo</Label>
                  <Input
                    value={exp.teamDescription}
                    onChange={(e) => updateExp(exp.id, 'teamDescription', e.target.value)}
                    placeholder="Equipo multidisciplinar de ingeniería..."
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
