import { useCV } from '@/contexts/CVContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Project } from '@/types/cv';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function StepProjects() {
  const { data, updateData } = useCV();
  const projects = data.projects ?? [];

  const addProject = () => {
    const p: Project = {
      id: generateId(),
      name: '',
      client: '',
      sector: '',
      role: '',
      startDate: '',
      endDate: '',
      technologies: '',
      description: '',
    };
    updateData({ projects: [...projects, p] });
  };

  const updateProject = (id: string, field: string, value: string) => {
    updateData({ projects: projects.map(p => p.id === id ? { ...p, [field]: value } : p) });
  };

  const removeProject = (id: string) => {
    updateData({ projects: projects.filter(p => p.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Proyectos</h2>
          <p className="text-sm text-muted-foreground mt-1">Para justificar solvencia técnica en licitaciones</p>
        </div>
        <Button onClick={addProject} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Añadir
        </Button>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay proyectos añadidos.</p>
        </div>
      )}

      {projects.map((p, i) => (
        <Card key={p.id}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Proyecto {i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeProject(p.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del proyecto *</Label>
                <Input value={p.name} onChange={(e) => updateProject(p.id, 'name', e.target.value)} placeholder="Planta fotovoltaica 50MW" />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input value={p.client} onChange={(e) => updateProject(p.id, 'client', e.target.value)} placeholder="CNMT, Iberdrola..." />
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Input value={p.sector} onChange={(e) => updateProject(p.id, 'sector', e.target.value)} placeholder="Energía, Industria..." />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Input value={p.role} onChange={(e) => updateProject(p.id, 'role', e.target.value)} placeholder="Responsable principal / Miembro del equipo" />
              </div>
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input type="month" value={p.startDate} onChange={(e) => updateProject(p.id, 'startDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input type="month" value={p.endDate} onChange={(e) => updateProject(p.id, 'endDate', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tecnologías</Label>
              <Input value={p.technologies} onChange={(e) => updateProject(p.id, 'technologies', e.target.value)} placeholder="AutoCAD, PVsyst, SAP..." />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={p.description}
                onChange={(e) => updateProject(p.id, 'description', e.target.value)}
                placeholder="Descripción breve del proyecto, alcance y resultados."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
