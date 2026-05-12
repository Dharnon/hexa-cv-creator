import { useCV } from '@/contexts/CVContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
        <p className="text-sm text-muted-foreground mt-1">Tu puesto actual y resumen profesional</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre completo *</Label>
          <Input
            value={profile.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder="Juan Pérez García"
          />
        </div>
        <div className="space-y-2">
          <Label>Puesto actual *</Label>
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
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
          <div>
            <Label className="text-sm">Rol en propuestas</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Activado: Responsable principal · Desactivado: Miembro del equipo
            </p>
          </div>
          <Switch
            checked={data.role === 'lead'}
            onCheckedChange={(v) => updateData({ role: v ? 'lead' : 'member' })}
          />
        </div>
      </div>
    </div>
  );
}
