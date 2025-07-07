---
categories:
- privacy
- security
- add-ons
date: 2023-05-10T15:44:09+0200
description: Most Online Security functionality is already provided by the browser,
  and there is little indication that it can improve on that. It does implement its
  functionality in a maximally privacy-unfriendly way however, sharing your browsing
  history and installed extensions with the vendor. There is also plenty of sloppy
  programming, some of which might potentially cause issues.
lastmod: '2025-07-07 05:23:56'
title: 'Online Security extension: Destroying privacy for no good reason'
---

These days it’s typical for antivirus vendors to provide you with a browser extension which is meant to improve your online security. I’ll say up front: I don’t consider any such browser extensions recommendable. At best, they are worthless. At worst, they [introduce massive security issues](/2020/02/25/mcafee-webadvisor-from-xss-in-a-sandboxed-browser-extension-to-administrator-privileges/).

As an example I took a brief look at the Online Security extension by ReasonLabs. No, there is no actual reason beyond its 7 million users. I think that this extension is a fairly typical representative of its craft.

{{< img src="welcome_screen.png" width="455" alt="A pop-up titled “Online Security for Google Chrome” and subtitled “Protects your browsing and personal information by blocking harmful content and real-time detection of data breaches.” A big orange button below says “Scan now.”" />}}

TL;DR: Most Online Security functionality is already provided by the browser, and there is little indication that it can improve on that. It does implement its functionality in a maximally privacy-unfriendly way however, sharing your browsing history and installed extensions with the vendor. There is also plenty of sloppy programming, some of which might potentially cause issues.

{{< toc >}}

## Features

First I want to take the Online Security features apart one by one. It might come as no surprise, but there is less here than the extension’s description makes it sound like.

### URL blocking

The extension description claims:

> URL Blocker - Online Security protects you against security breaches that come from browsing suspicious websites. Malware, phishing attempts, crypto-jackers, and scams that can damage both your browser and your device - we track them to keep you and your personal data safe.

If that sounds good, it’s probably because the browser’s built-in protection does such a good job staying in the background. Few people are even aware that it exists. So they will believe antivirus vendors’ claims that they need a third-party product to keep them safe from malicious websites.

Now I cannot really tell how detection quality of Online Security compares to Google Safe Browsing that most browsers rely on. I can comment on the implementation however. While the built-in protection will block malicious websites both at the top level and as frames, Online Security only looks at top-level addresses.

The much bigger issue however is: unlike the browser, Online Security lacks the data to make a decision locally. Instead, it will query ReasonLab’s web server for each and every address you navigate to. The query part of the address will be omitted, in case that makes you feel better.

Here is what a typical request looks like:

```
POST /SSE/v1/scan/urls.ashx HTTP/1.1
Host: apis.reasonsecurity.com
Cookie: s_id=5c1030de-48ae-4edd-acc3-5d92f4735f96; ruser=3b2653d9-31b9-4ce8-9127-efa0cda53702; aft=…
x-userid: 2362740a-6bba-40d6-8047-898a3b4423d5
Content-Length: 33
Content-Type: application/json

["https://www.google.com/search"]
```

That’s three user identifiers: two sent as cookies and a third one as `x-userid` HTTP header. While the former will be reset when the browsing data is cleared, the latter is stored in the extension and will persist for as long as the extension is installed. We’ll see that unique user identifier again.

This request will be sent whenever a new page loads. There is no caching: the extension won’t recognize that it queried the server about the exact same page seconds ago but rather send a new request.

That’s not quite as invasive as what we’ve seen with [Avast’s data collection](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/) where the context of the page load was being collected as well. Well, at least usually it isn’t. When Online Security performs a scan, be it manual or automated, it will send the addresses of all your tabs to the server:

```
POST /SSE/v1/scan/urls.ashx HTTP/1.1
Host: apis.reasonsecurity.com
Cookie: s_id=5c1030de-48ae-4edd-acc3-5d92f4735f96; ruser=3b2653d9-31b9-4ce8-9127-efa0cda53702; aft=…
x-userid: 2362740a-6bba-40d6-8047-898a3b4423d5
Content-Length: 335
Content-Type: application/json

[
  "https://example.com/",
  "chrome://extensions/",
  "https://chrome.google.com/webstore/detail/online-security/llbcnfanfmjhpedaedhbcnpgeepdnnok/related",
  "https://www.test.de/Geld-anlegen-mit-Zinsen-4209104-0/",
  "chrome-extension://llbcnfanfmjhpedaedhbcnpgeepdnnok/index.html",
  "chrome-extension://llbcnfanfmjhpedaedhbcnpgeepdnnok/index.html"
]
```

Yes, that even includes duplicate addresses. Still, likely no malice is involved here. Yet 17 years after Firefox 2 introduced privacy preserving phishing protection we shouldn’t have to discuss this again.

Protection against malicious websites in modern browsers will typically use local data to check website addresses against. The server will only be queried if there is a match, just in case the data changed in the meantime. And this should really be the baseline privacy level for any security solution today.

#### What happens to the data?

It’s impossible to tell from the outside what ReasonLab’s servers do with this data. So we have to rely on the information provided in the [privacy policy](https://reasonlabs.com/platform/products/extension/privacy-policy):

> We will also collect URLs and the preceding referral domains to check if they are malicious.

Good, they mention collecting this data in unambiguous terms.

> In this regard, we will send the URLs to our servers but only store their domains in order to operate and provide the Software services.

So they don’t claim the data to be deleted. They won’t keep the full addresses but they will keep the domain names. This statement leaves some open questions.

Most importantly, the privacy policy doesn’t mention the user identifier at all. If it’s stored along with the domain names, it still allows conclusions about the browsing habits of an individual user. There is also a non-negligible deanonymization potential here.

Also, what kind of services need this data? It’s hard to imagine anything that wouldn’t involve user profiles for advertising.

### Extension blocking

Next feature:

> Disables Harmful Extensions - Online Security identifies all extensions installed on your browser and disables the harmful ones that may hijack your browser settings.

Yet another piece of functionality that is already built into the browser. However, once again the built-in functionality is so unintrusive that antivirus vendors see a chance to sell you the same functionality.

I’m unsure about the implementation details for Chrome, but Firefox has a local `blocklist-addons.json` file that it checks all browser extensions against. In case of a match the extension is disabled.

Online Security on the other hand opted for a less privacy-friendly approach: when scanning, it will send the complete list of your installed extensions to the ReasonLab’s server:

```
POST /SSE/v1/scan/extensions.ashx HTTP/1.1
Host: api.reasonsecurity.com
Cookie: s_id=5c1030de-48ae-4edd-acc3-5d92f4735f96; ruser=3b2653d9-31b9-4ce8-9127-efa0cda53702; aft=…
Content-Length: 141
Content-Type: application/json

[
  "kpcjmfjmknbolfjjemmbpnajbiehajac",
  "badikkiifpoiichdfhclfkmpeiagfnpa",
  "nkdpapfpjjgbfpnombidpiokcmfkfdgn",
  "oboonakemofpalcgghocfoadofidjkkk"
]
```

The [privacy policy](https://reasonlabs.com/platform/products/extension/privacy-policy) acknowledges collecting this data but doesn’t tell what happens to it. At least the `x-userid` header isn’t present, so it’s only cookies identifying the user.

Well, maybe they at least do a better job at blocking malicious extensions than the browser does? After all, Google has been repeatedly criticized for not recognizing malicious extensions in Chrome Web Store.

Yes, but Google will remove and block malicious extensions when notified about them. So the only way of performing better than the built-in functionality is scanning for malicious extensions and keeping quiet about it, thus putting users at risk.

### Searching data leaks

Let’s move on to something the browser won’t do:

> Dark Web Monitoring - lets you know when your email-related information has become exposed. It will reveal details like passwords, usernames, financial information, and other sensitive details while providing steps to remediate the issue.

This sounds really fancy. What it actually means however: the extension can check whether your email address is present in any known data leaks. It will also use this feature as leverage: you have to register to run the check regularly, and you have to buy the premium version in order to scan multiple email addresses.

It so happens that the well-known website [Have I Been Pwned](https://haveibeenpwned.com/) provides the same service for free and without requiring you to register. Again, maybe they aren’t as good? Hard to tell.

But at least when I enter `me@mailinator.com` into Have I Been Pwned the result cites 99 data breaches and 7 pastes. Doing the same in Online Security yields merely 2 data breaches, which seems to suggest a rather bad data basis.

Interestingly, SpyCloud (which Online Security privacy policy cites as a partner) claims “659 breach exposures” for `me@mailinator.com`. It won’t tell any details unless you pay them however.

### Download monitoring

Now you probably expect that an antivirus vendor will focus on your downloads. And Online Security has you covered:

> Monitors Downloads - Online Security seamlessly integrates with RAV Endpoint Protection providing a full and comprehensive protection across your web browser and personal computer.

In other words: you have to install their antivirus, and then the extension will trigger it whenever you download something.

Which, quite frankly, isn’t very impressive. The [IAttachmentExecute::Save method](https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-iattachmentexecute-save) has been available as a way to run antivirus applications since Windows XP SP2. Mozilla added support for it with Firefox 3, which was released 15 years ago. Chrome likely supported this from day one. So antivirus software has had a supported way to scan downloads for a very long time. It doesn’t need browser extensions for that.

### Cookie and tracker blocking, notification control

And then there are a few more things that pretend to be useful features:

> Blocks Cookies and Trackers- Online Security identifies and blocks malicious cookies and trackers that target you with aggressive and hostile advertising. This allows you to keep your browsing experience private and safe.

> Notification Control  - Online Security blocks notifications from malicious websites and puts the control at your fingertips, so you can easily follow and remove unwanted notifications through the extension dashboard.

Don’t make the wording here confuse you: Online Security is not an ad blocker. It won’t actually block trackers, and it won’t really help you get rid of cookies or notifications.

This entire block of functionality is reserved exclusively to websites that Online Security considers malicious. When it encounters a malicious website (which, in its definition, is restricted to top-level websites), Online Security will delete cookies and browsing data for this website. It will also disable notifications from it.

Now you are probably wondering: what’s the point if malicious websites are blocked anyway? But they aren’t actually blocked. Since Online Security doesn’t have its data available locally, it has to query its webserver to decide whether a website is malicious. By the time it receives a response, the website might have loaded already. So it will be *redirected* to the extension’s “Blocked website” page.

So this functionality is merely a band-aid for the window of opportunity this extension grants malicious websites to do mischief.

## Explicit tracking

Whenever you open some extension page, when you click something in the extension, if you merely sneeze near the extension, it will send a tracking event to `track.atom-ds.com`. The request looks like this:

```
POST / HTTP/1.1
Host: track.atom-ds.com
Content-Type: text/plain;charset=UTF-8
Content-Length: 438

{
  "auth": "",
  "data": "[{
    \"clientcreated\":1683711797044,
    \"extension_id\":\"llbcnfanfmjhpedaedhbcnpgeepdnnok\",
    \"version\":\"3.13.1\",
    \"random_number\":902,
    \"action\":\"click\",
    \"product\":\"rav_extension\",
    \"screenid\":\"home_tab\",
    \"button\":\"see_more\",
    \"screencomponentname\":\"notifications\",
    \"status\":\"2_notifications_blocked\",
    \"ext_uid\":\"2362740a-6bba-40d6-8047-898a3b4423d5\"
  }]",
  "table": "digital_solutions_cyber_extensions_ui"
}
```

The `ext_uid` field here is the persistent user identifier we’ve seen as `x-userid` HTTP header before.

Now this kind of tracking might not be unusual. It’s being disclosed in the privacy policy:

> (ii) time and date of certain events related to the Software (such as launching and scanning, updating and uninstalling the Software), activity log of your use of the Software and the most used features of the Software

With the supposed purpose:

> To provide, support and operate the Software as well as to further develop, enhance and improve our Software and your user experience with our Software.

Of course, it would have been nice for such functionality to be opt-in, but who would object against their favorite browser extension being improved?

Well, it would also have been nice to say that this data is not being stored together with the user identifier. But it probably is, so that ReasonLabs has user profiles containing both browsing history *and* the user’s extension usage.

I wonder however: who runs the `atom-ds.com` domain? The privacy policy claims that Google Analytics is being used for monitoring, but this isn’t the Google Analytics domain. Online Security probably used Google Analytics in the past, but it doesn’t right now.

I also doubt that the domain is owned by ReasonLabs. This domain is listed in various tracking protection lists, it must be some company in the business of monitoring users. And ReasonLabs failed listing this third party in their privacy policy.

## Code quality issues

None of this means of course that browser extensions created by antivirus vendors cannot be useful. But they tend not to be. Which in my opinion is likely a question of priorities: for an antivirus vendor, their browser extension is never a priority. And so they don’t hire any expertise to develop it.

This lack of expertise is how I explain the common pattern of providing a minimal extension and then [escaping into a native application as soon as possible](/2018/11/30/maximizing-password-manager-attack-surface-leaning-from-kaspersky/). That’s not what Online Security developers did however, their extension is largely independent of the antivirus product.

The result isn’t exactly instilling confidence however. It has an unused page called `newtab.html` titled “Chrome Extension Boilerplate (with React 16.6+ & Webpack 4+).” It seems that they used a [publicly available extension boilerplate](https://github.com/lxieyang/chrome-extension-boilerplate-react/) and failed to remove the unnecessary parts. As a result, their extension contains among other things unused files `newtab.bundle.js` and `panel.bundle.js` weighting 190 KiB each.

But not only that. It contains its own copy of the Google Analytics script (another 140 KiB), also unused of course. I am fairly certain that copying this script violates Google’s license terms.

There are also more serious issues with the code. For example, there is a hardcoded list with almost 500 domains:

```js
[
  "birkiesdipyre.com",
  "birlerskababs.com",
  …
  "hegrem.com",
  "hehraybryciyls.com"
].forEach((domain, index) =>
{
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [{
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect"
        redirect: {
          url: chrome.runtime.getURL("/index.html?url=http://"+btoa(domain)+"#/Blocked")
        }
      },
      condition: {
        urlFilter: domain,
        resourceTypes: ["main_frame"]
      }
    }]
  });
});
```

It sort of makes sense to block some domains unconditionally, even if ReasonLabs’ server is down. It doesn’t make sense to use only domains starting with letters B to H however. No idea why the full list isn’t used here. It cannot be the package size, as there would have been obvious ways to cut down on this one (see above).

Note also that the condition uses the `urlFilter` keyword rather than `initiatorDomains`. So instead of blocking only these domains, they blocked every address where these domain names can be found – which could be e.g. websites writing *about* these domains.

And the redirect target? They’ve put `http://` outside the `btoa()` call, so the page cannot decode the `url` parameter and renders blank. It seems that this functionality hasn’t been tested at all.

That’s just the obvious mistakes in a small piece of code. Another typical bug looks like this:

```js
var hostname = new URL(url).hostname.replace("www.", "");
```

Clearly, the intention is to remove `www.` prefix at the start of a host name. Instead, this will remove `www.` anywhere in the host name. So `gwww.oogle.com` for example becomes `google.com`.

And that’s a pattern used all over the codebase. It’s used for removing cookies, deleting browsing data, setting site permissions. All of this could potentially be misdirected to an unrelated website.

For example, here is what the notifications settings display after I opened the extension’s “Blocked website” page for `gwww.oogle.com`:

{{< img src="notifications_list.png" width="616" alt="Page titled “Notifications control” listing two sources: gwww.oogle.com and suspendeddomain.org. The former is underlined with a thick red line." />}}

And here is what the cookie settings show:

{{< img src="cookies_list.png" width="616" alt="Page titled “Cookies and trackers” listing two sources: google.com and suspendeddomain.org. The former is underlined with a thick red line." />}}

## Conclusion

As we’ve seen, Online Security provides little to no value compared to functionality built into browsers or available for free. At the same time, it implements its functionality in a massively privacy-invading way. That’s despite better solutions to the problem being available for more than a decade and being widely publicized along with their shortcomings.

At the same time, code quality issues that I noticed in my glimpse of the extension’s source code aren’t exactly confidence instilling. As so often with antivirus vendors, there is little expertise and/or priority developing browser extensions.

If you really want to secure your browsing, it’s advisable to stay away from Online Security and similar products by antivirus vendors. What makes sense is an ad blocker, possibly configured to block trackers as well. And the antivirus better stays outside your browser.

Mind you, Windows Defender is a perfectly capable antivirus starting with Windows 10, and it’s installed by default. There is little reason to install a third-party antivirus application.