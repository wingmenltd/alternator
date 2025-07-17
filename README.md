# Alternator

Adds some critical missing commands:

1. "alternator.switch" to cycle between the two last opened files in an editor group. Can be used to replicate how <c-^> in Vim works.
2. "alternator.nextChange" to go to the next change (but unlike "workbench.action.editor.nextChange" it can move to the next file after last change)
3. "alternator.previousChange" to go to the previous change (but unlike "workbench.action.editor.previousChange" it can move to the previous file after first change)
4. "alternator.nextFileWithChanges" to jump directly to the next file with changes (skips to the next file without going through each change)
5. "alternator.previousFileWithChanges" to jump directly to the previous file with changes (skips to the previous file without going through each change)

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
      },
      {
        "command": "alternator.nextFileWithChanges",
        "key": "ctrl+alt+shift+n",
        "mac": "cmd+alt+shift+n",
        "when": "editorTextFocus"
      },
      {
        "command": "alternator.previousFileWithChanges",
        "key": "ctrl+alt+shift+p",
        "mac": "cmd+alt+shift+p",
        "when": "editorTextFocus"
      }
    ]

## Publishing

- vsce package
- https://marketplace.visualstudio.com/manage/publishers/wingmen

## Release Notes

### 1.2.0

- Added "alternator.nextFileWithChanges" and "alternator.previousFileWithChanges" commands to jump directly between files with changes

### 1.1.0

- Added "alternator.nextChange" and "alternator.previousChange" commands to cycle through changes that jump to the next/previous file once the first/last change is reached

### 1.0.0

Initial release of Alternator.

---
