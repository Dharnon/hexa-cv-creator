
# Rediseño del CV al formato anejo del cliente

Adaptamos la plantilla y el wizard al formato que usan los clientes (CNMT y otros) para facilitar la comparación de perfiles en licitaciones.

## 1. Rol del participante (responsable principal / miembro del equipo)

- Añadir un campo `projectRole: 'principal' | 'miembro'` en `CVData` (o como meta a nivel CV).
- Mostrarlo arriba del CV, bien visible, con dos casillas tipo checkbox (estilo anejo): `Responsable principal ☐  Miembro del equipo ☑`.
- Editable desde el wizard (Paso 1 o nuevo bloque inicial) y también desde la vista previa antes de exportar (PDF/Word), para alternar sin tocar el CV base.
- En `HRDashboard` permitir seleccionar el rol al previsualizar/exportar cada empleado.

## 2. Reordenar y retitular Experiencia Laboral

Mantener el mismo orden que el anejo dentro de cada experiencia:

```text
Profesión / cargo desempeñado     [grande, destacado]
  Funciones y responsabilidades:   [título]
    - bullet 1
    - bullet 2
  Tecnologías:                     [título + dos puntos]
    AutoCAD, SAP, ...
  Metodologías:                    [título nuevo, separado de tecnologías]
    AGILE, PMI, ...
  Empresa / empleador:             [menor jerarquía]
  Sector:                          [menor jerarquía]
  Personas a cargo / equipo        (si aplica)
  Fechas                           (alineadas a la derecha como hoy)
```

Cambios técnicos:
- Añadir `methodologies: string` a `WorkExperience` y campo en `StepExperience`.
- Renderizar en `CVPreview` con títulos en negrita ("Funciones y responsabilidades:", "Tecnologías:", "Metodologías:") y cuerpo debajo.
- Empresa y sector pasan a tamaño/peso menor (no eliminamos, solo despriorizamos).

## 3. Capacidades y Competencias

Renombrar la sección a "CAPACIDADES Y COMPETENCIAS" con subsecciones claras y títulos visibles:
- Técnicas
- Sociales
- Organizativas
- Otras (incluye permiso de conducir, disponibilidad para viajar, voluntariado, etc.)

Cambios:
- Mover "Permiso de conducir" fuera de su sección actual y consolidarlo dentro de `otherSkills` (o añadir un `otherInfo` dedicado y ocultar el bloque "PERMISO DE CONDUCIR" del preview).
- En `StepCompetencies`, eliminar el campo independiente "Permiso de conducir" y añadirlo como parte del bloque "Otras" (o auto-componer "Permiso de conducir: B" dentro del texto de Otras).
- Quitar la sección "Competencias personales" si existe (no se usa).

## 4. Tipografía y color

- Subir el tamaño base del cuerpo (de 11px a ~12px) y aumentar contraste de jerarquía:
  - Títulos sección: ~13–14px, bold, color oscuro (`#0F2A55` o similar) en lugar de `#3B82D6` claro.
  - Subtítulos (Funciones, Tecnologías, Metodologías): bold, color oscuro.
  - Cuerpo: gris muy oscuro (`#1A1A1A`) en lugar de `text-gray-700`.
- Mantener azul Hexa solo para acentos (línea superior, bordes), no para texto largo.

## 5. Nueva sección "Proyectos"

Añadir sección al final del CV para justificar solvencia técnica.

- Nuevo tipo `Project { id, name, client, sector, role, startDate, endDate, technologies, description }`.
- Nuevo paso en el wizard "Proyectos" (entre Experiencia y Educación, o tras Competencias).
- Renderizado en `CVPreview` con misma jerarquía que Experiencia (título proyecto, cliente/sector, rol, tecnologías, descripción).
- Permitir múltiples y que el CV pueda ocupar más de dos páginas (ya soporta paginación al exportar; verificar `cvPdfExport`).

## 6. Permitir más de 2 páginas

- Revisar `exportCvElementToPdf`: actualmente hace `addImage` único. Cambiar a paginado A4 dividiendo el canvas en bloques de altura `pdfHeight = pageWidth * (a4Height/a4Width)` y añadiendo páginas con `pdf.addPage()`.
- Verificar exportación Word en `HRDashboard` para nuevas secciones.

## 7. Orden final de secciones del CV (alineado con anejo)

1. Cabecera (logo + nombre + puesto + rol responsable/miembro)
2. Información personal
3. Perfil profesional
4. Experiencia laboral (con jerarquía interna nueva)
5. Educación y formación
6. Capacidades y competencias (técnicas / sociales / organizativas / otras)
7. Idiomas
8. Proyectos
9. Otras informaciones (si aplica)

## Detalles técnicos

- Migración DB: ampliar `cv_data.data` (JSONB) — no hace falta migración SQL, solo actualizar tipos en `src/types/cv.ts` y defaults.
- Archivos a tocar:
  - `src/types/cv.ts` (añadir `methodologies`, `projectRole`, `Project[]`)
  - `src/components/cv/StepExperience.tsx` (campo metodologías)
  - `src/components/cv/StepCompetencies.tsx` (reorganizar, quitar permiso suelto)
  - `src/components/cv/StepProjects.tsx` (nuevo)
  - `src/components/cv/StepIndicator.tsx` y `Index.tsx` (añadir paso)
  - `src/components/cv/StepPersonalInfo.tsx` o cabecera (selector rol)
  - `src/components/cv/CVPreview.tsx` (rediseño: títulos, jerarquía, color, orden, sección proyectos, badges rol)
  - `src/lib/cvPdfExport.ts` (paginado multi-página)
  - `src/pages/HRDashboard.tsx` (selector rol al previsualizar/exportar + export Word con nuevas secciones)
- Sin cambios en autenticación ni en RLS.

## Fuera de alcance

- No modificamos el flujo de login/registro.
- No tocamos la integración SAP/Maringo.
