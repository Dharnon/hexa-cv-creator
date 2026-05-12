import { useCV } from '@/contexts/CVContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { Project } from '@/types/cv';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function StepProjects() {
  const { data, updateData } = useCV();
  const projects = data.projects;

  const addProject = () => {
    const newProject: Project = {
      id: generateId(),
      title: '',
      client: '',
      startDate: '',
      endDate: '',
      isOngoing: false,
      description: '',
      technologies: '',
      methodologies: '',
    };
    updateData({ projects: [...projects, newProject] });
  };

  const updateProject = (id: string, field: keyof Project, value: unknown) => {
    updateData({
      projects: projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });
  };

  const removeProject = (id: string) => {
    updateData({ projects: projects.filter((p) => p.id !== id) });
  };

  const sorted = [...projects].sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0;
    return b.startDate.localeCompare(a.startDate);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Proyectos relevantes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Proyectos que acrediten solvencia técnica en ámbitos similares a licitaciones.
          </p>
        </div>
        <Button onClick={addProject} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Añadir
        </Button>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay proyectos añadidos.</p>
          <Button onClick={addProject} variant="outline" className="mt-3">
            <Plus className="w-4 h-4 mr-1" /> Añadir proyecto
          </Button>
        </div>
      )}

      {sorted.map((proj, idx) => (
        <Card key={proj.id}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Proyecto {idx + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeProject(proj.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Título del proyecto *</Label>
              <Input
                value={proj.title}
                onChange={(e) => updateProject(proj.id, 'title', e.target.value)}
                placeholder="Ej. Dirección técnica parque fotovoltaico 150 MWp"
              />
            </div>

            <div className="space-y-2">
              <Label>Cliente / organismo (opcional)</Label>
              <Input
                value={proj.client}
                onChange={(e) => updateProject(proj.id, 'client', e.target.value)}
                placeholder="Anonimizado si aplica"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input
                  type="month"
                  value={proj.startDate}
                  onChange={(e) => updateProject(proj.id, 'startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="month"
                    value={proj.endDate}
                    onChange={(e) => updateProject(proj.id, 'endDate', e.target.value)}
                    disabled={proj.isOngoing}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Checkbox
                      checked={proj.isOngoing}
                      onCheckedChange={(v) => {
                        updateProject(proj.id, 'isOngoing', v);
                        if (v) updateProject(proj.id, 'endDate', '');
                      }}
                    />
                    <Label className="text-xs">En curso</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción / alcance</Label>
              <Textarea
                value={proj.description}
                onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                placeholder="Objeto del proyecto, rol desempeñado y resultados relevantes..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tecnologías</Label>
                <Input
                  value={proj.technologies}
                  onChange={(e) => updateProject(proj.id, 'technologies', e.target.value)}
                  placeholder="Software, normativa, equipos..."
                />
              </div>
              <div className="space-y-2">
                <Label>Metodologías</Label>
                <Input
                  value={proj.methodologies}
                  onChange={(e) => updateProject(proj.id, 'methodologies', e.target.value)}
                  placeholder="PMI, BIM, agile en obra..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
