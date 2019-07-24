'use strict';

let Accessory, Characteristic, Service;

class RandomAccessory {

  constructor(api, log, config) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.config = config;

    this._state = {
      randomValue: 0,
    };

    this._maxValue = config.max || 1;

    this._services = this.createServices();
  }

  getServices() {
    return this._services;
  }

  createServices() {
    return [
      this.getAccessoryInformationService(),
      this.getBridgingStateService(),
      this.getSwitchService(),
    ];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Switch')
      .setCharacteristic(Characteristic.SerialNumber, this.config.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this.config.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.config.version);
  }

  getBridgingStateService() {
    return new Service.BridgingState()
      .setCharacteristic(Characteristic.Reachable, true)
      .setCharacteristic(Characteristic.LinkQuality, 4)
      .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
      .setCharacteristic(Characteristic.Category, Accessory.Categories.SWITCH);
  }

  getSwitchService() {
    this._switchService = new Service.Switch(this.name);
    this._switchService.getCharacteristic(Characteristic.On)
      .on('set', this._setState.bind(this));

    this._switchService.addCharacteristic(Characteristic.RandomValue);

    this._switchService.isPrimaryService = true;

    return this._switchService;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _pickRandomValue() {
    const minValue = 1;
    const maxValue = this._maxValue;

    this._state.randomValue = parseInt(Math.floor(Math.random() * (maxValue - minValue + 1) + minValue));
    this.log(`Picked random value: ${this._state.randomValue}`);

    this._switchService
      .getCharacteristic(Characteristic.RandomValue)
      .updateValue(this._state.randomValue);
  }

  _setState(value, callback) {
    this.log(`Change target state of ${this.name} to ${value}`);

    if (value) {
      this._pickRandomValue();

      // Turn off the switch after 1 second
      setTimeout(() => {
        this._switchService.setCharacteristic(Characteristic.On, false);
      }, 1000);
    }

    callback();
  }
}

module.exports = RandomAccessory;
