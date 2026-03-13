# ioBroker Sigenergy 适配器

[![NPM version](https://img.shields.io/npm/v/iobroker.sigenergy.svg)](https://www.npmjs.com/package/iobroker.sigenergy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**通过 Modbus TCP/RTU 连接 Sigenergy 太阳能系统的适配器**

支持 Sigenergy Modbus 协议 V2.5（发布日期：2025-02-19）。

---

## 功能特性

- 📡 **Modbus TCP**（以太网 / 无线局域网 / 光纤 / 4G）— 端口 502
- 🔗 **Modbus RTU**（RS485 串行）
- ⚡ **完整寄存器支持** — 符合 V2.5 规范的所有电站和逆变器寄存器
- 🔋 **电池统计** — 充满时间、剩余时间、每日覆盖率
- ☀️ **光伏统计** — 自耗率、自给率
- 🔌 **交流充电桩**（Sigen EVAC）— 可选
- ⚡ **直流充电桩** — 可选
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

## 许可证

MIT 许可证 — Copyright (c) 2025 ioBroker Community

---

## 更新日志
### 1.3.11 (2026-03-13)
* 修复 Prettier：在 registers.js 中添加缺失的尾随逗号

### 1.3.10 (2026-03-13)
* 修复 Prettier：将寄存器内联对象展开为多行格式

### 1.3.9 (2026-03-13)
* 在 README.md 中添加文档 — 多语言

### 1.3.8 (2026-03-13)
* 在 io-package.json 中添加缺失的 uk/zh-cn 翻译

### 1.3.7 (2026-03-13)
* 移除冗余的 mocha 开发依赖（已包含在 @iobroker/testing 中）

### 1.3.6 (2026-03-13)
* 修复 Prettier/ESLint 格式：使用制表符、单引号、花括号

### 1.3.5 (2026-03-13)
* (ssbingo) 修复 CI：使用显式 mocha 二进制路径

### 1.3.4 (2026-03-13)
* (ssbingo) 修复 CI：将 mocha 添加到 devDependencies

### 1.3.3 (2026-03-13)
* (ssbingo) 修复 modbus.js 中重复的 @param JSDoc 警告

### 1.3.2 (2026-03-13)
* (ssbingo) 代码质量修复：删除未使用变量，补全 JSDoc 文档

### 1.3.0 (2026-03-13)
* (ssbingo) 更新多语言文档

### 1.2.5 (2026-03-12)
* (ssbingo) 错误修复

### 1.2.4 (2026-03-12)
* (ssbingo) Einfügen Dokumentation in README.md - mehrsprachig

### 1.2.3 (2026-03-12)
* (ssbingo) 修复 AdapterCheck 问题

### 1.2.2 (2026-03-11)
* (ssbingo) 修复

### 1.2.1 (2026-03-11)
* (ssbingo) 修复

### 1.2.0 (2026-03-11)
* (ssbingo) 更新 StatisticsCalculator：恢复电池时间估算

### 1.1.9 (2026-03-11)
* (ssbingo) 更换为改进版 StatisticsCalculator

### 1.1.8 (2026-03-11)
* (ssbingo) 修正 package.json 中的作者信息

### 1.1.7 (2026-03-11)
* (ssbingo) 改进日志记录

### 1.1.6 (2026-03-10)
* (ssbingo) 在 package.json 中添加发布脚本

### 1.1.5 (2026-03-10)
* (ssbingo) 更新 .releaseconfig.json

### 1.1.4 (2026-03-10)
* (ssbingo) 更新 README：修正 VIS 组件适配器名称

### 1.1.3 (2026-03-09)
* (ssbingo) 修复 adapter-checker 警告和错误

### 1.1.2 (2026-03-10)
* (ssbingo) 修复 jsonConfig 中缺失的响应式尺寸属性

### 1.1.1 (2026-03-09)
* (ssbingo) 修复 adapter-checker 错误

### 1.1.0 (2026-03-09)
* (ssbingo) 将 Admin UI 从旧版 HTML 迁移到 jsonConfig (Admin 5+)

### 1.0.1 (2026-03-08)
* (ssbingo) 稳定版：VIS-2 组件迁移到独立适配器

### 0.4.1 (2026-03-08)
* (ssbingo) 稳定版：VIS-2 组件正常工作

### 0.1.0 (2026-03-01)
* (ssbingo) 首次发布 — 支持 Sigenergy 系统的 Modbus TCP/RTU

---

## 文档

- 🇬🇧 [English documentation](../../README.md)
- 🇩🇪 [Deutsche Dokumentation](../de/README.md)
- 🇷🇺 [Документация на русском](../ru/README.md)
- 🇳🇱 [Nederlandse documentatie](../nl/README.md)
- 🇫🇷 [Documentation française](../fr/README.md)
- 🇮🇹 [Documentazione italiana](../it/README.md)
- 🇪🇸 [Documentación en español](../es/README.md)
- 🇵🇱 [Dokumentacja polska](../pl/README.md)
- 🇵🇹 [Documentação portuguesa](../pt/README.md)
- 🇺🇦 [Документація українською](../uk/README.md)
- 🇨🇳 [简体中文文档](../zh-cn/README.md)
