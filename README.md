
# Delayed Switch Platform

A platform that provides configurable, auto reseting delayed switches. This platform can
be created to provide time delayed responses in HomeKit rules.

## Why do we need this plugin?

HomeKit (as of iOS 11.1) does not provide a capability to delay the execution of rules. This platform provides delayed switches that can be
used to build a set of rules that are delayed in execution by the
run time duration of the switch.

In addition to the basic delay functionality, the delay itself can also
be modified in rules to change the delay duration depending on external
factors.

## Installation instructions

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

 ```sudo npm install -g homebridge-delay-switch```

## Example config.json:

 ```
{
  "bridge": {
      ...
  },
  "platforms": [
    {
      "platform": "DelayedSwitches",
      "switches": [
        {
          "name": "Delayed Switch #1",
          "defaultDelay": 1800
        }
      ]
    }
  ]
}
```

The platform can provide any number of switches that have to be predefined in the homebridge config.json. Each switch supports the following attributes:

| Attributes | Usage |
|------------|-------|
| name | A unique name for the switch. Will be used as the accessory name. |
| defaultDelay | The default delay of the switch in seconds. |

## Accessory Services

Each delayed switch will expose two services:

* Accessory Information Service
* Switch Service

## Accessory Switch Service Characteristics

The exposed switch service supports the following characteristics:

| Characteristic | UUID | Permissions | Usage |
|---|---|---|---|
| On | `00000025-0000-1000-8000-0026BB765291` | READ, WRITE, NOTIFY | Enables the delayed switch. After the delay expires this characteristic will be switched off. |
| Delay | `B469181F-D796-46B4-8D99-5FBE4BA9DC9C` | READ, WRITE, NOTIFY | The delay of the switch in seconds. This value can be changed between 1s and 3600s. A change will only take effect the next time the switch is turned on. |

## Supported clients

This platform and the delayed switches it creates have been verified to work with the Elgato Eve app.

## Credits

This plugin was initially forked from and inspired by [homebridge-delay-switch](https://github.com/nitaybz/homebridge-delay-switch) by @nitaybz
