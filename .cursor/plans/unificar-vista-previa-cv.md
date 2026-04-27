# Unificar la vista previa del CV (criterio actualizado)

## Criterio de referencia (fuente de verdad)

- **El paso 6 (`StepPreview`) define cómo debe verse** la vista previa: es la implementación "perfecta" que hay que replicar en el resto de sitios.
- Hoy el paso 6 usa: contenedor sencillo (`border`, `overflow-auto`, `bg-muted/30`, `p-4`) y `CVPreview` con el comportamiento por defecto (**`mode="screen"`**: ancho fluido con `max-w-[210mm]`, `mx-auto`, `shadow-lg`).

## Qué hay que alinear (no al revés)

- **No** convertir el paso 6 al patrón del diálogo de RR.HH. (`FitToScreenPreview` + `mode="export"`).
- **Sí** hacer que la vista al pulsar **"Ver"** (y, en la medida de lo razonable, otras previsualizaciones del panel de RR.HH.) **coincidan con el paso 6** en layout y modo de `CVPreview`.

## Cambios previstos (dirección correcta)

1. **Extraer un contenedor reutilizable** (opcional pero recomendable) que refleje exactamente el bloque de preview del paso 6, por ejemplo `CVPreviewPanel` o un simple wrapper con las mismas clases que hoy en [StepPreview.tsx](src/components/cv/StepPreview.tsx) (líneas 189-191), de modo que RR.HH. y el paso 6 usen el **mismo** markup y clases.

2. **En [HRDashboard.tsx](src/pages/HRDashboard.tsx):** Sustituir el contenido del `Dialog` de preview:
   - Quitar o no usar `FitToScreenPreview` en ese flujo (el escalado/clip era para otra interacción; con el paso 6 como referencia, se prioriza la lectura y el aspecto del paso 6).
   - Renderizar `CVPreview` con **`mode="screen"`** (o sin `mode`, equivalente) dentro del mismo contenedor estilo paso 6, adaptando solo lo necesario al diálogo (por ejemplo `max-h` + scroll si hace falta, sin forzar 210mm fijos ni `transform: scale` salvo que el contenedor del modal quede claramente peor que el paso 6; si el modal queda estrecho, ajustar `max-w` del `DialogContent` o padding, no el modo export).

3. **PDF desde RR.HH.:** Sigue existiendo un nodo oculto `pdf-export-preview` con `mode="export"` para `exportCvElementToPdf` — no mezclar: la **visualización** copia el paso 6; la **exportación** puede seguir usando el DOM oculto en modo export (como ahora) para fidelidad al PDF.

4. **Paso 6:** Puede quedar sin cambios visuales o solo importar el mismo wrapper reutilizable para DRY; no se sustituye la experiencia actual por el patrón del diálogo antiguo.

## Archivos a tocar (orientación)

| Archivo | Acción |
|---------|--------|
| `src/components/cv/StepPreview.tsx` | Opcional: extraer wrapper de preview a un componente compartido. |
| Nuevo p. ej. `src/components/cv/CVPreviewFrame.tsx` | Contenedor idéntico al paso 6 (si se extrae). |
| `src/pages/HRDashboard.tsx` | Alinear diálogo "Ver" con el mismo contenedor + `CVPreview` `mode="screen"`. Quitar o no usar `FitToScreenPreview` en vista previa. |
| `src/components/cv/FitToScreenPreview.tsx` | Solo si aún se usa en otro sitio; si no, eliminar de HR o del repo si queda muerto. |

## Verificación

- Lado a lado: paso 6 y "Ver" en RR.HH. deben verse **igual o casi iguales** (mismas clases, mismo modo de preview).
- Export PDF desde RR.HH. sigue generando un PDF coherente (nodo `mode="export"` separado).

## Tareas

- [ ] Extraer o duplicar de forma fiel el contenedor de preview del paso 6 para reutilizar en RR.HH.
- [ ] Sustituir el contenido del `Dialog` de preview en `HRDashboard` para usar ese patrón y `mode="screen"`.
- [ ] Conservar/verificar nodo oculto `mode="export"` para PDF.
- [ ] Probar paso 6, diálogo Ver, y descargas PDF/Word.
