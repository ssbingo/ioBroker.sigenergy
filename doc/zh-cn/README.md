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

## 更新日志

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


### 1.9.6 (2026-04-16)
- (ssbingo) 新功能：新增计算状态 plant.pv1Power、plant.pv2Power、plant.pv3Power


### 1.9.5 (2026-04-08)
- (ssbingo) 修复：从 io-package.json 中删除未使用的 common.schedule

### 1.9.4 (2026-04-08)
- (ssbingo) 修复：Changelog / 添加 CHANGELOG_OLD.md

### 1.9.3 (2026-04-08)
- (ssbingo) 修复：删除 admin/index.html

### 1.9.2 (2026-04-08)
- (ssbingo) 修复

### 1.9.1 (2026-04-08)
- (ssbingo) 修复管理界面：删除过时的 index.html/index_m.html/words.js 文件；修复 jsonConfig sendTo 按钮中的 jsonData 类型

### 1.9.0 (2026-03-26)
- (ssbingo) 测试完成

### 1.8.23 (2026-03-26)
- (ssbingo) 修正LICENSE和README中的版权年份为2026；技术修正：CI/CD工作流、代码检查、测试

