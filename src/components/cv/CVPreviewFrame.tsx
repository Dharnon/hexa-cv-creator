import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Misma envoltura que el paso 6 (Vista Previa) para previsualizaciones alineadas con el creador.
 */
export function CVPreviewFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('border rounded-lg overflow-auto bg-muted/30 p-4', className)}>{children}</div>
  );
}
