export interface PersonalInfo {
  fullName: string;
  address: string;
  phone: string;
  email: string;
  linkedin: string;
  nationality: string;
  dateOfBirth: string;
  photo: string | null;
  showPersonalInfo: boolean;
}

export interface ProfessionalProfile {
  jobTitle: string;
  summary: string;
}

export interface WorkExperience {
  id: string;
  startDate: string;
  endDate: string;
  isCurrentJob: boolean;
  jobTitle: string;
  company: string;
  location: string;
  responsibilities: string[];
  technologies: string;
  sector: string;
  isManager: boolean;
  peopleManaged: number;
  teamDescription: string;
}

export interface Education {
  id: string;
  startDate: string;
  endDate: string;
  qualification: string;
  institution: string;
  subjects: string;
  level: string;
}

export type LanguageLevel = '' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Language {
  id: string;
  name: string;
  listening: LanguageLevel;
  reading: LanguageLevel;
  spokenInteraction: LanguageLevel;
  spokenProduction: LanguageLevel;
  writing: LanguageLevel;
}

export interface Competencies {
  motherTongue: string;
  languages: Language[];
  technicalSkills: string;
  socialSkills: string;
  organizationalSkills: string;
  otherSkills: string;
  drivingLicense: string;
}

export interface CVData {
  personalInfo: PersonalInfo;
  professionalProfile: ProfessionalProfile;
  workExperience: WorkExperience[];
  education: Education[];
  competencies: Competencies;
}

export const defaultCVData: CVData = {
  personalInfo: {
    fullName: '',
    address: '',
    phone: '',
    email: '',
    linkedin: '',
    nationality: '',
    dateOfBirth: '',
    photo: null,
    showPersonalInfo: true,
  },
  professionalProfile: {
    jobTitle: '',
    summary: '',
  },
  workExperience: [],
  education: [],
  competencies: {
    motherTongue: '',
    languages: [],
    technicalSkills: '',
    socialSkills: '',
    organizationalSkills: '',
    otherSkills: '',
    drivingLicense: '',
  },
};
