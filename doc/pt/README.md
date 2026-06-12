# ioBroker Sigenergy Adaptador

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adaptador para sistemas de energia solar Sigenergy via Modbus TCP/RTU**

Suporta o protocolo Sigenergy Modbus V2.9 (lançado em 2026-05-13).

---

## Funcionalidades

- 📡 **Modbus TCP** (Ethernet / WLAN / fibra ótica / 4G) — porta 502
- 🔗 **Modbus RTU** (RS485 série)
- ⚡ **Suporte completo de registos** — todos os registos de instalação, inversor, PSS e PID segundo a especificação V2.9
- 🔋 **Estatísticas de bateria** — tempo até carga completa, tempo restante, cobertura diária
- ☀️ **Estatísticas PV** — taxa de autoconsumo, taxa de autarcia
- 🔌 **Carregador AC** (Sigen EVAC) — opcional
- ⚡ **Carregador DC** — opcional
- 🏗️ **PSS** (comutador de potência) — Opcional, monitorização de quadros MV/LV e armário de distribuição
- 🔍 **PID** (deteção de isolamento PV) — Opcional
- 🌡️ **Pré-aquecimento ESS** — Programação TOU, 30 janelas temporais configuráveis (M1-HYA/HYB)
- 📈 **Registos alargados** — Cargas inteligentes 1–24, contadores de energia, parâmetros de código de rede
- ☀️ **SigenMicro** — Suporte a micro-inversores (deteção automática)
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
- PSS (comutador de potência)
- PID (deteção de isolamento PV)
- Pré-aquecimento ESS (apenas M1-HYA/HYB)
- SigenMicro (micro-inversores)

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

### 2.5.0 (2026-06-12)

- (ssbingo) Segurança arquitetural de escrita: as escritas Modbus são rejeitadas no próprio despachante quando o registro de destino não é válido para o tipo de dispositivo configurado (gating de models em onStateChange, guarda de plant para apenas SigenMicro)
- (ssbingo) Verificação TypeScript corrigida — novo `lib/adapter-config.d.ts` com declaração completa de AdapterConfig, construtor modbus-serial tipado, anotações ioBroker.CommonType/SettableObject; novo script `npm run check` passa com 0 erros
- (ssbingo) A configuração do ESLint permite tags JSDoc `@type` neste projeto JavaScript verificado (jsdoc/check-tag-names com typed:false)

### 2.4.0 (2026-06-12)

- (ssbingo) Arquitetura de tipos de dispositivo: seletor obrigatório (SigenStor / Sigen Hybrid / Sigen PV M1-HYB / inversor somente PV / apenas SigenMicro) com separação estrita de registros conforme as notas do protocolo V2.9
- (ssbingo) Suporte oficial a Sigen Hybrid e inversores somente PV (Sigen PV / PV Max)
- (ssbingo) Detecção automática do tipo de dispositivo no admin (registros 30500 / 31024)
- (ssbingo) Verificação de modelo na inicialização — avisa em caso de divergência entre configuração e hardware (novo estado info.modelType)
- (ssbingo) Registros dinâmicos de strings PV: PV5-PV16 conforme a contagem de strings do registro 31025
- (ssbingo) Controle de fator de potência PCC (40157/40158) apenas para M1-HYB; pré-aquecimento ESS apenas M1-HYB; carregador DC e grid code apenas SigenStor/Sigen Hybrid
- (ssbingo) Migração automática de configurações anteriores a 2.4.0 e limpeza de canais inválidos para o tipo de dispositivo selecionado

### 2.3.4 (2026-06-12)
- (ssbingo) fix: correção da deteção do nível de protocolo — quantidades corretas de registos para sondas, ordem decrescente V2.9→V2.6, distinção entre erros de transporte e exceções do dispositivo para evitar falso relatório pre-V2.6

### 2.3.3 (2026-06-11)
- (ssbingo) fix: suprimir avisos repetidos de leitura de registos após primeira ocorrência para plant/inverter/acCharger/dcCharger/pss/pid; falhas subsequentes registadas apenas ao nível debug

### 2.3.2 (2026-06-10)
- (ssbingo) fix: mostrar 'pre-V2.6' em vez de 'unknown' quando o dispositivo responde mas não tem registos plant estendidos; log de debug por sonda com mensagem de excepção Modbus

### 2.3.1 (2026-06-10)
- (ssbingo) feat: detectar nível do protocolo Modbus no arranque sondando registos 30088/30200/30228/30286; ler versão de firmware (30525); registar resultado e guardar como estado info.protocolLevel

### 2.3.0 (2026-06-10)
- (ssbingo) feat: mapas enum common.states adicionados para emsWorkMode/runningState/remoteEmsMode/dcCharger.runningState; registos de escrita PSS/PID/AC Charger (FC06/FC10) com subscribe e handlers onStateChange

### 2.2.7 (2026-06-10)
- (ssbingo) Correção: defaults native enableSmartLoads/enableCumulativeEnergy/enableGridCode adicionados ao io-package.json
- (ssbingo) Correção: descrição do registo 30003 atualizada com modos EMS V2.7 5 (FullFeedIn) e 9 (Custom)

### 2.2.6 (2026-06-10)
- (ssbingo) Novo: auditoria de registos V2.9 — registo 30279 em falta adicionado, registos PV DC Charger 31509/31511 movidos para namespace dcCharger, gain TOU ESS Preheating corrigido
- (ssbingo) Novo: escrita de retorno de registos de controlo plant.control.*, plant.gridCode.*, inverter.control.*, dcCharger.control.* (FC06/FC10); registos RW lidos no arranque
- (ssbingo) Correção: avisos repetidos de ESS Preheating suprimidos; erros de leitura de registos de controlo no arranque reduzidos a debug

### 2.2.4 (2026-06-10)
- (ssbingo) fix: leitura TOU pré-aquecimento ESS (FC03, 50000–50183) e escrita implementadas; encodeValue adicionado

### 2.2.3 (2026-06-10)
- (ssbingo) fix: adicionadas 25 chaves i18n em falta (PSS, PID, pré-aquecimento ESS, registos alargados) em todos os 11 idiomas

### 2.2.2 (2026-06-09)
- (ssbingo) docs: atualização de todos os READMEs para o protocolo Modbus V2.9 — adicionados PSS, PID, pré-aquecimento ESS, registos alargados, SigenMicro

### 2.2.1 (2026-06-09)
- (ssbingo) fix: tabela de registos PSS corrigida para 122 entradas conforme especificação oficial V2.9 (endereços, ganhos, tipos); registos de escrita PSS corrigidos para 6 entradas WO; registos PID 33055-33060 corrigidos (tipos, ganhos, 2 entradas em falta)

### 2.2.0 (2026-06-09)
- (ssbingo) Funcionalidade: suporte PSS (comutador de potência) e PID (detecção de isolamento PV); registros de agendamento TOU de pré-aquecimento ESS; novas opções admin para IDs escravos PSS/PID

### 2.1.1 (2026-06-09)
- (ssbingo) fix: wire feature flags (enableSmartLoads, enableCumulativeEnergy, enableGridCode) into polling and object creation; add Extended Registers admin tab

### 2.1.0 (2026-06-09)
- (ssbingo) Funcionalidade: estatísticas alargadas — estatísticas de instalação (30088–30097), cargas inteligentes 1–24 (30098–30193), energia acumulada (30194–30271), feedback de ajuste (30613–30619), parâmetros de código de rede (40049–40068)

### 2.0.0 (2026-06-09)
- (ssbingo) Funcionalidade: Protocolo Modbus V2.9 — novos registos de instalação/inversor/carregador DC, registos obsoletos removidos, enumerações expandidas

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
