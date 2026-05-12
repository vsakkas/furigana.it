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