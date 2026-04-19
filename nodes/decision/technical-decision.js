/**
 * Node: Decisão Técnica (Versão alinhada ao modelo ponderado)
 * Workflow: Software Risk Assessment
 * Descrição: Gera parecer técnico baseado em score ponderado (1-5) e contexto
 * Autor: domcabral9
 * Data: 2026-04
 *
 * Objetivo:
 * - Tornar o parecer mais explicável
 * - Alinhar com classificação: Homologado / Aguardando Ajustes / Rejeitado
 * - Considerar contexto (hosting, criticidade, dados, exposição)
 */

function normalizeBoolean(value) {
  if (!value) return false;
  return value.toString().trim().toLowerCase() === "sim";
}

function normalizeText(value) {
  if (!value) return "Não informado";
  return value.toString().trim();
}

const data = { ...$json };

const appName = normalizeText(data.APP_NAME);
const criticality = normalizeText(data.APP_CRITICALITY);
const hosting = normalizeText(data.INFRA_HOSTING);
const classification = data.risk_classification || "Não classificado";
const score = data.risk_score || "N/A";

/**
 * Construção do parecer
 */
let parecer = `
PARECER TÉCNICO DE AVALIAÇÃO DE SOFTWARE

Aplicação: ${appName}
Criticidade: ${criticality}
Modelo de hospedagem: ${hosting}

Score final (1-5): ${score}
Classificação: ${classification}

Resumo da análise:
`;

let pontosPositivos = [];
let pontosAtencao = [];
let riscosCriticos = [];

/**
 * Avaliação baseada em critérios (alinhado ao novo modelo)
 */

// Exposição
if (normalizeBoolean(data.INFRA_INTERNET_EXPOSED)) {
  pontosAtencao.push("Aplicação exposta à internet, aumentando a superfície de ataque.");
} else {
  pontosPositivos.push("Aplicação sem exposição direta à internet.");
}

// Dados pessoais
if (normalizeBoolean(data.DATA_PERSONAL_DATA)) {
  riscosCriticos.push("Processamento de dados pessoais identificado (impacto regulatório e LGPD).");
} else {
  pontosPositivos.push("Não há indicação de tratamento de dados pessoais.");
}

// MFA
if (!normalizeBoolean(data.SEC_MFA)) {
  riscosCriticos.push("Ausência de autenticação multifator (MFA).");
} else {
  pontosPositivos.push("MFA habilitado.");
}

// SSO
if (!normalizeBoolean(data.SEC_SSO)) {
  pontosAtencao.push("Ausência de autenticação centralizada (SSO).");
} else {
  pontosPositivos.push("SSO implementado.");
}

// RBAC
if (!normalizeBoolean(data.SEC_ROLE_BASED_ACCESS)) {
  pontosAtencao.push("Controle de acesso baseado em papéis (RBAC) não identificado.");
} else {
  pontosPositivos.push("RBAC implementado.");
}

// Logging
if (!normalizeBoolean(data.SEC_AUDIT_LOGGING)) {
  pontosAtencao.push("Ausência de trilhas de auditoria (logging). Possível dificuldade em investigações.");
} else {
  pontosPositivos.push("Auditoria e logging habilitados.");
}

// Integrações
if (data.APP_INTEGRATIONS && data.APP_INTEGRATIONS !== "Não") {
  pontosAtencao.push("A aplicação possui integrações externas (avaliar risco de cadeia/supply chain).");
}

/**
 * Montagem estruturada
 */

if (pontosPositivos.length > 0) {
  parecer += "\nPontos positivos:\n";
  pontosPositivos.forEach(p => {
    parecer += `- ${p}\n`;
  });
}

if (pontosAtencao.length > 0) {
  parecer += "\nPontos de atenção:\n";
  pontosAtencao.forEach(p => {
    parecer += `- ${p}\n`;
  });
}

if (riscosCriticos.length > 0) {
  parecer += "\nRiscos críticos:\n";
  riscosCriticos.forEach(r => {
    parecer += `- ${r}\n`;
  });
}

/**
 * Recomendação baseada no novo modelo
 */

let recomendacao = "";

switch (classification) {
  case "Homologado":
    recomendacao = "A aplicação atende aos critérios mínimos de segurança e pode ser homologada para uso.";
    break;

  case "Aguardando Ajustes":
    recomendacao = "A aplicação apresenta riscos moderados. Recomenda-se a implementação de melhorias antes da homologação definitiva.";
    break;

  case "Rejeitado":
    recomendacao = "A aplicação apresenta riscos elevados e não deve ser homologada até a mitigação dos pontos críticos.";
    break;

  default:
    recomendacao = "Não foi possível determinar uma recomendação automática. Avaliação manual necessária.";
}

/**
 * Regras adicionais de negócio (camada estratégica)
 */

// Alta criticidade exige revisão manual
if (criticality === "Alta") {
  recomendacao += " Devido à alta criticidade, é obrigatória validação manual pela equipe de segurança.";
}

// Dados pessoais + ausência de MFA = bloqueio forte
if (normalizeBoolean(data.DATA_PERSONAL_DATA) && !normalizeBoolean(data.SEC_MFA)) {
  recomendacao += " A ausência de MFA em contexto com dados pessoais é um fator impeditivo para homologação.";
}

// SaaS sem SSO é um risco relevante
if (hosting === "SaaS" && !normalizeBoolean(data.SEC_SSO)) {
  recomendacao += " Para soluções SaaS, a ausência de SSO representa risco elevado de gestão de identidade.";
}

parecer += `\nRecomendação:\n\n${recomendacao}\n`;

/**
 * Saída final
 */

data.technical_opinion = parecer;

data.technical_metadata = {
  classification,
  score,
  criticality,
  hosting,
  riscosCriticosCount: riscosCriticos.length
};

return [
  {
    json: data
  }
];