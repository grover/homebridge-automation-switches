# Advanced configuration

The following configuration example shows all switches in combination. The configuration was used to make the screenshots in the detailed documentation pages. The configuration shows examples of the
[automation switch](AutomationSwitch.md), the [lock mechanism](LockMechanism.md), the [security system](SecuritySystem.md) and the regular [switch](Switch.md).

## Example

```json
{
  "bridge": {
      ...
  },
  "platforms": [
    {
      "platform": "AutomationSwitches",
      "switches": [
        {
          "type": "automation",
          "name": "WindowOpenAlert",
          "period": 600,
          "autoOff": false,
          "stored": false
        },
        {
          "type": "automation",
          "name": "AutoOff",
          "period": 900,
          "autoOff": true,
          "stored": false
        },
        {
          "type": "lock",
          "name": "ScreenLock",
          "default": "unlocked",
          "stored": true
        },
        {
          "type": "security",
          "name": "Home Mode",
          "default": "armed-stay",
          "stored": true
        },
        {
          "type": "security",
          "name": "My DIY security system",
          "default": "unarmed",
          "stored": true,
          "zones": ["Living room", "Bedroom", "Back door"]
        }
      ]
    }
  ]
}
```
