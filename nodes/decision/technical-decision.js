/**
 * Node: Decisão Técnica
 * Workflow: Software Risk Assessment
 * Descrição: Gera parecer técnico automatizado com base nos dados coletados
 * Autor: domcabral9
 * Data: 2026-03
 */

function normalizeBoolean(value) {
  if (!value) return false;
  return value.toString().trim().toLowerCase() === "sim";
}

const data = { ...$json };

let parecer = `
Parecer Técnico de Avaliação de Software

Aplicação: ${data.app_name}
Criticidade declarada: ${data.criticality}

Classificação automática de risco: ${data.risk_level}
Score de risco: ${data.risk_score}

Resumo da análise:
`;

let pontosAtencao = [];
let pontosPositivos = [];

// Avaliações
if (normalizeBoolean(data.internet_exposed)) {
  pontosAtencao.push("A aplicação possui exposição à internet.");
}

if (normalizeBoolean(data.personal_data)) {
  pontosAtencao.push("A aplicação processa ou armazena dados pessoais.");
}

if (!normalizeBoolean(data.mfa)) {
  pontosAtencao.push("Não foi identificado uso de autenticação multifator (MFA).");
} else {
  pontosPositivos.push("Uso de autenticação multifator (MFA) habilitado.");
}

if (!normalizeBoolean(data.sso)) {
  pontosAtencao.push("Não foi identificado uso de autenticação centralizada (SSO).");
} else {
  pontosPositivos.push("Uso de autenticação centralizada (SSO) habilitado.");
}

// Montagem do resumo
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

// Recomendação inteligente
let recomendacao = "";

if (data.risk_level === "Alto") {
  recomendacao = "A aplicação apresenta risco elevado e não deve ser aprovada sem mitigação dos pontos críticos identificados.";
} else if (data.risk_level === "Médio") {
  recomendacao = "A aplicação pode ser aprovada mediante avaliação adicional e definição de controles compensatórios.";
} else {
  recomendacao = "A aplicação apresenta baixo risco, porém recomenda-se validação final da equipe de segurança.";
}

// Ajuste por criticidade (regra de negócio)
if (data.criticality === "Alta") {
  recomendacao += " Devido à alta criticidade, a avaliação manual da equipe de segurança é obrigatória.";
}

parecer += `
Recomendação:

${recomendacao}
`;

data.technical_opinion = parecer;

return [
  {
    json: data
  }
];