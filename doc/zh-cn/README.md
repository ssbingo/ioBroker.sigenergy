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
### 1.8.3 (2026-03-16)
* 删除adminTab导航条目；所有配置（包括SigenMicro扫描）仍保留在实例配置对话框中

### 1.8.2 (2026-03-16)
* 添加test/unit和test/integration目录及基础测试；修复CI错误"No test files found"

### 1.8.1 (2026-03-16)
* 在package.json中添加test:unit和test:integration脚本

### 1.8.0 (2026-03-16)
* 修复所有剩余lint错误：qty缩进，arrow括号，三元表达式换行，@type注释

### 1.7.9 (2026-03-16)
* 修复所有剩余prettier/eslint错误：换行超120字符，所有文件中的箭头函数括号

### 1.7.8 (2026-03-16)
* 修复剩余ESLint错误：箭头函数括号，长字符串换行，sendTo格式，mocha全局变量，JSDoc对齐

### 1.7.8 (2026-03-16)
* 修复剩余ESLint错误：为单参数箭头函数添加括号；格式化eslint.config.mjs；添加mocha全局变量和prettier.config.mjs

### 1.7.7 (2026-03-16)
* 修复所有ESLint错误：空格转制表符，if后添加大括号，修复未使用变量，修复空catch块，更新JSDoc

### 1.7.6 (2026-03-16)
* 修复W5022：清空words.js；将i18n文件从LANG/translations.json迁移到扁平LANG.json格式

### 1.7.5 (2026-03-16)
* 恢复使用admin/i18n/文件的i18n:true（W5022合规）；将内联多语言对象恢复为字符串键

### 1.7.5 (2026-03-16)
* fixed

### 1.7.4 (2026-03-16)
* 修复翻译：将jsonConfig.json和sigenmicro-tab.json中的i18n:true文件查找替换为内联多语言label对象

### 1.7.3 (2026-03-16)
* 修复sigenmicro-tab.json中的i18n：将类型从panel改为tabs，使Admin 7遵守i18n:true

### 1.7.2 (2026-03-16)
* 修复语言检测：用97个i18n键（11种语言）重建words.js；向所有UI字符串添加class=translate

### 1.7.1 (2026-03-16)
* 为所有SigenMicro管理文本添加i18n翻译（11种语言21个新键）

### 1.7.0 (2026-03-16)
* 将HTML adminTab iframe替换为原生jsonConfig标签页；type:state直接在Admin 7 React UI中显示实时扫描进度

### 1.6.3 (2026-03-16)
* 修复扫描进度显示：将所有CSS变量依赖元素替换为使用硬编码颜色的始终可见日志框

### 1.6.2 (2026-03-16)
* 扫描：恢复经过验证的分块sendTo方式（每次3个ID）；双重进度：每块直接文本更新+从info.scanProgress轮询getState

### 1.6.1 (2026-03-16)
* 修复扫描进度：用setInterval+getState轮询替代subscribeState；安全计时器改为每ID 2秒

### 1.6.0 (2026-03-16)
* 修复扫描进度：使用State订阅(info.scanProgress)代替sendTo分块；适配器逐ID写入进度，管理页面通过socket.subscribeState实时更新

### 1.5.6 (2026-03-16)
* 将不可见进度条替换为显示百分比和当前ID范围的纯文本状态行

### 1.5.5 (2026-03-16)
* 修复SigenMicro扫描根本原因：复用现有Modbus连接；扫描期间暂停轮询；修复重复扫描启动

### 1.5.4 (2026-03-16)
* SigenMicro扫描进度：CSS类替换为element.style.display；探测超时1000ms；块大小3

### 1.5.3 (2026-03-16)
* 修复SigenMicro扫描进度：使用CSS max-height过渡+shimmer动画（无display:none冲突）；requestAnimationFrame确保可靠重绘

### 1.5.2 (2026-03-16)
* SigenMicro标签页修复：进度条现在可见；保留ID（电站/逆变器/充电器）显示并自动跳过；未找到设备时显示提示信息

### 1.5.1 (2026-03-16)
* 在jsonConfig管理标签页中直接添加SigenMicro扫描按钮；扫描自动保存发现的设备并显示结果摘要

### 1.5.0 (2026-03-16)
* SigenMicro标签页：突出的扫描按钮，实时分块进度条显示当前ID范围和设备计数

### 1.4.1 (2026-03-16)
* 支持SigenMicro微型逆变器：Modbus扫描、设备发现、按设备启用/禁用、专用管理标签页

### 1.4.0 (2026-03-14)
* 修复 / 清理

### 1.3.19 (2026-03-14)
* 回退 eslint/@eslint/js 至 9.x；serialport 升级至 13.0.0

### 1.3.18 (2026-03-14)
* 升级 eslint 10.0.3、@eslint/js 10.0.1、serialport 13.0.0

### 1.3.17 (2026-03-13)
* 从 devDependencies 中删除 mocha

### 1.3.16 (2026-03-13)
* 恢复 mocha 开发依赖，修复 test:package 脚本

### 1.3.15 (2026-03-13)
* 修复 testConnection 中 setTimeout 的缩进

### 1.3.14 (2026-03-13)
* 修复最后两个 lint 错误

### 1.3.13 (2026-03-13)
* 修复所有 ESLint/Prettier 错误：JSDoc、格式、未使用的导入

### 1.3.12 (2026-03-13)
* 修复 curly 规则回归：modbus.js、statistics.js、main.js

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
