import { CVData } from '@/types/cv';

function formatMonth(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function CVPreview({ data }: { data: CVData }) {
  const { personalInfo, professionalProfile, workExperience, education, competencies } = data;

  const sortedExp = [...workExperience].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const sortedEdu = [...education].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div id="cv-preview" className="bg-white text-gray-900 w-full max-w-[210mm] mx-auto shadow-lg" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.5' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b-2" style={{ borderColor: '#3B82D6' }}>
        <div className="flex items-center gap-4">
          {personalInfo.photo && personalInfo.showPersonalInfo && (
            <img src={personalInfo.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: '#3B82D6' }} />
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1a1a2e' }}>{personalInfo.fullName || 'Nombre Completo'}</h1>
            <p className="text-sm font-medium" style={{ color: '#3B82D6' }}>{professionalProfile.jobTitle || 'Puesto'}</p>
          </div>
        </div>
        <div className="text-right text-xs" style={{ color: '#3B82D6' }}>
          <p className="font-bold text-sm">HEXA INGENIEROS</p>
          <p className="text-[9px] text-gray-400">Europass CV</p>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        {personalInfo.showPersonalInfo && (
          <div className="w-52 shrink-0 p-5 bg-gray-50 border-r border-gray-200 space-y-4">
            <Section title="INFORMACIÓN PERSONAL">
              {personalInfo.email && <InfoLine label="Email" value={personalInfo.email} />}
              {personalInfo.phone && <InfoLine label="Teléfono" value={personalInfo.phone} />}
              {personalInfo.address && <InfoLine label="Dirección" value={personalInfo.address} />}
              {personalInfo.linkedin && <InfoLine label="LinkedIn" value={personalInfo.linkedin} />}
              {personalInfo.nationality && <InfoLine label="Nacionalidad" value={personalInfo.nationality} />}
              {personalInfo.dateOfBirth && <InfoLine label="Nacimiento" value={personalInfo.dateOfBirth} />}
            </Section>

            {competencies.motherTongue && (
              <Section title="IDIOMAS">
                <p className="text-[10px]"><span className="font-medium">Lengua materna:</span> {competencies.motherTongue}</p>
                {competencies.languages.map(lang => (
                  <div key={lang.id} className="mt-1">
                    <p className="font-medium text-[10px]">{lang.name}</p>
                    <p className="text-[9px] text-gray-500">
                      {[lang.listening, lang.reading, lang.spokenInteraction, lang.spokenProduction, lang.writing].filter(Boolean).join(' / ')}
                    </p>
                  </div>
                ))}
              </Section>
            )}

            {competencies.drivingLicense && (
              <Section title="PERMISO DE CONDUCIR">
                <p className="text-[10px]">{competencies.drivingLicense}</p>
              </Section>
            )}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 p-6 space-y-5">
          {professionalProfile.summary && (
            <Section title="PERFIL PROFESIONAL">
              <p className="text-[11px] text-gray-700">{professionalProfile.summary}</p>
            </Section>
          )}

          {sortedExp.length > 0 && (
            <Section title="EXPERIENCIA LABORAL">
              {sortedExp.map(exp => (
                <div key={exp.id} className="mb-3 pl-3 border-l-2" style={{ borderColor: '#3B82D6' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[11px]">{exp.jobTitle}</p>
                      <p className="text-[10px]" style={{ color: '#3B82D6' }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                    </div>
                    <p className="text-[10px] text-gray-500 shrink-0 ml-2">
                      {formatMonth(exp.startDate)} — {exp.isCurrentJob ? 'Actualidad' : formatMonth(exp.endDate)}
                    </p>
                  </div>
                  {exp.sector && <p className="text-[9px] text-gray-400 mt-0.5">Sector: {exp.sector}</p>}
                  {exp.responsibilities.filter(Boolean).length > 0 && (
                    <ul className="list-disc ml-4 mt-1 space-y-0.5">
                      {exp.responsibilities.filter(Boolean).map((r, i) => (
                        <li key={i} className="text-[10px] text-gray-700">{r}</li>
                      ))}
                    </ul>
                  )}
                  {exp.technologies && <p className="text-[9px] text-gray-500 mt-1"><span className="font-medium">Tecnologías:</span> {exp.technologies}</p>}
                  {exp.isManager && (
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      <span className="font-medium">Responsable de equipo:</span> {exp.peopleManaged} personas{exp.teamDescription ? ` — ${exp.teamDescription}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </Section>
          )}

          {sortedEdu.length > 0 && (
            <Section title="EDUCACIÓN Y FORMACIÓN">
              {sortedEdu.map(ed => (
                <div key={ed.id} className="mb-3 pl-3 border-l-2" style={{ borderColor: '#3B82D6' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[11px]">{ed.qualification}</p>
                      <p className="text-[10px]" style={{ color: '#3B82D6' }}>{ed.institution}</p>
                    </div>
                    <p className="text-[10px] text-gray-500 shrink-0 ml-2">
                      {formatMonth(ed.startDate)} — {formatMonth(ed.endDate)}
                    </p>
                  </div>
                  {ed.subjects && <p className="text-[9px] text-gray-500 mt-0.5">{ed.subjects}</p>}
                  {ed.level && <p className="text-[9px] text-gray-400">Nivel: {ed.level}</p>}
                </div>
              ))}
            </Section>
          )}

          {(competencies.technicalSkills || competencies.socialSkills || competencies.organizationalSkills || competencies.otherSkills) && (
            <Section title="COMPETENCIAS">
              {competencies.technicalSkills && <CompBlock label="Técnicas" text={competencies.technicalSkills} />}
              {competencies.socialSkills && <CompBlock label="Sociales" text={competencies.socialSkills} />}
              {competencies.organizationalSkills && <CompBlock label="Organizativas" text={competencies.organizationalSkills} />}
              {competencies.otherSkills && <CompBlock label="Otros" text={competencies.otherSkills} />}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#3B82D6' }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[10px]">
      <span className="text-gray-400 block text-[9px]">{label}</span>
      {value}
    </p>
  );
}

function CompBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="mb-2">
      <p className="font-medium text-[10px]">{label}</p>
      <p className="text-[10px] text-gray-700">{text}</p>
    </div>
  );
}
