'use strict';

const clone = require('clone');

let Accessory, Characteristic, Service;

const SecuritySystemStates = [
  'Armed - Stay',
  'Armed - Away',
  'Armed - Night',
  'Disarmed',
  'Alarm triggered'
];

class SecuritySystemAccessory {

  constructor(api, log, config, storage) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;
    this.zones = config.zones || ['Alarm'];
    this.armAwayButtonLabel = config.armAwayButtonLabel || 'Arm Away';
    this.armStayButtonLabel = config.armStayButtonLabel || 'Arm Stay';

    this._storage = storage;

    const defaultValue = {
      targetState: this._pickDefault(config.default),
      zonesAlarm: {},
    };

    for (let zoneLabel of this.zones) {
      defaultValue.zonesAlarm[zoneLabel] = false;
    }

    storage.retrieve(defaultValue, (error, value) => {
      // Remove zones from storage that are not in the list anymore
      for (let zoneLabel in value.zonesAlarm) {
        if (this.zones.indexOf(zoneLabel) === -1) {
          delete value.zonesAlarm[zoneLabel];
        }
      }

      storage.store(value, () => true);

      this._state = value;
    });

    this._services = this.createServices();
  }

  _pickDefault(value) {
    switch (value) {
      case 'armed-stay': return 0;
      case 'armed-away': return 1;
      case 'armed-night': return 2;
      case 'unarmed': return 3;
      case undefined: return 3;
    }

    throw new Error('Unsupported default value in configuration of security system.');
  }

  getServices() {
    return this._services;
  }

  createServices() {
    return [
      this.getAccessoryInformationService(),
      this.getBridgingStateService(),
      this.getSecuritySystemService(),
      ...this.getArmSwitchServices(),
      ...this.getZoneServices(),
    ];
  }

  getArmSwitchServices() {
    this._armAwaySwitchService = new Service.Switch(`${this.name} ${this.armAwayButtonLabel}`, 'arm-away');
    this._armAwaySwitchService.getCharacteristic(Characteristic.On)
      .on('set', (value, callback) => this._setArm(value, callback, Characteristic.SecuritySystemTargetState.AWAY_ARM))
      .updateValue(this._isArmAway());

    this._armStaySwitchService = new Service.Switch(`${this.name} ${this.armStayButtonLabel}`, 'arm-stay');
    this._armStaySwitchService.getCharacteristic(Characteristic.On)
      .on('set', (value, callback) => this._setArm(value, callback, Characteristic.SecuritySystemTargetState.STAY_ARM))
      .updateValue(this._isArmStay());

    return [this._armAwaySwitchService, this._armStaySwitchService];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Security System')
      .setCharacteristic(Characteristic.SerialNumber, '43')
      .setCharacteristic(Characteristic.FirmwareRevision, this.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.version);
  }

  getBridgingStateService() {
    return new Service.BridgingState()
      .setCharacteristic(Characteristic.Reachable, true)
      .setCharacteristic(Characteristic.LinkQuality, 4)
      .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
      .setCharacteristic(Characteristic.Category, Accessory.Categories.SECURITY_SYSTEM);
  }

  getSecuritySystemService() {
    this._securitySystemService = new Service.SecuritySystem(this.name);
    this._securitySystemService.getCharacteristic(Characteristic.SecuritySystemTargetState)
      .on('set', this._setState.bind(this))
      .updateValue(this._state.targetState);

    this._securitySystemService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .updateValue(this._state.targetState);

    this._securitySystemService.isPrimaryService = true;

    return this._securitySystemService;
  }

  getZoneServices() {
    let services = [];

    for (let zoneLabel of this.zones) {
      const zoneSwitch = new Service.Switch(`${this.name} ${zoneLabel} Zone`, `zone-${zoneLabel}`);

      zoneSwitch.getCharacteristic(Characteristic.On)
        .on('set', (value, callback) => this._setAlarm(zoneLabel, value, callback))
        .updateValue(this._state.zonesAlarm[zoneLabel] || false);

      services.push(zoneSwitch);
    }

    return services;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _setState(value, callback) {
    this.log(`Change target state of ${this.name} to ${SecuritySystemStates[value]}`);

    const data = clone(this._state);
    data.targetState = value;
    this._persist(data, callback);
  }

  _setArm(value, callback, armState) {
    let targetState;
    if (value) {
      targetState = armState;
    } else {
      targetState = Characteristic.SecuritySystemTargetState.DISARM;
    }

    this._securitySystemService
      .getCharacteristic(Characteristic.SecuritySystemTargetState)
      .updateValue(targetState);

    this._setState(targetState, callback);
  }

  _setAlarm(zone, value, callback) {
    this.log(`Change alarm state of ${this.name} / Zone ${zone} to ${value}`);

    const data = clone(this._state);
    data.zonesAlarm[zone] = value;
    this._persist(data, callback);
  }

  _isAlarm() {
    for (let zoneLabel in this._state.zonesAlarm) {
      if (this._state.zonesAlarm[zoneLabel]) {
        return true;
      }
    }

    return false;
  }

  _isArmAway() {
    return this._state.targetState === Characteristic.SecuritySystemCurrentState.AWAY_ARM;
  }

  _isArmStay() {
    return this._state.targetState === Characteristic.SecuritySystemCurrentState.STAY_ARM;
  }

  _persist(data, callback) {
    this._storage.store(data, (error) => {
      if (error) {
        callback(error);
        return;
      }

      this._state = data;
      this._updateCurrentState();
      callback();
    });
  }

  _isDisarmed() {
    let currentState = this._state.targetState;
    return currentState === Characteristic.SecuritySystemCurrentState.DISARMED;
  }

  _updateCurrentState() {
    let currentState = this._state.targetState;
    if (this._isAlarm() && !this._isDisarmed()) {
      currentState = Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED;
    }

    this._securitySystemService
      .getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .updateValue(currentState);

    this._armAwaySwitchService
      .getCharacteristic(Characteristic.On)
      .updateValue(this._isArmAway());

    this._armStaySwitchService
      .getCharacteristic(Characteristic.On)
      .updateValue(this._isArmStay());
  }
}

module.exports = SecuritySystemAccessory;