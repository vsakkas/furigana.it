# furigana.it

<img src="icons/icon.svg" align="left" width="128" height="128" style="margin-right: 12px" />

[![GPLv3 License](https://img.shields.io/badge/License-GPLv3-edece7)](LICENSE)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--ons-edece7?logo=firefox-browser&logoColor=ffffff)](https://addons.mozilla.org/en-US/firefox/addon/furigana-it/)

Add furigana to any Japanese webpage.

A browser extension that annotates kanji with readings on demand. Right-click on any page and select **Add furigana**. Everything runs locally in your browser.

## Features

- On-demand annotation of Japanese webpages
- Correct morphological parsing using [kuromoji](https://www.npmjs.com/package/kuromoji)
- Proper okurigana handling — 食べる → 食(た)べる
- Selectable and copyable annotated text
- No server, no tracking, no analytics

## Installation

Install from [Firefox Add-ons](https://addons.mozilla.org/addon/furigana-it/).

## Usage

Right-click any Japanese webpage and select **Add furigana**.

## Privacy

This extension does not collect, store, or transmit any data — see the [PRIVACY.md](PRIVACY.md) file for details.

## Development

1. Clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click **This Firefox** → **Load Temporary Add-on**
4. Select `manifest.json`

To apply changes during development:
1. After editing any file, navigate to `about:debugging`
2. Click **This Firefox** → **Reload** on the extension

Validate the extension against Firefox's add-on policies using [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/):

```bash
web-ext lint
```

Build a `.zip` in `dist/` ready for submission to Firefox Add-ons:

```
web-ext build --source-dir . --artifacts-dir ./dist --ignore-files "dist/**" ".git/**" ".github/**"
```

## License

This project is licensed under the GPLv3 License — see the [LICENSE](LICENSE) file for details.
