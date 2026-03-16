'use strict';

/**
* SigenMicro Micro-Inverter Modbus Register Definitions
* Based on Sigenergy Modbus Protocol V2.5 — Section 5.x SigenMicro
*
* SigenMicro devices share the same register address layout as the
* Hybrid Inverter (slave IDs 1–246) but expose a micro-inverter
* specific subset of registers.
*
* Identification: Read HR 30500 (modelType, STRING, 15 regs).
* A SigenMicro responds with a model string beginning with "SigenMicro"
* or "SMI". Devices that do not respond or return an empty/invalid
* string are skipped during the scan.
*/

// ── Identification registers (Holding, FC03) ────────────────────────
const SIGENMICRO_IDENT_ADDR = 30500; // model type string
const SIGENMICRO_IDENT_QTY  = 15;    // 30 ASCII chars
const SIGENMICRO_SERIAL_ADDR = 30515;
const SIGENMICRO_SERIAL_QTY  = 10;   // 20 ASCII chars

// ── Per-device read registers (Input, FC04) ─────────────────────────
// Name pattern uses a placeholder §ID§ that is replaced with the
// actual slaveId at runtime, e.g. "sigenmicro.11.outputPower"
const SIGENMICRO_READ_REGISTERS = [
	{
		addr: 30500,
		qty:  15,
		name: 'sigenmicro.§ID§.modelType',
		type: 'STRING',
		gain: null,
		unit: '',
		role: 'info.name',
		desc: 'Model type',
	},
	{
		addr: 30515,
		qty:  10,
		name: 'sigenmicro.§ID§.serialNumber',
		type: 'STRING',
		gain: null,
		unit: '',
		role: 'info.serial',
		desc: 'Serial number',
	},
	{
		addr: 30525,
		qty:  15,
		name: 'sigenmicro.§ID§.firmwareVersion',
		type: 'STRING',
		gain: null,
		unit: '',
		role: 'info.firmware',
		desc: 'Firmware version',
	},
	{
		addr: 30600,
		qty:  1,
		name: 'sigenmicro.§ID§.runningState',
		type: 'U16',
		gain: null,
		unit: '',
		role: 'value',
		desc: 'Running state: 0=Standby, 1=Running, 2=Fault, 3=Shutdown',
	},
	{
		addr: 30601,
		qty:  2,
		name: 'sigenmicro.§ID§.outputPower',
		type: 'S32',
		gain: 1000,
		unit: 'kW',
		role: 'value.power',
		desc: 'AC output power',
	},
	{
		addr: 30603,
		qty:  1,
		name: 'sigenmicro.§ID§.gridFrequency',
		type: 'U16',
		gain: 100,
		unit: 'Hz',
		role: 'value.frequency',
		desc: 'Grid frequency',
	},
	{
		addr: 30604,
		qty:  1,
		name: 'sigenmicro.§ID§.temperature',
		type: 'S16',
		gain: 10,
		unit: '°C',
		role: 'value.temperature',
		desc: 'Device temperature',
	},
	{
		addr: 30606,
		qty:  1,
		name: 'sigenmicro.§ID§.mppt1Voltage',
		type: 'U16',
		gain: 10,
		unit: 'V',
		role: 'value.voltage',
		desc: 'MPPT1 DC input voltage',
	},
	{
		addr: 30607,
		qty:  1,
		name: 'sigenmicro.§ID§.mppt1Current',
		type: 'S16',
		gain: 100,
		unit: 'A',
		role: 'value.current',
		desc: 'MPPT1 DC input current',
	},
	{
		addr: 30608,
		qty:  2,
		name: 'sigenmicro.§ID§.mppt1Power',
		type: 'S32',
		gain: 1000,
		unit: 'kW',
		role: 'value.power',
		desc: 'MPPT1 DC input power',
	},
	{
		addr: 30610,
		qty:  1,
		name: 'sigenmicro.§ID§.mppt2Voltage',
		type: 'U16',
		gain: 10,
		unit: 'V',
		role: 'value.voltage',
		desc: 'MPPT2 DC input voltage',
	},
	{
		addr: 30611,
		qty:  1,
		name: 'sigenmicro.§ID§.mppt2Current',
		type: 'S16',
		gain: 100,
		unit: 'A',
		role: 'value.current',
		desc: 'MPPT2 DC input current',
	},
	{
		addr: 30612,
		qty:  2,
		name: 'sigenmicro.§ID§.mppt2Power',
		type: 'S32',
		gain: 1000,
		unit: 'kW',
		role: 'value.power',
		desc: 'MPPT2 DC input power',
	},
	{
		addr: 30640,
		qty:  2,
		name: 'sigenmicro.§ID§.dailyYield',
		type: 'U32',
		gain: 100,
		unit: 'kWh',
		role: 'value.energy',
		desc: 'Daily energy yield',
	},
	{
		addr: 30642,
		qty:  4,
		name: 'sigenmicro.§ID§.totalYield',
		type: 'U64',
		gain: 100,
		unit: 'kWh',
		role: 'value.energy',
		desc: 'Total lifetime energy yield',
	},
];

/**
* Return a copy of SIGENMICRO_READ_REGISTERS with §ID§ replaced by slaveId.
* @param {number} slaveId - Modbus slave ID of the SigenMicro device
* @returns {object[]}
*/
function getRegistersForDevice(slaveId) {
	return SIGENMICRO_READ_REGISTERS.map(reg => ({
		...reg,
		name: reg.name.replace('§ID§', String(slaveId)),
	}));
}

module.exports = {
	SIGENMICRO_IDENT_ADDR,
	SIGENMICRO_IDENT_QTY,
	SIGENMICRO_SERIAL_ADDR,
	SIGENMICRO_SERIAL_QTY,
	SIGENMICRO_READ_REGISTERS,
	getRegistersForDevice,
};
