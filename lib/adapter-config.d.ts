// This file extends the AdapterConfig type from "@types/iobroker"
// with the native configuration values defined in io-package.json.
// Used by the local type check (tsconfig.check.json) only — no runtime effect.

declare global {
    /**
     * modbus-serial v8 ships its CommonJS class export without a construct
     * signature in the bundled type definitions — this constructor type
     * restores `new ModbusRTU()` for the JS type check.
     */
    type ModbusRTUConstructor = new () => import('modbus-serial');

    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace ioBroker {
        interface AdapterConfig {
            connectionType: 'tcp' | 'serial';
            tcpHost: string;
            tcpPort: number;
            serialPort: string;
            serialBaudRate: number;
            serialDataBits: number;
            serialParity: string;
            serialStopBits: number;
            plantId: number;
            inverterId: number;
            acChargerId: number;
            dcChargerId: number;
            pollInterval: number;
            timeout: number;
            deviceType: 'sigenstor' | 'sigenhybrid' | 'm1hyb' | 'pvinverter' | 'sigenmicroOnly';
            hasAcCharger: boolean;
            hasDcCharger: boolean;
            hasBattery: boolean;
            hasPv: boolean;
            calcBatteryTimeToFull: boolean;
            calcBatteryTimeRemaining: boolean;
            calcBatteryDailyFull: boolean;
            calcBatteryCoverageTime: boolean;
            calcSelfConsumptionRate: boolean;
            calcAutarkyRate: boolean;
            calcPvYield: boolean;
            calcGridFeedIn: boolean;
            hasSigenMicro: boolean;
            sigenMicroScanFrom: number;
            sigenMicroScanTo: number;
            sigenMicroDevices: string;
            enableSmartLoads: boolean;
            enableCumulativeEnergy: boolean;
            enableGridCode: boolean;
            enablePss: boolean;
            pssSlaveId: number;
            enablePid: boolean;
            pidSlaveId: number;
            enableEssPreheating: boolean;
            hasEmergencyGateway: boolean;
            emergencyDevice1Id: string;
            emergencyDevice2Id: string;
            emergencyDevice2Dir: 'off' | 'on';
            emergencyDevice3Id: string;
            emergencyDevice3Dir: 'off' | 'on';
            emergencyDevice4Id: string;
            emergencyDevice4Dir: 'off' | 'on';
            emergencyStableDelay: number;
            emergencyTelegram: boolean;
            emergencyTelegramInst: string;
            emergencyTelegramChat: string;
        }
    }
}

export {};
