---
title: "Attack surface of extension pages"
date: 2022-08-24T11:56:51+0200
description: "Remote Code Execution in extension pages is actually hard to achieve. We’ll produce a vulnerable extension nevertheless and look into how it can be exploited."
categories:
- addons
- security
- extension-security-basics
---

In the previous article we discussed [extension privileges](/2022/06/02/impact-of-extension-privileges/). And as we know from [another article](/2022/06/02/anatomy-of-a-basic-extension/#the-relevant-contexts), extension pages are the extension context with full access to these privileges. So if someone were to attack a browser extension, attempting Remote Code Execution (RCE) in an extension page would be the obvious thing to do.

In this article we’ll make some changes to the [example extension](/2022/06/02/anatomy-of-a-basic-extension/#the-example-extension) to make such an attack against it feasible. But don’t be mistaken: rendering our extension vulnerable requires actual work, thanks to the security measures implemented by the browsers.

This doesn’t mean that such attacks are never feasible against real-world extensions. Sometimes even these highly efficient mechanisms [fail to prevent a catastrophic vulnerability](/2020/02/25/mcafee-webadvisor-from-xss-in-a-sandboxed-browser-extension-to-administrator-privileges/). And then there are of course extensions [explicitly disabling security mechanisms](/2020/01/13/pwning-avast-secure-browser-for-fun-and-profit/), with similarly catastrophic results. Ironically, both of these examples are supposed security products created by big antivirus vendors.

*Note*: This article is part of a series on the basics of browser extension security. It’s meant to provide you with some understanding of the field and serve as a reference for my more specific articles. You can browse the [extension-security-basics category](/categories/extension-security-basics/) to see other published articles in this series.

{{< toc >}}

## What does RCE look like?

Extension pages are just regular HTML pages. So what we call Remote Code Execution here, is usually called a [Cross-site Scripting (XSS) vulnerability](https://en.wikipedia.org/wiki/Cross-site_scripting) in other contexts. Merely the impact of such vulnerabilities is typically more severe with browser extensions.

A classic XSS vulnerability would involve insecurely handling untrusted HTML code:

```js
var div = document.createElement("div");
div.innerHTML = untrustedData;
document.body.appendChild(div);
```

If an attacker can decide what kind of data is assigned to `innerHTML` here, they could choose a value like `<img src="x" onerror="alert('XSS')">`. Once that image is added to the document, the browser will attempt to load it. The load fails, which triggers the `error` event handler. And that handler is defined inline, meaning that the JavaScript code `alert('XSS')` will run. So you get a message indicating successful exploitation:

{{< img src="xss.png" width="457" alt="A browser alert message titled “My extension” containing the text “XSS”." />}}

And here is your first hurdle: the typical attack target is the background page, thanks to how central it is to most browser extensions. Yet the background page isn’t visible, meaning that it has little reason to deal with HTML code.

What about pages executing untrusted code directly then? Something along the lines of:

```js
eval(untrustedData);
```

At the first glance, this looks similarly unlikely. No developer would actually do that, right?

Actually, they would if they [use jQuery](/2020/03/02/psa-jquery-is-bad-for-the-security-of-your-project/) which has an affinity for running JavaScript code as an unexpected side-effect.

## Modifying the example extension

I’ll discuss all the changes to the [example extension](/2022/06/02/anatomy-of-a-basic-extension/#the-example-extension) one by one. But you can download the ZIP file with the complete extension source code [here](extension.zip).

Before an extension page can run malicious code, this code has to come from somewhere. Websites, malicious or not, cannot usually access extension pages directly however. So they have to rely on extension content scripts to pass malicious data along. This separation of concerns reduces the attack surface considerably.

But let’s say that our extension wanted to display the price of the item currently viewed. The issue: the content script cannot download the JSON file with the price. That’s because the content script itself runs on `www.example.com` whereas JSON files are stored on `data.example.com`, so same-origin policy kicks in.

No problem, the content script can ask the background page to download the data:

```js
chrome.runtime.sendMessage({
  type: "check_price",
  url: location.href.replace("www.", "data.") + ".json"
}, response => alert("The price is: " + response));
```

Next step: the background page needs to handle this message. And extension developers might decide that [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) is too complicated, which is why they’d rather use [jQuery.ajax()](https://api.jquery.com/jQuery.ajax/) instead. So they do the following:

```js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
{
  if (request.type == "check_price")
  {
    $.get(request.url).done(data =>
    {
      sendResponse(data.price);
    });
    return true;
  }
});
```

Looks simple enough. The extension needs to load the latest jQuery 2.x library as a background script and request the permissions to access `data.example.com`, meaning the following changes to `manifest.json`:

```json
{
  …
  "permissions": [
    "storage",
    "https://data.example.com/*"
  ],
  …
  "background": {
    "scripts": [
      "jquery-2.2.4.min.js",
      "background.js"
    ]
  },
  …
}
```

This appears to work correctly. When the content script executes on `https://www.example.com/my-item` it will ask the background page to download `https://data.example.com/my-item.json`. The background page complies, parses the JSON data, gets the `price` field and sends it back to the content script.

## The attack

You might wonder: where did we tell jQuery to parse JSON data? And we actually didn’t. jQuery merely guessed that we want it to parse JSON because we downloaded a JSON file.

What happens if `https://data.example.com/my-item.json` is not a JSON file? Then jQuery might interpret this data as any one of its supported data types. By default those are: `xml`, `json`, `script` or `html`. And you can probably spot the issue already: `script` type is not safe.

So if a website wanted to exploit our extension, the easiest way would be to serve a JavaScript file (MIME type `application/javascript`) under `https://data.example.com/my-item.json`. One could use the following code for example:

```js
alert("Running in the extension!");
```

Will jQuery then try to run that script inside the background page? You bet!

But the browser saves the day once again. The Developer Tools display the following issue for the background page now:

{{< img src="csp-error.png" width="795" alt="Screenshot with the text “Content Security Policy of your site blocks the use of 'eval' in JavaScript” indicating an issue in jquery-2.2.4.min.js" />}}

*Note*: There is a reason why I didn’t use jQuery 3.x. The developers eventually came around and [disabled this dangerous behavior for cross-domain requests](https://github.com/jquery/jquery/issues/2432). In jQuery 4.x it will even be [disabled for all requests](https://github.com/jquery/jquery/issues/4822). Still, jQuery 2.x and even 1.x remain way too common in browser extensions.

## Making the attack succeed

The [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy) mechanism which stopped this attack is extremely effective. The default setting for browser extension pages is rather restrictive:

```
script-src 'self'; object-src 'self';
```

The `script-src` entry here determines what scripts can be run by extension pages. `'self'` means that only scripts contained in the extension itself are allowed. No amount of trickery will make this extension run a malicious script on an extension page. This protection renders all vulnerabilities non-exploitable or at least reduces their severity considerably. Well, [almost all vulnerabilities](/2020/02/25/mcafee-webadvisor-from-xss-in-a-sandboxed-browser-extension-to-administrator-privileges/).

That’s unless an extension relaxes this protection, which is way too common. For example, some extensions will explicitly change this setting in their `manifest.json` file to allow `eval()` calls:

```json
{
  …
  "content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self';",
  …
}
```

Protection is gone and the attack described above suddenly works!

{{< img src="xss2.png" width="423" alt="A browser alert message titled “My extension” containing the text “Running in the extension!”." />}}

Do I hear you mumble “cheating”? “No real extension would do that” you say? I beg to differ. In [my extension survey](https://github.com/palant/chrome-extension-manifests-dataset) 7.9% of the extensions use `'unsafe-eval'` to relax the default Content Security Policy setting.

In fact: more popular extensions are more likely to be the offenders here. When looking at extensions with more than 10,000 users, it’s already 12.5% of them. And for extensions with at least 100,000 users this share goes up to 15.4%.

## Further CSP circumvention approaches

It doesn’t always have to be `'unsafe-eval'` or `'unsafe-inline'` script sources which essentially drop all defenses. Sometimes it is something way more innocuous, such as adding the some website as a trusted script source:

```json
{
  …
  "content_security_policy": "script-src 'self' https://example.com/;"
  …
}
```

With `example.com` being some big name’s code hosting or even the extension owner’s very own website, it certainly can be trusted? How likely is it that someone will hack that server only to run some malicious script in the extension?

Actually, hacking the server often isn’t necessary. Maybe `example.com` has an [open redirect vulnerability](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html), allowing attackers to redirect the request to a script they control. Or it contains a [JSONP endpoint](https://en.wikipedia.org/wiki/JSONP). For example, `https://example.com/get_data?callback=ready` might produce a response like this:

```js
ready({...some data here...});
```

Attackers would attempt to manipulate this callback name, e.g. loading `https://example.com/get_data?callback=alert("XSS")//` which will result in the following script:

```js
alert("XSS")//({...some data here...});
```

That’s it, now `example.com` can be used to produce a script with arbitrary code and CSP protection is no longer effective.

*Side-note*: These days JSONP endpoints usually restrict callback names to alphanumeric characters only, to prevent this very kind of abuse. However, JSONP endpoints without such protection are still too common.

## Recommendations for developers

So if you are an extension developer and you want to protect your extension against this kind of attacks, what can you do?

First and foremost: let Content Security Policy protect you. Avoid adding `'unsafe-eval'` and `'unsafe-inline'` at any cost. Rather than allowing external script sources, bundle these scripts with your extension. If you absolutely cannot avoid loading external scripts, try to keep the list short.

And then there is the usual advise to prevent XSS vulnerabilities:

* Don’t mess with HTML code directly, use safe DOM manipulation methods such as [createElement()](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement), [setAttribute()](https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute), [textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent).
* For more complicated user interfaces use safe frameworks such as [React](https://reactjs.org/) or [Vue](https://vuejs.org/).
* [Do not use jQuery](/2020/03/02/psa-jquery-is-bad-for-the-security-of-your-project/).
* If you absolutely have to handle dynamic HTML code, always pass it through a sanitizer such as [DOMPurify](https://openbase.com/js/dompurify) and soon hopefully the built-in [HTML Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API).
* When adding links dynamically, always make sure that the link target starts with `https://` or at least `http://` so that nobody can smuggle in a `javascript:` link.
