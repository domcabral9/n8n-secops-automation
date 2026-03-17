/**
 * Node: Gerador de Score
 * Workflow: Software Risk Assessment
 * Descrição: Calcula o score de risco com base em critérios de segurança
 * Autor: domcabral9
 * Data: 2026-03
 */

function normalizeBoolean(value) {
  if (!value) return false;
  return value.toString().trim().toLowerCase() === "sim";
}

const data = { ...$json };
let score = 0;

// Regras de risco
if (data.criticality === "Alta") {
  score += 3;
}

if (normalizeBoolean(data.internet_exposed)) {
  score += 3;
}

if (normalizeBoolean(data.personal_data)) {
  score += 2;
}

if (!normalizeBoolean(data.mfa)) {
  score += 2;
}

if (!normalizeBoolean(data.sso)) {
  score += 1;
}

// Classificação de risco
let risk_level = "Baixo";

if (score >= 7) {
  risk_level = "Alto";
} else if (score >= 4) {
  risk_level = "Médio";
}

// Saída padronizada
data.risk_score = score;
data.risk_level = risk_level;

return [
  {
    json: data
  }
];