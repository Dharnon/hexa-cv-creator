import { useCV } from '@/contexts/CVContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function StepPersonalInfo() {
  const { data, updateData } = useCV();
  const info = data.personalInfo;

  const update = (field: string, value: string | boolean | null) => {
    updateData({ personalInfo: { ...info, [field]: value } });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update('photo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Informacion Personal</h2>
        <p className="text-sm text-muted-foreground mt-1">Datos basicos de contacto</p>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Switch
          checked={info.showPersonalInfo}
          onCheckedChange={(v) => update('showPersonalInfo', v)}
        />
        <Label className="text-sm">Mostrar informacion personal en el CV</Label>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Switch
          checked={info.showName}
          onCheckedChange={(v) => update('showName', v)}
        />
        <Label className="text-sm">Mostrar nombre en la cabecera del CV</Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre completo *</Label>
          <Input value={info.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Juan Perez Garcia" />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input type="email" value={info.email} onChange={(e) => update('email', e.target.value)} placeholder="juan@hexa.es" />
        </div>
        <div className="space-y-2">
          <Label>Telefono</Label>
          <Input value={info.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+34 600 000 000" />
        </div>
        <div className="space-y-2">
          <Label>Direccion</Label>
          <Input value={info.address} onChange={(e) => update('address', e.target.value)} placeholder="Madrid, Espana" />
        </div>
        <div className="space-y-2">
          <Label>LinkedIn</Label>
          <Input value={info.linkedin} onChange={(e) => update('linkedin', e.target.value)} placeholder="linkedin.com/in/juanperez" />
        </div>
        <div className="space-y-2">
          <Label>Nacionalidad</Label>
          <Input value={info.nationality} onChange={(e) => update('nationality', e.target.value)} placeholder="Espanola" />
        </div>
        <div className="space-y-2">
          <Label>Fecha de nacimiento</Label>
          <Input type="date" value={info.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Foto de perfil</Label>
          <Input type="file" accept="image/*" onChange={handlePhotoUpload} />
          {info.photo && (
            <div className="flex items-center gap-2 mt-1">
              <img src={info.photo} alt="Preview" className="w-12 h-12 rounded-full object-cover" />
              <button onClick={() => update('photo', null)} className="text-xs text-destructive hover:underline">Eliminar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
