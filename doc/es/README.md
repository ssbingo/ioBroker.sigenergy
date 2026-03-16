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

## Licencia

Licencia MIT — Copyright (c) 2025 ioBroker Community

---

## Changelog
### 1.6.2 (2026-03-16)
* Scan: chunked sendTo (3 IDs por llamada) restaurado; progreso doble: texto por chunk + getState de info.scanProgress

### 1.6.1 (2026-03-16)
* Progreso scan: subscribeState reemplazado por setInterval+getState (500ms); timer seguridad 2s por ID

### 1.6.0 (2026-03-16)
* Progreso scan: State subscription (info.scanProgress) en lugar de sendTo chunks; adaptador escribe progreso por ID

### 1.5.6 (2026-03-16)
* Barra de progreso invisible reemplazada por linea de texto con porcentaje y rango de ID

### 1.5.5 (2026-03-16)
* Correcion scan SigenMicro: reutilizar conexion Modbus existente; pausar polling; inicio duplicado corregido

### 1.5.4 (2026-03-16)
* Progreso SigenMicro: clases CSS reemplazadas por element.style.display; timeout sonda 1000ms; tamano chunk 3

### 1.5.3 (2026-03-16)
* Corrección progreso scan SigenMicro: transición CSS max-height + animación shimmer; requestAnimationFrame para repintado confiable

### 1.5.2 (2026-03-16)
* Pestaña SigenMicro: barra de progreso visible; IDs reservados mostrados y omitidos; mensaje cuando no se encuentran dispositivos

### 1.5.1 (2026-03-16)
* Botón de escaneo SigenMicro añadido directamente en la pestaña jsonConfig; los dispositivos encontrados se guardan automáticamente

### 1.5.0 (2026-03-16)
* Pestaña SigenMicro: botón de escaneo destacado, barra de progreso en tiempo real con rango de ID y contador de dispositivos

### 1.4.1 (2026-03-16)
* Soporte SigenMicro: escaneo Modbus, detección de dispositivos, activación individual, pestaña dedicada

### 1.4.0 (2026-03-14)
* Correcciones / Limpieza

### 1.3.19 (2026-03-14)
* Revertido eslint/@eslint/js a 9.x; serialport actualizado a 13.0.0

### 1.3.18 (2026-03-14)
* Actualizados eslint 10.0.3, @eslint/js 10.0.1, serialport 13.0.0

### 1.3.17 (2026-03-13)
* Mocha eliminado de devDependencies

### 1.3.16 (2026-03-13)
* Restaurada dependencia mocha, corregido script test:package

### 1.3.15 (2026-03-13)
* Corregida indentación setTimeout en testConnection

### 1.3.14 (2026-03-13)
* Corregidos los dos últimos errores de lint

### 1.3.13 (2026-03-13)
* Todos los errores ESLint/Prettier corregidos: JSDoc, formato, importaciones no usadas

### 1.3.12 (2026-03-13)
* Corrección regresión curly en modbus.js, statistics.js, main.js

### 1.3.11 (2026-03-13)
* Corrección Prettier: comas finales faltantes en registers.js

### 1.3.10 (2026-03-13)
* Corrección Prettier: objetos de registro expandidos a formato multilínea

### 1.3.9 (2026-03-13)
* Añadida documentación en README.md - multilingüe

### 1.3.8 (2026-03-13)
* Añadidas traducciones uk/zh-cn faltantes

### 1.3.7 (2026-03-13)
* Eliminada dependencia mocha redundante

### 1.3.6 (2026-03-13)
* Corrección del formateo Prettier/ESLint

### 1.3.5 (2026-03-13)
* (ssbingo) Fix CI: usar ruta binaria explícita de mocha para evitar problemas de resolución PATH con npm ci

### 1.3.4 (2026-03-13)
* (ssbingo) Fix CI: mocha añadido a devDependencies para que el script test:package pueda ejecutarse

### 1.3.3 (2026-03-13)
* (ssbingo) Corregida advertencia JSDoc @param duplicada causada por etiqueta de cierre faltante en modbus.js

### 1.3.2 (2026-03-13)
* (ssbingo) Correcciones de calidad de código: variables no utilizadas eliminadas, documentación JSDoc completada, declaración léxica en switch-case corregida

### 1.3.0 (2026-03-13)
* (ssbingo) Documentación multilingüe actualizada

### 1.2.5 (2026-03-12)
* (ssbingo) Correcciones

### 1.2.4 (2026-03-12)
* (ssbingo) Documentación multilingüe añadida a README.md

### 1.2.3 (2026-03-12)
* (ssbingo) Correcciones para AdapterCheck

### 1.2.0 (2026-03-11)
* (ssbingo) StatisticsCalculator actualizado: re-añadidas estimaciones de tiempo de batería, tiempo de carga diario y seguimiento de cobertura de batería

### 1.1.7 (2026-03-11)
* (ssbingo) Logging mejorado: mensajes debug/info/warn/error para conexión, ciclos de polling, lecturas de registros y parada del adaptador

### 1.1.0 (2026-03-09)
* (ssbingo) Interfaz de administración migrada de HTML legacy a jsonConfig (Admin 5+)

### 0.1.0 (2026-03-01)
* (ssbingo) Primera versión — soporte Modbus TCP/RTU para sistemas Sigenergy

---

## Documentación

- 🇬🇧 [English documentation](../../README.md)
- 🇩🇪 [Deutsche Dokumentation](../de/README.md)
- 🇷🇺 [Документация на русском](../ru/README.md)
- 🇳🇱 [Nederlandse documentatie](../nl/README.md)
- 🇫🇷 [Documentation française](../fr/README.md)
- 🇮🇹 [Documentazione italiana](../it/README.md)
- 🇵🇱 [Dokumentacja polska](../pl/README.md)
- 🇵🇹 [Documentação portuguesa](../pt/README.md)
- 🇺🇦 [Документація українською](../uk/README.md)
- 🇨🇳 [简体中文文档](../zh-cn/README.md)
