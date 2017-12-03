const version = require('../package.json').version;
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
  }

  accessories(callback) {
    let _accessories = [];
    const { switches } = this.config;

    switches.forEach(sw => {
      this.log(`Found automation switch in config: "${sw.name}"`);

      // Make sure minimal configuration is set
      sw.autoOff = typeof sw.autoOff !== "undefined" ? sw.autoOff : true;
      sw.period = sw.period || 60;
      sw.version = version;

      const switchAccessory = new SwitchAccessory(this.api.hap, this.log, sw);
      _accessories.push(switchAccessory);
    });

    callback(_accessories);
  }
}