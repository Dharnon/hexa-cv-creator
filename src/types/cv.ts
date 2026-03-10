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
  showName: boolean;
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
    showName: true,
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

export const sampleCVData: CVData = {
  personalInfo: {
    fullName: 'María García López',
    address: 'Calle Gran Vía 28, 28013 Madrid',
    phone: '+34 612 345 678',
    email: 'maria.garcia@hexaingenieros.com',
    linkedin: 'linkedin.com/in/mariagarcia',
    nationality: 'Española',
    dateOfBirth: '1990-05-15',
    photo: null,
    showPersonalInfo: true,
    showName: true,
  },
  professionalProfile: {
    jobTitle: 'Ingeniera de Proyectos Senior',
    summary: 'Ingeniera industrial con más de 10 años de experiencia en gestión de proyectos de infraestructura y energía. Especializada en dirección de equipos multidisciplinares, optimización de procesos y cumplimiento normativo.',
  },
  workExperience: [
    {
      id: 'exp1',
      startDate: '2021-03',
      endDate: '',
      isCurrentJob: true,
      jobTitle: 'Ingeniera de Proyectos Senior',
      company: 'Hexa Ingenieros',
      location: 'Madrid',
      responsibilities: [
        'Dirección técnica de proyectos de infraestructura energética con presupuestos de hasta 15M€',
        'Coordinación de equipos multidisciplinares de 12 personas',
        'Elaboración de ofertas técnicas y pliegos de prescripciones para licitaciones públicas',
      ],
      technologies: 'AutoCAD, Revit, MS Project, Primavera P6, SAP',
      sector: 'Energía e infraestructura',
      isManager: true,
      peopleManaged: 12,
      teamDescription: 'Equipo multidisciplinar de ingenieros civiles, eléctricos y mecánicos',
    },
    {
      id: 'exp2',
      startDate: '2017-09',
      endDate: '2021-02',
      isCurrentJob: false,
      jobTitle: 'Ingeniera de Proyectos',
      company: 'Acciona Ingeniería',
      location: 'Madrid',
      responsibilities: [
        'Gestión técnica de proyectos de plantas fotovoltaicas y parques eólicos',
        'Redacción de informes técnicos y memorias de cálculo estructural',
      ],
      technologies: 'AutoCAD, MATLAB, PVsyst, ETABS',
      sector: 'Energías renovables',
      isManager: false,
      peopleManaged: 0,
      teamDescription: '',
    },
    {
      id: 'exp3',
      startDate: '2014-06',
      endDate: '2017-08',
      isCurrentJob: false,
      jobTitle: 'Ingeniera Junior',
      company: 'IDOM Consulting',
      location: 'Bilbao',
      responsibilities: [
        'Apoyo en diseño y cálculo de estructuras metálicas',
        'Elaboración de planos y documentación técnica',
      ],
      technologies: 'AutoCAD, CYPE, Robot Structural Analysis',
      sector: 'Consultoría de ingeniería',
      isManager: false,
      peopleManaged: 0,
      teamDescription: '',
    },
  ],
  education: [
    {
      id: 'edu1',
      startDate: '2012-09',
      endDate: '2014-06',
      qualification: 'Máster en Ingeniería Industrial',
      institution: 'Universidad Politécnica de Madrid',
      subjects: 'Dirección de proyectos, Gestión energética, Cálculo avanzado',
      level: 'Máster (MECES 3)',
    },
    {
      id: 'edu2',
      startDate: '2008-09',
      endDate: '2012-06',
      qualification: 'Grado en Ingeniería en Tecnologías Industriales',
      institution: 'Universidad del País Vasco (UPV/EHU)',
      subjects: 'Mecánica, Termodinámica, Resistencia de materiales',
      level: 'Grado (MECES 2)',
    },
  ],
  competencies: {
    motherTongue: 'Español',
    languages: [
      {
        id: 'lang1',
        name: 'Inglés',
        listening: 'C1',
        reading: 'C1',
        spokenInteraction: 'B2',
        spokenProduction: 'B2',
        writing: 'C1',
      },
      {
        id: 'lang2',
        name: 'Francés',
        listening: 'B1',
        reading: 'B2',
        spokenInteraction: 'B1',
        spokenProduction: 'A2',
        writing: 'B1',
      },
    ],
    technicalSkills: 'AutoCAD, Revit, CYPE, MS Project, Primavera P6, MATLAB, SAP. Certificación PMP. Normativa CTE, Eurocódigos y RITE.',
    socialSkills: 'Liderazgo de equipos multidisciplinares. Comunicación eficaz con clientes y administraciones públicas.',
    organizationalSkills: 'Planificación y control de proyectos con metodología PMI. Gestión simultánea de hasta 4 proyectos.',
    otherSkills: 'Disponibilidad para viajar. Voluntariado en Ingeniería Sin Fronteras (2016-2018).',
    drivingLicense: 'B',
  },
};
