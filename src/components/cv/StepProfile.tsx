import { useCV } from '@/contexts/CVContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function StepProfile() {
  const { data, updateData } = useCV();
  const profile = data.professionalProfile;

  const update = (field: string, value: string) => {
    updateData({ professionalProfile: { ...profile, [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Puesto / Perfil Profesional</h2>
        <p className="text-sm text-muted-foreground mt-1">Puesto al que aplica y resumen profesional</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Puesto solicitado *</Label>
          <Input
            value={profile.jobTitle}
            onChange={(e) => update('jobTitle', e.target.value)}
            placeholder="Ingeniero de Proyectos"
          />
        </div>
        <div className="space-y-2">
          <Label>Resumen profesional</Label>
          <Textarea
            value={profile.summary}
            onChange={(e) => update('summary', e.target.value)}
            placeholder="Breve descripción de su perfil profesional, experiencia y objetivos..."
            rows={5}
          />
        </div>
      </div>
    </div>
  );
}
