'use strict';

const clone = require('clone');

let Accessory, Characteristic, Service;

class SliderAccessory {

  constructor(api, log, config, storage) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;
    this.config = config;

    this._storage = storage;

    const defaultValue = {
      value: config.default === undefined ? false : config.default
    };

    storage.retrieve(defaultValue, (error, value) => {
      this._state = value;
    });

    this._services = this.createServices();
  }

  getServices() {
    return this._services;
  }

  createServices() {
    return [
      this.getAccessoryInformationService(),
      this.getBridgingStateService(),
      this.getSliderService()
    ];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Slider')
      .setCharacteristic(Characteristic.SerialNumber, '46')
      .setCharacteristic(Characteristic.FirmwareRevision, this.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.version);
  }

  getBridgingStateService() {
    return new Service.BridgingState()
      .setCharacteristic(Characteristic.Reachable, true)
      .setCharacteristic(Characteristic.LinkQuality, 4)
      .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
      .setCharacteristic(Characteristic.Category, Accessory.Categories.SWITCH);
  }

  getSliderService() {
    this._sliderService = new Service.Slider(this.name);

    const props = {
      minValue: this.config.minValue,
      maxValue: this.config.maxValue,
    };

    this._sliderService.getCharacteristic(Characteristic.SliderValue)
      .on('set', this._setValue.bind(this))
      .setProps(props)
      .updateValue(this._state.value);

    this._sliderService.isPrimaryService = true;

    return this._sliderService;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _setValue(value, callback) {
    this.log(`Change value of ${this.name} to ${value}`);

    const data = clone(this._state);
    data.value = value;

    this._persist(data, callback);
  }

  _persist(data, callback) {
    this._storage.store(data, (error) => {
      if (error) {
        callback(error);
        return;
      }

      this._state = data;
      callback();
    });
  }
}

module.exports = SliderAccessory;
