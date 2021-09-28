---
title: "Breaking Custom Cursor to p0wn the web"
date: 2021-09-28T14:37:24+0200
description: Sloppy coding practices in Custom Cursor extension resulted in vulnerabilities with considerable abuse potential. Attack surface of the extension remains excessive.
categories:
- security
- add-ons
---

Browser extensions make attractive attack targets. That’s not necessarily because of the data handled by the extension itself, but too often because of the privileges granted to the extension. Particularly extensions with access to all websites should better be careful and reduce the attack surface as much as possible. Today’s case study is Custom Cursor, a Chrome extension that more than 6 million users granted essentially full access to their browsing session.

{{< img src="custom-cursor.png" alt="A red mouse cursor with evil eyes grinning with its sharp teeth, next to it the text Custom Cursor" width="600" >}}
<em>
  Image credits:
  <a href="https://custom-cursor.com/" rel="nofollow">Custom Cursor</a>,
  <a href="https://openclipart.org/detail/88777/little-red-devil-head-cartoon" rel="nofollow">palomaironique</a>
</em>
{{< /img >}}

The attack surface of Custom Cursor is unnecessarily large: it grants `custom-cursor.com` website excessive privileges while also disabling [default Content Security Policy protection](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy#default_content_security_policy). The result: anybody controlling `custom-cursor.com` (e.g. via one of the very common [cross-site scripting vulnerabilities](https://en.wikipedia.org/wiki/Cross-site_scripting)) could take over the extension completely. As of Custom Cursor 3.0.1 this particular vulnerability has been resolved, the attack surface remains excessive however. I recommend uninstalling the extension, it isn’t worth the risk.

{{< toc >}}

## Integration with extension’s website

The Custom Cursor extension will let you view cursor collections on `custom-cursor.com` website, installing them in the extension works with one click. The seamless integration is possible thanks to the following lines in extension’s `manifest.json` file:

{{< highlight json >}}
"externally_connectable": {
  "matches": [ "*://*.custom-cursor.com/*" ]
},
{{< /highlight >}}

This means that any webpage under the `custom-cursor.com` domain is allowed to call [chrome.runtime.sendMessage()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage) to send a message to this extension. The message handling in the extension looks as follows:

{{< highlight js >}}
browser.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
  switch (request.action) {
    case "getInstalled": {
      ...
    }
    case "install_collection": {
      ...
    }
    case "get_config": {
      ...
    }
    case "set_config": {
      ...
    }
    case "set_config_sync": {
      ...
    }
    case "get_config_sync": {
      ...
    }
  }
}.bind(this));
{{< /highlight >}}

This doesn’t merely allow the website to retrieve information about the installed icon collections and install new ones, it also provides the website with arbitrary access to extension’s configuration. This in itself already has some abuse potential, e.g. it allows tracking users more reliably than with cookies as extension configuration will survive clearing browsing data.

## The vulnerability

Originally I looked at Custom Cursor 2.1.10. This extension version used jQuery for its user interface. As noted before, jQuery [encourages sloppy security practices](/2020/03/02/psa-jquery-is-bad-for-the-security-of-your-project/), and Custom Cursor wasn’t an exception. For example, it would create HTML elements by giving jQuery HTML code:

{{< highlight js >}}
collection = $(
  `<div class="box-setting" data-collname="${collname}">
    <h3>${item.name}</h3>
    <div class="collection-cursors" data-collname="${collname}">
    </div>
  </div>`
);
{{< /highlight >}}

With `collname` being unsanitized collection name here, this code allows HTML injection. A vulnerability like that is normally less severe for browser extensions, thanks to their [default Content Security Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy#default_content_security_policy). Except that Custom Cursor doesn’t use the default policy but instead:

{{< highlight json >}}
"content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'",
{{< /highlight >}}

This `'unsafe-eval'` allows calling inherently dangerous JavaScript functions like [eval()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval). And what calls `eval()` implicitly? Why, jQuery of course, when processing a `<script>` tag in the HTML code. A malicious collection name like `Test<script>alert(1)</script>` will display the expected alert message when the list of collections is displayed by the extension.

So by installing a collection with a malicious name the `custom-cursor.com` website could run JavaScript code in the extension. But does that code also have access to all of extension’s privileges? Yes as the following code snippet proves:

{{< highlight js >}}
chrome.runtime.sendMessage("ogdlpmhglpejoiomcodnpjnfgcpmgale", {
  action: "install_collection",
  slug: "test",
  collection: {
    id: 1,
    items: [],
    slug: "test",
    name: `Test
      <script>
        chrome.runtime.getBackgroundPage(page => page.console.log(1));
      </script>`
  }
})
{{< /highlight >}}

When executed on any webpage under the `custom-cursor.com` domain this will install an empty icon collection. The JavaScript code in the collection name will retrieve the extension’s background page and output some text to its console. It could have instead called `page.eval()` to run additional code in the context of the background page where it would persist for the entire browsing session. And it would have access to all of extension’s privileges:

{{< highlight js >}}
"permissions": [ "tabs", "*://*/*", "storage" ],
{{< /highlight >}}

This extension has full access to all websites. So malicious code could spy on everything the user does, and it could even load more websites in the background in order to impersonate the user towards the websites. If the user is logged into Amazon for example, it could place an order and have it delivered to a new address. Or it could send spam via the user’s Gmail account.

## What’s fixed and what isn’t

When I reported this vulnerability I gave five recommendations to reduce the attack surface. Out of these, one has been implemented: jQuery has been replaced by React, a framework not inherently prone to cross-site scripting vulnerabilities. So the immediate code execution vulnerability has been resolved.

Otherwise nothing changed however and the attack surface remains considerable. The following recommendations have not been implemented:

1. Use the default Content Security Policy or at least remove `'unsafe-eval'`.
2. Restrict special privileges for `custom-cursor.com` to HTTPS and specific subdomains only. As `custom-cursor.com` isn’t even protected by [HSTS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security), any person-in-the-middle attacker could force the website to load via unencrypted HTTP and inject malicious code into it.
3. Protect `custom-cursor.com` website via Content Security Policy which would make exploitable cross-site scripting vulnerabilities far less likely.
4. Restrict the privileges granted to the website, in particular removing arbitrary access to configuration options.

The first two changes in particular would have been trivial to implement, especially when compared to the effort of moving from jQuery to React. Why this has not been done is beyond me.

## Timeline

* 2021-06-30: Sent a vulnerability report to various email addresses associated with the extension
* 2021-07-05: Requested confirmation that the report has been received
* 2021-07-07: Received confirmation that the issue is being worked on
* 2021-09-28: Published article (90 days deadline)
