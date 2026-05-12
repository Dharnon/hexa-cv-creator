import { CVData, ProposalRole } from '@/types/cv';
import hexaLogo from '@/assets/hexa-logo.png';

function formatMonth(dateStr: string): string {
  if (!dateStr) return '';
  const [, month] = dateStr.split('-');
  const year = dateStr.split('-')[0];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function roleLabel(role: ProposalRole): string {
  return role === 'lead' ? 'Responsable principal' : 'Miembro del equipo';
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
  showName = true,
  tenderLabel,
}: {
  data: CVData;
  mode?: 'screen' | 'export';
  showName?: boolean;
  /** Si se proporciona, muestra en cabecera la licitación activa junto al rol. */
  tenderLabel?: string;
}) {
  const { professionalProfile, workExperience, education, competencies, othersMisc, role } = data;

  const sortedExp = [...workExperience].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const sortedEdu = [...education].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const isLead = role === 'lead';
  const showProposalHeader = Boolean(tenderLabel?.trim()) || isLead;

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
          ? 'w-[210mm] shrink-0 max-w-none mx-auto shadow-lg'
          : 'w-[210mm] max-w-none mx-0 shadow-none',
      ].join(' ')}
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.45' }}
    >
      <div
        className="flex items-center justify-between px-5 py-2 border-b-2 border-[#1e40af] bg-white"
        data-pdf-atomic
      >
        <div className="flex items-center gap-2">
          <img src={hexaLogo} alt="Hexa Ingenieros" className="h-6 w-auto" />
          <p className="text-[9px] font-medium text-gray-700">Europass CV</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            {showName && (
              <h1 className="text-[18px] font-bold leading-tight text-gray-900">
                {professionalProfile.fullName || 'Nombre Completo'}
              </h1>
            )}
            <p className="text-[11px] font-semibold text-[#1e40af] mt-0.5 leading-tight">
              {professionalProfile.jobTitle || 'Puesto'}
            </p>
            {showProposalHeader && (
              <div className="mt-1 max-w-[min(100%,360px)] ml-auto text-right space-y-0.5">
                {tenderLabel?.trim() && (
                  <p className="text-[9px] font-medium text-gray-600 leading-tight">{tenderLabel}</p>
                )}
                <p
                  className={[
                    'text-[14px] font-bold leading-tight tracking-tight',
                    isLead ? 'text-[#0f172a]' : 'text-[#1e40af]',
                  ].join(' ')}
                >
                  {roleLabel(role)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 p-6 pb-8 space-y-5 overflow-visible">
          {sortedExp.length > 0 && (
            <section className="break-inside-avoid">
              <div data-pdf-atomic>
                <h3 className={sectionTitleClass}>Experiencia laboral</h3>
              </div>
              {sortedExp.map((exp) => (
                <div key={exp.id} className="mb-4 pl-3 border-l-[3px] border-[#1e40af]" data-pdf-atomic>
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[12px] font-bold text-gray-900">{exp.jobTitle}</p>
                    <p className={`${mutedSmall} shrink-0 text-right`}>
                      {formatMonth(exp.startDate)} — {exp.isCurrentJob ? 'Actualidad' : formatMonth(exp.endDate)}
                    </p>
                  </div>

                  {exp.responsibilities.filter(Boolean).length > 0 && (
                    <>
                      <p className={subHeadingClass}>Funciones y responsabilidades</p>
                      <div className="mt-0.5 space-y-1">
                        {exp.responsibilities.filter(Boolean).map((r, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span
                              className="shrink-0 w-3 text-center text-[10px] leading-snug text-gray-800 select-none"
                              aria-hidden
                            >
                              •
                            </span>
                            <p className={`${bodyClass} flex-1 min-w-0 leading-snug`}>{r}</p>
                          </div>
                        ))}
                      </div>
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

                  <div className="mt-2 space-y-0.5 text-[10px] text-gray-600">
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

          {sortedEdu.length > 0 && (
            <section className="break-inside-avoid">
              <div data-pdf-atomic>
                <h3 className={sectionTitleClass}>Educación y formación</h3>
              </div>
              {sortedEdu.map((ed) => (
                <div key={ed.id} className="mb-3 pl-3 border-l-[3px] border-[#1e40af]" data-pdf-atomic>
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
            <section className="break-inside-avoid">
              <div data-pdf-atomic>
                <h3 className={sectionTitleClass}>Idiomas</h3>
              </div>
              {competencies.motherTongue && (
                <div className={`${bodyClass} mb-1`} data-pdf-atomic>
                  <span className="font-semibold">Lengua materna: </span>
                  {competencies.motherTongue}
                </div>
              )}
              {competencies.languages.map((lang) => (
                <div key={lang.id} className="mb-2" data-pdf-atomic>
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
            <section className="break-inside-avoid">
              <div data-pdf-atomic>
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
              </div>
            </section>
          )}

          {hasOthersContent(othersMisc) && (
            <section className="break-inside-avoid">
              <div data-pdf-atomic>
                <h3 className={sectionTitleClass}>Otros</h3>
              </div>
              {othersMisc.drivingLicense?.trim() && (
                <div className={`${bodyClass} mb-1`} data-pdf-atomic>
                  <span className="font-semibold text-gray-900">Permiso de conducir: </span>
                  {othersMisc.drivingLicense}
                </div>
              )}
              {othersMisc.travelAvailability?.trim() && (
                <div className="mb-2" data-pdf-atomic>
                  <p className={subHeadingClass}>Disponibilidad para viajar</p>
                  <p className={bodyClass}>{othersMisc.travelAvailability}</p>
                </div>
              )}
              {othersMisc.volunteering?.trim() && (
                <div className="mb-2" data-pdf-atomic>
                  <p className={subHeadingClass}>Voluntariado</p>
                  <p className={bodyClass}>{othersMisc.volunteering}</p>
                </div>
              )}
              {othersMisc.extraNotes?.trim() && (
                <div className="mb-2" data-pdf-atomic>
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
