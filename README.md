# n8n-secops-automation

## 📌 Visão Geral

Este projeto implementa uma automação de avaliação de risco para softwares utilizando **n8n Community**, integrando Google Forms e Google Sheets para coleta e processamento de dados.

A solução automatiza a análise inicial de segurança, gerando um parecer técnico padronizado e rastreável.

---

## 🎯 Objetivo

* Automatizar a avaliação inicial de softwares solicitados
* Reduzir esforço manual e inconsistências
* Padronizar critérios de análise de risco
* Gerar parecer técnico de forma automática
* Criar rastreabilidade no processo de aprovação

---

## 🧠 Problema Resolvido

Processos manuais de avaliação de software geralmente apresentam:

* Falta de padronização
* Alto esforço operacional
* Baixa rastreabilidade
* Dependência de análise manual

Este projeto resolve esses pontos através de automação orientada a regras.

---

## 🏗️ Arquitetura

Fluxo da automação:

Google Forms
↓
Google Sheets
↓
n8n (Trigger)
↓
Normalização
↓
Motor de risco
↓
Geração de parecer técnico
↓
Atualização da planilha

---

## ⚙️ Tecnologias Utilizadas

* n8n Community
* Google Forms
* Google Sheets API
* Google Cloud (OAuth2)
* JavaScript (Function Nodes)

---

## 🔄 Estrutura do Workflow

| Etapa            | Descrição                        |
| ---------------- | -------------------------------- |
| Normalização     | Padroniza os dados do formulário |
| Classificação    | Identifica aplicações críticas   |
| Cálculo de Risco | Gera score baseado em controles  |
| Decisão Técnica  | Gera parecer automatizado        |
| Persistência     | Atualiza planilha com resultado  |

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

Contém os scripts utilizados nos Function Nodes do n8n:

* normalization → tratamento de dados
* classification → regras de criticidade
* risk → cálculo de score
* decision → geração do parecer técnico

---

## ⚠️ Regras de Risco (Resumo)

O cálculo de risco considera:

* Exposição à internet
* Uso de MFA
* Uso de SSO
* Controle de acesso (RBAC)
* Logging de auditoria
* Armazenamento de dados pessoais

O score final é classificado como:

* Baixo
* Médio
* Alto

---

## 📄 Exemplo de Saída

```json
{
  "app_name": "Google Gemini",
  "risk_score": 3,
  "risk_level": "Baixo",
  "risk_flag": "CRITICAL_APPLICATION",
  "technical_opinion": "Parecer técnico gerado automaticamente..."
}
```

---

## 🚀 Como Utilizar

1. Criar formulário no Google Forms
2. Integrar com Google Sheets
3. Configurar credenciais OAuth no Google Cloud
4. Importar workflow no n8n
5. Configurar credenciais no n8n
6. Ativar o workflow

---

## 🔐 Considerações de Segurança

* Uso de OAuth2 para integração com Google APIs
* Controle de acesso ao n8n
* Separação entre coleta e processamento de dados
* Possibilidade de evolução para GRC

---

## 📈 Evoluções Futuras

* Geração automática de PDF de parecer
* Integração com sistemas de ticket
* Dashboard de risco
* Integração com SIEM/GRC
* Motor de risco mais avançado

---

## 📌 Status do Projeto

PoC funcional com:

* Integração completa com Google
* Workflow automatizado
* Geração de parecer técnico
* Atualização automática da base

---

## 🤝 Contribuição

Este projeto faz parte de estudos e evolução em automação de segurança e governança.

---

## 📬 Contato

domcabral@proton.me
