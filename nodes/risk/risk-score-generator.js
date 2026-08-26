/**
 * Node: Gerador de Score
 * Workflow: Software Risk Assessment
 *
 * Calcula o score de risco ponderado (1-5) a partir dos campos ja
 * normalizados pelo Apps Script (ver apps-script/normalizacao.gs) e
 * repassados pelo node "Normalizacao" do n8n. Nao deve receber nem tratar
 * nomes de campo alternativos - o contrato de entrada e fixo.
 */

const raw = $json;

/**
 * As 6 perguntas booleanas do formulario sao hoje um radio fechado
 * Sim/Nao/Nao sei informar - "sim" e o unico valor tratado como verdadeiro,
 * "nao sei informar" e tratado como neutro (mesmo caminho que "nao").
 */
function normalizeBoolean(value) {
  if (typeof value !== 'string') return false;
  return value.trim().toLowerCase() === 'sim';
}

const normalized = {
  app_name: raw.app_name || 'Não informado',
  criticality: raw.app_criticality || 'Não informado',
  hosting: raw.infra_hosting || 'Não informado',
  internet_exposed: normalizeBoolean(raw.infra_internet_exposed),
  personal_data: normalizeBoolean(raw.data_personal_data),
  mfa: normalizeBoolean(raw.sec_mfa),
  sso: normalizeBoolean(raw.sec_sso),
  rbac: normalizeBoolean(raw.sec_role_based_access),
  audit: normalizeBoolean(raw.sec_audit_logging)
};

const weights = {
  criticality: 2.0,
  internet_exposed: 1.5,
  personal_data: 1.5,
  mfa: 2.0,
  sso: 1.0,
  rbac: 1.0,
  audit: 1.0
};

const scores = {
  criticality: 1,
  internet_exposed: normalized.internet_exposed ? 5 : 1,
  personal_data: normalized.personal_data ? 5 : 1,
  mfa: normalized.mfa ? 1 : 5,
  sso: normalized.sso ? 1 : 3,
  rbac: normalized.rbac ? 1 : 3,
  audit: normalized.audit ? 1 : 3
};

switch (normalized.criticality.toLowerCase()) {
  case 'crítica':
    scores.criticality = 5;
    break;

  case 'alta':
    scores.criticality = 4;
    break;

  case 'média':
    scores.criticality = 3;
    break;

  case 'baixa':
    scores.criticality = 1;
    break;

  default:
    scores.criticality = 2;
}

let weighted_sum = 0;
let total_weight = 0;

for (const key in scores) {
  weighted_sum += scores[key] * weights[key];
  total_weight += weights[key];
}

const final_score = Number((weighted_sum / total_weight).toFixed(2));

let risk_level = 'Baixo';
let recommendation = 'Homologado';

if (final_score >= 4) {
  risk_level = 'Alto';
  recommendation = 'Não Homologado';
} else if (final_score >= 2.5) {
  risk_level = 'Médio';
  recommendation = 'Homologado com Ressalvas';
}

const debug_score = {
  normalized,
  scores,
  weights,
  weighted_sum,
  total_weight,
  final_score
};

return [{
  ...raw,

  normalized,

  analysis: {
    risk_score: final_score,
    risk_level,
    recommendation
  },

  debug_score
}];
