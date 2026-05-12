import type {
  CVData,
  Competencies,
  OthersMisc,
  ProposalPresentation,
  Project,
  WorkExperience,
} from '@/types/cv';
import { defaultCVData, defaultOthersMisc, defaultProposalPresentation } from '@/types/cv';

/** Datos guardados antes de othersMisc / sin methodologies */
interface LegacyCompetencies extends Partial<Competencies> {
  drivingLicense?: string;
}

interface LegacyCVPartial extends Partial<CVData> {
  competencies?: LegacyCompetencies;
}

function normalizeWorkExperience(exp: WorkExperience): WorkExperience {
  return {
    ...exp,
    methodologies: exp.methodologies ?? '',
    responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
  };
}

function normalizeProject(p: Project): Project {
  return {
    ...p,
    client: p.client ?? '',
    technologies: p.technologies ?? '',
    methodologies: p.methodologies ?? '',
    description: p.description ?? '',
    isOngoing: p.isOngoing ?? false,
  };
}

function normalizeCompetencies(comp: LegacyCompetencies | undefined): Competencies {
  const base = defaultCVData.competencies;
  const merged = { ...base, ...comp };
  return {
    motherTongue: merged.motherTongue ?? '',
    languages: Array.isArray(merged.languages) ? merged.languages : [],
    technicalSkills: merged.technicalSkills ?? '',
    socialSkills: merged.socialSkills ?? '',
    organizationalSkills: merged.organizationalSkills ?? '',
    otherSkills: merged.otherSkills ?? '',
  };
}

function normalizeOthersMisc(raw: LegacyCVPartial): OthersMisc {
  const legacyDl = raw.competencies?.drivingLicense?.trim() ?? '';
  const om = raw.othersMisc;
  return {
    drivingLicense: (om?.drivingLicense ?? '').trim() || legacyDl,
    travelAvailability: om?.travelAvailability ?? '',
    volunteering: om?.volunteering ?? '',
    extraNotes: om?.extraNotes ?? '',
  };
}

function normalizeProposalPresentation(raw: Partial<ProposalPresentation> | undefined): ProposalPresentation {
  const entries =
    raw?.entries && raw.entries.length > 0
      ? raw.entries.map((e) => ({
          id: e.id,
          label: e.label || 'Propuesta',
          role: e.role === 'lead' ? ('lead' as const) : ('member' as const),
        }))
      : [...defaultProposalPresentation.entries];
  const active =
    raw?.activeEntryId && entries.some((e) => e.id === raw.activeEntryId)
      ? raw.activeEntryId
      : entries[0].id;
  return { entries, activeEntryId: active };
}

export function normalizeCVData(cvData: CVData): CVData {
  const legacy = cvData as LegacyCVPartial;
  const merged = { ...defaultCVData, ...cvData };

  return {
    ...merged,
    personalInfo: {
      ...defaultCVData.personalInfo,
      ...merged.personalInfo,
      showName: merged.personalInfo.showName ?? true,
      showPersonalInfo: merged.personalInfo.showPersonalInfo ?? true,
    },
    professionalProfile: {
      ...defaultCVData.professionalProfile,
      ...merged.professionalProfile,
    },
    workExperience: (merged.workExperience ?? []).map(normalizeWorkExperience),
    education: merged.education ?? [],
    projects: (merged.projects ?? []).map(normalizeProject),
    competencies: normalizeCompetencies(legacy.competencies),
    othersMisc: normalizeOthersMisc(legacy),
    proposalPresentation: normalizeProposalPresentation(merged.proposalPresentation),
  };
}
