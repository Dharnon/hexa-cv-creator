/** Correo que siempre recibe roles admin + hr al registrarse y al arrancar el servidor. */
export const BUILTIN_BOOTSTRAP_ADMIN_EMAIL = 'ji.munoz@hexaingenieros.com';

export function shouldGrantBootstrapAdminRoles(email: string): boolean {
  const e = email.trim().toLowerCase();
  const env = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  return e === BUILTIN_BOOTSTRAP_ADMIN_EMAIL || (!!env && e === env);
}
