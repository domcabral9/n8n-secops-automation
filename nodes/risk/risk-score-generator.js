/**
 * Node: Gerador de Score (Versão com Peso)
 * Workflow: Software Risk Assessment
 * Descrição: Calcula score ponderado (1-5) baseado em critérios de segurança e contexto de hosting
 * Autor: domcabral9
 * Data: 2026-04
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

function normalizeTriState(value) {
  if (value === undefined || value === null) return "unknown";
  if (typeof value === "boolean") return value;
  const v = value.toString().trim().toLowerCase();
  if (["sim", "true", "1", "yes"].includes(v)) return true;
  if (["não", "nao", "false", "0", "no"].includes(v)) return false;
  return "unknown";
}

function normalizeText(value) {
  if (!value) return "";
  return value.toString().trim();
}

function normalizeKeys(obj) {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    const normalizedKey = key.trim().toLowerCase();
    newObj[normalizedKey] = obj[key];
  });
  return newObj;
}

function pick(data, ...fields) {
  for (const field of fields) {
    const f = field.toLowerCase();
    if (data[f] !== undefined && data[f] !== null) {
      return data[f];
    }
  }
  return undefined;
}

const rawData = { ...$json };
const data = normalizeKeys(rawData);

// =========================
// EXTRAÇÃO
// =========================

const criticality = normalizeText(pick(data, "app_criticality", "criticality"));
const hosting = normalizeText(pick(data, "infra_hosting", "hosting")).toLowerCase();

const internetExposed = normalizeTriState(pick(data, "infra_internet_exposed", "internet_exposed"));
const personalData = normalizeTriState(pick(data, "data_personal_data", "personal_data"));
const mfa = normalizeTriState(pick(data, "sec_mfa", "mfa"));
const sso = normalizeTriState(pick(data, "sec_sso", "sso"));
const rbac = normalizeTriState(pick(data, "sec_role_based_access", "role_based_access"));
const audit = normalizeTriState(pick(data, "sec_audit_logging", "audit_logging"));

// =========================
// PESOS POR CONTEXTO
// =========================

let weightProfile = {
  criticality: 1,
  internet_exposed: 1,
  personal_data: 1,
  mfa: 1,
  sso: 1,
  rbac: 1,
  audit_log: 1
};

switch (hosting) {
  case "saas":
    weightProfile = {
      criticality: 1.2,
      internet_exposed: 0.8,
      personal_data: 1.3,
      mfa: 1.3,
      sso: 1.2,
      rbac: 1.1,
      audit_log: 1.1
    };
    break;

  case "cloud fornecedor":
  case "cloud publica":
    weightProfile = {
      criticality: 1.2,
      internet_exposed: 1.2,
      personal_data: 1.3,
      mfa: 1.3,
      sso: 1.2,
      rbac: 1.1,
      audit_log: 1.1
    };
    break;

  case "on-premise":
    weightProfile = {
      criticality: 1.1,
      internet_exposed: 1.3,
      personal_data: 1.1,
      mfa: 1.2,
      sso: 0.5,
      rbac: 1.2,
      audit_log: 1.3
    };
    break;
}

// =========================
// SCORE FUNCTIONS
// =========================

function scoreCriticality(value) {
  const v = value.toLowerCase();
  if (v === "alta") return 1;
  if (v === "média" || v === "media") return 3;
  if (v === "baixa") return 5;
  return 2;
}

function scoreSSO(sso, context) {
  const { hosting, personalData, criticality } = context;

  if (!personalData && criticality !== "Alta") return 5;
  if (hosting === "on-premise") return 4;

  if (sso === true) return 5;
  if (sso === false) return 1;
  return 3;
}

function scoreExposure(internetExposed, context) {
  const { hosting, mfa } = context;

  if (hosting === "saas") {
    return mfa === true ? 4 : 2;
  }

  if (internetExposed === true) {
    return mfa === true ? 3 : 1;
  }

  return 5;
}

function scorePersonalData(personalData, controls) {
  if (personalData !== true) return 5;

  let protectionLevel = 0;
  if (controls.mfa === true) protectionLevel++;
  if (controls.rbac === true) protectionLevel++;
  if (controls.audit === true) protectionLevel++;

  if (protectionLevel >= 3) return 5;
  if (protectionLevel === 2) return 4;
  if (protectionLevel === 1) return 2;

  return 1;
}

function scoreBoolean(tri) {
  if (tri === true) return 5;
  if (tri === false) return 1;
  return 3;
}

// =========================
// CONTEXT
// =========================

const context = {
  hosting,
  personalData: personalData === true,
  criticality,
  mfa
};

// =========================
// SCORES
// =========================

const scores = {
  criticality: scoreCriticality(criticality),
  internet_exposed: scoreExposure(internetExposed, context),
  personal_data: scorePersonalData(personalData, { mfa, rbac, audit }),
  mfa: scoreBoolean(mfa),
  sso: scoreSSO(sso, context),
  rbac: scoreBoolean(rbac),
  audit_log: scoreBoolean(audit)
};

// =========================
// CALCULO
// =========================

let weightedSum = 0;
let totalWeight = 0;

for (const key in scores) {
  const weight = weightProfile[key] || 1;
  weightedSum += scores[key] * weight;
  totalWeight += weight;
}

const finalScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;

// =========================
// CLASSIFICAÇÃO
// =========================

let classification = "Rejeitado";
if (finalScore >= 4.0) classification = "Homologado";
else if (finalScore >= 3.0) classification = "Aguardando Ajustes";

// =========================
// DEBUG
// =========================

rawData.debug_score = {
  inputs_normalized: {
    criticality,
    hosting,
    internetExposed,
    personalData,
    mfa,
    sso,
    rbac,
    audit
  },
  scores,
  weights: weightProfile,
  weightedSum,
  totalWeight
};

// =========================
// OUTPUT
// =========================

rawData.risk_score = Number(finalScore.toFixed(2));
rawData.risk_classification = classification;

return [
  { json: rawData }
];