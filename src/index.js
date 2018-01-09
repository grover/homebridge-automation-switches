
const util = require('util');

const version = require('../package.json').version;

const AutomationSwitchAccessory = require('./AutomationSwitchAccessory');
const SecuritySystemAccessory = require('./SecuritySystemAccessory');
const LockMechanismAccessory = require('./LockMechanismAccessory');
const SwitchAccessory = require('./SwitchAccessory');

const HomeKitTypes = require('./HomeKitTypes');


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
}

const AutomationSwitchesPlatform = class {
  constructor(log, config, api) {
    this.log = log;
    this.log('AutomationSwitchesPlatform Plugin Loaded');
    this.config = config;
    this.api = api;

    HomeKitTypes.registerWith(api.hap);

    this._factories = {
      automation: this._createAutomationSwitch.bind(this),
      lock: this._createLockMechanism.bind(this),
      security: this._createSecuritySwitch.bind(this),
      switch: this._createSwitch.bind(this)
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
        sw.type = 'automation';
      }

      const factory = this._factories[sw.type];
      if (factory === undefined) {
        this.log(`Invalid automation switch - type is unknown: ${util.inspect(sw)}`);
        this.log('Skipping.');
        return;
      }

      const accessory = factory(sw);
      _accessories.push(accessory);
    });

    callback(_accessories);
  }

  _createAutomationSwitch(sw) {
    // Make sure minimal configuration is set
    sw.autoOff = typeof sw.autoOff !== "undefined" ? sw.autoOff : true;
    sw.period = sw.period || 60;
    sw.version = version;

    return new AutomationSwitchAccessory(this.api, this.log, sw);
  }

  _createSecuritySwitch(sw) {
    sw.version = version;
    return new SecuritySystemAccessory(this.api, this.log, sw);
  }

  _createLockMechanism(sw) {
    sw.version = version;
    return new LockMechanismAccessory(this.api, this.log, sw);
  }

  _createSwitch(sw) {
    sw.version = version;
    return new SwitchAccessory(this.api, this.log, sw);
  }
}