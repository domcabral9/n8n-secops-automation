/**
 * Node: Decisão Técnica
 * Workflow: Software Risk Assessment
 *
 * Consome os dados já normalizados e pontuados pelo "Gerador de Score" e
 * monta o parecer técnico. Não recalcula score nem realiza normalização
 * adicional - qualquer critério novo entra no "Gerador de Score" primeiro.
 */

const data = $json;

const normalized = data.normalized || {};
const analysis = data.analysis || {};
const debug = data.debug_score || {};

const criteriaByKey = {};
(debug.criteria || []).forEach((c) => {
  criteriaByKey[c.key] = c;
});

/**
 * Cada critério com sua contribuição real pro score final (peso × risco
 * individual, já calculados pelo Gerador de Score) - usado pra ranquear os
 * fatores que mais pesaram nesta submissão específica, em vez de textos
 * fixos repetidos em todo parecer. `positive` é o sentido em que o critério
 * reduz risco (ex.: MFA presente, exposição ausente).
 */
const CRITERIA = [
  {
    key: 'mfa',
    positive: normalized.mfa,
    positiveText: 'Aplicação utiliza autenticação multifator (MFA).',
    negativeText: 'Ausência de autenticação multifator (MFA).',
    naoAplicavelText: 'Autenticação multifator (MFA) não avaliada - software standalone sem superfície de autenticação.',
    critical: true
  },
  {
    key: 'sso',
    positive: normalized.sso,
    positiveText: 'Aplicação integrada a autenticação centralizada (SSO).',
    negativeText: 'Ausência de autenticação centralizada (SSO).',
    naoAplicavelText: 'Autenticação centralizada (SSO) não avaliada - software standalone sem superfície de autenticação.'
  },
  {
    key: 'rbac',
    positive: normalized.rbac,
    positiveText: 'Aplicação possui controle de acesso baseado em papéis (RBAC).',
    negativeText: 'Controle de acesso baseado em papéis (RBAC) não identificado.',
    naoAplicavelText: 'Controle de acesso baseado em papéis (RBAC) não avaliado - software standalone sem contas de usuário.'
  },
  {
    key: 'audit',
    positive: normalized.audit,
    positiveText: 'Aplicação mantém trilhas de auditoria (logging).',
    negativeText: 'Ausência de trilhas de auditoria (logging). Possível dificuldade em investigações.',
    naoAplicavelText: 'Trilhas de auditoria (logging) não avaliadas - software standalone sem contas de usuário.'
  },
  {
    key: 'internet_exposed',
    positive: !normalized.internet_exposed,
    positiveText: 'Aplicação sem exposição direta à internet.',
    negativeText: 'Aplicação exposta à internet, aumentando a superfície de ataque.'
  },
  {
    key: 'personal_data',
    positive: !normalized.personal_data,
    positiveText: 'Não há indicação de tratamento de dados pessoais.',
    negativeText: 'Aplicação realiza processamento ou armazenamento de dados pessoais.'
  }
];

const ranked = CRITERIA.map((c) => {
  const info = criteriaByKey[c.key] || { weight: 0, risk: 0, applicable: true };
  return { ...c, applicable: info.applicable !== false, contribution: info.weight * info.risk };
}).sort((a, b) => b.contribution - a.contribution);

const pontos_positivos = [];
const pontos_atencao = [];
const riscos_criticos = [];
const nao_aplicaveis = [];

ranked.forEach((c) => {
  if (!c.applicable) {
    nao_aplicaveis.push(c.naoAplicavelText);
  } else if (c.positive) {
    pontos_positivos.push(c.positiveText);
  } else if (c.critical) {
    riscos_criticos.push(c.negativeText);
  } else {
    pontos_atencao.push(c.negativeText);
  }
});

const topRiscos = ranked.filter((c) => c.applicable && !c.positive);
const principaisFatores = topRiscos.length > 0
  ? topRiscos.slice(0, 2).map((c) => c.negativeText).join(' ')
  : 'Nenhum fator de risco relevante identificado nos critérios avaliados.';

/**
 * Todas as respostas do formulário, agrupadas por seção (gerado pelo
 * Apps Script em full_answers_json) - garante que nenhuma resposta coletada
 * fica de fora do parecer, mesmo a que não entra no cálculo de risco.
 */
function buildFullAnswersText(json) {
  if (!json) return '';

  let sections;
  try {
    sections = JSON.parse(json);
  } catch (error) {
    return '';
  }

  return sections
    .filter((section) => section.answers && section.answers.length > 0)
    .map((section) => {
      const lines = section.answers
        .map((a) => `- ${a.question}: ${a.answer}`)
        .join('\n');
      return `${section.section}\n${lines}`;
    })
    .join('\n\n');
}

const full_answers_text = buildFullAnswersText(data.full_answers_json);

let parecer = `
PARECER TÉCNICO DE AVALIAÇÃO DE SOFTWARE

Aplicação: ${normalized.app_name}
Criticidade: ${normalized.criticality}
Modelo de hospedagem: ${normalized.hosting}

Score final (0-5, maior = mais seguro): ${analysis.risk_score}
Classificação: ${analysis.recommendation}

Probabilidade de ocorrência: ${analysis.probability_level} (${analysis.probability_score})
Impacto potencial: ${analysis.impact_level} (${analysis.impact_score})

Principais fatores desta avaliação:
${principaisFatores}

Resumo da análise:
`;

if (pontos_positivos.length > 0) {
  parecer += `\nPontos positivos:\n`;
  pontos_positivos.forEach((item) => {
    parecer += `- ${item}\n`;
  });
}

if (pontos_atencao.length > 0) {
  parecer += `\nPontos de atenção:\n`;
  pontos_atencao.forEach((item) => {
    parecer += `- ${item}\n`;
  });
}

if (riscos_criticos.length > 0) {
  parecer += `\nRiscos críticos:\n`;
  riscos_criticos.forEach((item) => {
    parecer += `- ${item}\n`;
  });
}

if (nao_aplicaveis.length > 0) {
  parecer += `\nCritérios não aplicáveis a este software:\n`;
  nao_aplicaveis.forEach((item) => {
    parecer += `- ${item}\n`;
  });
}

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
  full_answers_text,
  analysis_status: 'Concluído',

  risk_score: analysis.risk_score,
  risk_level: analysis.risk_level,
  recommendation: analysis.recommendation,

  probability_score: analysis.probability_score,
  probability_level: analysis.probability_level,
  impact_score: analysis.impact_score,
  impact_level: analysis.impact_level
}];
