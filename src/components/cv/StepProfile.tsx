import { useCV } from '@/contexts/CVContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProjectRole } from '@/types/cv';
import { cn } from '@/lib/utils';

export function StepProfile() {
  const { data, updateData } = useCV();
  const profile = data.professionalProfile;
  const role: ProjectRole = data.projectRole ?? 'miembro';

  const update = (field: string, value: string) => {
    updateData({ professionalProfile: { ...profile, [field]: value } });
  };

  const setRole = (r: ProjectRole) => updateData({ projectRole: r });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Puesto / Perfil Profesional</h2>
        <p className="text-sm text-muted-foreground mt-1">Tu puesto actual, rol en el proyecto y resumen profesional</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Rol en el proyecto *</Label>
          <p className="text-xs text-muted-foreground">
            Indica si esta persona aparece como responsable principal o como miembro del equipo. Se puede cambiar antes de exportar.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'principal', label: 'Responsable principal' },
              { value: 'miembro', label: 'Miembro del equipo' },
            ] as { value: ProjectRole; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={cn(
                  'rounded-lg border-2 px-4 py-3 text-sm font-medium text-left transition-colors',
                  role === opt.value
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40',
                )}
              >
                <span className={cn(
                  'inline-flex items-center justify-center w-4 h-4 rounded-sm border mr-2 text-[10px]',
                  role === opt.value ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground',
                )}>
                  {role === opt.value ? '✓' : ''}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
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
      </div>
    </div>
  );
}
