"use strict";

const version = require('../package.json').version;
const clone = require('clone');
const inherits = require('util').inherits;

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

    this._storage = storage;

    const defaultValue = {
      targetState: this._pickDefault(config.default),
      alarm: false
    };

    storage.retrieve(defaultValue, (error, value) => {
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
      this.getArmSwitchService(),
    ];
  }

  getArmSwitchService() {
    this._armSwitchService = new Service.Switch(`${this.name} Arm`);
    this._armSwitchService.getCharacteristic(Characteristic.On)
      .on('set', this._setArm.bind(this))
      .updateValue(!this._isDisarmed());

    return this._armSwitchService;
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

    this._securitySystemService.addCharacteristic(Characteristic.AlarmTrigger)
      .on('set', this._setAlarm.bind(this))
      .updateValue(this._state.alarm);

    this._securitySystemService.isPrimaryService = true;

    return this._securitySystemService;
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

  _setArm(value, callback) {
    let targetState;
    if (value) {
      targetState = Characteristic.SecuritySystemTargetState.AWAY_ARM;
    } else {
      targetState = Characteristic.SecuritySystemTargetState.DISARM;
    }

    this._securitySystemService
      .getCharacteristic(Characteristic.SecuritySystemTargetState)
      .updateValue(targetState);

    this._setState(targetState, callback);
  }

  _setAlarm(value, callback) {
    this.log(`Change alarm state of ${this.name} to ${value}`);

    const data = clone(this._state);
    data.alarm = value;
    this._persist(data, callback);
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
    if (this._state.alarm && !this._isDisarmed()) {
      currentState = Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED;
    }

    this._securitySystemService
      .getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .updateValue(currentState);
  }
}

module.exports = SecuritySystemAccessory;