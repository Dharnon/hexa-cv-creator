import { useState, useEffect, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, UserPlus, Trash2 } from 'lucide-react';
import hexaLogo from '@/assets/hexa-logo.png';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserWithRoles {
  user_id: string;
  full_name: string;
  email: string;
  roles: string[];
}

export default function AdminPanel() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState<{ userId: string; role: string } | null>(null);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createJobTitle, setCreateJobTitle] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/users');
      if (!res.ok) {
        toast.error('No se pudieron cargar los usuarios');
        setUsers([]);
        return;
      }
      const data = (await res.json()) as UserWithRoles[];
      setUsers(data);
    } catch {
      toast.error('Error de conexión');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (userId: string, role: string) => {
    const res = await apiFetch(`/api/admin/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((body as { error?: string }).error ?? 'Error al añadir rol');
    } else {
      toast.success('Rol añadido');
      loadUsers();
    }
  };

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: createEmail.trim(),
          password: createPassword,
          fullName: createFullName.trim(),
          jobTitle: createJobTitle.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((body as { error?: string }).error ?? 'No se pudo crear el usuario');
        return;
      }
      toast.success('Usuario creado. Puedes asignar roles adicionales en la lista.');
      setCreateEmail('');
      setCreatePassword('');
      setCreateFullName('');
      setCreateJobTitle('');
      loadUsers();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setCreatingUser(false);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    const res = await apiFetch(`/api/admin/users/${userId}/roles/${encodeURIComponent(role)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error((body as { error?: string }).error ?? 'Error al quitar rol');
    } else {
      toast.success('Rol eliminado');
      loadUsers();
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-destructive text-destructive-foreground',
    hr: 'bg-primary text-primary-foreground',
    employee: 'bg-secondary text-secondary-foreground',
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={hexaLogo} alt="Hexa Ingenieros" className="h-8 w-auto" />
            <div>
              <p className="font-semibold text-foreground">Panel de administración</p>
              <p className="text-xs text-muted-foreground">Usuarios, alta y roles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Inicio
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Nuevo usuario
            </CardTitle>
            <CardDescription>
              Misma política que el registro: correo corporativo y contraseña mínimo 8 caracteres. Se crea con rol
              employee; asigna admin o hr abajo si hace falta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUser} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-new-email">Correo</Label>
                <Input
                  id="admin-new-email"
                  type="email"
                  autoComplete="off"
                  value={createEmail}
                  onChange={(ev) => setCreateEmail(ev.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-new-password">Contraseña temporal</Label>
                <Input
                  id="admin-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={createPassword}
                  onChange={(ev) => setCreatePassword(ev.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-new-name">Nombre completo</Label>
                <Input
                  id="admin-new-name"
                  value={createFullName}
                  onChange={(ev) => setCreateFullName(ev.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-new-job">Puesto (opcional)</Label>
                <Input
                  id="admin-new-job"
                  value={createJobTitle}
                  onChange={(ev) => setCreateJobTitle(ev.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={creatingUser}>
                  {creatingUser ? 'Creando…' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Usuarios y roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <div
                    key={u.user_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {u.roles.map((r) => (
                          <Badge key={r} className={roleColors[r] ?? ''}>
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={addingRole?.userId === u.user_id ? addingRole.role : ''}
                        onValueChange={(role) => setAddingRole({ userId: u.user_id, role })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Añadir rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {(['hr', 'admin', 'employee'] as const)
                            .filter((r) => !u.roles.includes(r))
                            .map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!addingRole || addingRole.userId !== u.user_id}
                        onClick={() => {
                          if (addingRole?.userId === u.user_id) {
                            addRole(u.user_id, addingRole.role);
                            setAddingRole(null);
                          }
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" /> Añadir
                      </Button>
                      {u.roles
                        .filter((r) => r !== 'employee')
                        .map((r) => (
                          <Button
                            key={r}
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRole(u.user_id, r)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Quitar {r}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
