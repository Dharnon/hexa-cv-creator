import { useCV } from '@/contexts/CVContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { Language, LanguageLevel } from '@/types/cv';

const LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function LevelSelect({ value, onChange }: { value: LanguageLevel; onChange: (v: LanguageLevel) => void }) {
  return (
    <Select value={value || undefined} onValueChange={(v) => onChange(v as LanguageLevel)}>
      <SelectTrigger className="w-20 h-8 text-xs">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {LEVELS.map((l) => (
          <SelectItem key={l} value={l}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StepCompetencies() {
  const { data, updateData } = useCV();
  const comp = data.competencies;
  const misc = data.othersMisc;

  const updateComp = (field: string, value: unknown) => {
    updateData({ competencies: { ...comp, [field]: value } });
  };

  const updateMisc = (field: string, value: unknown) => {
    updateData({ othersMisc: { ...misc, [field]: value } });
  };

  const addLanguage = () => {
    const newLang: Language = {
      id: generateId(),
      name: '',
      listening: '',
      reading: '',
      spokenInteraction: '',
      spokenProduction: '',
      writing: '',
    };
    updateComp('languages', [...comp.languages, newLang]);
  };

  const updateLang = (id: string, field: string, value: unknown) => {
    updateComp(
      'languages',
      comp.languages.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    );
  };

  const removeLang = (id: string) => {
    updateComp(
      'languages',
      comp.languages.filter((l) => l.id !== id),
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Capacidades, idiomas y otros</h2>
        <p className="text-sm text-muted-foreground mt-1">Idiomas (Europass), capacidades por tipo y sección «Otros» para licitaciones.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-medium text-foreground">Idiomas</h3>
        <div className="space-y-2">
          <Label>Lengua materna</Label>
          <Input
            value={comp.motherTongue}
            onChange={(e) => updateComp('motherTongue', e.target.value)}
            placeholder="Español"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Otros idiomas</Label>
          <Button variant="outline" size="sm" onClick={addLanguage}>
            <Plus className="w-3 h-3 mr-1" /> Añadir idioma
          </Button>
        </div>

        {comp.languages.map((lang) => (
          <Card key={lang.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  value={lang.name}
                  onChange={(e) => updateLang(lang.id, 'name', e.target.value)}
                  placeholder="Inglés"
                  className="w-48"
                />
                <Button variant="ghost" size="icon" onClick={() => removeLang(lang.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Comprensión</Label>
                  <LevelSelect value={lang.listening} onChange={(v) => updateLang(lang.id, 'listening', v)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Lectura</Label>
                  <LevelSelect value={lang.reading} onChange={(v) => updateLang(lang.id, 'reading', v)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Interacción oral</Label>
                  <LevelSelect value={lang.spokenInteraction} onChange={(v) => updateLang(lang.id, 'spokenInteraction', v)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Expresión oral</Label>
                  <LevelSelect value={lang.spokenProduction} onChange={(v) => updateLang(lang.id, 'spokenProduction', v)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Escritura</Label>
                  <LevelSelect value={lang.writing} onChange={(v) => updateLang(lang.id, 'writing', v)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4 border-t pt-8">
        <h3 className="text-base font-medium text-foreground">Capacidades y competencias</h3>
        <div className="space-y-2">
          <Label>Técnicas</Label>
          <Textarea
            value={comp.technicalSkills}
            onChange={(e) => updateComp('technicalSkills', e.target.value)}
            placeholder="Certificaciones, software, normativa..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Sociales</Label>
          <Textarea
            value={comp.socialSkills}
            onChange={(e) => updateComp('socialSkills', e.target.value)}
            placeholder="Comunicación, trabajo en equipo..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Organizativas</Label>
          <Textarea
            value={comp.organizationalSkills}
            onChange={(e) => updateComp('organizationalSkills', e.target.value)}
            placeholder="Gestión de proyectos, coordinación..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Otras capacidades</Label>
          <Textarea
            value={comp.otherSkills}
            onChange={(e) => updateComp('otherSkills', e.target.value)}
            placeholder="Cualquier competencia transversal adicional..."
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-8">
        <h3 className="text-base font-medium text-foreground">Otros</h3>
        <p className="text-sm text-muted-foreground">
          Permiso de conducir, disponibilidad para viajar, voluntariado y notas adicionales para el cliente.
        </p>
        <div className="space-y-2">
          <Label>Permiso de conducir</Label>
          <Input
            value={misc.drivingLicense}
            onChange={(e) => updateMisc('drivingLicense', e.target.value)}
            placeholder="B, C, etc."
          />
        </div>
        <div className="space-y-2">
          <Label>Disponibilidad para viajar</Label>
          <Textarea
            value={misc.travelAvailability}
            onChange={(e) => updateMisc('travelAvailability', e.target.value)}
            placeholder="Nacional / internacional, preaviso..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Voluntariado</Label>
          <Textarea
            value={misc.volunteering}
            onChange={(e) => updateMisc('volunteering', e.target.value)}
            placeholder="ONG, mentoring..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Notas adicionales</Label>
          <Textarea
            value={misc.extraNotes}
            onChange={(e) => updateMisc('extraNotes', e.target.value)}
            placeholder="Cualquier otro dato relevante..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
