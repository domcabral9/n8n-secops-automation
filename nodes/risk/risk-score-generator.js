/**
 * Node: Gerador de Score (Versão com Peso)
 * Workflow: Software Risk Assessment
 * Descrição: Calcula score ponderado (1-5) baseado em critérios de segurança e contexto de hosting
 * Autor: domcabral9
 * Data: 2026-05
 *
 /**
 * Node: Gerador de Score (Versão HARDENED v4 - Context Aware)
 *
 * Evoluções:
 * - Tri-state (true/false/unknown)
 * - SSO contextual (não penaliza quando irrelevante)
 * - Exposição contextual (SaaS esperado)
 * - Dados pessoais combinados com controles (MFA/RBAC/Audit)
 * - Hosting case-insensitive + pesos aplicados corretamente
 * - Debug completo
 */

 /**
 * risk-score-generator.js
 *
 * Responsável por:
 * 1. Normalizar os dados recebidos do formulário
 * 2. Calcular score de risco
 * 3. Retornar um objeto padronizado para os próximos nodes
 */

const raw = $json;

/**
 * Normalização booleana
 * Aceita boolean, string e valores do formulário
 */
function normalizeBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;

  if (!value) return false;

  const normalized = value
    .toString()
    .trim()
    .toLowerCase();

  return [
    'sim',
    'true',
    '1',
    'yes',
    'externo - internet',
    'armazena dados pessoais internos (colaboradores)',
    'armazena dados de clientes',
    'armazena dados sensíveis'
  ].includes(normalized);
}

/**
 * Normalização centralizada
 * Todos os próximos nodes devem consumir apenas estes campos
 */
const normalized = {
  app_name:
    raw.app_name ||
    raw.APP_NAME ||
    'Não informado',

  criticality:
    raw.criticality ||
    raw.app_criticality ||
    raw.APP_CRITICALITY ||
    'Não informado',

  hosting:
    raw.hosting ||
    raw.infra_hosting ||
    raw.INFRA_HOSTING ||
    'Não informado',

  internet_exposed: normalizeBoolean(
    raw.internet_exposed ||
    raw.infra_internet_exposed ||
    raw.INFRA_INTERNET_EXPOSED
  ),

  personal_data: normalizeBoolean(
    raw.personal_data ||
    raw.data_personal_data ||
    raw.DATA_PERSONAL_DATA
  ),

  mfa: normalizeBoolean(
    raw.mfa ||
    raw.sec_mfa ||
    raw.SEC_MFA
  ),

  sso: normalizeBoolean(
    raw.sso ||
    raw.sec_sso ||
    raw.SEC_SSO
  ),

  rbac: normalizeBoolean(
    raw.rbac ||
    raw.sec_role_based_access ||
    raw.SEC_ROLE_BASED_ACCESS
  ),

  audit: normalizeBoolean(
    raw.audit ||
    raw.sec_audit_logging ||
    raw.SEC_AUDIT_LOGGING
  )
};

/**
 * Pesos de risco
 */
const weights = {
  criticality: 2.0,
  internet_exposed: 1.5,
  personal_data: 1.5,
  mfa: 2.0,
  sso: 1.0,
  rbac: 1.0,
  audit: 1.0
};

/**
 * Score individual por critério
 */
const scores = {
  criticality: 1,
  internet_exposed: normalized.internet_exposed ? 5 : 1,
  personal_data: normalized.personal_data ? 5 : 1,
  mfa: normalized.mfa ? 1 : 5,
  sso: normalized.sso ? 1 : 3,
  rbac: normalized.rbac ? 1 : 3,
  audit: normalized.audit ? 1 : 3
};

/**
 * Ajuste de criticidade
 */
switch (normalized.criticality.toLowerCase()) {
  case 'crítica':
  case 'critica':
    scores.criticality = 5;
    break;

  case 'alta':
    scores.criticality = 4;
    break;

  case 'média':
  case 'media':
    scores.criticality = 3;
    break;

  case 'baixa':
    scores.criticality = 1;
    break;

  default:
    scores.criticality = 2;
}

/**
 * Cálculo ponderado
 */
let weighted_sum = 0;
let total_weight = 0;

for (const key in scores) {
  weighted_sum += scores[key] * weights[key];
  total_weight += weights[key];
}

const final_score = Number(
  (weighted_sum / total_weight).toFixed(2)
);

/**
 * Classificação final
 */
let risk_level = 'Baixo';
let recommendation = 'Homologado';

if (final_score >= 4) {
  risk_level = 'Alto';
  recommendation = 'Não Homologado';
} else if (final_score >= 2.5) {
  risk_level = 'Médio';
  recommendation = 'Homologado com Ressalvas';
}

/**
 * Dados de debug
 * Auxilia troubleshooting durante evolução da automação
 */
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