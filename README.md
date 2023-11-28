# Alternator

Simply adds a missing command to cycle between the two last opened files in an editor group. Can be used to replicate how
<c-^> in Vim works.

## Features

## Extension Settings

By default the extensions adds the following keybinding:

    "keybindings": [
      {
        "command": "alternator.switch",
        "key": "ctrl+alt+a",
        "mac": "cmd+alt+a",
        "when": "editorTextFocus"
      }
    ]

## Release Notes

### 1.0.0

Initial release of Alternator.

---
