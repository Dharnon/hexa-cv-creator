import { CVData } from '@/types/cv';
import hexaLogo from '@/assets/hexa-logo.png';

function formatMonth(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

const COLOR_PRIMARY = '#1F4E8C';   // Hexa azul oscuro para títulos
const COLOR_ACCENT = '#3B82D6';    // Azul Hexa para acentos
const COLOR_TEXT = '#1A1A1A';      // Cuerpo
const COLOR_MUTED = '#444';        // Secundario

export function CVPreview({
  data,
  mode = 'screen',
}: {
  data: CVData;
  mode?: 'screen' | 'export';
}) {
  const { personalInfo, professionalProfile, workExperience, education, competencies } = data;
  const projects = data.projects ?? [];
  const role = data.projectRole ?? 'miembro';

  const sortedExp = [...workExperience].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const sortedEdu = [...education].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div
      id="cv-preview"
      className={[
        'bg-white flex flex-col',
        mode === 'screen'
          ? 'w-full max-w-[210mm] mx-auto shadow-lg'
          : 'w-[210mm] max-w-none mx-0 shadow-none',
      ].join(' ')}
      style={{ color: COLOR_TEXT, fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.5', minHeight: '297mm' }}
    >
      {/* Header */}
      <div className="px-8 pt-6 pb-3 border-b-4" style={{ borderColor: COLOR_PRIMARY }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={hexaLogo} alt="Hexa Ingenieros" className="h-9 w-auto" />
            <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: COLOR_MUTED }}>
              Anejo · CV Formato Europass
            </p>
          </div>
          <div className="flex items-center gap-4">
            {personalInfo.photo && personalInfo.showPersonalInfo && (
              <img
                src={personalInfo.photo}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2"
                style={{ borderColor: COLOR_PRIMARY }}
              />
            )}
            <div className="text-right">
              {personalInfo.showName && (
                <h1 className="text-2xl font-extrabold" style={{ color: COLOR_PRIMARY, lineHeight: 1.1 }}>
                  {personalInfo.fullName || 'Nombre Completo'}
                </h1>
              )}
              <p className="text-sm font-semibold mt-0.5" style={{ color: COLOR_ACCENT }}>
                {professionalProfile.jobTitle || 'Puesto'}
              </p>
            </div>
          </div>
        </div>

        {/* Role selector */}
        <div className="mt-4 flex items-center gap-8">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLOR_PRIMARY }}>
            Participante en el desarrollo del contrato:
          </p>
          <RoleCheck label="Responsable principal" checked={role === 'principal'} />
          <RoleCheck label="Miembro del equipo" checked={role === 'miembro'} />
        </div>
      </div>

      <div className="flex flex-1">
        {personalInfo.showPersonalInfo && (
          <aside className="w-56 shrink-0 p-5 bg-gray-50 border-r border-gray-200 space-y-4">
            <Section title="Información personal">
              {personalInfo.email && <InfoLine label="Email" value={personalInfo.email} />}
              {personalInfo.phone && <InfoLine label="Teléfono" value={personalInfo.phone} />}
              {personalInfo.address && <InfoLine label="Dirección" value={personalInfo.address} />}
              {personalInfo.linkedin && <InfoLine label="LinkedIn" value={personalInfo.linkedin} />}
              {personalInfo.nationality && <InfoLine label="Nacionalidad" value={personalInfo.nationality} />}
              {personalInfo.dateOfBirth && <InfoLine label="Nacimiento" value={personalInfo.dateOfBirth} />}
            </Section>
          </aside>
        )}

        <main className="flex-1 p-6 space-y-5">
          {professionalProfile.summary && (
            <Section title="Perfil profesional">
              <p style={{ color: COLOR_TEXT }}>{professionalProfile.summary}</p>
            </Section>
          )}

          {sortedExp.length > 0 && (
            <Section title="Experiencia laboral">
              {sortedExp.map((exp) => (
                <article key={exp.id} className="mb-4 pl-3 border-l-[3px]" style={{ borderColor: COLOR_ACCENT }}>
                  <header className="flex justify-between items-start">
                    <p className="font-bold text-[13px]" style={{ color: COLOR_PRIMARY }}>
                      {exp.jobTitle || 'Profesión / cargo desempeñado'}
                    </p>
                    <p className="text-[10px] font-medium shrink-0 ml-2" style={{ color: COLOR_MUTED }}>
                      {formatMonth(exp.startDate)} – {exp.isCurrentJob ? 'Actualidad' : formatMonth(exp.endDate)}
                    </p>
                  </header>

                  {exp.responsibilities.filter(Boolean).length > 0 && (
                    <SubBlock label="Funciones y responsabilidades:">
                      <ul className="list-disc ml-4 mt-0.5 space-y-0.5">
                        {exp.responsibilities.filter(Boolean).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </SubBlock>
                  )}

                  {exp.technologies && (
                    <SubBlock label="Tecnologías:" inline>{exp.technologies}</SubBlock>
                  )}

                  {exp.methodologies && (
                    <SubBlock label="Metodologías:" inline>{exp.methodologies}</SubBlock>
                  )}

                  {exp.isManager && (
                    <SubBlock label="Personas a cargo:" inline>
                      {exp.peopleManaged}
                      {exp.teamDescription ? ` — ${exp.teamDescription}` : ''}
                    </SubBlock>
                  )}

                  {(exp.company || exp.location) && (
                    <p className="text-[10.5px] mt-1" style={{ color: COLOR_MUTED }}>
                      <span className="font-semibold">Empresa:</span> {exp.company}
                      {exp.location ? `, ${exp.location}` : ''}
                    </p>
                  )}
                  {exp.sector && (
                    <p className="text-[10.5px]" style={{ color: COLOR_MUTED }}>
                      <span className="font-semibold">Sector:</span> {exp.sector}
                    </p>
                  )}
                </article>
              ))}
            </Section>
          )}

          {sortedEdu.length > 0 && (
            <Section title="Educación y formación">
              {sortedEdu.map((ed) => (
                <article key={ed.id} className="mb-3 pl-3 border-l-[3px]" style={{ borderColor: COLOR_ACCENT }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[12.5px]" style={{ color: COLOR_PRIMARY }}>{ed.qualification}</p>
                      <p className="text-[11px] font-medium" style={{ color: COLOR_ACCENT }}>{ed.institution}</p>
                    </div>
                    <p className="text-[10px] shrink-0 ml-2" style={{ color: COLOR_MUTED }}>
                      {formatMonth(ed.startDate)} – {formatMonth(ed.endDate)}
                    </p>
                  </div>
                  {ed.subjects && <p className="text-[10.5px] mt-0.5">{ed.subjects}</p>}
                  {ed.level && <p className="text-[10px]" style={{ color: COLOR_MUTED }}>Nivel: {ed.level}</p>}
                </article>
              ))}
            </Section>
          )}

          {(competencies.technicalSkills || competencies.socialSkills || competencies.organizationalSkills || competencies.otherSkills) && (
            <Section title="Capacidades y competencias">
              {competencies.technicalSkills && <CompBlock label="Técnicas" text={competencies.technicalSkills} />}
              {competencies.socialSkills && <CompBlock label="Sociales" text={competencies.socialSkills} />}
              {competencies.organizationalSkills && <CompBlock label="Organizativas" text={competencies.organizationalSkills} />}
              {competencies.otherSkills && <CompBlock label="Otras" text={competencies.otherSkills} />}
            </Section>
          )}

          {(competencies.motherTongue || competencies.languages.length > 0) && (
            <Section title="Idiomas">
              {competencies.motherTongue && (
                <p className="text-[11px] mb-1">
                  <span className="font-semibold">Lengua materna:</span> {competencies.motherTongue}
                </p>
              )}
              {competencies.languages.map((lang) => (
                <div key={lang.id} className="mb-1.5">
                  <p className="font-bold text-[11px]" style={{ color: COLOR_PRIMARY }}>{lang.name}</p>
                  <p className="text-[10px]" style={{ color: COLOR_MUTED }}>
                    {[lang.listening, lang.reading, lang.spokenInteraction, lang.spokenProduction, lang.writing]
                      .filter(Boolean)
                      .join(' / ')}
                  </p>
                </div>
              ))}
            </Section>
          )}

          {projects.length > 0 && (
            <Section title="Proyectos">
              {projects.map((p) => (
                <article key={p.id} className="mb-3 pl-3 border-l-[3px]" style={{ borderColor: COLOR_ACCENT }}>
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-[12.5px]" style={{ color: COLOR_PRIMARY }}>{p.name}</p>
                    {(p.startDate || p.endDate) && (
                      <p className="text-[10px] shrink-0 ml-2" style={{ color: COLOR_MUTED }}>
                        {formatMonth(p.startDate)} – {formatMonth(p.endDate)}
                      </p>
                    )}
                  </div>
                  {(p.client || p.sector) && (
                    <p className="text-[10.5px]" style={{ color: COLOR_MUTED }}>
                      {p.client && <><span className="font-semibold">Cliente:</span> {p.client}</>}
                      {p.client && p.sector ? ' · ' : ''}
                      {p.sector && <><span className="font-semibold">Sector:</span> {p.sector}</>}
                    </p>
                  )}
                  {p.role && <SubBlock label="Rol:" inline>{p.role}</SubBlock>}
                  {p.description && <SubBlock label="Descripción:" inline>{p.description}</SubBlock>}
                  {p.technologies && <SubBlock label="Tecnologías:" inline>{p.technologies}</SubBlock>}
                </article>
              ))}
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3
        className="text-[12px] font-extrabold uppercase tracking-wider mb-2 pb-0.5 border-b"
        style={{ color: COLOR_PRIMARY, borderColor: COLOR_PRIMARY }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function SubBlock({ label, children, inline }: { label: string; children: React.ReactNode; inline?: boolean }) {
  if (inline) {
    return (
      <p className="text-[11px] mt-1">
        <span className="font-bold" style={{ color: COLOR_PRIMARY }}>{label} </span>
        <span style={{ color: COLOR_TEXT }}>{children}</span>
      </p>
    );
  }
  return (
    <div className="mt-1">
      <p className="text-[11px] font-bold" style={{ color: COLOR_PRIMARY }}>{label}</p>
      <div className="text-[11px]" style={{ color: COLOR_TEXT }}>{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[10.5px]">
      <span className="block text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: COLOR_MUTED }}>{label}</span>
      <span style={{ color: COLOR_TEXT }}>{value}</span>
    </p>
  );
}

function CompBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="mb-2">
      <p className="font-bold text-[11.5px]" style={{ color: COLOR_PRIMARY }}>{label}</p>
      <p className="text-[11px]" style={{ color: COLOR_TEXT }}>{text}</p>
    </div>
  );
}

function RoleCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: COLOR_TEXT }}>
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 border-2 text-[9px] font-bold"
        style={{
          borderColor: COLOR_PRIMARY,
          background: checked ? COLOR_PRIMARY : '#fff',
          color: '#fff',
        }}
      >
        {checked ? '✓' : ''}
      </span>
      {label}
    </span>
  );
}
