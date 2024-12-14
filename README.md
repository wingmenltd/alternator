# Alternator

Adds some critical missing commands:

1. "alternator.switch" to cycle between the two last opened files in an editor group. Can be used to replicate how <c-^> in Vim works.
2. "alternator.nextChange" to go to the next change (but unlike "workbench.action.editor.nextChange" it can move to the next file after last change)
3. "alternator.previousChange" to go to the previous change (but unlike "workbench.action.editor.previousChange" it can move to the previous file after first change)

## Extension Settings

By default the extensions adds the following keybinding:

    "keybindings": [
      {
        "command": "alternator.switch",
        "key": "ctrl+alt+a",
        "mac": "cmd+alt+a",
        "when": "editorTextFocus"
      },
      {
        "command": "alternator.nextChange",
        "key": "ctrl+alt+n",
        "mac": "cmd+alt+n",
        "when": "editorTextFocus"
      },
      {
        "command": "alternator.previousChange",
        "key": "ctrl+alt+p",
        "mac": "cmd+alt+p",
        "when": "editorTextFocus"
      }
    ]

## Release Notes

### 1.1.0

- Added "alternator.nextChange" and "alternator.previousChange" commands to cycle through changes that jump to the next/previous file once the first/last change is reached

### 1.0.0

Initial release of Alternator.

---
