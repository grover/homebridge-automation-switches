"use strict";

var Service, Characteristic;

module.exports = function(homebridge) {
 
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-delay-switch", "DelaySwitch", DelaySwitch);
}

function DelaySwitch(log, config) {
  this.log = log;
  this.name = config.name;
  this.delayTime = config.delay;
  this.Timer;
  this._service = new Service.Switch(this.name);
  this._service.getCharacteristic(Characteristic.On)
    .on('set', this._setOn.bind(this));
}

DelaySwitch.prototype.getServices = function() {
  return [this._service];
}

DelaySwitch.prototype._setOn = function(on, callback) {
 this.log("Setting switch to " + on);
 if (on == 1) {
    clearTimeout(this.Timer);
    this.Timer = setTimeout(function() {
      this._service.getCharacteristic(Characteristic.On).setValue(false, undefined)
    }.bind(this), this.delayTime);
  }
  else { 
   clearTimeout(this.Timer);
  }
  
  callback();
}
