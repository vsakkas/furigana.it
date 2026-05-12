console.log("[furigana] content script loaded on", location.hostname);
document.body.style.border = "5px solid red";

browser.runtime.onMessage.addListener((message) => {
    if (message.type === "ANNOTATE_PAGE") {
        console.log("[furigana] received ANNOTATE_PAGE");
    }
});