# ioBroker Sigenergy Adaptador

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adaptador para sistemas de energía solar Sigenergy a través de Modbus TCP/RTU**

Compatible con el protocolo Sigenergy Modbus V2.5 (publicado el 2025-02-19).

---

## Funcionalidades

- 📡 **Modbus TCP** (Ethernet / WLAN / fibra óptica / 4G) — puerto 502
- 🔗 **Modbus RTU** (RS485 serie)
- ⚡ **Soporte completo de registros** — todos los registros de instalación e inversor según la especificación V2.5
- 🔋 **Estadísticas de batería** — tiempo hasta carga completa, tiempo restante, cobertura diaria
- ☀️ **Estadísticas PV** — tasa de autoconsumo, tasa de autarquía
- 🔌 **Cargador AC** (Sigen EVAC) — opcional
- ⚡ **Cargador DC** — opcional
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


### 1.9.6 (2026-04-16)
- (ssbingo) Nuevo: añadidos estados calculados plant.pv1Power, plant.pv2Power, plant.pv3Power


### 1.9.5 (2026-04-08)
- (ssbingo) Corrección: eliminado common.schedule no utilizado de io-package.json

### 1.9.4 (2026-04-08)
- (ssbingo) Corrección: Changelog / añadido CHANGELOG_OLD.md

### 1.9.3 (2026-04-08)
- (ssbingo) Corrección: eliminado admin/index.html

### 1.9.2 (2026-04-08)
- (ssbingo) Correcciones

### 1.9.1 (2026-04-08)
- (ssbingo) Interfaz de administración corregida: eliminados archivos obsoletos index.html/index_m.html/words.js; corregido el tipo jsonData en los botones sendTo de jsonConfig

### 1.9.0 (2026-03-26)
- (ssbingo) Prueba completada

### 1.8.23 (2026-03-26)
- (ssbingo) Año de copyright corregido a 2026 en LICENSE y README; correcciones técnicas: CI/CD, linting, pruebas

