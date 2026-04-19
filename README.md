# n8n-secops-automation

## 📌 Visão Geral

Este projeto implementa um **motor de avaliação de risco contextual para softwares**, utilizando **n8n Community** integrado ao Google Forms e Google Sheets.

Diferente de abordagens tradicionais baseadas em checklist, esta solução evolui para um modelo de análise **orientado a contexto, impacto e controles de segurança**, aproximando-se de práticas reais utilizadas em ambientes corporativos.

---

## 🎯 Objetivo

* Automatizar a avaliação inicial de softwares
* Reduzir esforço manual e inconsistências
* Padronizar critérios de análise de risco
* Gerar parecer técnico estruturado e auditável
* Suportar decisões de homologação com base em risco real

---

## 🧠 Problema Resolvido

Processos tradicionais de avaliação apresentam:

* Falta de padronização
* Avaliações subjetivas
* Baixa rastreabilidade
* Dependência excessiva de análise manual
* Uso de checklists que ignoram contexto

Este projeto resolve esses pontos com um motor de decisão que considera:

* Tipo de aplicação (SaaS, On-premise, Cloud)
* Sensibilidade dos dados
* Exposição
* Controles de segurança implementados

---

## 🏗️ Arquitetura

Fluxo da automação:

Google Forms
↓
Google Sheets
↓
n8n (Trigger)
↓
Normalização de Dados
↓
Motor de Risco Contextual
↓
Geração de Parecer Técnico
↓
Persistência (Sheets)

---

## ⚙️ Tecnologias Utilizadas

* n8n Community
* Google Forms
* Google Sheets API
* Google Cloud (OAuth2)
* JavaScript (Function Nodes)

---

## 🔄 Estrutura do Workflow

| Etapa           | Descrição                                         |
| --------------- | ------------------------------------------------- |
| Normalização    | Padroniza e corrige inconsistências de input      |
| Classificação   | Identifica criticidade e contexto da aplicação    |
| Motor de Risco  | Calcula score ponderado (1–5) baseado em contexto |
| Decisão Técnica | Gera parecer técnico automatizado                 |
| Persistência    | Atualiza planilha com resultado                   |

---

## 🧠 Evolução do Motor de Risco

### 🔹 Versão inicial

Baseada em soma de pontos fixos:

* * risco por ausência de controles
* Sem distinção de contexto

Limitações:

* Penalização indevida de aplicações simples
* Falta de precisão na análise

---

### 🔹 Versão atual (Context-Aware Risk Engine)

O modelo evoluiu para considerar:

#### 1. Contexto da aplicação

* SaaS vs On-premise vs Cloud
* Exposição esperada vs risco real

#### 2. Sensibilidade dos dados

* Dados pessoais não são automaticamente risco
* Risco depende da presença de controles

#### 3. Controles de segurança

* MFA
* SSO (apenas quando relevante)
* RBAC
* Logging

#### 4. Avaliação combinada

Exemplo:

* Dados pessoais + MFA + RBAC → risco controlado
* Dados pessoais sem controles → risco alto

---

## ⚖️ Lógica de Avaliação (Resumo)

O score final varia de **1 a 5**:

| Score     | Classificação      | Interpretação    |
| --------- | ------------------ | ---------------- |
| 4.0 – 5.0 | Homologado         | Seguro para uso  |
| 3.0 – 3.9 | Aguardando Ajustes | Requer melhorias |
| < 3.0     | Rejeitado          | Risco elevado    |

---

## 🧩 Principais Regras Inteligentes

### ✔ SSO contextual

* Não penaliza aplicações sem necessidade de autenticação
* Relevante apenas para SaaS ou sistemas com dados sensíveis

---

### ✔ Exposição inteligente

* SaaS exposto → comportamento esperado
* Penalização ocorre apenas sem controles adequados

---

### ✔ Dados pessoais com análise de proteção

* Não penaliza automaticamente
* Avalia presença de:

  * MFA
  * RBAC
  * Logging

---

### ✔ Tri-state evaluation

Valores suportados:

* Sim
* Não
* Não sei (tratado como neutro)

---

## 📄 Exemplo de Saída

```json
{
  "app_name": "Sistema Exemplo",
  "risk_score": 4.1,
  "risk_classification": "Homologado",
  "technical_opinion": "Aplicação com baixo risco e controles adequados."
}
```

---

## 📂 Estrutura do Repositório

```bash
.
├── workflows/
├── nodes/
├── examples/
├── docs/
└── README.md
```

### nodes/

* normalization → padronização de dados
* classification → definição de criticidade
* risk → motor de score contextual
* decision → geração de parecer técnico

---

## 🚀 Como Utilizar

1. Criar formulário no Google Forms
2. Integrar com Google Sheets
3. Configurar OAuth no Google Cloud
4. Importar workflow no n8n
5. Configurar credenciais
6. Ativar automação

---

## 🔐 Considerações de Segurança

* Uso de OAuth2
* Separação entre coleta e processamento
* Estrutura preparada para integração com GRC
* Possibilidade de auditoria via logs e histórico

---

## 📈 Evoluções Futuras

* Score por domínio (Identidade, Dados, Infraestrutura)
* Justificativa automática baseada no score
* Integração com sistemas de ticket (Jira, ServiceNow)
* Dashboard de risco
* Exportação de parecer em PDF
* Integração com SIEM/GRC

---

## 📌 Status do Projeto

Versão atual:

✔ Motor de risco contextual implementado
✔ Integração com Google Forms/Sheets
✔ Score ponderado funcional
✔ Geração de parecer técnico

---

## 🤝 Contribuição

Projeto voltado para estudos e evolução prática em:

* SecOps
* GRC
* Automação de segurança

---

## 📬 Contato

([domcabral@proton.me](mailto:domcabral@proton.me))
