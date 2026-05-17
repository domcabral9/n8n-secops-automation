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


/**
 * technical-decision.js
 *
 * Responsável por:
 * 1. Consumir dados já normalizados
 * 2. Gerar parecer técnico padronizado
 *
 * Este arquivo NÃO deve recalcular score
 * nem realizar normalizações adicionais.
 */

const data = $json;

const normalized = data.normalized || {};
const analysis = data.analysis || {};

const pontos_positivos = [];
const pontos_atencao = [];
const riscos_criticos = [];

/**
 * Exposição à internet
 */
if (normalized.internet_exposed) {
  pontos_atencao.push(
    'Aplicação exposta à internet, aumentando a superfície de ataque.'
  );
} else {
  pontos_positivos.push(
    'Aplicação sem exposição direta à internet.'
  );
}

/**
 * Dados pessoais
 */
if (normalized.personal_data) {
  pontos_atencao.push(
    'Aplicação realiza processamento ou armazenamento de dados pessoais.'
  );
} else {
  pontos_positivos.push(
    'Não há indicação de tratamento de dados pessoais.'
  );
}

/**
 * MFA
 */
if (!normalized.mfa) {
  riscos_criticos.push(
    'Ausência de autenticação multifator (MFA).'
  );
} else {
  pontos_positivos.push(
    'Aplicação utiliza autenticação multifator (MFA).'
  );
}

/**
 * SSO
 */
if (!normalized.sso) {
  pontos_atencao.push(
    'Ausência de autenticação centralizada (SSO).'
  );
} else {
  pontos_positivos.push(
    'Aplicação integrada a autenticação centralizada (SSO).'
  );
}

/**
 * RBAC
 */
if (!normalized.rbac) {
  pontos_atencao.push(
    'Controle de acesso baseado em papéis (RBAC) não identificado.'
  );
}

/**
 * Auditoria
 */
if (!normalized.audit) {
  pontos_atencao.push(
    'Ausência de trilhas de auditoria (logging). Possível dificuldade em investigações.'
  );
}

/**
 * Montagem do parecer
 */
let parecer = `
PARECER TÉCNICO DE AVALIAÇÃO DE SOFTWARE

Aplicação: ${normalized.app_name}
Criticidade: ${normalized.criticality}
Modelo de hospedagem: ${normalized.hosting}

Score final (1-5): ${analysis.risk_score}
Classificação: ${analysis.recommendation}

Resumo da análise:
`;

/**
 * Pontos positivos
 */
if (pontos_positivos.length > 0) {
  parecer += `\nPontos positivos:\n`;

  pontos_positivos.forEach(item => {
    parecer += `- ${item}\n`;
  });
}

/**
 * Pontos de atenção
 */
if (pontos_atencao.length > 0) {
  parecer += `\nPontos de atenção:\n`;

  pontos_atencao.forEach(item => {
    parecer += `- ${item}\n`;
  });
}

/**
 * Riscos críticos
 */
if (riscos_criticos.length > 0) {
  parecer += `\nRiscos críticos:\n`;

  riscos_criticos.forEach(item => {
    parecer += `- ${item}\n`;
  });
}

/**
 * Recomendação final
 */
parecer += `\nRecomendação:\n\n`;

switch (analysis.recommendation) {
  case 'Não Homologado':
    parecer += 'A aplicação apresenta riscos relevantes de segurança e não deve ser homologada até adequação dos controles identificados.';
    break;

  case 'Homologado com Ressalvas':
    parecer += 'A aplicação pode ser homologada mediante avaliação complementar e aceite dos riscos identificados.';
    break;

  default:
    parecer += 'A aplicação atende aos critérios mínimos de segurança e pode ser homologada para uso.';
}

return [{
  ...data,

  technical_opinion: parecer,

  risk_score: analysis.risk_score,
  risk_level: analysis.risk_level,
  recommendation: analysis.recommendation
}];