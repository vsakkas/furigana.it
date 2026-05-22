# furigana.it

<img src="icons/icon.svg" align="left" width="128" height="128" style="margin-right: 12px" />

[![GPLv3 License](https://img.shields.io/badge/license-GPLv3-edece7)](LICENSE)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Unpublished-edece7?logo=firefox-browser&logoColor=edece7)](#)

Add furigana to any Japanese webpage.

A browser extension that annotates kanji with readings on demand. Right-click on any page and select **Add furigana**. Everything runs locally in your browser.

## Features

- On-demand annotation of Japanese webpages
- Correct morphological parsing using [kuromoji](https://www.npmjs.com/package/kuromoji)
- Proper okurigana handling — 食べる → 食(た)べる
- Selectable and copyable annotated text
- No server, no tracking, no analytics

## Installation

> Coming to Firefox Add-ons. For now, see `Development` section.

## Usage

Right-click any Japanese webpage and select **Add furigana**.

## Development

1. Clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click **This Firefox** → **Load Temporary Add-on**
4. Select `manifest.json`

## License

This project is licensed under the GPLv3 License - see the [LICENSE](LICENSE) file for details.
