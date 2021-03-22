---
categories:
- security
- privacy
- duckduckgo
date: 2021-03-15T14:07:37+0100
description: Insecure internal communication in DuckDuckGo Privacy Essentials leaked
  some info across domains, and an XSS vulnerability was exploitable by its server.
lastmod: '2021-03-22 07:09:40'
title: 'DuckDuckGo Privacy Essentials vulnerabilities: Insecure communication and
  Universal XSS'
---

A few months ago I looked into the inner workings of DuckDuckGo Privacy Essentials, a popular browser extension meant to protect the privacy of its users. I found some of the [typical issues](/2020/12/10/how-anti-fingerprinting-extensions-tend-to-make-fingerprinting-easier/) (mostly resolved since) but also two actual security vulnerabilities. First of all, the extension used insecure communication channels for some internal communication, which, quite ironically, caused some data leakage across domain boundaries. The second vulnerability gave a DuckDuckGo server way more privileges than intended: a [Cross-site Scripting (XSS) vulnerability](https://en.wikipedia.org/wiki/Cross-site_scripting) in the extension allowed this server to execute arbitrary JavaScript code on any domain.

Both issues are resolved in DuckDuckGo Privacy Essentials 2021.2.3 and above. At the time of writing, this version is only available for Google Chrome however. Two releases have been skipped for Mozilla Firefox and Microsoft Edge for some reason, so that the latest version available here only fixes the first issue (insecure internal communication). **Update** (2021-03-16): An extension version with the fix is now available for both Firefox and Edge.

{{< img src="duck.jpg" width="600" alt="A very dirty and battered rubber duck" >}}
<em>
  Image credits:
  <a href="https://pixabay.com/photos/rubber-duck-toy-yellow-duckling-594356/" rel="nofollow">RyanMcGuire</a>
</em>
{{< /img >}}

These vulnerabilities are very typical, I’ve seen similar mistakes in other extensions many times. This isn’t merely extension developers being clueless. The extension platform introduced by Google Chrome simply doesn’t provide secure and convenient alternatives. So most extension developers are bound to get it wrong on the first try. **Update** (2021-03-16): Linked to respective Chromium issues.

{{< toc >}}

## Another case of (ab)using window.postMessage

Seeing `window.postMessage()` called in a browser extension’s content script is almost always a red flag. That’s because it is [really hard to use this securely](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#using_window.postmessage_in_extensions_non-standard_inline). Any communication will be visible to the web page, and it is impossible to distinguish legitimate messages from those sent by web pages. This doesn’t stop extensions from trying of course, simply because this API is so convenient compared to secure extension APIs.

In case of DuckDuckGo Privacy Essentials, the content script `element-hiding.js` used this to coordinate actions of different frames in a tab. When a new frame loaded, it sent a `frameIdRequest` message to the top frame. And the content script there would reply:

{{< highlight js >}}
if (event.data.type === 'frameIdRequest') {
  document.querySelectorAll('iframe').forEach((frame) => {
    if (frame.id && !frame.className.includes('ddg-hidden') && frame.src) {
      frame.contentWindow.postMessage({
        frameId: frame.id,
        mainFrameUrl: document.location.href,
        type: 'setFrameId'
      }, '*')
    }
  })
}
{{< /highlight >}}

While this communication is intended for the content script loaded in a frame, the web page there can see it as well. And if that web page belongs to a different domain, this leaks two pieces of data that it isn’t supposed to know: the full address of its parent frame and the `id` attribute of the `<iframe>` tag where it is loaded.

Another piece of code was responsible for hiding blocked frames to reduce visual clutter. This was done by sending a `hideFrame` message, and the code handling it looked like this:

{{< highlight js >}}
if (event.data.type === 'hideFrame') {
  let frame = document.getElementById(event.data.frameId)
  this.collapseDomNode(frame)
}
{{< /highlight >}}

Remember, this isn’t some private communication channel. Without any origin checks, any website could have sent this message. It could be a different frame in the same tab, it could even be the page which opened this pop-up window. And this code just accepts the message and hides some document element. Without even verifying that it is indeed an `iframe` tag. This certainly makes the job of anybody running a [Clickjacking attack](https://en.wikipedia.org/wiki/Clickjacking) much easier.

DuckDuckGo addressed the issue by completely removing this entire content script. Good riddance!

## Why you should be careful when composing your JavaScript

When extensions load content scripts dynamically, the [tabs.executeScript() API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/executeScript) allows them to specify the JavaScript code as string. Sadly, using this feature is sometimes unavoidable given how this API has no other way of passing configuration data to static script files. It requires special care however, there is no Content Security Policy here to save you if you embed data from untrusted sources into the code.

The problematic code in DuckDuckGo Privacy Essentials looked like this:

{{< highlight js >}}
var variableScript = {
  'runAt': 'document_start',
  'allFrames': true,
  'matchAboutBlank': true,
  'code': `
    try {
      var ddg_ext_ua='${agentSpoofer.getAgent()}'
    } catch(e) {}
  `
};
chrome.tabs.executeScript(details.tabId, variableScript);
{{< /highlight >}}

Note how `agentSpoofer.getAgent()` is inserted into this script without any escaping or sanitization. Is that data trusted? Sort of. The data used to decide about spoofing the user agent is [downloaded from staticcdn.duckduckgo.com](https://staticcdn.duckduckgo.com/useragents/random_useragent.json). So the good news are: the websites you visit cannot mess with it. The bad news: this data can be manipulated by DuckDuckGo, by Microsoft (hosting provider) or by anybody else who gains access to that server (hackers or government agency).

If somebody managed to compromise that data (for individual users or for all of them), the impact would be massive. First of all, this would allow executing arbitrary JavaScript code in the context of any website the user visits (Universal XSS). But content scripts can also send messages to the extension’s background page. Here the background page will react for example to messages like `{getTab: 1}` (retrieving information about user’s tabs), `{updateSetting: {name: "activeExperiment", value: "2"}}` (changing extension settings) and many more.

Per my recommendation, the problematic code has been changed to use `JSON.stringify()`:

{{< highlight js >}}
  'code': `
    try {
      var ddg_ext_ua=${JSON.stringify(agentSpoofer.getAgent())}
    } catch(e) {}
  `
{{< /highlight >}}

This call will properly encode any data, so that it is safe to insert into JavaScript code. The only concern (irrelevant in this case): if you insert JSON-encoded data into a `<script>` tag, you’ll need to watch out for `</script>` in the data. You can escape forward slashes after calling `JSON.stringify()` to avoid this issue.

## Consequences for the extension platform?

I’ve heard that Google is implementing [Manivest V3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/) in order to make their extension platform more secure. While these changes will surely help, may I suggest doing something about the things that extensions continuously get wrong? If there are no convenient secure APIs, extension developers will continue using insecure alternatives.

For example, extension developers keep resorting to `window.postMessage()` for internal communication. I understand that [runtime.sendMessage()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage) is all one needs to keep things secure. But going through the background page when you mean to message another frame is very inconvenient, doing it correctly requires lots of boilerplate code. So maybe [an API to communicate between content scripts in the same tab](https://bugs.chromium.org/p/chromium/issues/detail?id=1188556) could be added to the extension platform, even if it’s merely a wrapper for `runtime.sendMessage()`?

The other concern is the `code` parameter in [tabs.executeScript()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/executeScript), security-wise it’s a footgun that really shouldn’t exist. It has only one legitimate use case: to pass configuration data to a content script. So how about [extending the API to pass a configuration object](https://bugs.chromium.org/p/chromium/issues/detail?id=330111) along with the script file? Yes, same effect could also be achieved with a message exchange, but that complicates matters and introduces timing issues, which is why extension developers often go for a shortcut.

## Timeline

* 2020-12-10: Asked for a security contact in a GitHub issue.
* 2020-12-10: Received a developer’s email address as contact.
* 2020-12-16: Reported both issues via email.
* 2020-12-16: Received confirmation that the reports have been received and will be addressed.
* 2021-01-05: Cross-frame information leakage issue resolved.
* 2021-01-08: DuckDuckGo Privacy Essentials 2021.1.8 released.
* 2021-01-13: Universal XSS issue resolved.
* 2021-02-08 (presumably): DuckDuckGo Privacy Essentials 2021.2.3 released for Google Chrome only.