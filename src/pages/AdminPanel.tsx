import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');

    const roleMap = new Map<string, string[]>();
    roles?.forEach(r => {
      const existing = roleMap.get(r.user_id) ?? [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    });

    setUsers((profiles ?? []).map(p => ({
      user_id: p.user_id,
      full_name: p.full_name || p.email,
      email: p.email,
      roles: roleMap.get(p.user_id) ?? [],
    })));
    setLoading(false);
  };

  const addRole = async (userId: string, role: string) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: role as any });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'El usuario ya tiene este rol' : error.message);
    } else {
      toast.success('Rol añadido');
      loadUsers();
    }
  };

  const removeRole = async (userId: string, role: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role as any);
    if (error) {
      toast.error(error.message);
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
              <p className="font-semibold text-foreground flex items-center gap-1"><Shield className="w-4 h-4" /> Panel de Administración</p>
              <p className="text-xs text-muted-foreground">Gestión de roles de usuario</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios y Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : (
              <div className="space-y-4">
                {users.map(u => (
                  <div key={u.user_id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{u.full_name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <div className="flex gap-1 mt-1">
                        {u.roles.map(r => (
                          <Badge key={r} className={`${roleColors[r] ?? ''} gap-1`}>
                            {r}
                            <button onClick={() => removeRole(u.user_id, r)} className="hover:opacity-70">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={v => addRole(u.user_id, v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Añadir rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {['admin', 'hr', 'employee']
                            .filter(r => !u.roles.includes(r))
                            .map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
