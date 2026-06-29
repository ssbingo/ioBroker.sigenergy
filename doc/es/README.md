# ioBroker Sigenergy Adaptador

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Adaptador para sistemas de energía solar Sigenergy a través de Modbus TCP/RTU**

Compatible con el protocolo Sigenergy Modbus V2.9 (publicado el 2026-05-13).

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
</p>

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

## Desconexión de emergencia — protección de sistemas fotovoltaicos externos

### Antecedentes

Los inversores híbridos Sigenergy disponen de una **pasarela de emergencia** opcional
que cambia automáticamente al modo fuera de red / isla cuando falla la red eléctrica.
En este modo, el sistema Sigenergy genera su propia red local de corriente alterna,
alimentada por la batería.

Si un **segundo sistema fotovoltaico** — como una central de balcón, un micro-inversor
o un inversor de cadena de terceros — está conectado al mismo circuito doméstico,
seguirá inyectando energía en esta red local aislada. La mayoría de los inversores
conectados a la red no están diseñados para esta situación y pueden:

- sobrecargar la gestión de la batería de Sigenergy
- desestabilizar la tensión o la frecuencia en la red en isla
- sufrir daños por las inusuales condiciones de funcionamiento

La única solución segura es la **desconexión inmediata** del sistema externo
en cuanto Sigenergy pasa al modo fuera de red.

### Cómo gestiona esto el adaptador

El adaptador monitoriza el estado `plant.onOffGridStatus` en cada ciclo de sondeo.

**En caso de fallo de red** (`onOffGridStatus` = 1 o 2):
- Todos los dispositivos de emergencia configurados se conmutan instantáneamente
- Se envía una notificación de Telegram (opcional)

**Al retorno de la red** (`onOffGridStatus` = 0):
- Se inicia un temporizador de estabilización configurable (predeterminado: 10 minutos)
- Si la red permanece estable durante toda la duración, los dispositivos se restauran
- Si la red vuelve a fallar durante el temporizador, el temporizador se cancela
  y los dispositivos permanecen apagados
- Al restaurarse con éxito se envía una notificación de Telegram (opcional)

### Activar la función

**Paso 1 — pestaña Componentes**  
Activar la casilla **Pasarela de emergencia (conmutación fuera de red)**.  
La pestaña *Desconexión de emergencia* se vuelve visible.

**Paso 2 — pestaña Desconexión de emergencia**

#### Dispositivos

| Campo | Descripción |
|---|---|
| **Retardo de estabilización (minutos)** | Tiempo que la red debe permanecer estable antes de volver a encender los dispositivos. Recomendación: 10 minutos. |
| **Dispositivo 1 — ID de objeto** | El ID de estado ioBroker del interruptor principal del sistema externo. Se establece en `false` en caso de fallo de red; `true` tras una recuperación estable. |
| **Dispositivos 2–4 — ID de objeto** | Dispositivos opcionales adicionales. |
| **Dispositivos 2–4 — Dirección** | *APAGADO en fallo, ENCENDIDO tras recuperación* o *ENCENDIDO en fallo, APAGADO tras recuperación*. |

#### Notificaciones de Telegram (opcional)

| Campo | Descripción |
|---|---|
| **Activar notificación de Telegram** | Activa las notificaciones en caso de fallo y recuperación de la red. |
| **Instancia de Telegram** | Seleccionar la instancia del adaptador `telegram.x` a utilizar. |
| **ID de chat** | Opcional: restringir a un chat específico. Dejar vacío para difusión a todos. |

### Ejemplo — central de balcón

Un relé Shelly Plus 1 está cableado en serie con el cable de alimentación de la central de balcón.
Su ID de estado ioBroker es `shelly.0.SHPLUS1-ABC123.Relay0.Switch`.

Configuración:
- **Dispositivo 1**: `shelly.0.SHPLUS1-ABC123.Relay0.Switch`  
  → El relé se abre (`false`) en caso de fallo de red, se cierra (`true`) tras una recuperación estable

La central de balcón está ahora automáticamente protegida.

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

### 3.0.8 (2026-06-29)
- (ssbingo) fix: traducciones i18n faltantes añadidas para cadenas de la interfaz de escaneo SigenMicro (es, fr, it, nl, pl, pt, uk, zh-cn)

### 3.0.7 (2026-06-28)
- (ssbingo) chore: dependencias actualizadas (@iobroker/adapter-core 3.4.1, @types/node 22.20.0, testing-action-adapter 1.1.1, testing-action-deploy 1.5.0, http-proxy-middleware 3.0.7)

### 3.0.6 (2026-06-14)
- (ssbingo) fix: campo common.license duplicado eliminado — licenseInformation ya presente

### 3.0.5 (2026-06-14)
- (ssbingo) fix: campo license faltante añadido al bloque common de io-package.json

### 3.0.4 (2026-06-14)
- (ssbingo) Corrección: la notificación Telegram ante un corte de red ahora se envía una sola vez (no en cada poll); la conmutación de dispositivos se limita a 3 intentos máximos (inicial + 2 reintentos) en modo fuera de red

### 3.0.3 (2026-06-13)
- (ssbingo) Corrección: eliminado welcomeText no funcional de io-package.json; añadido aviso staticText visible en pestaña Desconexión de emergencia (caja amarilla, i18n en los 11 idiomas)

### 3.0.2 (2026-06-13)
- (ssbingo) Corrección: errores ESLint/Prettier en métodos de desconexión de emergencia — variable no utilizada eliminada, sangría corregida, tipos JSDoc @param añadidos

### 3.0.1 (2026-06-13)
- (ssbingo) Nuevo: welcomeText añadido a io-package.json — aviso multilingüe sobre la función de desconexión de emergencia

### 3.0.0 (2026-06-13)
- (ssbingo) Nuevo: desconexión de emergencia — desconexión automática de sistemas fotovoltaicos externos (centrales de balcón, micro-inversores) ante fallos de red; temporizador de estabilización configurable al retorno de la red; notificaciones Telegram opcionales
- (ssbingo) Docs: documentación de desconexión de emergencia añadida en los 11 idiomas

### 2.5.2 (2026-06-12)
- (ssbingo) fix: espacios en la URL del botón Buy Me a Coffee codificados como %20 — la imagen no se mostraba en GitHub

### 2.5.1 (2026-06-12)
- (ssbingo) fix: corregido el role del instanceObject info.modelType de 'info.name' a 'text' (avisos W1133/W1135 del adapter-checker)

### 2.5.0 (2026-06-12)

- (ssbingo) Seguridad de escritura arquitectónica: las escrituras Modbus se rechazan directamente en el despachador cuando el registro de destino no es válido para el tipo de dispositivo configurado (gating de models en onStateChange, guardia de plant para solo SigenMicro)
- (ssbingo) Comprobación de TypeScript corregida — nuevo `lib/adapter-config.d.ts` con declaración completa de AdapterConfig, constructor de modbus-serial tipado, anotaciones ioBroker.CommonType/SettableObject; el nuevo script `npm run check` pasa con 0 errores
- (ssbingo) La configuración de ESLint permite etiquetas JSDoc `@type` en este proyecto JavaScript verificado (jsdoc/check-tag-names con typed:false)

### 2.4.0 (2026-06-12)

- (ssbingo) Arquitectura de tipos de dispositivo: selector obligatorio (SigenStor / Sigen Hybrid / Sigen PV M1-HYB / inversor solo PV / solo SigenMicro) con separación estricta de registros según las notas del protocolo V2.9
- (ssbingo) Soporte oficial para Sigen Hybrid e inversores solo PV (Sigen PV / PV Max)
- (ssbingo) Detección automática del tipo de dispositivo desde el hardware en el admin (registros 30500 / 31024)
- (ssbingo) Verificación del modelo al inicio — advierte si la configuración y el hardware detectado no coinciden (nuevo estado info.modelType)
- (ssbingo) Registros PV dinámicos: PV5-PV16 tensión/corriente según el número de strings del registro 31025
- (ssbingo) Control del factor de potencia PCC (40157/40158) solo para M1-HYB; precalentamiento ESS solo M1-HYB; cargador DC y grid code solo SigenStor/Sigen Hybrid
- (ssbingo) Migración automática de configuraciones anteriores a 2.4.0 y limpieza de canales no válidos para el tipo de dispositivo seleccionado

### 2.3.4 (2026-06-12)
- (ssbingo) fix: corrección de la detección del nivel de protocolo — cantidades correctas de registros para sondas, orden descendente V2.9→V2.6, distinción de errores de transporte de excepciones del dispositivo para evitar informe falso pre-V2.6

### 2.3.3 (2026-06-11)
- (ssbingo) fix: suprimir advertencias repetidas de lectura de registros tras la primera aparición para plant/inverter/acCharger/dcCharger/pss/pid; los fallos posteriores solo se registran a nivel debug

### 2.3.2 (2026-06-10)
- (ssbingo) fix: mostrar 'pre-V2.6' en lugar de 'unknown' cuando el dispositivo responde pero no tiene registros plant extendidos; log de depuración por sonda con mensaje de excepción Modbus

### 2.3.1 (2026-06-10)
- (ssbingo) feat: detectar nivel de protocolo Modbus en el arranque sondeando registros 30088/30200/30228/30286; leer versión de firmware (30525); registrar resultado y almacenar como estado info.protocolLevel

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
