---
categories:
- addons
- security
- extension-security-basics
date: 2022-08-31T14:36:51+0200
description: Extensions can use web_accessible_resources to expose their pages to
  the web. This enables way more attacks against them, some discussed here.
lastmod: '2022-08-31 21:00:21'
title: When extension pages are web-accessible
---

In the article discussing the [attack surface of extension pages](/2022/08/24/attack-surface-of-extension-pages/) I said:

> Websites, malicious or not, cannot usually access extension pages directly however.

And then I proceeded talking about extension pages as if this security mechanism were always in place. But that isn’t the case of course, and extensions will quite often disable it at least partially.

The impact of extension pages being exposed to the web is severe and warrants a thorough discussion in a separate article. So here it comes.

*Note*: This article is part of a series on the basics of browser extension security. It’s meant to provide you with some understanding of the field and serve as a reference for my more specific articles. You can browse the [extension-security-basics category](/categories/extension-security-basics/) to see other published articles in this series.

{{< toc >}}

## Why display extension pages within web pages?

Very often extensions will want to display some of its user interface on regular web pages. Our [example extension](/2022/08/10/anatomy-of-a-basic-extension/#the-example-extension) took the approach of injecting its content directly into the page:

```js
let div = document.createElement("div");
div.innerHTML = result.message + " <button>Explain</button>";
document.body.appendChild(div);
```

Whether this approach works depends very much on the website. Even for non-malicious websites, one never knows what CSS styles are used by the website and how they will impact this code. So extension developers will try to find an own context for extension’s user interface, one where it won’t be affected by whatever unexpected stuff the website might be doing.

This kind of context is provided by the [`<iframe>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe), whatever we load there will no longer be affected by the parent page.

Except: A frame displaying `about:blank` may be easy to create, but its contents are accessible not merely to your content script but to the web page as well. So the web page may decide to do something with them, whether unintentionally (because the frame is mistaken for one of its own) or with a malicious purpose.

The obvious solution: load an extension page in that frame. The frame will not be considered same-origin by the browser, so the browser won’t grant the website access to it. It’s the secure solution. Well, mostly at least…

## Loading an extension page in a frame

I’ll discuss all the changes to the [example extension](/2022/08/10/anatomy-of-a-basic-extension/#the-example-extension) one by one. But you can download the ZIP file with the resulting extension source code [here](extension.zip).

So let’s say we add a `message.html` page to the extension, one that will display the message outlined above. How will the content script load it on a page?

```js
let frame = document.createElement("iframe");
frame.src = chrome.runtime.getURL("message.html");
frame.style.borderWidth = "0";
frame.style.width = "100%";
frame.style.height = "100px";
document.body.appendChild(frame);
```

When we add this code to our `script.js` content script and open `example.com` we get the following:

{{< img src="blocked.png" width="766" alt="Screenshot of the example domain. Below the usual content the “sad page” symbol is displayed and the text “This page has been blocked by Chromium.”" />}}

That’s the security mechanism mentioned in the previous article: web pages are usually not allowed to interact with extension pages directly. The same restriction applies to our content script, so loading the extension page fails.

*Note*: This only applies to Chromium-based browsers. In Mozilla Firefox the code above will succeed. Content scripts have the same access rights as extension pages here, meaning that they can load extension pages even when the web page they attach to cannot.

The solution? Make the page [web-accessible](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources). It means adding the following line to the extension’s `manifest.json` file:

```json
{
  …
  "web_accessible_resources": ["message.html"],
  …
}
```

The good news: now the content script is allowed to load `message.html`. The bad news: any web page is also allowed to load `message.html`. This page is no longer protected against malicious web pages messing with it directly.

## Do extensions even do this?

Obviously, extension pages not being web-accessible is a useful security mechanism. But, as we’ve seen before, disabling security mechanisms isn’t uncommon. So, how many extensions declare their pages as web-accessible?

It’s hard to tell for sure because `web_accessible_resources` can contain wildcard matches and it isn’t obvious whether these apply to any HTML pages. However, looking for explicit allowing of `.html` resources in [my extension survey](https://github.com/palant/chrome-extension-manifests-dataset), I can see that at least 8% of the extensions do this.

Here again, more popular extensions are more likely to relax security mechanisms. When looking at extensions with at least 10,000 users, the share of those with web-accessible extension pages goes up to almost 17%. And for extensions with at least 100,000 users it’s even 25% of them.

Some extensions will go as far as declaring all of extension resources web-accessible. These are a minority however, with their share staying below 2% even for the popular extensions.

## A vulnerable message page

Of course, a web-accessible extension page isn’t necessarily a vulnerable extension page. At this stage it’s merely more exposed. It typically becomes vulnerable when extension developers give in to their natural urge to make things more generic.

For example, we could just move the code displaying the message from the content script into the extension page. But why do that? We could make that a *generic* message page and keep all the logic in the content script.

And since it is a generic message page displaying generic messages, the content script needs to tell it what to do. For example, it could use URL parameters for that:

```js
chrome.storage.local.get("message", result =>
{
  frame.src = chrome.runtime.getURL("message.html") +
    "?message=" + encodeURIComponent(result.message) +
    "&url=https://example.net/explanation";
});
```

The extension page now gets two parameters: the message to be displayed and the address to be opened if the button is clicked.

And the script doing the processing in the extension page would then look like this:

```js
$(() =>
{
  let params = new URLSearchParams(location.search);
  $(document.body).append(params.get("message") + " <button>Explain</button>");
  $("body > button").click(() =>
  {
    chrome.tabs.create({ url: params.get("url") });
  });
});
```

This has the added benefit that the background page is no longer necessary. It can be removed because the message page has all the necessary privileges, it doesn’t need to delegate the task of opening a new tab.

Yes, this is using jQuery again, with its [affinity for running JavaScript code as an unexpected side-effect](/2020/03/02/psa-jquery-is-bad-for-the-security-of-your-project/). And it appears to work correctly. We get a message similar to the one [produced by the original extension](/2022/08/10/anatomy-of-a-basic-extension/#the-content-script). Yet this time page CSS no longer applies to it.

{{< img src="message.png" width="696" alt="Screenshot of the example domain. Below the usual content a message says “Hi there!” along with a button labeled “Explain.”" />}}

## Achieving Remote Code Execution

People familiar with [Cross-site Scripting (XSS) vulnerabilities](https://en.wikipedia.org/wiki/Cross-site_scripting) probably noticed already that the way the `message` parameter is handled is vulnerable. Since the `message.html` page is now web-accessible, the web page can take the frame created by the content script and rewrite the parameters:

```js
setTimeout(() =>
{
  let frame = document.querySelector("iframe:last-child");
  let src = frame.src;

  // Remove existing query parameters
  src = src.replace(/\?.*/, "");

  // Add malicious query parameters
  src += "?message=" + encodeURIComponent("<script>alert('XSS')</script>");

  // Load into frame
  frame.src = src;
}, 1000);
```

Yes, the extension page will attempt to run the script passed in the parameter. Which is stopped by [Content Security Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy) here as well:

{{< img src="csp-error.png" width="753" alt="Screenshot of an issue displayed in Developer Tools with the text ”Content Security Policy of your site blocks the use of 'eval' in JavaScript`”" />}}

So in order for this to be a *proper* Remote Code Execution vulnerability, our example extension also needs to relax its Content Security Policy in the `manifest.json` file:

```json
{
  …
  "content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self';",
  …
}
```

As I explained in the [previous article](/2022/08/24/attack-surface-of-extension-pages/#making-the-attack-succeed), CSP being weakened in this way is remarkably common. Once this change is made, the attack results in the expected message indicating code execution in the extension page context:

{{< img src="xss.png" width="768" alt="Message showing on the example domain with the text: “chrome-extension://… says: XSS”" />}}

*Note*: Quite a few stars have to align for this attack to work. Chrome will generally ignore `'unsafe-inline'` directive for scripts, so inline scripts will never execute. Here it only works because jQuery versions before 3.4.0 will call `eval()` on inline scripts. And `eval()` calls can be allowed with the `'unsafe-eval'` directive.

## Triggering the attack at will

The approach outlined here relies on the extension injecting its frame into the page. But our example extension only does it on `example.com`. Does it mean that other websites cannot exploit it?

Usually they still can, at least in Chromium-based browsers. That’s because the extension page address is always the same:

```
chrome-extension://<extension-id>/message.html
```

For public extensions the extension ID is known. For example, if you switch on Developer Mode in Chrome you will see it in the list of installed extensions:

{{< img src="extension.png" width="415" alt="Screenshot of the Adobe Acrobat extension listing. Below the extension description, there is a line labeled ID followed by a combination of 32 letters." />}}

So any website can create this frame and exploit the vulnerability instead of waiting for the extension to create it:

```js
let frame = document.createElement("iframe");
frame.src = "chrome-extension://abcdefghijklmnopabcdefghijklmnop/message.html?message="
  + encodeURIComponent("<script>alert('XSS')</script>");
document.body.appendChild(frame);
```

This approach won’t work in Firefox because the page address is built using a different, user-specific extension ID. In Manifest V3 Chrome also introduced a `use_dynamic_url` flag to the [web_accessible_resources entry](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources) which has a similar effect. At the moment barely any extensions use this flag however.

## What if code execution is impossible?

But what if the extension does not relax Content Security Policy? Or if it doesn’t use jQuery? Is this extension no longer vulnerable then?

The extension page remains vulnerable to HTML injection of course. This means that a website could e.g. open this extension page as a new tab and display its own content there. For the user it will look like a legitimate extension page, so they might be inclined to trust the content and maybe even enter sensitive data into an HTML form provided.

Also, if a vulnerable extension page contains sensitive data, this data could be extracted by injecting CSS code. I previously outlined [how such an attack would work against Google web pages](/2021/06/28/having-fun-with-css-injection-in-a-browser-extension/#exfiltrating-data), but it works against a browser extension as well of course.

Finally, there is also the `url` parameter here. Even without code execution, we can make this extension open whichever page we like:

```js
let frame = document.createElement("iframe");
frame.src = "chrome-extension://abcdefghijklmnopabcdefghijklmnop/message.html?message="
  + "&url=data:,Hi!";
document.body.appendChild(frame);
```

If the user now clicks that “Explain” button, the address `data:,Hi!` loads in a new tab, even though websites aren’t normally allowed to open it for security reasons. So this vulnerability allows websites to [hijack window.open() extension API](/2022/08/17/impact-of-extension-privileges/#implicit-privileges).

Wait, but the user still needs to click that button, right? Isn’t that quite a bit of a setback?

Actually, tricking the user into doing that is easy with [clickjacking](https://en.wikipedia.org/wiki/Clickjacking). The approach: we make that frame invisible. And we also clip it to make sure only a piece of the button is visible. Then we place the frame under the mouse cursor whenever the user moves it, so when the user clicks anywhere this button receives the click.

```js
let frame = document.createElement("iframe");
frame.style.position = "absolute";
frame.style.opacity = "0.0001";
frame.style.clip = "rect(10px 60px 30px 40px)";
frame.src = "chrome-extension://abcdefghijklmnopabcdefghijklmnop/message.html?message="
  + "&url=data:,Hi!";
document.body.appendChild(frame);

window.addEventListener("mousemove", event =>
{
  frame.style.left = (event.clientX - 50) + "px";
  frame.style.top = (event.clientY - 20) + "px";
});
```

The user doesn’t see anything unusual here. Yet when they click anywhere on the page the address `data:,Hi!` loads in a new tab.

## Passing data via window.postMessage()

When a content script passes data to an extension page, it isn’t always using URL parameters. Another common approach is [window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). In principle, this method gives developers better control over who can do what. The extension page and content script can inspect `event.origin` and `event.sender` properties to ensure that only trusted parties can communicate here.

In reality this method is meant for communication between web pages however and not extension parts. So it doesn’t allow distinguishing between a web page and the content script running in that web page for example. Securing this communication channel is inherently difficult, and extensions frequently fail to do it correctly.

Worse yet, its convenience and capability for bi-directional communication invite exchanging way more data. Web pages can listen in on this data, and they could attempt to send messages of their own. In the worst-case scenario, this exposes functionality that [allows compromising all of the extension’s capabilities](/2021/04/13/print-friendly-pdf-full-compromise/).

## Recommendations for developers

Obviously, all the [recommendations from the previous article](/2022/08/24/attack-surface-of-extension-pages/#recommendations-for-developers) apply here as well. These help prevent code execution vulnerabilities in extension pages or at least limit vulnerability scope.

In addition, making extension pages web-accessible should be considered carefully. It may sound obvious, but please don’t mark pages as web-accessible unless you absolutely have to. And apply `use_dynamic_url` flag if you can.

Also, web-accessible pages require additional security scrutiny. Any parameters passed in by methods accessible to web pages should be considered untrusted. If possible, don’t even use communication methods that are accessible to web pages.

Yes, [runtime.sendMessage() API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage) requires communicating via the background page which makes it far less convenient. Yes, that [safe replacement for window.postMessage() for extensions to use](https://bugs.chromium.org/p/chromium/issues/detail?id=1188556) isn’t getting any traction. Still, that way you won’t accidentally make mistakes that will compromise the security of your extension.