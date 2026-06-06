// Fix kuromoji XHR in Firefox extension context
// kuromoji uses XHR to load dict files, Firefox generates moz-extension:/
// with a single slash instead of moz-extension:// — this corrects it
XMLHttpRequest.prototype.open = (function (originalOpen) {
    return function (method, url, ...rest) {
        if (typeof url === "string") {
            url = url.replace(/^moz-extension:\/(?!\/)/, "moz-extension://");
        }
        return originalOpen.call(this, method, url, ...rest);
    };
})(XMLHttpRequest.prototype.open);

const KANJI_RE = /[\u4e00-\u9fff]/;

class FuriganaAnnotator {
    tokenizer = null;

    async init() {
        return new Promise((resolve, reject) => {
            kuromoji.builder({ dicPath: browser.runtime.getURL("dict/") })
                .build((err, tokenizer) => {
                    if (err) return reject(err);
                    this.tokenizer = tokenizer;
                    console.log("[furigana] ready");
                    resolve();
                });
        });
    }

    annotate(text) {
        if (!this.tokenizer) return text;
        const result = this.tokenizer
            .tokenize(text)
            .map(token => this.toRuby(token))
            .join("");
        return result === text ? null : result;
    }

    toRuby(token) {
        const surface = token.surface_form;
        const reading = token.reading;

        if (!reading || reading === surface) return surface;
        if (!KANJI_RE.test(surface)) return surface;

        return this.alignReadingToSurface(surface, this.toHiragana(reading));
    }

    // Build a regex from the surface where consecutive kanji
    // groups become (.+) and kana become literals, then match
    // against the reading to extract per-kanji-group readings.
    alignReadingToSurface(surface, reading) {
        let pattern = "^";
        let inKanji = false;

        for (const char of surface) {
            if (KANJI_RE.test(char)) {
                if (!inKanji) {
                    pattern += "(.+)";
                    inKanji = true;
                }
            } else {
                inKanji = false;
                pattern += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            }
        }
        pattern += "$";

        const match = new RegExp(pattern).exec(reading);
        if (!match) {
            // Fallback — wrap entire surface
            return `<ruby>${surface}<rt>${reading}</rt></ruby>`;
        }

        let result = "";
        let groupIndex = 1;
        inKanji = false;

        for (const char of surface) {
            if (KANJI_RE.test(char)) {
                if (!inKanji) {
                    result += `<ruby>${char}`;
                    inKanji = true;
                } else {
                    result += char;
                }
            } else {
                if (inKanji) {
                    result += `<rt>${match[groupIndex++]}</rt></ruby>`;
                    inKanji = false;
                }
                result += char;
            }
        }

        if (inKanji) {
            result += `<rt>${match[groupIndex]}</rt></ruby>`;
        }

        return result;
    }

    toHiragana(text) {
        return text.replace(/[\u30a1-\u30f6]/g, char =>
            String.fromCharCode(char.charCodeAt(0) - 0x60)
        );
    }
}

const annotator = new FuriganaAnnotator();

annotator.init().catch(err => {
    console.error("[furigana] init failed:", err);
});

browser.contextMenus.create({
    id: "add-furigana",
    title: "Add furigana",
    contexts: ["page"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "add-furigana") {
        browser.tabs.sendMessage(tab.id, { type: "ANNOTATE_PAGE" });
    }
});

browser.runtime.onMessage.addListener(msg => {
    if (msg.type === "ANNOTATE_BATCH") {
        return Promise.resolve(
            msg.texts.map(text => annotator.annotate(text))
        );
    }
});
