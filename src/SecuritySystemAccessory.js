"use strict";

const version = require('../package.json').version;
const securitySystemStorage = require('node-persist').create();

const inherits = require('util').inherits;

const NameFactory = require('./util/NameFactory');

let Accessory, Characteristic, Service;

const SecuritySystemStates = [
  'Armed - Stay',
  'Armed - Away',
  'Armed - Night',
  'Disarmed',
  'Alarm triggered'
];

class SecuritySystemAccessory {

  constructor(api, log, config) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;

    this._persistKey = `SecuritySystem.${NameFactory.generate(this.name)}.json`;

    securitySystemStorage.initSync({ dir: api.user.persistPath() });
    this._state = securitySystemStorage.getItemSync(this._persistKey) || {
      targetState: Characteristic.SecuritySystemCurrentState.DISARMED,
      alarm: false
    };

    this._services = this.createServices();
  }

  getServices() {
    return this._services;
  }

  createServices() {
    return [
      this.getAccessoryInformationService(),
      this.getBridgingStateService(),
      this.getSecuritySystemService()
    ];
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
    this._state.targetState = value;
    this._persist(callback);
  }

  _setAlarm(value, callback) {
    this.log(`Change alarm state of ${this.name} to ${value}`);
    this._state.alarm = value;
    this._persist(callback);
  }

  _persist(callback) {
    securitySystemStorage.setItem(this._persistKey, this._state, (error, result) => {
      if (error) {
        callback(error);
        return;
      }

      securitySystemStorage.persistKey(this._persistKey, (error) => {
        if (error) {
          callback(error);
          return;
        }

        this._updateCurrentState();
        callback();
      });
    });
  }

  _updateCurrentState() {
    let currentState = this._state.targetState;
    if (this._state.alarm && currentState !== Characteristic.SecuritySystemCurrentState.DISARMED) {
      currentState = Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED;
    }

    this._securitySystemService
      .getCharacteristic(Characteristic.SecuritySystemCurrentState)
      .updateValue(currentState);
  }
}

module.exports = SecuritySystemAccessory;