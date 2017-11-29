const DelayedSwitchAccessory = require('./DelayedSwitchAccessory.js');

const HOMEBRIDGE = {
  Accessory: null,
  Service: null,
  Characteristic: null,
  UUIDGen: null
};

const platformName = 'DelayedSwitches';
const platformPrettyName = 'Delayed Switches Platform';

module.exports = (homebridge) => {
  HOMEBRIDGE.Accessory = homebridge.platformAccessory;
  HOMEBRIDGE.Service = homebridge.hap.Service;
  HOMEBRIDGE.Characteristic = homebridge.hap.Characteristic;
  HOMEBRIDGE.UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform(platformName, platformPrettyName, DelayedSwitchPlatform, true);
}

const DelayedSwitchPlatform = class {
  constructor(log, config, api) {
    this.log = log;
    this.log('DelayedSwitchPlatform Platform Plugin Loaded');
    this.config = config;
    this.api = api;

    this.log(this);
  }

  accessories(callback) {
    let _accessories = [];
    const { switches } = this.config;

    switches.forEach(sw => {
      this.log(`Found switch in config: "${sw.name}"`);

      let switchAccessory = new DelayedSwitchAccessory(this.api.hap, this.log, sw);
      _accessories.push(switchAccessory);
    });

    callback(_accessories);
  }
}