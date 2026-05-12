import { CVData } from '@/types/cv';
import hexaLogo from '@/assets/hexa-logo.png';

function formatMonth(dateStr: string): string {
  if (!dateStr) return '';
  const [, month] = dateStr.split('-');
  const year = dateStr.split('-')[0];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function activeProposalLabel(data: CVData): string | null {
  const { entries, activeEntryId } = data.proposalPresentation;
  const entry = entries.find((e) => e.id === activeEntryId) ?? entries[0];
  if (!entry) return null;
  const role =
    entry.role === 'lead' ? 'Responsable principal en esta propuesta' : 'Miembro del equipo en esta propuesta';
  return `${entry.label} — ${role}`;
}

function hasOthersContent(m: CVData['othersMisc']): boolean {
  return Boolean(
    m.drivingLicense?.trim() ||
      m.travelAvailability?.trim() ||
      m.volunteering?.trim() ||
      m.extraNotes?.trim(),
  );
}

export function CVPreview({
  data,
  mode = 'screen',
}: {
  data: CVData;
  mode?: 'screen' | 'export';
}) {
  const { personalInfo, professionalProfile, workExperience, education, competencies, projects, othersMisc } =
    data;

  const sortedExp = [...workExperience].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const sortedEdu = [...education].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const sortedProj = [...projects].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const proposalLine = activeProposalLabel(data);

  const sectionTitleClass =
    'text-[11px] font-bold uppercase tracking-wider mb-2 text-[#1e3a5f] border-b border-[#1e3a5f]/25 pb-1';
  const subHeadingClass = 'text-[10px] font-semibold text-gray-800 mt-2 mb-0.5';
  const bodyClass = 'text-[10px] leading-relaxed text-gray-800';
  const mutedSmall = 'text-[9px] text-gray-600';

  return (
    <div
      id="cv-preview"
      className={[
        'bg-white text-gray-900 flex flex-col',
        mode === 'screen'
          ? 'w-full max-w-[210mm] mx-auto shadow-lg'
          : 'w-[210mm] max-w-none mx-0 shadow-none',
      ].join(' ')}
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.45' }}
    >
      <div className="flex items-center justify-between px-8 py-4 border-b-2 border-[#1e40af] bg-white">
        <div className="flex items-center gap-3">
          <img src={hexaLogo} alt="Hexa Ingenieros" className="h-8 w-auto" />
          <p className="text-[10px] font-medium text-gray-700">Europass CV</p>
        </div>

        <div className="flex items-center gap-4">
          {personalInfo.photo && personalInfo.showPersonalInfo && (
            <img
              src={personalInfo.photo}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-[#1e40af]"
            />
          )}
          <div className="text-right">
            {personalInfo.showName && (
              <h1 className="text-[22px] font-bold leading-tight text-gray-900">
                {personalInfo.fullName || 'Nombre Completo'}
              </h1>
            )}
            <p className="text-[13px] font-semibold text-[#1e40af] mt-0.5">
              {professionalProfile.jobTitle || 'Puesto'}
            </p>
            {proposalLine && (
              <p className="text-[10px] font-semibold text-gray-800 mt-1.5 max-w-[280px] ml-auto">{proposalLine}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {personalInfo.showPersonalInfo && (
          <div className="w-52 shrink-0 p-5 bg-gray-100 border-r border-gray-300 space-y-4">
            <div>
              <h3 className={sectionTitleClass}>Información personal</h3>
              <div className="space-y-2">
                {personalInfo.email && <InfoLine label="Email" value={personalInfo.email} />}
                {personalInfo.phone && <InfoLine label="Teléfono" value={personalInfo.phone} />}
                {personalInfo.address && <InfoLine label="Dirección" value={personalInfo.address} />}
                {personalInfo.linkedin && <InfoLine label="LinkedIn" value={personalInfo.linkedin} />}
                {personalInfo.nationality && <InfoLine label="Nacionalidad" value={personalInfo.nationality} />}
                {personalInfo.dateOfBirth && <InfoLine label="Nacimiento" value={personalInfo.dateOfBirth} />}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-6 space-y-5">
          {professionalProfile.summary && (
            <section>
              <h3 className={sectionTitleClass}>Perfil profesional</h3>
              <p className={`${bodyClass}`}>{professionalProfile.summary}</p>
            </section>
          )}

          {sortedExp.length > 0 && (
            <section>
              <h3 className={sectionTitleClass}>Experiencia laboral</h3>
              {sortedExp.map((exp) => (
                <div key={exp.id} className="mb-4 pl-3 border-l-[3px] border-[#1e40af]">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[12px] font-bold text-gray-900">{exp.jobTitle}</p>
                    <p className={`${mutedSmall} shrink-0 text-right`}>
                      {formatMonth(exp.startDate)} — {exp.isCurrentJob ? 'Actualidad' : formatMonth(exp.endDate)}
                    </p>
                  </div>

                  {exp.responsibilities.filter(Boolean).length > 0 && (
                    <>
                      <p className={subHeadingClass}>Funciones y responsabilidades</p>
                      <ul className="list-disc ml-4 space-y-0.5">
                        {exp.responsibilities.filter(Boolean).map((r, i) => (
                          <li key={i} className={`${bodyClass}`}>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {exp.technologies?.trim() && (
                    <p className={`${bodyClass} mt-2`}>
                      <span className="font-semibold text-gray-900">Tecnologías: </span>
                      {exp.technologies}
                    </p>
                  )}
                  {exp.methodologies?.trim() && (
                    <p className={`${bodyClass} mt-1`}>
                      <span className="font-semibold text-gray-900">Metodologías: </span>
                      {exp.methodologies}
                    </p>
                  )}

                  <div className={`mt-2 space-y-0.5 ${mutedSmall}`}>
                    {(exp.company || exp.location) && (
                      <p>
                        {[exp.company, exp.location].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {exp.sector && <p>Sector: {exp.sector}</p>}
                  </div>

                  {exp.isManager && (
                    <p className={`${mutedSmall} mt-1`}>
                      <span className="font-semibold text-gray-700">Responsable de equipo: </span>
                      {exp.peopleManaged} personas
                      {exp.teamDescription ? ` — ${exp.teamDescription}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {sortedProj.length > 0 && (
            <section>
              <h3 className={sectionTitleClass}>Proyectos</h3>
              {sortedProj.map((proj) => (
                <div key={proj.id} className="mb-4 pl-3 border-l-[3px] border-[#1e40af]">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[11px] font-bold text-gray-900">{proj.title}</p>
                    <p className={`${mutedSmall} shrink-0 text-right`}>
                      {formatMonth(proj.startDate)} — {proj.isOngoing ? 'En curso' : formatMonth(proj.endDate)}
                    </p>
                  </div>
                  {proj.client?.trim() && <p className={`${mutedSmall} mt-0.5`}>Cliente: {proj.client}</p>}
                  {proj.description?.trim() && <p className={`${bodyClass} mt-1`}>{proj.description}</p>}
                  {proj.technologies?.trim() && (
                    <p className={`${bodyClass} mt-1`}>
                      <span className="font-semibold text-gray-900">Tecnologías: </span>
                      {proj.technologies}
                    </p>
                  )}
                  {proj.methodologies?.trim() && (
                    <p className={`${bodyClass} mt-0.5`}>
                      <span className="font-semibold text-gray-900">Metodologías: </span>
                      {proj.methodologies}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {sortedEdu.length > 0 && (
            <section>
              <h3 className={sectionTitleClass}>Educación y formación</h3>
              {sortedEdu.map((ed) => (
                <div key={ed.id} className="mb-3 pl-3 border-l-[3px] border-[#1e40af]">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-gray-900">{ed.qualification}</p>
                      <p className="text-[10px] font-medium text-[#1e40af]">{ed.institution}</p>
                    </div>
                    <p className={`${mutedSmall} shrink-0`}>
                      {formatMonth(ed.startDate)} — {formatMonth(ed.endDate)}
                    </p>
                  </div>
                  {ed.subjects && <p className={`${mutedSmall} mt-0.5`}>{ed.subjects}</p>}
                  {ed.level && <p className={`${mutedSmall}`}>Nivel: {ed.level}</p>}
                </div>
              ))}
            </section>
          )}

          {(competencies.motherTongue || competencies.languages.length > 0) && (
            <section>
              <h3 className={sectionTitleClass}>Idiomas</h3>
              {competencies.motherTongue && (
                <p className={`${bodyClass} mb-1`}>
                  <span className="font-semibold">Lengua materna: </span>
                  {competencies.motherTongue}
                </p>
              )}
              {competencies.languages.map((lang) => (
                <div key={lang.id} className="mb-2">
                  <p className="font-semibold text-[10px] text-gray-900">{lang.name}</p>
                  <p className={`${mutedSmall}`}>
                    {[lang.listening, lang.reading, lang.spokenInteraction, lang.spokenProduction, lang.writing]
                      .filter(Boolean)
                      .join(' / ')}
                  </p>
                </div>
              ))}
            </section>
          )}

          {(competencies.technicalSkills ||
            competencies.socialSkills ||
            competencies.organizationalSkills ||
            competencies.otherSkills) && (
            <section>
              <h3 className={sectionTitleClass}>Capacidades y competencias</h3>
              {competencies.technicalSkills && (
                <div className="mb-2">
                  <p className={subHeadingClass}>Técnicas</p>
                  <p className={bodyClass}>{competencies.technicalSkills}</p>
                </div>
              )}
              {competencies.socialSkills && (
                <div className="mb-2">
                  <p className={subHeadingClass}>Sociales</p>
                  <p className={bodyClass}>{competencies.socialSkills}</p>
                </div>
              )}
              {competencies.organizationalSkills && (
                <div className="mb-2">
                  <p className={subHeadingClass}>Organizativas</p>
                  <p className={bodyClass}>{competencies.organizationalSkills}</p>
                </div>
              )}
              {competencies.otherSkills && (
                <div className="mb-2">
                  <p className={subHeadingClass}>Otras</p>
                  <p className={bodyClass}>{competencies.otherSkills}</p>
                </div>
              )}
            </section>
          )}

          {hasOthersContent(othersMisc) && (
            <section>
              <h3 className={sectionTitleClass}>Otros</h3>
              {othersMisc.drivingLicense?.trim() && (
                <p className={`${bodyClass} mb-1`}>
                  <span className="font-semibold text-gray-900">Permiso de conducir: </span>
                  {othersMisc.drivingLicense}
                </p>
              )}
              {othersMisc.travelAvailability?.trim() && (
                <div className="mb-2">
                  <p className={subHeadingClass}>Disponibilidad para viajar</p>
                  <p className={bodyClass}>{othersMisc.travelAvailability}</p>
                </div>
              )}
              {othersMisc.volunteering?.trim() && (
                <div className="mb-2">
                  <p className={subHeadingClass}>Voluntariado</p>
                  <p className={bodyClass}>{othersMisc.volunteering}</p>
                </div>
              )}
              {othersMisc.extraNotes?.trim() && (
                <div className="mb-2">
                  <p className={subHeadingClass}>Notas adicionales</p>
                  <p className={bodyClass}>{othersMisc.extraNotes}</p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[10px] text-gray-800">
      <span className="text-[9px] font-medium text-gray-600 uppercase tracking-wide block">{label}</span>
      {value}
    </p>
  );
}
