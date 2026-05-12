import type {
  CVData,
  Competencies,
  OthersMisc,
  ProfessionalProfile,
  ProposalRole,
  WorkExperience,
} from '@/types/cv';
import { defaultCVData, defaultOthersMisc } from '@/types/cv';

interface LegacyPersonalInfo {
  fullName?: string;
}

interface LegacyProposalEntry {
  id?: string;
  label?: string;
  role?: ProposalRole;
}

interface LegacyProposalPresentation {
  entries?: LegacyProposalEntry[];
  activeEntryId?: string | null;
}

interface LegacyCompetencies extends Partial<Competencies> {
  drivingLicense?: string;
}

interface LegacyCVPartial extends Partial<CVData> {
  personalInfo?: LegacyPersonalInfo;
  projects?: unknown;
  proposalPresentation?: LegacyProposalPresentation;
  competencies?: LegacyCompetencies;
}

function normalizeWorkExperience(exp: WorkExperience): WorkExperience {
  return {
    ...exp,
    methodologies: exp.methodologies ?? '',
    responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
  };
}

function normalizeProfessionalProfile(
  raw: Partial<ProfessionalProfile> | undefined,
  legacy: LegacyPersonalInfo | undefined,
): ProfessionalProfile {
  return {
    fullName: raw?.fullName ?? legacy?.fullName ?? '',
    jobTitle: raw?.jobTitle ?? '',
    summary: raw?.summary ?? '',
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

function normalizeRole(raw: LegacyCVPartial): ProposalRole {
  if (raw.role === 'lead' || raw.role === 'member') return raw.role;
  const pp = raw.proposalPresentation;
  if (pp?.entries && pp.entries.length > 0) {
    const active = pp.entries.find((e) => e.id === pp.activeEntryId) ?? pp.entries[0];
    if (active?.role === 'lead') return 'lead';
  }
  return 'member';
}

export function normalizeCVData(cvData: CVData): CVData {
  const legacy = cvData as LegacyCVPartial;
  const merged = { ...defaultCVData, ...cvData };

  return {
    professionalProfile: normalizeProfessionalProfile(merged.professionalProfile, legacy.personalInfo),
    workExperience: (merged.workExperience ?? []).map(normalizeWorkExperience),
    education: merged.education ?? [],
    competencies: normalizeCompetencies(legacy.competencies),
    othersMisc: normalizeOthersMisc(legacy),
    role: normalizeRole(legacy),
  };
}
