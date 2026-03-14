# ioBroker Sigenergy Adaptador

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adaptador para sistemas de energia solar Sigenergy via Modbus TCP/RTU**

Suporta o protocolo Sigenergy Modbus V2.5 (lançado em 2025-02-19).

---

## Funcionalidades

- 📡 **Modbus TCP** (Ethernet / WLAN / fibra ótica / 4G) — porta 502
- 🔗 **Modbus RTU** (RS485 série)
- ⚡ **Suporte completo de registos** — todos os registos de instalação e inversor segundo a especificação V2.5
- 🔋 **Estatísticas de bateria** — tempo até carga completa, tempo restante, cobertura diária
- ☀️ **Estatísticas PV** — taxa de autoconsumo, taxa de autarcia
- 🔌 **Carregador AC** (Sigen EVAC) — opcional
- ⚡ **Carregador DC** — opcional
- 📊 **Valores calculados** — estatísticas derivadas atualizadas a cada ciclo de sondagem
- 🖥️ **Widgets VIS** — fluxo de energia, estado da bateria, painéis de estatísticas

---

## Hardware suportado

| Categoria        | Modelos |
|-----------------|---------|
| **Inversor híbrido** | SigenStor EC SP/TP, Sigen Hybrid SP/TP/TPLV, Sigen PV M1-HYA, PG Controller |
| **Inversor PV** | Sigen PV Max SP/TP, Sigen PV M1 |
| **EVAC (AC)**   | Sigen EVAC 7/11/22 kW, PG EVAC |

---

## Endereços Modbus predefinidos

| Dispositivo | Endereço |
|------------|----------|
| Instalação (leitura/escrita) | **247** |
| Difusão instalação (escrita, sem resposta) | **0** |
| Inversor | **1** |
| Carregador AC (EVAC) | **2** |

---

## Instalação

### Via ioBroker Admin (recomendado)
1. Abrir ioBroker Admin → Adaptadores
2. Procurar «sigenergy»
3. Instalar

---

## Configuração

### Separador Ligação
- **Tipo de ligação**: TCP (Ethernet) ou Série (RS485)
- **Host TCP**: Endereço IP do inversor
- **Porta TCP**: 502 (predefinida)
- **ID Modbus instalação**: 247 (predefinido)
- **ID Modbus inversor**: 1 (predefinido)

### Separador Componentes
Selecionar os dispositivos instalados:
- Bateria / ESS
- Painéis PV
- Carregador AC (EVAC)
- Carregador DC

### Separador Estatísticas
Escolher os valores estatísticos a calcular:
- Tempo até à carga completa da bateria
- Tempo restante da bateria
- Tempo de carga diário
- Tempo de cobertura da bateria
- Taxa de autoconsumo
- Taxa de autarcia

---

## Objetos de dados

### Instalação (`plant.*`)
| Estado | Descrição | Unidade |
|--------|-----------|---------|
| `plant.gridActivePower` | Potência rede (>0 importação, <0 exportação) | kW |
| `plant.pvPower` | Produção PV | kW |
| `plant.essPower` | Potência bateria (<0 descarga) | kW |
| `plant.essSoc` | Estado de carga da bateria | % |
| `plant.activePower` | Potência ativa total da instalação | kW |
| `plant.runningState` | Estado instalação (0=Espera, 1=Ativo...) | - |

### Inversor (`inverter.*`)
| Estado | Descrição | Unidade |
|--------|-----------|---------|
| `inverter.pvPower` | Potência PV no inversor | kW |
| `inverter.essBatterySoc` | SOC da bateria | % |
| `inverter.essBatterySoh` | SOH da bateria | % |
| `inverter.essBatteryTemperature` | Temperatura da bateria | °C |
| `inverter.phaseAVoltage` | Tensão fase A | V |
| `inverter.gridFrequency` | Frequência da rede | Hz |

### Estatísticas (`statistics.*`)
| Estado | Descrição | Unidade |
|--------|-----------|---------|
| `statistics.batteryTimeToFull` | Minutos até bateria cheia | min |
| `statistics.batteryTimeRemaining` | Tempo restante da bateria | min |
| `statistics.selfConsumptionRate` | Taxa de autoconsumo | % |
| `statistics.autarkyRate` | Taxa de autarcia | % |
| `statistics.housePower` | Consumo doméstico calculado | kW |

---

## Widgets VIS

> **Nota:** Todos os 7 widgets são fornecidos pelo adaptador separado [ioBroker.vis-2-widgets-sigenergy](https://github.com/ssbingo/ioBroker.vis-2-widgets-sigenergy). Instale-o juntamente com este adaptador para utilizar os widgets no VIS-2.

### Widget fluxo de energia
Mostra o fluxo de energia animado entre PV → Bateria ↔ Rede → Casa.

### Widget estado da bateria
Mostra a barra SOC, o emblema SOH, o tempo até carga/descarga completa, a potência atual.

### Widget visão geral de potência
Leitura em tempo real dos quatro fluxos de potência.

### Widget estatísticas
Autarcia de hoje, autoconsumo, SOC mín/máx, tempo de cobertura da bateria.

### Widget inversor
Dados do inversor em tempo real: potência PV, frequência da rede, tensões de fase, temperatura.

### Widget carregador AC (EVAC)
Estado e medições de potência da estação de carregamento Sigen EVAC.

### Widget carregador DC
Estado e medições de potência do carregador DC.

---

## Protocolo de comunicação

- Modbus TCP: modo TCP, full duplex, porta 502 (escravo)
- Modbus RTU: half duplex, 9600 bps, 8N1
- Intervalo de sondagem mínimo: 1000 ms (1 segundo) segundo a especificação Sigenergy
- Timeout: 1000 ms segundo a especificação Sigenergy

---

## Licença

Licença MIT — Copyright (c) 2025 ioBroker Community

---

## Changelog
<<<<<<< HEAD
### 1.3.19 (2026-03-14)
* Revertido eslint/@eslint/js para 9.x; serialport atualizado para 13.0.0

=======
>>>>>>> 7386bdc0143b77f883d57ad177396d7b0e757bdc
### 1.3.18 (2026-03-14)
* Atualizados eslint 10.0.3, @eslint/js 10.0.1, serialport 13.0.0

### 1.3.17 (2026-03-13)
* Mocha removido das devDependencies

### 1.3.16 (2026-03-13)
* Restaurada dependência mocha, corrigido script test:package

### 1.3.15 (2026-03-13)
* Corrigida indentação do setTimeout em testConnection

### 1.3.14 (2026-03-13)
* Corrigidos os dois últimos erros de lint

### 1.3.13 (2026-03-13)
* Todos os erros ESLint/Prettier corrigidos: JSDoc, formatação, importações não utilizadas

### 1.3.12 (2026-03-13)
* Correção de regressão curly em modbus.js, statistics.js, main.js

### 1.3.11 (2026-03-13)
* Correção Prettier: vírgulas finais ausentes em registers.js

### 1.3.10 (2026-03-13)
* Correção Prettier: objetos de registo expandidos para formato multilinha

### 1.3.9 (2026-03-13)
* Adicionada documentação no README.md - multilíngue

### 1.3.8 (2026-03-13)
* Adicionadas traduções uk/zh-cn em io-package.json

### 1.3.7 (2026-03-13)
* Removida dependência mocha redundante

### 1.3.6 (2026-03-13)
* Corrigida formatação Prettier/ESLint

### 1.3.5 (2026-03-13)
* (ssbingo) Correção CI: usar caminho explícito do binário mocha para evitar problemas de resolução de PATH com npm ci

### 1.3.4 (2026-03-13)
* (ssbingo) Correção CI: mocha adicionado às devDependencies para que o script test:package possa ser executado

### 1.3.3 (2026-03-13)
* (ssbingo) Corrigido aviso JSDoc @param duplicado causado por tag de fechamento ausente em modbus.js

### 1.3.2 (2026-03-13)
* (ssbingo) Correções de qualidade de código: variáveis não utilizadas removidas, documentação JSDoc concluída, declaração léxica em switch-case corrigida

### 1.3.0 (2026-03-13)
* (ssbingo) Documentação multilingue atualizada

### 1.2.5 (2026-03-12)
* (ssbingo) Correções

### 1.2.4 (2026-03-12)
* (ssbingo) Documentação multilingue adicionada ao README.md

### 1.2.3 (2026-03-12)
* (ssbingo) Correções para AdapterCheck

### 1.2.0 (2026-03-11)
* (ssbingo) StatisticsCalculator atualizado: re-adicionadas estimativas de tempo de bateria, tempo de carga diário e rastreamento de cobertura de bateria

### 1.1.7 (2026-03-11)
* (ssbingo) Logging melhorado: mensagens debug/info/warn/error para ligação, ciclos de polling, leituras de registos e paragem do adaptador

### 1.1.0 (2026-03-09)
* (ssbingo) Interface de administração migrada de HTML legacy para jsonConfig (Admin 5+)

### 0.1.0 (2026-03-01)
* (ssbingo) Primeira versão — suporte Modbus TCP/RTU para sistemas Sigenergy

---

## Documentação

- 🇬🇧 [English documentation](../../README.md)
- 🇩🇪 [Deutsche Dokumentation](../de/README.md)
- 🇷🇺 [Документация на русском](../ru/README.md)
- 🇳🇱 [Nederlandse documentatie](../nl/README.md)
- 🇫🇷 [Documentation française](../fr/README.md)
- 🇮🇹 [Documentazione italiana](../it/README.md)
- 🇪🇸 [Documentación en español](../es/README.md)
- 🇵🇱 [Dokumentacja polska](../pl/README.md)
- 🇺🇦 [Документація українською](../uk/README.md)
- 🇨🇳 [简体中文文档](../zh-cn/README.md)
