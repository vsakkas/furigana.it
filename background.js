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

class FuriganaAnnotator {
    constructor() {
        this.tokenizer = null;
        this.ready = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            kuromoji.builder({ dicPath: browser.runtime.getURL("dict/") })
                .build((err, tokenizer) => {
                    if (err) return reject(err);

                    this.tokenizer = tokenizer;
                    this.ready = true;

                    console.log("[furigana] ready");
                    resolve();
                });
        });
    }

    annotate(text) {
        if (!this.ready) return text;

        return this.tokenizer.tokenize(text)
            .map(t => this.toRuby(t))
            .join("");
    }

    toRuby(token) {
        const surface = token.surface_form;
        const reading = token.reading;

        if (!reading || reading === surface) return surface;
        if (!/[\u4e00-\u9fff]/.test(surface)) return surface;

        const hira = reading.replace(/[\u30a1-\u30f6]/g, c =>
            String.fromCharCode(c.charCodeAt(0) - 0x60)
        );

        // Find where kanji ends and okurigana begins
        let kanjiEnd = 0;
        for (let i = surface.length - 1; i >= 0; i--) {
            if (/[\u4e00-\u9fff]/.test(surface[i])) {
                kanjiEnd = i + 1;
                break;
            }
        }

        const kanji = surface.slice(0, kanjiEnd);
        const okurigana = surface.slice(kanjiEnd);
        const kanjiReading = okurigana
            ? hira.slice(0, hira.length - okurigana.length)
            : hira;

        return `<ruby>${kanji}<rt>${kanjiReading}</rt></ruby>${okurigana}`;
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

browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === "ANNOTATE") {
        return Promise.resolve(annotator.annotate(msg.text));
    }
});
