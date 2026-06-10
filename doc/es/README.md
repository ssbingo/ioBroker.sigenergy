# ioBroker Sigenergy Adaptador

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adaptador para sistemas de energía solar Sigenergy a través de Modbus TCP/RTU**

Compatible con el protocolo Sigenergy Modbus V2.9 (publicado el 2026-05-13).

---

## Funcionalidades

- 📡 **Modbus TCP** (Ethernet / WLAN / fibra óptica / 4G) — puerto 502
- 🔗 **Modbus RTU** (RS485 serie)
- ⚡ **Soporte completo de registros** — todos los registros de instalación, inversor, PSS y PID según la especificación V2.9
- 🔋 **Estadísticas de batería** — tiempo hasta carga completa, tiempo restante, cobertura diaria
- ☀️ **Estadísticas PV** — tasa de autoconsumo, tasa de autarquía
- 🔌 **Cargador AC** (Sigen EVAC) — opcional
- ⚡ **Cargador DC** — opcional
- 🏗️ **PSS** (conmutador de alimentación) — Opcional, monitorización de celdas MV/BT y armario de distribución
- 🔍 **PID** (detección de aislamiento PV) — Opcional
- 🌡️ **Precalentamiento ESS** — Programación TOU, 30 ventanas de tiempo configurables (M1-HYA/HYB)
- 📈 **Registros extendidos** — Cargas inteligentes 1–24, contadores de energía, parámetros de código de red
- ☀️ **SigenMicro** — Soporte de micro-inversores (detección automática)
- 📊 **Valores calculados** — estadísticas derivadas actualizadas en cada ciclo de sondeo
- 🖥️ **Widgets VIS** — flujo de energía, estado de batería, paneles de estadísticas

---

## Hardware compatible

| Categoría        | Modelos |
|-----------------|---------|
| **Inversor híbrido** | SigenStor EC SP/TP, Sigen Hybrid SP/TP/TPLV, Sigen PV M1-HYA, PG Controller |
| **Inversor PV** | Sigen PV Max SP/TP, Sigen PV M1 |
| **EVAC (AC)**   | Sigen EVAC 7/11/22 kW, PG EVAC |

---

## Direcciones Modbus predeterminadas

| Dispositivo | Dirección |
|------------|-----------|
| Instalación (lectura/escritura) | **247** |
| Difusión instalación (escritura, sin respuesta) | **0** |
| Inversor | **1** |
| Cargador AC (EVAC) | **2** |

---

## Instalación

### A través de ioBroker Admin (recomendado)
1. Abrir ioBroker Admin → Adaptadores
2. Buscar «sigenergy»
3. Instalar

---

## Configuración

### Pestaña Conexión
- **Tipo de conexión**: TCP (Ethernet) o Serie (RS485)
- **Host TCP**: Dirección IP del inversor
- **Puerto TCP**: 502 (predeterminado)
- **ID Modbus instalación**: 247 (predeterminado)
- **ID Modbus inversor**: 1 (predeterminado)

### Pestaña Componentes
Seleccionar los dispositivos instalados:
- Batería / ESS
- Paneles PV
- Cargador AC (EVAC)
- Cargador DC
- PSS (conmutador de alimentación)
- PID (detección de aislamiento PV)
- Precalentamiento ESS (solo M1-HYA/HYB)
- SigenMicro (micro-inversores)

### Pestaña Estadísticas
Elegir los valores estadísticos a calcular:
- Tiempo hasta carga completa de la batería
- Tiempo restante de la batería
- Tiempo de carga diario
- Tiempo de cobertura de la batería
- Tasa de autoconsumo
- Tasa de autarquía

---

## Objetos de datos

### Instalación (`plant.*`)
| Estado | Descripción | Unidad |
|--------|-------------|--------|
| `plant.gridActivePower` | Potencia red (>0 importación, <0 exportación) | kW |
| `plant.pvPower` | Generación PV | kW |
| `plant.essPower` | Potencia batería (<0 descarga) | kW |
| `plant.essSoc` | Estado de carga de la batería | % |
| `plant.activePower` | Potencia activa total instalación | kW |
| `plant.runningState` | Estado instalación (0=Espera, 1=Activo...) | - |

### Inversor (`inverter.*`)
| Estado | Descripción | Unidad |
|--------|-------------|--------|
| `inverter.pvPower` | Potencia PV en el inversor | kW |
| `inverter.essBatterySoc` | SOC batería | % |
| `inverter.essBatterySoh` | SOH batería | % |
| `inverter.essBatteryTemperature` | Temperatura batería | °C |
| `inverter.phaseAVoltage` | Tensión fase A | V |
| `inverter.gridFrequency` | Frecuencia de red | Hz |

### Estadísticas (`statistics.*`)
| Estado | Descripción | Unidad |
|--------|-------------|--------|
| `statistics.batteryTimeToFull` | Minutos hasta batería llena | min |
| `statistics.batteryTimeRemaining` | Tiempo restante de batería | min |
| `statistics.selfConsumptionRate` | Tasa de autoconsumo | % |
| `statistics.autarkyRate` | Tasa de autarquía | % |
| `statistics.housePower` | Consumo doméstico calculado | kW |

---

## Widgets VIS

> **Nota:** Los 7 widgets son proporcionados por el adaptador separado [ioBroker.vis-2-widgets-sigenergy](https://github.com/ssbingo/ioBroker.vis-2-widgets-sigenergy). Instálelo junto con este adaptador para usar los widgets en VIS-2.

### Widget flujo de energía
Muestra el flujo de energía animado entre PV → Batería ↔ Red → Casa.

### Widget estado de batería
Muestra la barra SOC, el distintivo SOH, el tiempo hasta carga/descarga completa, la potencia actual.

### Widget resumen de potencia
Lectura en tiempo real de los cuatro flujos de potencia.

### Widget estadísticas
Autarquía de hoy, autoconsumo, SOC mín/máx, tiempo de cobertura de batería.

### Widget inversor
Datos del inversor en tiempo real: potencia PV, frecuencia de red, tensiones de fase, temperatura.

### Widget cargador AC (EVAC)
Estado y mediciones de potencia de la estación de carga Sigen EVAC.

### Widget cargador DC
Estado y mediciones de potencia del cargador DC.

---

## Protocolo de comunicación

- Modbus TCP: modo TCP, full duplex, puerto 502 (esclavo)
- Modbus RTU: half duplex, 9600 bps, 8N1
- Intervalo de sondeo mínimo: 1000 ms (1 segundo) según la especificación Sigenergy
- Tiempo de espera: 1000 ms según la especificación Sigenergy

---

## Changelog

### 2.3.0 (2026-06-10)
- (ssbingo) feat: mapas enum common.states añadidos para emsWorkMode/runningState/remoteEmsMode/dcCharger.runningState; registros de escritura PSS/PID/AC Charger (FC06/FC10) conectados con subscribe y handlers onStateChange

### 2.2.7 (2026-06-10)
- (ssbingo) Corrección: defaults native enableSmartLoads/enableCumulativeEnergy/enableGridCode añadidos a io-package.json
- (ssbingo) Corrección: descripción del registro 30003 actualizada con modos EMS V2.7 5 (FullFeedIn) y 9 (Custom)

### 2.2.6 (2026-06-10)
- (ssbingo) Nuevo: auditoría de registros V2.9 — registro faltante 30279 añadido, registros PV DC Charger 31509/31511 movidos al namespace dcCharger, gain TOU ESS Preheating corregido
- (ssbingo) Nuevo: escritura de retorno de registros de control plant.control.*, plant.gridCode.*, inverter.control.*, dcCharger.control.* (FC06/FC10); registros RW leídos al inicio
- (ssbingo) Corrección: advertencias repetidas de ESS Preheating suprimidas; errores de lectura de registros de control al inicio reducidos a debug

### 2.2.4 (2026-06-10)
- (ssbingo) fix: lectura TOU precalentamiento ESS (FC03, 50000–50183) y escritura implementadas; encodeValue añadido

### 2.2.3 (2026-06-10)
- (ssbingo) fix: añadidas 25 claves i18n faltantes (PSS, PID, precalentamiento ESS, registros extendidos) en los 11 idiomas

### 2.2.2 (2026-06-09)
- (ssbingo) docs: actualización de todos los READMEs al protocolo Modbus V2.9 — añadidos PSS, PID, precalentamiento ESS, registros extendidos, SigenMicro

### 2.2.1 (2026-06-09)
- (ssbingo) fix: tabla de registros PSS corregida a 122 entradas según especificación oficial V2.9 (direcciones, ganancias, tipos); registros de escritura PSS corregidos a 6 entradas WO; registros PID 33055-33060 corregidos (tipos, ganancias, 2 entradas faltantes)

### 2.2.0 (2026-06-09)
- (ssbingo) Función: compatibilidad con PSS (conmutador de alimentación) y PID (detección de aislamiento PV); registros de programación TOU de precalentamiento ESS; nuevas opciones admin para ID esclavos PSS/PID

### 2.1.1 (2026-06-09)
- (ssbingo) fix: wire feature flags (enableSmartLoads, enableCumulativeEnergy, enableGridCode) into polling and object creation; add Extended Registers admin tab

### 2.1.0 (2026-06-09)
- (ssbingo) Función: estadísticas ampliadas — estadísticas de planta (30088–30097), cargas inteligentes 1–24 (30098–30193), energía acumulada (30194–30271), retroalimentación de ajuste (30613–30619), parámetros de código de red (40049–40068)

### 2.0.0 (2026-06-09)
- (ssbingo) Función: Protocolo Modbus V2.9 — nuevos registros de planta/inversor/cargador DC, registros obsoletos eliminados, enumeraciones ampliadas

### 1.9.17 (2026-06-08)
- (ssbingo) Corrección: eliminado formato largo i18n duplicado (admin/i18n), añadida clave de traducción /dev/ttyUSB0

### 1.9.16 (2026-06-08)
- (ssbingo) Chore: devDependency @alcalzone/release-script actualizada a ^5.2.1

### 1.9.15 (2026-06-08)
- (ssbingo) Chore: añadido @tsconfig/node22 como devDependency (actualización de plantilla ioBroker)
- (ssbingo) Chore: testing-action-check actualizado a @v2
- (ssbingo) Chore: actualización de seguridad de axios

### 1.9.14 (2026-05-27)
- (ssbingo) Corrección: ajustes en el pipeline CI — Node.js 24, @types/node ^22.0.0, package-lock.json corregido; solo la entrada más reciente en common.news

### 1.9.13 (2026-05-27)
- (ssbingo) Corrección: package-lock.json actualizado para @types/node ^22.0.0 (estaba bloqueado en 25.x)

### 1.9.12 (2026-05-27)
- (ssbingo) Corrección: @types/node fijado en ^22.0.0 en devDependencies

### 1.9.11 (2026-05-27)
- (ssbingo) Corrección: Node.js 24 para jobs CI check-and-lint y deploy
- (ssbingo) Chore: añadido @types/node como devDependency

### 1.9.10 (2026-05-27)
- (ssbingo) Actualizaciones de dependencias via Dependabot — @alcalzone/release-script* 5.2.0, @iobroker/eslint-config 2.3.4
- (ssbingo) Actualizaciones de CI — actions/setup-node@v6, testing-action-deploy@v1

### 1.9.9 (2026-05-14)
- (ssbingo) Actualizaciones de dependencias via Dependabot: protobufjs, @protobufjs/utf8, fast-uri
- (ssbingo) Ahora requiere Node.js >= 22

### 1.9.8 (2026-04-22)
- (ssbingo) Corrección: registros de error de conexión/polling deduplicados evitan inundación de logs y mejoran la compatibilidad con Sentry
- (ssbingo) Corrección: protecciones de cierre y extendForeignObject previenen condiciones de carrera al descargar y con la UI de admin
- (ssbingo) Corrección: fuga de socket en timeout de Modbus solucionada; testConnection ahora pausa el polling; canales de control vacíos eliminados

### 1.9.7 (2026-04-16)
- (ssbingo) Nuevo: añadidos estados calculados plant.pv1Power, plant.pv2Power, plant.pv3Power
