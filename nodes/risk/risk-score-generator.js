/**
 * Node: Gerador de Score (Versão com Peso)
 * Workflow: Software Risk Assessment
 * Descrição: Calcula score ponderado (1-5) baseado em critérios de segurança e contexto de hosting
 * Autor: domcabral9
 * Data: 2026-04
 *
 * Regra de classificação:
 * 4.0 - 5.0 => Homologado (Recomendado para uso)
 * 3.0 - 3.9 => Aguardando Ajustes
 * < 3.0     => Rejeitado
 */

function normalizeBoolean(value) {
  if (!value) return false;
  return value.toString().trim().toLowerCase() === "sim";
}

function normalizeText(value) {
  if (!value) return "";
  return value.toString().trim();
}

const data = { ...$json };

/**
 * Definição de pesos dinâmicos por tipo de infraestrutura
 * Ajuste fino: SaaS e Cloud Fornecedor assumem menos controle direto
 */
const hosting = normalizeText(data.INFRA_HOSTING);

let weightProfile = {
  criticality: 1.0,
  internet_exposed: 1.0,
  personal_data: 1.0,
  mfa: 1.0,
  sso: 1.0,
  rbac: 1.0,
  audit_log: 1.0
};

switch (hosting) {
  case "SaaS":
    weightProfile = {
      criticality: 1.2,
      internet_exposed: 0.8,
      personal_data: 1.3,
      mfa: 1.2,
      sso: 1.2,
      rbac: 1.1,
      audit_log: 1.1
    };
    break;

  case "Cloud Fornecedor":
  case "Cloud Publica":
    weightProfile = {
      criticality: 1.2,
      internet_exposed: 1.2,
      personal_data: 1.2,
      mfa: 1.3,
      sso: 1.2,
      rbac: 1.1,
      audit_log: 1.1
    };
    break;

  case "On-premise":
    weightProfile = {
      criticality: 1.1,
      internet_exposed: 1.3,
      personal_data: 1.1,
      mfa: 1.2,
      sso: 1.0,
      rbac: 1.2,
      audit_log: 1.3
    };
    break;

  default:
    // "Não sei" ou não informado
    weightProfile = {
      criticality: 1.0,
      internet_exposed: 1.0,
      personal_data: 1.0,
      mfa: 1.0,
      sso: 1.0,
      rbac: 1.0,
      audit_log: 1.0
    };
}

/**
 * Avaliação individual (nota de 1 a 5)
 * 5 = melhor cenário (baixo risco)
 * 1 = pior cenário (alto risco)
 */

function scoreCriticality(value) {
  switch (value) {
    case "Alta": return 1;
    case "Média": return 3;
    case "Baixa": return 5;
    default: return 2;
  }
}

function scoreBooleanSecurity(isEnabled, positiveScore = 5, negativeScore = 1) {
  return isEnabled ? positiveScore : negativeScore;
}

// Cálculo das notas individuais
const scores = {
  criticality: scoreCriticality(data.APP_CRITICALITY),
  internet_exposed: scoreBooleanSecurity(!normalizeBoolean(data.INFRA_INTERNET_EXPOSED)),
  personal_data: scoreBooleanSecurity(!normalizeBoolean(data.DATA_PERSONAL_DATA)),
  mfa: scoreBooleanSecurity(normalizeBoolean(data.SEC_MFA)),
  sso: scoreBooleanSecurity(normalizeBoolean(data.SEC_SSO)),
  rbac: scoreBooleanSecurity(normalizeBoolean(data.SEC_ROLE_BASED_ACCESS)),
  audit_log: scoreBooleanSecurity(normalizeBoolean(data.SEC_AUDIT_LOGGING))
};

/**
 * Cálculo ponderado
 */
let weightedSum = 0;
let totalWeight = 0;

for (const key in scores) {
  const weight = weightProfile[key] || 1;
  weightedSum += scores[key] * weight;
  totalWeight += weight;
}

const finalScore = weightedSum / totalWeight;

/**
 * Classificação final
 */
let classification = "Rejeitado";

if (finalScore >= 4.0) {
  classification = "Homologado";
} else if (finalScore >= 3.0) {
  classification = "Aguardando Ajustes";
}

/**
 * Saída estruturada
 */
data.risk_score = Number(finalScore.toFixed(2));
data.risk_classification = classification;
data.risk_details = {
  scores,
  weights: weightProfile
};

return [
  {
    json: data
  }
];
