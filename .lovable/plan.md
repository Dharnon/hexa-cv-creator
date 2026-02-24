

# Hexa Ingenieros — Europass CV Builder

A clean, minimal internal web app for Hexa Ingenieros employees to create Europass-format CVs through a step-by-step wizard, preview them live, and export as PDF or Word.

## Branding & Design
- Hexa Ingenieros logo in the header
- Brand colors: **Blue primary (#3B82D6)**, dark navy text, white/light gray backgrounds
- Minimal, clean, professional UI matching the company website style
- Spanish language interface

## Multi-Step CV Form Wizard

### Step 1 — Información Personal
- Nombre completo, dirección, teléfono, email, LinkedIn, nacionalidad
- Optional profile photo upload
- Date of birth (optional)
- **Toggle to show/hide personal info** on the final CV

### Step 2 — Puesto / Perfil Profesional
- Job title / position applied for
- Optional professional summary paragraph

### Step 3 — Experiencia Laboral
- Add multiple work experience entries, each with:
  - Date range (start/end or "Actualidad")
  - Job title & company name + location
  - Responsibilities (bullet points)
  - Technologies/tools used
  - Business sector
  - **Manager role toggle**: if "Responsable", fields for number of people managed and team description
- **Automatic chronological sorting** (most recent first)
- Reorder capability

### Step 4 — Educación y Formación
- Multiple education entries with date range, qualification, institution, subjects
- Auto-sorted chronologically

### Step 5 — Competencias
- **Idiomas**: Lengua materna + other languages with European level grid (A1–C2: comprensión, lectura, habla, escritura)
- **Competencias técnicas**: Certifications, software, tools
- **Competencias sociales**: Teamwork, communication
- **Competencias organizativas**: Management, project coordination
- **Otros**: Driving license, additional info

### Step 6 — Vista Previa y Exportar
- Live preview of the CV in **Modern Europass layout** (sidebar with photo + personal info, main content with timeline)
- Toggle personal info visibility before exporting
- **Export as PDF** (print-ready)
- **Export as Word (.docx)**
- Hexa Ingenieros branding on the CV output

## Data Handling
- Form data saved to **localStorage** so users can resume editing
- No backend needed — fully client-side
- All export processing happens in the browser

## Key UX Details
- Clean step indicator showing wizard progress
- Form validation at each step
- "Añadir otro" buttons for repeatable sections
- Responsive but optimized for desktop use

