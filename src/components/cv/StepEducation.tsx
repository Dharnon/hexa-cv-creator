import { useCV } from '@/contexts/CVContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Education } from '@/types/cv';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function StepEducation() {
  const { data, updateData } = useCV();
  const entries = data.education;

  const addEntry = () => {
    const newEd: Education = {
      id: generateId(),
      startDate: '',
      endDate: '',
      qualification: '',
      institution: '',
      subjects: '',
      level: '',
    };
    updateData({ education: [...entries, newEd] });
  };

  const updateEntry = (id: string, field: string, value: string) => {
    updateData({
      education: entries.map(e => e.id === id ? { ...e, [field]: value } : e),
    });
  };

  const removeEntry = (id: string) => {
    updateData({ education: entries.filter(e => e.id !== id) });
  };

  const sorted = [...entries].sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0;
    return b.startDate.localeCompare(a.startDate);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Educación y Formación</h2>
          <p className="text-sm text-muted-foreground mt-1">Ordenado automáticamente por fecha</p>
        </div>
        <Button onClick={addEntry} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Añadir
        </Button>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay formación añadida.</p>
          <Button onClick={addEntry} variant="outline" className="mt-3">
            <Plus className="w-4 h-4 mr-1" /> Añadir formación
          </Button>
        </div>
      )}

      {sorted.map((ed, idx) => (
        <Card key={ed.id}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Formación {idx + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeEntry(ed.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input type="month" value={ed.startDate} onChange={(e) => updateEntry(ed.id, 'startDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input type="month" value={ed.endDate} onChange={(e) => updateEntry(ed.id, 'endDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Titulación *</Label>
                <Input value={ed.qualification} onChange={(e) => updateEntry(ed.id, 'qualification', e.target.value)} placeholder="Grado en Ingeniería Industrial" />
              </div>
              <div className="space-y-2">
                <Label>Centro *</Label>
                <Input value={ed.institution} onChange={(e) => updateEntry(ed.id, 'institution', e.target.value)} placeholder="Universidad Politécnica de Madrid" />
              </div>
              <div className="space-y-2">
                <Label>Materias principales</Label>
                <Input value={ed.subjects} onChange={(e) => updateEntry(ed.id, 'subjects', e.target.value)} placeholder="Termodinámica, Mecánica de Fluidos..." />
              </div>
              <div className="space-y-2">
                <Label>Nivel (CINE/EQF)</Label>
                <Input value={ed.level} onChange={(e) => updateEntry(ed.id, 'level', e.target.value)} placeholder="Nivel 6 (Grado)" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
