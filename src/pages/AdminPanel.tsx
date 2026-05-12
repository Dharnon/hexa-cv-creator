import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
              <p className="text-xs text-muted-foreground">Roles de usuario</p>
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

      <main className="max-w-5xl mx-auto px-6 py-8">
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
