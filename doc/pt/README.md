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

## Changelog

### 1.9.17 (2026-06-08)
- (ssbingo) Correção: removido formato longo i18n duplicado (admin/i18n), adicionada chave de tradução /dev/ttyUSB0

### 1.9.16 (2026-06-08)
- (ssbingo) Chore: devDependency @alcalzone/release-script atualizada para ^5.2.1

### 1.9.15 (2026-06-08)
- (ssbingo) Chore: adicionado @tsconfig/node22 como devDependency (atualização de template ioBroker)
- (ssbingo) Chore: testing-action-check atualizado para @v2
- (ssbingo) Chore: atualização de segurança do axios

### 1.9.14 (2026-05-27)
- (ssbingo) Correção: ajustes no CI — Node.js 24, @types/node ^22.0.0, package-lock.json corrigido; apenas a entrada mais recente em common.news

### 1.9.13 (2026-05-27)
- (ssbingo) Correção: package-lock.json atualizado para @types/node ^22.0.0 (estava travado em 25.x)

### 1.9.12 (2026-05-27)
- (ssbingo) Correção: @types/node fixado em ^22.0.0 nas devDependencies

### 1.9.11 (2026-05-27)
- (ssbingo) Correção: Node.js 24 para jobs CI check-and-lint e deploy
- (ssbingo) Chore: adicionado @types/node como devDependency

### 1.9.10 (2026-05-27)
- (ssbingo) Atualização de dependências via Dependabot — @alcalzone/release-script* 5.2.0, @iobroker/eslint-config 2.3.4
- (ssbingo) Atualizações de CI — actions/setup-node@v6, testing-action-deploy@v1

### 1.9.9 (2026-05-14)
- (ssbingo) Atualização de dependências via Dependabot: protobufjs, @protobufjs/utf8, fast-uri
- (ssbingo) Agora requer Node.js >= 22

### 1.9.8 (2026-04-22)
- (ssbingo) Correção: logs de erro de conexão/polling deduplicados evitam inundação de logs e melhoram a prontidão para Sentry
- (ssbingo) Correção: proteções de encerramento e extendForeignObject previnem condições de corrida no unload e com o admin UI
- (ssbingo) Correção: vazamento de socket no timeout de Modbus corrigido; testConnection agora pausa o polling; canais de controle vazios removidos

### 1.9.7 (2026-04-16)
- (ssbingo) Novo: adicionados estados calculados plant.pv1Power, plant.pv2Power, plant.pv3Power


### 1.9.6 (2026-04-16)
- (ssbingo) Novo: adicionados estados calculados plant.pv1Power, plant.pv2Power, plant.pv3Power


### 1.9.5 (2026-04-08)
- (ssbingo) Correção: removido common.schedule não utilizado do io-package.json

### 1.9.4 (2026-04-08)
- (ssbingo) Correção: Changelog / adicionado CHANGELOG_OLD.md

### 1.9.3 (2026-04-08)
- (ssbingo) Correção: removido admin/index.html

### 1.9.2 (2026-04-08)
- (ssbingo) Correções

### 1.9.1 (2026-04-08)
- (ssbingo) IU de administração corrigida: removidos ficheiros legados index.html/index_m.html/words.js; corrigido o tipo jsonData nos botões sendTo do jsonConfig

### 1.9.0 (2026-03-26)
- (ssbingo) Teste concluído

### 1.8.23 (2026-03-26)
- (ssbingo) Ano de copyright corrigido para 2026 em LICENSE e README; correções técnicas: CI/CD, linting, testes

