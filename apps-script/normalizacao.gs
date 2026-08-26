/**
 * Normalizacao de submissoes do formulario "SecOps - Softwares Homologados".
 *
 * Preso ao Google Form (Extensoes > Apps Script), disparado por um trigger
 * instalavel de onFormSubmit (nao um trigger simples - precisa de autorizacao
 * para escrever na planilha vinculada). Mapeia cada resposta pelo ID interno
 * da pergunta, que sobrevive a reescrita de texto - so muda se a pergunta for
 * apagada e recriada. Escreve uma linha ja normalizada na aba "Normalizado" e
 * detecta caso o mapeamento tenha ficado desatualizado (ver checkMappingDrift_).
 */

var SPREADSHEET_ID = '1Bvetmye_KkGCagWYokQGeuEtKkyARzurDpcoF17oBNg';
var NORMALIZED_SHEET_NAME = 'Normalizado';
var TIMEZONE = 'America/Sao_Paulo';

// Fonte unica de verdade do mapeamento. Ao adicionar/remover uma pergunta no
// Form, atualizar aqui - ver docs/DEVELOPMENT.md para o runbook completo.
var QUESTION_ID_MAP = {
  '787040768': 'app_name',
  '785106603': 'app_version',
  '705107647': 'app_category',
  '2088661705': 'app_purpose',
  '1183438435': 'app_criticality',
  '45748503': 'lic_model',
  '283118380': 'fin_billing_model',
  '303554647': 'app_source',
  '1279192954': 'resp_manager_area',
  '110194186': 'resp_owner_name',
  '226863151': 'resp_owner_contact',
  '1041709934': 'infra_hosting',
  '1019934164': 'infra_internet_exposed',
  '740390117': 'sec_mfa',
  '1067800673': 'sec_mfa_method',
  '1846184060': 'sec_sso',
  '204466467': 'sec_sso_method',
  '1390988720': 'access_method',
  '987717747': 'sec_role_based_access',
  '164053033': 'sec_audit_logging',
  '1479401882': 'app_integrations',
  '1887116858': 'app_integrations_details',
  '1229955354': 'data_personal_data',
  '511821588': 'data_personal_type',
  '1610298999': 'data_file_storage',
  '1362064285': 'app_notes',
};

// Rotulo original de cada campo, usado so na secao "Respostas Completas" do
// parecer - nao usado pelo motor de risco (que le pelo nome do campo acima).
var FIELD_LABELS = {
  app_name: 'Qual e o NOME do Software adquirido?',
  app_version: 'Qual e a VERSAO do Software?',
  app_category: 'Selecione a CATEGORIA que o Software se enquadra',
  app_purpose: 'Qual a FINALIDADE do Software',
  app_criticality: 'Qual e o nivel de CRITICIDADE do software para a OPERACAO?',
  lic_model: 'Tipo de LICENCIAMENTO do Software Adquirido',
  fin_billing_model: 'Tipo de COBRANCA',
  app_source: 'FONTE DE AQUISICAO',
  resp_manager_area: 'Area de nivel GERENCIAL responsavel pelo Software',
  resp_owner_name: 'Colaborador responsavel pela administracao do Software',
  resp_owner_contact: 'CONTATO do responsavel',
  infra_hosting: 'Onde o software sera HOSPEDADO',
  infra_internet_exposed: 'TIPO DE ACESSO (exposicao a internet)',
  sec_mfa: 'Utiliza Multiplo Fator de Autenticacao (MFA)?',
  sec_mfa_method: 'Como o MFA esta implementado',
  sec_sso: 'Utiliza autenticacao Single Sign-On (SSO)?',
  sec_sso_method: 'Como o SSO esta implementado',
  access_method: 'FORMA DE ACESSO (URL/IP/porta/cliente)',
  sec_role_based_access: 'Permite CONTROLE DE PERFIS e permissoes de usuarios?',
  sec_audit_logging: 'Registra LOGS DE ACESSO ou auditoria?',
  app_integrations: 'INTEGRA com outros sistemas da empresa?',
  app_integrations_details: 'Sistemas integrados',
  data_personal_data: 'ARMAZENA ou PROCESSA DADOS PESSOAIS?',
  data_personal_type: 'TIPO DE DADO pessoal tratado',
  data_file_storage: 'Armazena DOCUMENTOS ou ARQUIVOS?',
  app_notes: 'Informacoes Adicionais',
};

// Agrupamento por secao do proprio formulario - so para a transparencia
// completa no parecer (item 3 do plano), nao usado pelo motor de risco.
var SECTION_GROUPS = [
  { section: 'Identificacao do Software', fields: ['app_name', 'app_version', 'app_category', 'app_purpose', 'app_criticality'] },
  { section: 'Licenciamento', fields: ['lic_model', 'fin_billing_model', 'app_source'] },
  { section: 'Responsabilidade', fields: ['resp_manager_area', 'resp_owner_name', 'resp_owner_contact'] },
  { section: 'Infraestrutura', fields: ['infra_hosting', 'infra_internet_exposed'] },
  { section: 'Controle de Acesso', fields: ['sec_mfa', 'sec_mfa_method', 'sec_sso', 'sec_sso_method', 'access_method', 'sec_role_based_access', 'sec_audit_logging'] },
  { section: 'Integracoes', fields: ['app_integrations', 'app_integrations_details'] },
  { section: 'Tratamento de Dados', fields: ['data_personal_data', 'data_personal_type', 'data_file_storage'] },
  { section: 'Informacoes Adicionais', fields: ['app_notes'] },
];

var OUTPUT_COLUMNS = ['form_timestamp', 'form_email', 'mapping_status']
  .concat(Object.keys(FIELD_LABELS))
  .concat(['full_answers_json', 'parecer_doc_url']);

function onFormSubmit(e) {
  var answers = {};
  e.response.getItemResponses().forEach(function (itemResponse) {
    var field = QUESTION_ID_MAP[String(itemResponse.getItem().getId())];
    if (field) {
      answers[field] = itemResponse.getResponse();
    }
  });

  var mappingStatus = checkMappingDrift_();
  var fullAnswers = buildFullAnswers_(answers);

  var row = OUTPUT_COLUMNS.map(function (column) {
    if (column === 'form_timestamp') return formatTimestamp_(e.response.getTimestamp());
    if (column === 'form_email') return e.response.getRespondentEmail() || '';
    if (column === 'mapping_status') return mappingStatus;
    if (column === 'full_answers_json') return JSON.stringify(fullAnswers);
    if (column === 'parecer_doc_url') return '';
    return answers[column] || '';
  });

  getNormalizedSheet_().appendRow(row);
}

/**
 * Compara o QUESTION_ID_MAP contra as perguntas reais do formulario agora.
 * Sem isso o problema original (BKP manual quebrando toda vez que o Forms
 * muda) so migraria pra dentro do script, sem ninguem notar - ver item 1b
 * do plano de correcao.
 */
// Tipos de item que nunca coletam resposta - existem so pra layout/decoracao
// do formulario (ex.: a imagem "#SOU NINJA 2025" no topo). Excluidos da
// checagem de drift, senao viram falso positivo de "pergunta nova".
var NON_ANSWERABLE_TYPES = [
  FormApp.ItemType.SECTION_HEADER,
  FormApp.ItemType.PAGE_BREAK,
  FormApp.ItemType.IMAGE,
  FormApp.ItemType.VIDEO,
];

function checkMappingDrift_() {
  var currentIds = {};
  FormApp.getActiveForm().getItems().forEach(function (item) {
    if (NON_ANSWERABLE_TYPES.indexOf(item.getType()) === -1) {
      currentIds[String(item.getId())] = item.getTitle();
    }
  });

  var problems = [];

  Object.keys(QUESTION_ID_MAP).forEach(function (mappedId) {
    if (!currentIds[mappedId]) {
      problems.push('pergunta mapeada sumiu (campo ' + QUESTION_ID_MAP[mappedId] + ', id ' + mappedId + ')');
    }
  });

  Object.keys(currentIds).forEach(function (currentId) {
    if (!QUESTION_ID_MAP[currentId]) {
      problems.push('pergunta nova sem mapeamento: "' + currentIds[currentId] + '" (id ' + currentId + ')');
    }
  });

  return problems.length === 0 ? 'OK' : 'ATENCAO: ' + problems.join('; ');
}

function buildFullAnswers_(answers) {
  return SECTION_GROUPS.map(function (group) {
    return {
      section: group.section,
      answers: group.fields
        .filter(function (field) { return answers[field]; })
        .map(function (field) {
          return { question: FIELD_LABELS[field], answer: answers[field] };
        }),
    };
  });
}

function formatTimestamp_(date) {
  return Utilities.formatDate(date, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function getNormalizedSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(NORMALIZED_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(NORMALIZED_SHEET_NAME);
    sheet.appendRow(OUTPUT_COLUMNS);
  }
  return sheet;
}
