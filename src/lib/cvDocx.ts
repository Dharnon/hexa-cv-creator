import type { CVData } from '@/types/cv';

/** Builds docx paragraph-compatible structure via dynamic import in callers */
export async function buildCvDocxParagraphs(data: CVData) {
  const { Paragraph, TextRun, HeadingLevel } = await import('docx');

  const sortedExp = [...data.workExperience].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const sortedEdu = [...data.education].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const sortedProj = [...data.projects].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const pp = data.proposalPresentation;
  const activeEntry = pp.entries.find((e) => e.id === pp.activeEntryId) ?? pp.entries[0];
  const proposalLine =
    activeEntry != null
      ? `${activeEntry.label} — ${activeEntry.role === 'lead' ? 'Responsable principal' : 'Miembro del equipo'}`
      : '';

  const children: InstanceType<typeof Paragraph>[] = [];

  const pushBlank = () => children.push(new Paragraph({ text: '' }));

  if (data.personalInfo.showName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.personalInfo.fullName || 'Nombre',
            bold: true,
            size: 32,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
      }),
    );
  }
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.professionalProfile.jobTitle || '',
          color: '1e40af',
          size: 24,
        }),
      ],
    }),
  );
  if (proposalLine) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: proposalLine, bold: true, size: 20 })],
      }),
    );
  }
  pushBlank();

  if (data.personalInfo.showPersonalInfo) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'INFORMACIÓN PERSONAL', bold: true, color: '1e3a5f', size: 22 })],
      }),
    );
    const fields = [
      ['Email', data.personalInfo.email],
      ['Teléfono', data.personalInfo.phone],
      ['Dirección', data.personalInfo.address],
      ['LinkedIn', data.personalInfo.linkedin],
      ['Nacionalidad', data.personalInfo.nationality],
    ].filter(([, v]) => v);
    fields.forEach(([label, value]) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true, size: 20 }),
            new TextRun({ text: value as string, size: 20, color: '1f2937' }),
          ],
        }),
      );
    });
    pushBlank();
  }

  if (data.professionalProfile.summary) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'PERFIL PROFESIONAL', bold: true, color: '1e3a5f', size: 22 })],
      }),
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: data.professionalProfile.summary, size: 20, color: '1f2937' })],
      }),
    );
    pushBlank();
  }

  if (sortedExp.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'EXPERIENCIA LABORAL', bold: true, color: '1e3a5f', size: 22 })],
      }),
    );
    sortedExp.forEach((exp) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: exp.jobTitle, bold: true, size: 22 })],
        }),
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${exp.startDate} — ${exp.isCurrentJob ? 'Actualidad' : exp.endDate}`,
              italics: true,
              size: 18,
              color: '4b5563',
            }),
          ],
        }),
      );
      if (exp.responsibilities.filter(Boolean).length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: 'Funciones y responsabilidades', bold: true, size: 20 })],
          }),
        );
        exp.responsibilities.filter(Boolean).forEach((r) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${r}`, size: 20, color: '1f2937' })],
              indent: { left: 360 },
            }),
          );
        });
      }
      if (exp.technologies?.trim()) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Tecnologías: ', bold: true, size: 20 }),
              new TextRun({ text: exp.technologies, size: 20, color: '1f2937' }),
            ],
          }),
        );
      }
      if (exp.methodologies?.trim()) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Metodologías: ', bold: true, size: 20 }),
              new TextRun({ text: exp.methodologies, size: 20, color: '1f2937' }),
            ],
          }),
        );
      }
      const companyLine = [exp.company, exp.location].filter(Boolean).join(' · ');
      if (companyLine) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: companyLine, size: 18, color: '6b7280' })],
          }),
        );
      }
      if (exp.sector?.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Sector: ${exp.sector}`, size: 18, color: '6b7280' })],
          }),
        );
      }
      if (exp.isManager) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Responsable de equipo: ${exp.peopleManaged} personas${exp.teamDescription ? ' — ' + exp.teamDescription : ''}`,
                italics: true,
                size: 18,
                color: '4b5563',
              }),
            ],
          }),
        );
      }
      pushBlank();
    });
  }

  if (sortedProj.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'PROYECTOS', bold: true, color: '1e3a5f', size: 22 })],
      }),
    );
    sortedProj.forEach((proj) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: proj.title, bold: true, size: 20 })],
        }),
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${proj.startDate} — ${proj.isOngoing ? 'En curso' : proj.endDate}`,
              italics: true,
              size: 18,
              color: '4b5563',
            }),
          ],
        }),
      );
      if (proj.client?.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Cliente: ${proj.client}`, size: 18, color: '6b7280' })],
          }),
        );
      }
      if (proj.description?.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: proj.description, size: 20, color: '1f2937' })],
          }),
        );
      }
      if (proj.technologies?.trim()) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Tecnologías: ', bold: true, size: 20 }),
              new TextRun({ text: proj.technologies, size: 20, color: '1f2937' }),
            ],
          }),
        );
      }
      if (proj.methodologies?.trim()) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Metodologías: ', bold: true, size: 20 }),
              new TextRun({ text: proj.methodologies, size: 20, color: '1f2937' }),
            ],
          }),
        );
      }
      pushBlank();
    });
  }

  if (sortedEdu.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'EDUCACIÓN Y FORMACIÓN', bold: true, color: '1e3a5f', size: 22 })],
      }),
    );
    sortedEdu.forEach((ed) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: ed.qualification, bold: true, size: 20 }),
            new TextRun({ text: ` — ${ed.institution}`, size: 20, color: '1f2937' }),
          ],
        }),
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${ed.startDate} — ${ed.endDate}`,
              italics: true,
              size: 18,
              color: '4b5563',
            }),
          ],
        }),
      );
      if (ed.subjects) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: ed.subjects, size: 18, color: '6b7280' })],
          }),
        );
      }
      pushBlank();
    });
  }

  if (data.competencies.motherTongue || data.competencies.languages.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'IDIOMAS', bold: true, color: '1e3a5f', size: 22 })],
      }),
    );
    if (data.competencies.motherTongue) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Lengua materna: ', bold: true, size: 20 }),
            new TextRun({ text: data.competencies.motherTongue, size: 20, color: '1f2937' }),
          ],
        }),
      );
    }
    data.competencies.languages.forEach((lang) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: lang.name, bold: true, size: 20 })],
        }),
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [lang.listening, lang.reading, lang.spokenInteraction, lang.spokenProduction, lang.writing]
                .filter(Boolean)
                .join(' / '),
              size: 18,
              color: '6b7280',
            }),
          ],
        }),
      );
    });
    pushBlank();
  }

  const capSections = [
    ['Técnicas', data.competencies.technicalSkills],
    ['Sociales', data.competencies.socialSkills],
    ['Organizativas', data.competencies.organizationalSkills],
    ['Otras', data.competencies.otherSkills],
  ].filter(([, v]) => v);

  if (capSections.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'CAPACIDADES Y COMPETENCIAS', bold: true, color: '1e3a5f', size: 22 }),
        ],
      }),
    );
    capSections.forEach(([label, value]) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true, size: 20 }),
            new TextRun({ text: value as string, size: 20, color: '1f2937' }),
          ],
        }),
      );
    });
    pushBlank();
  }

  const m = data.othersMisc;
  const othersParts: string[] = [];
  if (m.drivingLicense?.trim()) othersParts.push(`Permiso de conducir: ${m.drivingLicense}`);
  if (m.travelAvailability?.trim()) othersParts.push(`Disponibilidad para viajar: ${m.travelAvailability}`);
  if (m.volunteering?.trim()) othersParts.push(`Voluntariado: ${m.volunteering}`);
  if (m.extraNotes?.trim()) othersParts.push(`Notas: ${m.extraNotes}`);

  if (othersParts.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'OTROS', bold: true, color: '1e3a5f', size: 22 })],
      }),
    );
    othersParts.forEach((line) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 20, color: '1f2937' })],
        }),
      );
    });
  }

  return children;
}
