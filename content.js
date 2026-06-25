class FuriganaInjector {
    constructor() {
        this.busy = false;
        this.skipTags = new Set([
            "SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA",
            "RUBY", "RT", "RP", "NOSCRIPT", "HEAD", "TITLE"
        ]);
        this.hasKanji = /[\u4e00-\u9fff]/;
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

            await this.annotateNodes(nodes);

            console.timeEnd("[furigana] total");
            console.log("[furigana] done");
        } finally {
            this.busy = false;
        }
    }

    async annotateSelection() {
        if (this.busy) return;
        this.busy = true;

        try {
            await new Promise(requestAnimationFrame);

            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const nodes = this.collectTextNodes(range.commonAncestorContainer, range);

            console.log("[furigana] annotating", nodes.length, "selected nodes");
            console.time("[furigana] selection total");

            await this.annotateNodes(nodes);

            console.timeEnd("[furigana] selection total");
            console.log("[furigana] selection done");
        } finally {
            this.busy = false;
        }
    }

    async annotateNodes(nodes) {
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
        const range = document.createRange();
        for (let i = 0; i < promises.length; i++) {
            const results = await promises[i];
            chunks[i].forEach((node, j) => {
                if (results[j] === null) return;
                node.replaceWith(range.createContextualFragment(results[j]));
            });
        }
    }

    collectTextNodes(root, range = null) {
        const treeRoot = root.nodeType === Node.TEXT_NODE ? root.parentNode : root;

        const nodes = [];
        const walker = document.createTreeWalker(
            treeRoot,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (this.skipTags.has(node.tagName)) return NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_SKIP;
                    }
                    if (!this.hasKanji.test(node.textContent)) return NodeFilter.FILTER_REJECT;
                    if (range && !range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
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
            if (message.type === "ANNOTATE_SELECTION") {
                this.annotateSelection();
            }
        });
    }
}

const injector = new FuriganaInjector();
injector.listen();