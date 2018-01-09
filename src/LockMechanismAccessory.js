"use strict";

const version = require('../package.json').version;
const inherits = require('util').inherits;

const NameFactory = require('./util/NameFactory');

let Accessory, Characteristic, Service;

const LockMechanismStates = [
  'Unsecured',
  'Secured',
  'Jammed',
  'Unknown',
  'Alarm triggered'
];

class LockMechanismAccessory {

  constructor(api, log, config) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;

    this._state = {
      targetState: Characteristic.LockTargetState.UNSECURED
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
      this.getLockMechanismService()
    ];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Lock Mechanism')
      .setCharacteristic(Characteristic.SerialNumber, '45')
      .setCharacteristic(Characteristic.FirmwareRevision, this.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.version);
  }

  getBridgingStateService() {
    return new Service.BridgingState()
      .setCharacteristic(Characteristic.Reachable, true)
      .setCharacteristic(Characteristic.LinkQuality, 4)
      .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
      .setCharacteristic(Characteristic.Category, Accessory.Categories.DOOR_LOCK);
  }

  getLockMechanismService() {
    this._lockMechanismService = new Service.LockMechanism(this.name);
    this._lockMechanismService.getCharacteristic(Characteristic.LockTargetState)
      .on('set', this._setTargetState.bind(this))
      .updateValue(this._state.targetState);

    this._lockMechanismService.getCharacteristic(Characteristic.LockCurrentState)
      .updateValue(this._state.targetState);

    this._lockMechanismService.isPrimaryService = true;

    return this._lockMechanismService;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _setTargetState(value, callback) {
    this.log(`Change target state of ${this.name} to ${LockMechanismStates[value]}`);
    this._state.targetState = value;
    this._updateCurrentState();
    callback();
  }

  _updateCurrentState() {
    let currentState = this._state.targetState;

    this._lockMechanismService
      .getCharacteristic(Characteristic.LockCurrentState)
      .updateValue(currentState);
  }
}

module.exports = LockMechanismAccessory;