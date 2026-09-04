/**
 * Node: Gerador de Score
 * Workflow: Software Risk Assessment
 *
 * Calcula Probabilidade, Impacto e o score final (0-5, maior = mais seguro) a
 * partir dos campos ja normalizados pelo Apps Script (ver
 * apps-script/normalizacao.gs) e repassados pelo node "Normalizacao" do n8n.
 * Nao deve receber nem tratar nomes de campo alternativos - o contrato de
 * entrada e fixo.
 *
 * Segue o mesmo padrao do risk-engine.service.ts do morpheus-beta: cada
 * criterio tem peso (importancia) e dimensao (PROBABILITY ou IMPACT), o motor
 * calcula uma media ponderada de risco por dimensao (0=seguro, 5=risco
 * maximo) e inverte (5 - risco) pra um score de seguranca. Probabilidade e
 * Impacto sao so diagnostico - nao ha regra de piso cruzando as duas; a
 * classificacao final vem de uma faixa unica sobre o score total, igual ao
 * morpheus-beta em runtime (a grade Probabilidade x Impacto la e so visual).
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

function criticalityRisk(value) {
  switch ((value || '').toLowerCase()) {
    case 'crítica':
      return 5;
    case 'alta':
      return 4;
    case 'média':
      return 2;
    case 'baixa':
      return 0;
    default:
      // Dado ausente/inesperado: assume risco moderado-alto, nao baixo -
      // na duvida trata como mais arriscado, nunca mais seguro.
      return 3;
  }
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

// Software autonomo (Adobe Reader, um navegador) nunca vai ter MFA/SSO/RBAC/
// logs de acesso - nao porque o controle e ruim, mas porque a pergunta nao
// se aplica. "Standalone" so SUSPENDE A PENALIDADE de "ausente"; um "Sim"
// real (ex.: gerenciador de senhas local com MFA proprio) sempre conta como
// credito, mesmo com hospedagem Standalone.
const STANDALONE_HOSTING = 'Standalone (instalação local, sem login)';
const isStandalone = normalized.hosting === STANDALONE_HOSTING;

function applicable(rawAnswer) {
  return !(isStandalone && !normalizeBoolean(rawAnswer));
}

/**
 * Fonte unica de verdade de peso + dimensao por criterio. `risk` e sempre
 * 0 (seguro) a 5 (risco maximo) - a importancia relativa vive so no peso,
 * nao mais tambem num teto de escala diferente por criterio. `applicable:
 * false` exclui o criterio do calculo (nem soma como risco nem como seguro)
 * - ver STANDALONE_HOSTING acima.
 *
 * PROBABILITY = afeta a chance de um incidente ocorrer (autenticacao,
 * exposicao). IMPACT = afeta a gravidade se ocorrer (criticidade do
 * negocio, dados pessoais, blast radius, capacidade de resposta) - RBAC e
 * Auditoria entram como IMPACT porque nao mudam a chance de comprometimento,
 * só o tamanho do estrago e a velocidade de deteccao/resposta depois dele.
 */
// Pesos validados contra NIST SP 800-53 Rev 5 / SP 800-122 (nenhuma norma da
// peso numerico - o que segue e nossa interpretacao em cima do que elas
// definem como exigencia por linha de base, nao um numero literal da NIST):
// - Criticidade (3.0): e o eixo que decide toda a linha de base do NIST
//   (FIPS 199) - o maior peso do modelo de proposito.
// - Dados pessoais (2.0): SP 800-122 trata confidencialidade de PII como
//   categoria de dano distinta e grave (dano ao individuo, responsabilidade
//   legal), nao so mais um campo de dado.
// - MFA (2.0) e RBAC (1.5): IA-2(1)/(2) (MFA) e AC-6 (privilegio minimo,
//   base do RBAC) sao exigidos a partir da linha de base Moderada no NIST -
//   mesmo degrau de exigencia, por isso RBAC subiu pra perto do MFA (antes
//   pesava a metade sem motivo claro).
// - Auditoria (1.0, mantido): AU-2 (log basico) e exigido ate na linha
//   Baixa - e universal no NIST, nao um diferencial de sistema critico, por
//   isso nao ganhou reforco extra igual MFA/RBAC.
const RISK_CRITERIA = [
  { key: 'criticality', weight: 3.0, dimension: 'IMPACT', risk: criticalityRisk(normalized.criticality), applicable: true },
  { key: 'mfa', weight: 2.0, dimension: 'PROBABILITY', risk: normalized.mfa ? 0 : 5, applicable: applicable(raw.sec_mfa) },
  { key: 'internet_exposed', weight: 1.5, dimension: 'PROBABILITY', risk: normalized.internet_exposed ? 5 : 0, applicable: true },
  { key: 'personal_data', weight: 2.0, dimension: 'IMPACT', risk: normalized.personal_data ? 5 : 0, applicable: true },
  { key: 'sso', weight: 1.0, dimension: 'PROBABILITY', risk: normalized.sso ? 0 : 5, applicable: applicable(raw.sec_sso) },
  { key: 'rbac', weight: 1.5, dimension: 'IMPACT', risk: normalized.rbac ? 0 : 5, applicable: applicable(raw.sec_role_based_access) },
  { key: 'audit', weight: 1.0, dimension: 'IMPACT', risk: normalized.audit ? 0 : 5, applicable: applicable(raw.sec_audit_logging) }
];

const PROBABILITY_LEVELS = [
  { id: 'Alta', min: 0, max: 1.66 },
  { id: 'Média', min: 1.67, max: 3.33 },
  { id: 'Baixa', min: 3.34, max: 5 }
];
const IMPACT_LEVELS = [
  { id: 'Alto', min: 0, max: 1.66 },
  { id: 'Médio', min: 1.67, max: 3.33 },
  { id: 'Baixo', min: 3.34, max: 5 }
];
// Faixas de classificacao final. Corte de "Homologado" amenizado pra 3.5
// (era 4.0, valor literal do classificationDefs do morpheus-beta) apos
// validacao com perfis diversos - 4.0/5.0 (80%) se mostrou rigoroso demais
// na pratica. Sem base numerica na NIST (nenhuma norma da corte de
// aprovacao) - decisao de apetite de risco, nao um numero derivado.
const CLASSIFICATIONS = [
  { id: 'Não Homologado', min: 0, max: 2.99 },
  { id: 'Homologado com Ressalvas', min: 3.0, max: 3.49 },
  { id: 'Homologado', min: 3.5, max: 5 }
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function weightedAverageRisk(items) {
  const applicableItems = items.filter((item) => item.applicable !== false);
  const totalWeight = applicableItems.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = applicableItems.reduce((sum, item) => sum + item.risk * item.weight, 0);
  return weightedSum / totalWeight;
}

function findLevel(bands, score) {
  return bands.find((band) => score >= band.min && score <= band.max) || bands[bands.length - 1];
}

const probabilityItems = RISK_CRITERIA.filter((c) => c.dimension === 'PROBABILITY');
const impactItems = RISK_CRITERIA.filter((c) => c.dimension === 'IMPACT');

const probability_risk = weightedAverageRisk(probabilityItems);
const impact_risk = weightedAverageRisk(impactItems);
const total_risk = weightedAverageRisk(RISK_CRITERIA);

const probability_score = Number(clamp(5 - probability_risk, 0, 5).toFixed(2));
const impact_score = Number(clamp(5 - impact_risk, 0, 5).toFixed(2));
const risk_score = Number(clamp(5 - total_risk, 0, 5).toFixed(2));

const probability_level = findLevel(PROBABILITY_LEVELS, probability_score).id;
const impact_level = findLevel(IMPACT_LEVELS, impact_score).id;
const recommendation = findLevel(CLASSIFICATIONS, risk_score).id;

let risk_level;
switch (recommendation) {
  case 'Não Homologado':
    risk_level = 'Alto';
    break;
  case 'Homologado com Ressalvas':
    risk_level = 'Médio';
    break;
  default:
    risk_level = 'Baixo';
}

/**
 * Criticidade e 100% autodeclarada por quem preenche o formulario (muitas
 * vezes um usuario comum, nao alguem de seguranca) - e o criterio de maior
 * peso do modelo, entao um erro aqui distorce o resultado inteiro. O motor
 * NUNCA sobrescreve o valor declarado - so sinaliza quando ele destoa
 * fortemente de outros sinais do proprio formulario, pra um humano revisar.
 * Checagens conservadoras, so com campos cujo valor exato ja conhecemos.
 */
function checkCriticalityMismatch(raw, normalized) {
  const crit = (normalized.criticality || '').toLowerCase();
  const personalDataSensitive = (raw.data_personal_type || '').toLowerCase().includes('sensíve');
  const hasIntegrations = (raw.app_integrations || '').trim().toLowerCase() === 'sim';

  if (crit === 'baixa' && (personalDataSensitive || hasIntegrations)) {
    return 'Criticidade declarada como Baixa, mas o software trata dados sensíveis e/ou integra com outros sistemas - revisar classificação.';
  }
  if (crit === 'crítica' && isStandalone && !hasIntegrations && !normalized.personal_data) {
    return 'Criticidade declarada como Crítica, mas o software é standalone, sem integrações nem dados pessoais - revisar classificação.';
  }
  return '';
}

const criticality_review_flag = checkCriticalityMismatch(raw, normalized);

const debug_score = {
  normalized,
  criteria: RISK_CRITERIA,
  probability_risk,
  impact_risk,
  total_risk
};

return [{
  ...raw,

  normalized,

  analysis: {
    risk_score,
    risk_level,
    recommendation,
    probability_score,
    probability_level,
    impact_score,
    impact_level,
    criticality_review_flag
  },

  debug_score
}];
