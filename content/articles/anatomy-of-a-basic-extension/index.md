---
title: "Anatomy of a basic extension"
date: 2022-08-10T12:26:51+0200
description: "Starting an article series. Here we’ll take apart a very simple browser extension and look at various contexts in which its code executes."
categories:
- add-ons
- security
- extension-security-basics
---

I am starting an article series explaining the basics of browser extension security. It’s meant to provide you with some understanding of the field and serve as a reference for my more specific articles. You can browse the [extension-security-basics category](/categories/extension-security-basics/) to see other published articles in this series.

Before we go for a deeper dive, let’s get a better understanding of what a browser extension actually is. We’ll take a look at a simple example extension and the different contexts in which its code runs.

{{< toc >}}

## Browser extensions? What kind of browser extensions?

Browser extensions were introduced to the general public by Mozilla more than two decades ago. Seeing their success, other browser vendors developed their own extension models. However, Google Chrome becoming the prevalent browser eventually caused all the other extension models to go extinct. At this point in time, only Chrome-compatible extensions are still relevant.

These extensions are supported by Google Chrome itself and other Chromium-based browsers such as Microsoft Edge, Opera or Vivaldi. The Mozilla Firefox browser uses an independent implementation of the extension APIs, the only one as far as I am aware. While mostly compatible, Mozilla’s extension APIs have been improved in some areas. Some of these improvements have security impact but, the extension development being centered on Google Chrome these days, I doubt that many extension developers are aware.

Another interesting aspect is that Mozilla for Android also supports extensions, unlike the mobile versions of Google Chrome. This is merely of theoretical importance however as only add-ons from a [very short list](https://addons.mozilla.org/en-US/android/) can be installed. Two years ago I’ve [voiced my concern about this restrictive approach](/2020/08/31/a-grim-outlook-on-the-future-of-browser-add-ons/), yet as of today this list still contains only ten browser extensions.

## The example extension

So our example extension is going to be a Chrome-compatible one. I’ll discuss the files one by one but you can download the entire source code to play around with [here](extension.zip). Unpack this ZIP file to some directory.

All browsers support trying out extensions by loading them from a directory. In Chromium-based browsers you go to `chrome://extensions/`, enable developer mode and use “Load unpacked” button. In Firefox you go to `about:debugging#/runtime/this-firefox` and click “Load Temporary Add-on” button.

This extension uses questionable approaches on purpose. It has several potential security issues, none of these are currently exploitable however. Small changes to the extension functionality will change that however, I’ll introduce these in future articles.

### The extension manifest

The central piece of an extension is its manifest, a file named `manifest.json`. Ours looks like this:

```json
{
  "manifest_version": 2,
  "name": "My extension",
  "version": "1.0",
  "permissions": [
    "storage"
  ],
  "content_scripts": [
    {
      "js": [
        "script.js"
      ],
      "matches": [
        "https://example.com/*",
        "https://www.example.com/*"
      ]
    }
  ],
  "background": {
    "scripts": [
      "background.js"
    ]
  },
  "options_ui": {
    "page": "options.html"
  }
}
```

We use manifest version 2 here. Eventually [manifest version 3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/) is supposed to replace it completely. Yet in [my current survey of extension manifests](https://github.com/palant/chrome-extension-manifests-dataset) only 16% of all extensions used the newer version.

This manifest declares that the extension requires the `storage` permission. This means that it can use [the storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage) to store its data persistently. Unlike cookies or `localStorage` APIs which give users some level of control, extension storage can normally only be cleared by uninstalling the extension.

It also declares that this extension contains the content script `script.js`, an options page `options.html` and a background script `background.js`. We’ll take a look at all of these next.

### The content script

Content scripts are loaded whenever the user navigates to a matching page, in our case any page matching the `https://example.com/*` expression. They execute like the page’s own scripts and have arbitrary access to the page’s [Document Object Model (DOM)](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model). Our content script uses that access to display a notification message:

```js
chrome.storage.local.get("message", result =>
{
  let div = document.createElement("div");
  div.innerHTML = result.message + " <button>Explain</button>";
  div.querySelector("button").addEventListener("click", () =>
  {
    chrome.runtime.sendMessage("explain");
  });
  document.body.appendChild(div);
});
```

This uses [the storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage) to retrieve the `message` value from extension’s storage. That message is then added to the page along with a button labeled “Explain”. This is what it looks like on `example.com`:

{{< img src="message.png" alt="Usual website text starting with “Example Domain.” Below it a block saying “Hi there!” followed by a button titled “Explain.”" width="738" />}}

What happens when this button is clicked? The content script uses [runtime.sendMessage() API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage) to send a message to the extension pages. That’s because a content script only has direct access to a handful of APIs such as `storage`. Everything else has to be done by extension pages that content scripts can send messages to.

The content script capabilities differ slightly depending on browser. For Chromium-based browsers you can find the list in the [Chrome Developers documentation](https://developer.chrome.com/docs/extensions/mv3/content_scripts/#capabilities), for Firefox [MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#webextension_apis) is the ultimative source.

### The background page

Usually, when content scripts send a message its destination is the background page. The background page is a special page that is always present unless specified otherwise in the extension manifest. It is invisible to the user, despite being a regular page with its own DOM and everything. Its function is typically coordinating all other parts of the extension.

Wait, our extension manifest doesn’t even define a background page! There is only a background script. How does that work?

There is still a background page. It is called `_generated_background_page.html` and contains the following code:

```html
<!DOCTYPE html>
<body>
<script src="background.js"></script>
```

If a background page isn’t declared explicitly, the browser will helpfully generate one automatically and make sure all the declared background scripts are loaded into it.

And here is our background script:

```js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
{
  if (request == "explain")
  {
    chrome.tabs.create({ url: "https://example.net/explanation" });
  }
})
```

It uses [runtime.onMessage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage) to listen to messages. When an `"explain"` message is received, it uses [tabs API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs) to open a page in a new tab.

### The options page

But how did that `message` text get into extension storage? Probably via an option page allowing to configure the extension.

Browser extensions can contain various kinds of pages. There are for example action pages that are displayed in a drop-down when the extension icon is clicked. Or pages that the extension will load in a new tab. Unlike the background page, these pages aren’t persistent but rather load when needed. Yet all of them can receive messages from content scripts. And all of them have full access to extension-specific APIs, as far as the extension’s permissions allow.

Our extension manifest declares an options page. This page displays on top of the extension details if some user manages to find the button to open it which browser vendors hide rather well:

{{< img src="options.png" alt="Extension details displayed by the browser: permissions, source, and also “Extension options” button. On top of that page a modal dialog is displayed with the title “My extension”. Inside it the text “Please enter a message” followed by a text box. The value “Hi there!” is filled into the text box." width="659" />}}

It’s a regular HTML page, nothing special about it:

```html
<html>

<head>
  <script src="options.js"></script>
</head>

<body>
  Please enter a message:
  <input id="message" style="width: 100%;">
</body>

</html>
```

The script loaded by this page makes sure that any changes to the `message` field are immediately saved to the extension storage where our content script will retrieve them:

```js
function init()
{
  let element = document.getElementById("message");
  chrome.storage.local.get("message", result => element.value = result.message);
  element.addEventListener("input", () =>
  {
    chrome.storage.local.set({ message: element.value });
  });
}

window.addEventListener("load", init, { once: true });
```

## The relevant contexts

Altogether the relevant contexts for browser extensions look like this:

{{< img src="architecture.png" width="600" alt="Browser extension consists of two sections: extension pages (background page, action page, options page) and content scripts (example.com content script, example.net content script, example.info content script). Content scripts interact with extension pages and with websites: example.com content script with example.com website, example.net content script with example.net website, example.info content script with example.info website. Extension pages interact with browser’s extension APIs, connected websites and desktop applications." />}}

In this article we’ve already seen content scripts that can access websites directly but are barred from accessing most of the extension APIs. Instead, content scripts will communicate with extension pages.

The extension pages are way more powerful than content scripts and have full access to extension APIs. They usually won’t communicate with websites directly however, instead relying on content scripts for website access.

Desktop applications and connected websites are out of scope for this article. We’ll take a thorough look at them later.