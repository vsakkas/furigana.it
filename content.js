class FuriganaInjector {
    constructor() {
        this.busy = false;
        this.skipTags = new Set([
            "SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA",
            "RUBY", "RT", "RP", "NOSCRIPT", "HEAD", "TITLE"
        ]);
        this.hasJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/;
    }

    async annotate() {
        if (this.busy) return;
        this.busy = true;

        try {
            // Wait a tick to ensure page has fully rendered
            await new Promise(requestAnimationFrame);

            const nodes = this.collectTextNodes(document.body);
            console.log("[furigana] annotating", nodes.length, "nodes");
            console.time("[furigana] total");

            const range = document.createRange();

            // Split nodes into batches
            const chunkSize = 100;
            const chunks = [];
            for (let i = 0; i < nodes.length; i += chunkSize) {
                chunks.push(nodes.slice(i, i + chunkSize));
            }

            // Send all batches to background for annotation
            const promises = chunks.map(chunk =>
                browser.runtime.sendMessage({
                    type: "ANNOTATE_BATCH",
                    texts: chunk.map(n => n.textContent)
                })
            );

            // Apply results as they come back, replacing original text with annotated HTML
            for (let i = 0; i < promises.length; i++) {
                const results = await promises[i];
                chunks[i].forEach((node, j) => {
                    if (results[j] === null) return;
                    node.replaceWith(range.createContextualFragment(results[j]));
                });
            }
            console.timeEnd("[furigana] total");
            console.log("[furigana] done");
        } finally {
            this.busy = false;
        }
    }

    collectTextNodes(root) {
        const nodes = [];
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    let el = node.parentElement;
                    while (el) {
                        if (this.skipTags.has(el.tagName)) return NodeFilter.FILTER_REJECT;
                        el = el.parentElement;
                    }
                    if (!this.hasJapanese.test(node.textContent)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        let node;
        while ((node = walker.nextNode())) nodes.push(node);
        return nodes;
    }

    listen() {
        browser.runtime.onMessage.addListener((message) => {
            if (message.type === "ANNOTATE_PAGE") {
                this.annotate();
            }
        });
    }
}

const injector = new FuriganaInjector();
injector.listen();