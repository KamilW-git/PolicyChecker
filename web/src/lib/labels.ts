export const requestStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'Szkic',
    SUBMITTED: 'Złożony',
    IN_REVIEW: 'W recenzji',
    AUTO_APPROVED: 'Zatwierdzono automatycznie',
    APPROVED: 'Zatwierdzono',
    REJECTED: 'Odrzucono',
    NEEDS_INFORMATION: 'Braki informacji',
    APPROVED_WITH_EXCEPTION: 'Zatwierdzono z wyjątkiem',
    CANCELLED: 'Anulowano',
  };
  return map[status] || status;
};

export const decisionLabel = (decision: string | null) => {
  if (!decision) return 'Brak';
  const map: Record<string, string> = {
    APPROVED: 'Zatwierdzono',
    REJECTED: 'Odrzucono',
    REQUIRES_REVIEW: 'Wymaga recenzji',
    MISSING_INFORMATION: 'Braki informacji',
  };
  return map[decision] || decision;
};

export const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    REQUESTER: 'Wnioskodawca',
    REVIEWER: 'Recenzent',
    POLICY_OWNER: 'Właściciel polityki',
    POLICY_APPROVER: 'Zatwierdzający polityki',
    AUDITOR: 'Audytor',
    ADMIN: 'Administrator',
  };
  return map[role] || role;
};

export const missingFieldLabel = (field: string) => {
  const map: Record<string, string> = {
    dpaDocument: 'Dokument DPA',
    hasDpa: 'Posiada DPA',
    emergencyJustification: 'Uzasadnienie awaryjne',
  };
  return map[field] || field;
};

export const urgencyLabel = (urgency: string | null) => {
  if (!urgency) return 'Brak';
  const map: Record<string, string> = {
    NORMAL: 'Normalna',
    HIGH: 'Wysoka',
    EMERGENCY: 'Awaryjna',
  };
  return map[urgency] || urgency;
};

export const vendorRiskLabel = (risk: string | null) => {
  if (!risk) return 'Brak';
  const map: Record<string, string> = {
    LOW: 'Niskie',
    MEDIUM: 'Średnie',
    HIGH: 'Wysokie',
    CRITICAL: 'Krytyczne',
  };
  return map[risk] || risk;
};

export const policyStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    PUBLISHED: 'Opublikowana',
    DRAFT: 'Robocza',
    ARCHIVED: 'Zarchiwizowana',
  };
  return map[status] || status;
};

export const policyVersionStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'Robocza',
    IN_REVIEW: 'W recenzji',
    PUBLISHED: 'Opublikowana',
    REJECTED: 'Odrzucona',
  };
  return map[status] || status;
};

export const categoryLabel = (category: string) => {
  const map: Record<string, string> = {
    SAAS: 'SaaS',
    HARDWARE: 'Sprzęt',
    CONSULTING: 'Doradztwo',
    MARKETING_SERVICE: 'Marketing',
    SOFTWARE: 'Oprogramowanie',
  };
  return map[category] || category;
};

export const departmentLabel = (dept: string) => {
  const map: Record<string, string> = {
    IT: 'IT',
    HR: 'HR',
    FINANCE: 'Finanse',
    PROCUREMENT: 'Zakupy',
  };
  return map[dept] || dept;
};

export const auditActionLabel = (action: string) => {
  const map: Record<string, string> = {
    CREATE_REQUEST: 'Utworzenie wniosku',
    SUBMIT_REQUEST: 'Złożenie wniosku',
    RESUBMIT_REQUEST: 'Ponowne złożenie wniosku',
    ADD_COMMENT: 'Dodanie komentarza',
    UPLOAD_ATTACHMENT: 'Wgranie załącznika',
    MANUAL_OVERRIDE: 'Decyzja ręczna',
    CREATE_POLICY: 'Utworzenie polityki',
    UPDATE_POLICY: 'Aktualizacja polityki',
    CREATE_POLICY_VERSION: 'Utworzenie wersji polityki',
    SUBMIT_POLICY_VERSION: 'Przekazanie do recenzji',
    APPROVE_POLICY_VERSION: 'Zatwierdzenie polityki',
    REJECT_POLICY_VERSION: 'Odrzucenie polityki',
  };
  return map[action] || action;
};

export const effectTriggeredLabel = (effect: string) => {
  const map: Record<string, string> = {
    REQUIRE_FIELD: 'Wymagane pole',
    REQUIRE_APPROVAL: 'Wymagana akceptacja',
    REJECT: 'Odrzucenie',
    APPROVE: 'Zatwierdzenie',
  };
  return map[effect] || effect;
};

export const domainLabel = (domain: string) => {
  const map: Record<string, string> = {
    PROCUREMENT: 'Zakupy',
    IT: 'IT',
    HR: 'HR',
    FINANCE: 'Finanse',
    LEGAL: 'Prawo',
    SECURITY: 'Bezpieczeństwo',
  };
  return map[domain] || domain;
};
