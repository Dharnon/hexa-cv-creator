import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import hexaLogo from '@/assets/hexa-logo.png';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Briefcase } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith('@hexaingenieros.com')) {
      toast.error('Solo se permiten correos @hexaingenieros.com');
      return;
    }
    setLoading(true);
    const result = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, fullName, jobTitle);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (!isLogin) {
      toast.success('Cuenta creada. Revisa tu correo para verificar tu cuenta.');
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted items-center justify-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-8 px-12">
          <img src={hexaLogo} alt="Hexa Ingenieros" className="h-12 w-auto" />
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-foreground">
              Plataforma de Currículum
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Gestiona y genera tu CV profesional con la identidad corporativa de Hexa Ingenieros.
            </p>
          </div>
          {/* Decorative illustration area */}
          <div className="mt-8 w-72 h-48 rounded-2xl bg-primary/10 flex items-center justify-center">
            <div className="space-y-3 w-48">
              <div className="h-3 rounded-full bg-primary/30 w-full" />
              <div className="h-3 rounded-full bg-primary/20 w-3/4" />
              <div className="h-3 rounded-full bg-primary/15 w-1/2" />
              <div className="h-8 rounded-lg bg-primary/25 w-full mt-4" />
              <div className="h-3 rounded-full bg-primary/20 w-5/6" />
              <div className="h-3 rounded-full bg-primary/15 w-2/3" />
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border border-primary/10" />
        <div className="absolute -bottom-32 -left-8 w-80 h-80 rounded-full border border-primary/5" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 bg-primary flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative arcs */}
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border border-primary-foreground/10" />
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full border border-primary-foreground/5" />

        <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl p-8 relative z-10">
          {/* Logo on mobile */}
          <div className="flex lg:hidden justify-center mb-6">
            <img src={hexaLogo} alt="Hexa Ingenieros" className="h-8 w-auto" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? '¡Hola!' : '¡Bienvenido!'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta para comenzar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nombre completo"
                  className="pl-11 h-12 rounded-full border-border bg-muted/50 text-sm"
                  required
                />
              </div>
            )}

            {!isLogin && (
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="Puesto actual"
                  className="pl-11 h-12 rounded-full border-border bg-muted/50 text-sm"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="pl-11 h-12 rounded-full border-border bg-muted/50 text-sm"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="pl-11 pr-11 h-12 rounded-full border-border bg-muted/50 text-sm"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full font-semibold text-sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <span className="font-semibold text-primary">
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
