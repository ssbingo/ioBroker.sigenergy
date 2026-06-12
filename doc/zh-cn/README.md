# ioBroker Sigenergy 适配器

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**通过 Modbus TCP/RTU 连接 Sigenergy 太阳能系统的适配器**

支持 Sigenergy Modbus 协议 V2.9（发布日期：2026-05-13）。

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
</p>

---

## 功能特性

- 📡 **Modbus TCP**（以太网 / 无线局域网 / 光纤 / 4G）— 端口 502
- 🔗 **Modbus RTU**（RS485 串行）
- ⚡ **完整寄存器支持** — 符合 V2.9 规范的所有电站、逆变器、PSS 和 PID 寄存器
- 🔋 **电池统计** — 充满时间、剩余时间、每日覆盖率
- ☀️ **光伏统计** — 自耗率、自给率
- 🔌 **交流充电桩**（Sigen EVAC）— 可选
- ⚡ **直流充电桩** — 可选
- 🏗️ **PSS**（电力站开关）— 可选，含 MV/LV 开关设备和配电柜监控
- 🔍 **PID**（光伏绝缘检测）— 可选
- 🌡️ **ESS 预热** — TOU 时间表，30 个可配置时间窗口（M1-HYA/HYB）
- 📈 **扩展寄存器** — 智能负载 1–24、累计能量计量、电网规格参数
- ☀️ **SigenMicro** — 微型逆变器支持（自动扫描）
- 📊 **计算值** — 每次轮询周期更新的派生统计数据
- 🖥️ **VIS 组件** — 能量流、电池状态、统计面板

---

## 支持的硬件

| 类别 | 型号 |
|------|------|
| **混合逆变器** | SigenStor EC SP/TP、Sigen Hybrid SP/TP/TPLV、Sigen PV M1-HYA、PG Controller |
| **光伏逆变器** | Sigen PV Max SP/TP、Sigen PV M1 |
| **EVAC（交流）** | Sigen EVAC 7/11/22 kW、PG EVAC |

---

## 默认 Modbus 地址

| 设备 | 地址 |
|------|------|
| 电站（读/写） | **247** |
| 电站广播（只写，无响应） | **0** |
| 逆变器 | **1** |
| 交流充电桩（EVAC） | **2** |

---

## 安装

### 通过 ioBroker Admin（推荐）
1. 打开 ioBroker Admin → 适配器
2. 搜索「sigenergy」
3. 安装

---

## 配置

### 连接选项卡
- **连接类型**：TCP（以太网）或串行（RS485）
- **TCP 主机**：逆变器的 IP 地址
- **TCP 端口**：502（默认）
- **电站 Modbus ID**：247（默认）
- **逆变器 Modbus ID**：1（默认）

### 组件选项卡
选择已安装的设备：
- 电池 / ESS
- 光伏板
- 交流充电桩（EVAC）
- 直流充电桩
- PSS（电力站开关）
- PID（光伏绝缘检测）
- ESS 预热（仅限 M1-HYA/HYB）
- SigenMicro（微型逆变器）

### 统计选项卡
选择要计算的统计值：
- 电池充满时间
- 电池剩余时间
- 每日充电时间
- 电池覆盖时间
- 自耗率
- 自给率

---

## 数据对象

### 电站（`plant.*`）
| 状态 | 描述 | 单位 |
|------|------|------|
| `plant.gridActivePower` | 电网功率（>0 输入，<0 输出） | kW |
| `plant.pvPower` | 光伏发电量 | kW |
| `plant.essPower` | 电池功率（<0 放电） | kW |
| `plant.essSoc` | 电池荷电状态 | % |
| `plant.activePower` | 电站总有功功率 | kW |
| `plant.runningState` | 电站状态（0=待机，1=运行...） | - |

### 逆变器（`inverter.*`）
| 状态 | 描述 | 单位 |
|------|------|------|
| `inverter.pvPower` | 逆变器光伏功率 | kW |
| `inverter.essBatterySoc` | 电池 SOC | % |
| `inverter.essBatterySoh` | 电池 SOH | % |
| `inverter.essBatteryTemperature` | 电池温度 | °C |
| `inverter.phaseAVoltage` | A 相电压 | V |
| `inverter.gridFrequency` | 电网频率 | Hz |

### 统计（`statistics.*`）
| 状态 | 描述 | 单位 |
|------|------|------|
| `statistics.batteryTimeToFull` | 电池充满所需分钟数 | 分钟 |
| `statistics.batteryTimeRemaining` | 电池剩余分钟数 | 分钟 |
| `statistics.selfConsumptionRate` | 自耗率 | % |
| `statistics.autarkyRate` | 自给率 | % |
| `statistics.housePower` | 计算得出的家庭用电量 | kW |

---

## VIS 组件

> **注意：** 全部 7 个组件由独立适配器 [ioBroker.vis-2-widgets-sigenergy](https://github.com/ssbingo/ioBroker.vis-2-widgets-sigenergy) 提供。请与本适配器一起安装，以便在 VIS-2 中使用这些组件。

### 能量流组件
显示 光伏 → 电池 ↔ 电网 → 家庭 之间的动态能量流动。

### 电池状态组件
显示 SOC 进度条、SOH 标签、充满/耗尽时间、当前功率。

### 功率概览组件
实时显示全部四路功率流。

### 统计组件
今日自给率、自耗率、SOC 最小/最大值、电池覆盖时间。

### 逆变器组件
逆变器实时数据：光伏功率、电网频率、各相电压、温度。

### 交流充电桩组件（EVAC）
Sigen EVAC 充电站的状态和功率读数。

### 直流充电桩组件
直流充电桩的状态和功率读数。

---

## 通信协议

- Modbus TCP：TCP 模式，全双工，端口 502（从站）
- Modbus RTU：半双工，9600 bps，8N1
- 最小轮询间隔：1000 ms（1 秒），符合 Sigenergy 规范
- 超时：1000 ms，符合 Sigenergy 规范

---

## 更新日志

### 2.5.1 (2026-06-12)
- (ssbingo) fix: 将 instanceObject info.modelType 的 role 从 'info.name' 更正为 'text'（adapter-checker 警告 W1133/W1135）

### 2.5.0 (2026-06-12)

- (ssbingo) 架构级写入安全：当目标寄存器对所配置的设备类型无效时，Modbus 写入会在写入调度器中被直接拒绝（onStateChange 中的 models 门控，仅 SigenMicro 模式的电站防护）
- (ssbingo) 修复 TypeScript 类型检查——新增 `lib/adapter-config.d.ts` 提供完整的 AdapterConfig 声明、类型化的 modbus-serial 构造函数、ioBroker.CommonType/SettableObject 注解；新脚本 `npm run check` 以 0 错误通过
- (ssbingo) ESLint 配置允许在此受检 JavaScript 项目中使用 JSDoc `@type` 标签（jsdoc/check-tag-names 设为 typed:false）

### 2.4.0 (2026-06-12)

- (ssbingo) 设备类型架构：必选选择器（SigenStor / Sigen Hybrid / Sigen PV M1-HYB / 纯光伏逆变器 / 仅 SigenMicro），按协议 V2.9 型号脚注进行严格的二选一寄存器门控
- (ssbingo) 正式支持 Sigen Hybrid 和纯光伏逆变器（Sigen PV / PV Max）
- (ssbingo) 管理界面可从硬件自动检测设备类型（寄存器 30500 / 31024）
- (ssbingo) 启动时进行型号校验——配置与检测到的硬件不一致时发出警告（新状态 info.modelType）
- (ssbingo) 动态光伏组串寄存器：根据寄存器 31025 报告的组串数量启用 PV5-PV16 电压/电流
- (ssbingo) PCC 功率因数控制（40157/40158）仅限 M1-HYB；ESS 预热仅限 M1-HYB；直流充电器和电网准则仅限 SigenStor/Sigen Hybrid
- (ssbingo) 自动迁移 2.4.0 之前的配置并清理对所选设备类型无效的通道

### 2.3.4 (2026-06-12)
- (ssbingo) fix: 修正协议版本检测 — 使用正确的寄存器数量探测，从 V2.9 降序到 V2.6，区分传输错误和设备异常，避免误报 pre-V2.6

### 2.3.3 (2026-06-11)
- (ssbingo) fix: 对 plant/inverter/acCharger/dcCharger/pss/pid 寄存器读取警告在首次出现后不再重复；后续失败仅在 debug 级别记录

### 2.3.2 (2026-06-10)
- (ssbingo) fix: 当设备响应但无扩展 plant 寄存器时显示 'pre-V2.6' 而非 'unknown'；为每个探针添加含 Modbus 异常信息的调试日志

### 2.3.1 (2026-06-10)
- (ssbingo) feat: 启动时通过探测寄存器 30088/30200/30228/30286 检测 Modbus 协议级别；读取固件版本（30525）；记录结果并存储为 info.protocolLevel 状态

### 2.3.0 (2026-06-10)
- (ssbingo) feat: 为 emsWorkMode/runningState/remoteEmsMode/dcCharger.runningState 添加 common.states 枚举映射；连接 PSS/PID/交流充电桩写寄存器（FC06/FC10），含 subscribe 和 onStateChange 处理器

### 2.2.7 (2026-06-10)
- (ssbingo) 修复：在 io-package.json 中添加缺失的 native 默认值 enableSmartLoads/enableCumulativeEnergy/enableGridCode
- (ssbingo) 修复：更新寄存器 30003 描述，包含 V2.7 EMS 模式 5（完全并网）和 9（自定义）

### 2.2.6 (2026-06-10)
- (ssbingo) 新功能：V2.9 寄存器审计 — 添加缺失寄存器 30279，DC 充电机 PV 寄存器 31509/31511 移至 dcCharger 命名空间，修正 ESS 预热 TOU 时间 gain
- (ssbingo) 新功能：实现 plant.control.*、plant.gridCode.*、inverter.control.*、dcCharger.control.* 控制寄存器回写（FC06/FC10）；启动时读取 RW 保持寄存器
- (ssbingo) 修复：抑制设备不支持 ESS 预热寄存器时的重复警告；控制寄存器启动读取错误降级为 debug

### 2.2.4 (2026-06-10)
- (ssbingo) fix: 实现 ESS 预热 TOU 读取（FC03, 50000–50183）和写回；添加 encodeValue

### 2.2.3 (2026-06-10)
- (ssbingo) fix: 为所有 11 种语言添加 25 个缺失的 i18n 键（PSS、PID、ESS 预热、扩展寄存器）

### 2.2.2 (2026-06-09)
- (ssbingo) docs: 更新所有 README 至 Modbus 协议 V2.9 — 添加 PSS、PID、ESS 预热、扩展寄存器、SigenMicro

### 2.2.1 (2026-06-09)
- (ssbingo) 修复：根据官方规格V2.9将PSS寄存器表修正为122个条目（地址、增益、类型）；PSS写入寄存器修正为6个WO条目；PID寄存器33055-33060修正（类型、增益、2个缺失条目）

### 2.2.0 (2026-06-09)
- (ssbingo) 功能：支持PSS（电力站开关）和PID（PV绝缘检测）；ESS预热TOU时间表寄存器；PSS/PID从机ID的新管理选项

### 2.1.1 (2026-06-09)
- (ssbingo) fix: wire feature flags (enableSmartLoads, enableCumulativeEnergy, enableGridCode) into polling and object creation; add Extended Registers admin tab

### 2.1.0 (2026-06-09)
- (ssbingo) 功能：扩展统计 — 电站统计（30088–30097），智能负载 1–24（30098–30193），累计能量（30194–30271），调节反馈（30613–30619），电网代码参数（40049–40068）

### 2.0.0 (2026-06-09)
- (ssbingo) 功能：Modbus 协议 V2.9 — 新增电站/逆变器/直流充电桩寄存器，删除已废弃寄存器，扩展枚举

### 1.9.17 (2026-06-08)
- (ssbingo) 修复：删除重复的 i18n 长格式 (admin/i18n)，添加 /dev/ttyUSB0 翻译键

### 1.9.16 (2026-06-08)
- (ssbingo) 维护：devDependency @alcalzone/release-script 更新至 ^5.2.1

### 1.9.15 (2026-06-08)
- (ssbingo) 维护：添加 @tsconfig/node22 devDependency（ioBroker 模板更新）
- (ssbingo) 维护：testing-action-check 更新至 @v2
- (ssbingo) 维护：axios 安全更新

### 1.9.14 (2026-05-27)
- (ssbingo) 修复：CI 流水线修复 — Node.js 24、@types/node ^22.0.0、修正 package-lock.json；common.news 仅保留最新条目

### 1.9.13 (2026-05-27)
- (ssbingo) 修复：更新 package-lock.json 以解析 @types/node ^22.0.0（之前锁定在 25.x）

### 1.9.12 (2026-05-27)
- (ssbingo) 修复：在 devDependencies 中将 @types/node 固定为 ^22.0.0

### 1.9.11 (2026-05-27)
- (ssbingo) 修复：CI 的 check-and-lint 和 deploy 任务改用 Node.js 24
- (ssbingo) Chore：添加 @types/node devDependency

### 1.9.10 (2026-05-27)
- (ssbingo) Dependabot 依赖更新 — @alcalzone/release-script* 5.2.0、@iobroker/eslint-config 2.3.4
- (ssbingo) CI 更新 — actions/setup-node@v6、testing-action-deploy@v1

### 1.9.9 (2026-05-14)
- (ssbingo) 依赖更新 via Dependabot：protobufjs、@protobufjs/utf8、fast-uri
- (ssbingo) 现在需要 Node.js >= 22

### 1.9.8 (2026-04-22)
- (ssbingo) 修复：去重连接/轮询错误日志以防止日志泛滥并改进 Sentry 兼容性
- (ssbingo) 修复：关闭保护和 extendForeignObject 可防止卸载时以及与管理界面的竞争条件
- (ssbingo) 修复：修复 Modbus 超时时的套接字泄漏；testConnection 现在会暂停轮询；移除空的 control 通道

### 1.9.7 (2026-04-16)
- (ssbingo) 新功能：新增计算状态 plant.pv1Power、plant.pv2Power、plant.pv3Power
