'use strict';

const ModbusRTU = require('modbus-serial');

/**
 * ModbusConnection - Handles Modbus TCP and Serial connections
 * for Sigenergy solar systems
 */
class ModbusConnection {
    /**
     * @param {object} config - Connection configuration
     * @param {Function} logFn - Logging function
     */
    constructor(config, logFn) {
        this.config = config;
        this.log = logFn || console;
        this._setTimeout = logFn && logFn.setTimeout ? logFn.setTimeout.bind(logFn) : setTimeout;
        this._clearTimeout = logFn && logFn.clearTimeout ? logFn.clearTimeout.bind(logFn) : clearTimeout;
        this.client = new ModbusRTU();
        this.connected = false;
        this.connecting = false;
        this._reconnectTimer = null;
        this._requestQueue = [];
        this._processing = false;
    }

    /**
     * Connect to Modbus device
     *
     * @returns {Promise<boolean>} Resolves when connected
     */
    async connect() {
        if (this.connecting) {
            return false;
        }
        this.connecting = true;

        try {
            if (this.client.isOpen) {
                await this.client.close();
            }

            this.client = new ModbusRTU();
            this.client.setTimeout(this.config.timeout || 5000);

            if (this.config.connectionType === 'tcp') {
                this.log.debug(`Connecting Modbus TCP to ${this.config.tcpHost}:${this.config.tcpPort}`);
                const connectTimeout = this.config.timeout || 5000;
                await Promise.race([
                    this.client.connectTCP(this.config.tcpHost, {
                        port: this.config.tcpPort || 502,
                    }),
                    new Promise((_, reject) =>
                        this._setTimeout(
                            () => reject(new Error(`TCP connection timeout after ${connectTimeout}ms`)),
                            connectTimeout,
                        ),
                    ),
                ]);
            } else {
                // Serial RTU
                this.log.debug(`Connecting Modbus RTU on ${this.config.serialPort}`);
                await this.client.connectRTUBuffered(this.config.serialPort, {
                    baudRate: this.config.serialBaudRate || 9600,
                    dataBits: this.config.serialDataBits || 8,
                    parity: this.config.serialParity || 'none',
                    stopBits: this.config.serialStopBits || 1,
                });
            }

            this.connected = true;
            this.connecting = false;
            this.log.info('Modbus connection established');
            return true;
        } catch (err) {
            this.connected = false;
            this.connecting = false;
            this.log.error(`Modbus connection failed: ${err.message}`);
            return false;
        }
    }

    /**
     * Disconnect from Modbus device
     *
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this._reconnectTimer) {
            this._clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        if (this.client && this.client.isOpen) {
            try {
                await this.client.close();
            } catch {
                // ignore close errors during disconnect
            }
        }
        this.connected = false;
        this.log.info('Modbus disconnected');
    }

    /**
     * Read input registers (function code 0x04)
     *
     * @param {number} slaveId - Slave address
     * @param {number} address - Register start address
     * @param {number} qty - Number of registers to read
     * @returns {Promise<number[]>} Raw register data
     */
    async readInputRegisters(slaveId, address, qty) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        this.log.debug(`FC04 slaveId=${slaveId} addr=${address} qty=${qty}`);
        this.client.setID(slaveId);
        const data = (await this.client.readInputRegisters(address, qty)).data;
        this.log.debug(
            `FC04 slaveId=${slaveId} addr=${address} → [${data.slice(0, 4).join(',')}${data.length > 4 ? '…' : ''}]`,
        );
        return data;
    }

    /**
     * Read holding registers (function code 0x03)
     *
     * @param {number} slaveId - Slave address
     * @param {number} address - Register start address
     * @param {number} qty - Number of registers to read
     * @returns {Promise<number[]>} Raw register data
     */
    async readHoldingRegisters(slaveId, address, qty) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        this.log.debug(`FC03 slaveId=${slaveId} addr=${address} qty=${qty}`);
        this.client.setID(slaveId);
        const data = (await this.client.readHoldingRegisters(address, qty)).data;
        this.log.debug(
            `FC03 slaveId=${slaveId} addr=${address} → [${data.slice(0, 4).join(',')}${data.length > 4 ? '…' : ''}]`,
        );
        return data;
    }

    /**
     * Write single register (function code 0x06)
     *
     * @param {number} slaveId - Slave address
     * @param {number} address - Register address
     * @param {number} value - Value to write
     * @returns {Promise<void>}
     */
    async writeSingleRegister(slaveId, address, value) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        this.client.setID(slaveId);
        await this.client.writeRegister(address, value);
    }

    /**
     * Write multiple registers (function code 0x10)
     *
     * @param {number} slaveId - Slave address
     * @param {number} address - Start address
     * @param {number[]} values - Values array
     * @returns {Promise<void>}
     */
    async writeMultipleRegisters(slaveId, address, values) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        this.client.setID(slaveId);
        await this.client.writeRegisters(address, values);
    }

    /**
     * Test connection - used from admin
     *
     * @returns {Promise<{success: boolean, message: string}>} Test result
     */
    async testConnection() {
        try {
            const wasConnected = this.connected;
            if (!this.connected) {
                const ok = await this.connect();
                if (!ok) {
                    return { success: false, message: 'Connection failed - check host/port settings' };
                }
            }

            // Try reading plant system time as connectivity check
            this.client.setID(247);
            await this.client.readInputRegisters(30000, 2);

            if (!wasConnected) {
                await this.disconnect();
            }

            return {
                success: true,
                message: 'Connection OK - Plant system time register accessible',
            };
        } catch (err) {
            this.connected = false;
            return {
                success: false,
                message: `Connection test failed: ${err.message}`,
            };
        }
    }

    /**
     * Parse register value based on data type
     *
     * @param {number[]} rawData - Raw register data
     * @param {string} type - Data type (U16, S16, U32, S32, U64, STRING)
     * @param {number|null} gain - Scaling factor
     * @returns {number|string} Decoded value
     */
    static parseValue(rawData, type, gain) {
        let raw;

        switch (type) {
            case 'U16':
                raw = rawData[0];
                break;
            case 'S16':
                raw = rawData[0];
                if (raw > 32767) {
                    raw -= 65536;
                }
                break;
            case 'U32':
                raw = (rawData[0] << 16) | rawData[1];
                raw = raw >>> 0; // ensure unsigned
                break;
            case 'S32':
                raw = (rawData[0] << 16) | rawData[1];
                if (raw > 2147483647) {
                    raw -= 4294967296;
                }
                break;
            case 'U64':
                // JavaScript can't handle 64-bit integers precisely, use approximation
                raw =
                    rawData[0] * Math.pow(2, 48) +
                    rawData[1] * Math.pow(2, 32) +
                    rawData[2] * Math.pow(2, 16) +
                    rawData[3];
                break;
            case 'STRING': {
                // Each register holds 2 ASCII chars
                let str = '';
                for (let i = 0; i < rawData.length; i++) {
                    const high = (rawData[i] >> 8) & 0xff;
                    const low = rawData[i] & 0xff;
                    if (high !== 0) {
                        str += String.fromCharCode(high);
                    }
                    if (low !== 0) {
                        str += String.fromCharCode(low);
                    }
                }
                return str.trim();
            }
            default:
                raw = rawData[0];
        }

        if (gain && gain !== 1 && gain !== null) {
            return raw / gain;
        }
        return raw;
    }
}

module.exports = ModbusConnection;
