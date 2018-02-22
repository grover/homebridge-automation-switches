
const util = require('util');

const version = require('../package.json').version;

const AutomationSwitchAccessory = require('./AutomationSwitchAccessory');
const SecuritySystemAccessory = require('./SecuritySystemAccessory');
const LockMechanismAccessory = require('./LockMechanismAccessory');
const SwitchAccessory = require('./SwitchAccessory');
const SliderAccessory = require('./SliderAccessory');
const AlarmClockAccessory = require('./AlarmClockAccessory');

const StorageWrapper = require('./util/StorageWrapper');
const FakeStorageWrapper = require('./util/FakeStorageWrapper');
const SerialNumberGenerator = require('./util/SerialNumberGenerator');

const HomeKitTypes = require('./HomeKitTypes');
const ClockTypes = require('./hap/ClockTypes');


const HOMEBRIDGE = {
  Accessory: null,
  Service: null,
  Characteristic: null,
  UUIDGen: null
};

const platformName = 'homebridge-switches';
const platformPrettyName = 'AutomationSwitches';

module.exports = (homebridge) => {
  HOMEBRIDGE.Accessory = homebridge.platformAccessory;
  HOMEBRIDGE.Service = homebridge.hap.Service;
  HOMEBRIDGE.Characteristic = homebridge.hap.Characteristic;
  HOMEBRIDGE.UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform(platformName, platformPrettyName, AutomationSwitchesPlatform, true);
};

const SerialNumberPrefixes = {
  automation: 'AU',
  lock: 'LK',
  security: 'SC',
  switch: 'SW',
  slider: 'SL',
  alarmclock: 'AC'
};

const AutomationSwitchesPlatform = class {
  constructor(log, config, api) {
    this.log = log;
    this.log(`AutomationSwitchesPlatform Plugin Loaded - Version ${version}`);
    this.config = config;
    this.api = api;

    HomeKitTypes.registerWith(api.hap);
    ClockTypes.registerWith(api.hap);

    this._factories = {
      automation: this._createAutomationSwitch.bind(this),
      lock: this._createLockMechanism.bind(this),
      security: this._createSecuritySwitch.bind(this),
      switch: this._createSwitch.bind(this),
      slider: this._createSlider.bind(this),
      alarmclock: this._createAlarmClock.bind(this)
    };
  }

  accessories(callback) {
    let _accessories = [];
    const { switches } = this.config;

    switches.forEach(sw => {
      this.log(`Found automation switch in config: "${sw.name}"`);
      if (sw.name === undefined || sw.name.length === 0) {
        throw new Error('Invalid configuration: Automation switch name is invalid.');
      }

      if (sw.type === undefined) {
        this.log(`Warning: ${sw.name} does not specify a type. Please update your configuration`);
        this.log(`to include "type": "automation" for ${sw.name} or it'll fail to run in the future.`);
        sw.type = 'automation';
      }

      const factory = this._factories[sw.type];
      if (factory === undefined) {
        this.log(`Invalid automation switch - type is unknown: ${util.inspect(sw)}`);
        this.log('Skipping.');
        return;
      }

      sw.serialNumber = SerialNumberGenerator.generate(SerialNumberPrefixes[sw.type], sw.name);

      const storage = this._createStorage(sw);

      const accessory = factory(sw, storage);
      _accessories.push(accessory);
    });

    callback(_accessories);
  }

  _createStorage(sw) {
    if (this._shouldStoreSwitchState(sw)) {
      const type = this._sanitizeTypeForStorage(sw.type);
      return new StorageWrapper(this.api, this.log, type, sw.name);
    }

    return new FakeStorageWrapper();
  }

  _shouldStoreSwitchState(sw) {
    return sw.stored === true
      || (sw.type === 'security' && sw.stored !== false);
  }

  _sanitizeTypeForStorage(type) {
    if (type === 'security') {
      type = 'SecuritySystem';
    }

    return type;
  }

  _createAutomationSwitch(sw, storage) {
    // Make sure minimal configuration is set
    sw.autoOff = typeof sw.autoOff !== 'undefined' ? sw.autoOff : true;
    sw.period = sw.period || 60;
    sw.version = version;

    return new AutomationSwitchAccessory(this.api, this.log, sw, storage);
  }

  _createSecuritySwitch(sw, storage) {
    sw.version = version;
    return new SecuritySystemAccessory(this.api, this.log, sw, storage);
  }

  _createLockMechanism(sw, storage) {
    sw.version = version;
    return new LockMechanismAccessory(this.api, this.log, sw, storage);
  }

  _createSwitch(sw, storage) {
    sw.version = version;
    return new SwitchAccessory(this.api, this.log, sw, storage);
  }

  _createSlider(sw, storage) {
    sw.version = version;
    return new SliderAccessory(this.api, this.log, sw, storage);
  }

  _createAlarmClock(sw, storage) {
    sw.version = version;
    return new AlarmClockAccessory(this.api, this.log, sw, storage);
  }
};