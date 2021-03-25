---
categories:
- amazon
- privacy
- security
date: 2021-03-08 12:36:31+01:00
description: Amazon Assistant browser extension delegates its wide range of privileges
  to Amazon web services. The potential for misuse is enormous.
lastmod: '2021-03-25 10:20:48+01:00'
title: How Amazon Assistant lets Amazon track your every move on the web
---

I recently noticed that Amazon is promoting their Amazon Assistant extension quite aggressively. With success: while not all browsers vendors provide usable extension statistics, it would appear that this extension has beyond 10 million users across Firefox, Chrome, Opera and Edge. Reason enough to look into what this extension is doing and how.

Here I must say that the privacy expectations for shopping assistants [aren’t very high to start with](/2020/10/28/what-would-you-risk-for-free-honey/#the-trouble-with-shopping-assistants). Still, I was astonished to discover that Amazon built the perfect machinery to let them track any Amazon Assistant user or all of them: what they view and for how long, what they search on the web, what accounts they are logged into and more. Amazon could also mess with the web experience at will and for example hijack competitors’ web shops.

{{< img src="amazon_assistant.png" alt="Amazon Assistant log with a borg eye" width="600" >}}
<em>
  Image credits:
  <a href="https://www.amazon.com/" rel="nofollow">Amazon</a>,
  <a href="https://openclipart.org/detail/12544/game-baddie-borg" rel="nofollow">nicubunu</a>,
  <a href="https://pixabay.com/vectors/mask-drone-psychopath-terminator-153936/" rel="nofollow">OpenClipart</a>
</em>
{{< /img >}}

Mind you, I’m not saying that Amazon is currently doing any of this. <strike>While I’m not done analyzing the code, so far everything suggests that Amazon Assistant is only transferring domain names of the web pages you visit rather than full addresses. And all website manipulations seem in line with the extension’s purpose.</strike> **Update** (2021-03-25): There is a [follow-up article with details on what Amazon actually does](/2021/03/22/follow-up-on-amazon-assistants-data-collection/). But since all extension privileges are delegated to Amazon web services, it’s impossible to make sure that it always works like this. If for some Amazon Assistant users the “hoover up all data” mode is switched on, nobody will notice.

{{< toc >}}

## What is Amazon Assistant supposed to do?

On the first glance, Amazon Assistant is just the panel showing up when you click the extension icon. It will show you current Amazon deals, let you track your orders and manage lists of items to buy. So far very much confined to Amazon itself.

{{< img src="assistant_panel.png" alt="Amazon Assistant panel showing up when the icon is clicked, showing add to list, orders and deals as options" width="323" />}}

What’s not quite obvious: “Add to list” will attempt to recognize what product is displayed in the current browser tab. And that will work not only on Amazon properties. Clicking this button while on some other web shop will embed an Amazon Assistant into that web page and offer you to add this item to your Amazon wishlist.

But Amazon Assistant will become active on its own as well. Are you searching for “playstation” on Google? Amazon Assistant will show its message right on top of Google’s ads, because you might want to buy that on Amazon.

{{< img src="search_assistant.png" alt="Amazon Assistant pop-up suggesting Amazon products when searching on Google" width="390" />}}

You will see similar messages when searching on eBay or other online shops.

So you can already guess that Amazon Assistant will ask Amazon web services what to do on any particular website: how to recognize searches, how to extract product information. There are just too many shops to keep all this information in the extension. As a side-effect that is certainly beneficial to Amazon’s business, Amazon will learn which websites you visit and what you search there. That’s your unavoidable privacy cost of this extension. But it doesn’t stop here.

## The extension’s privileges

Let’s first take a look at what this extension is *allowed* to do. That’s the `permissions` entry in the extension’s `manifest.json` file:

{{< highlight json >}}
"permissions": [
  "tabs",
  "storage",
  "http://*/*",
  "https://*/*",
  "notifications",
  "management",
  "contextMenus",
  "cookies",
{{< /highlight >}}

This is really lots of privileges. First note `http://*/*` and `https://*/*`: the extension has access to each and every website (I cut off the long list of Amazon properties here which is irrelevant then). This is necessary if it wants to inject its content there. The `tabs` permission then allows recognizing when tabs are created or removed, and when a new page loads into a tab.

The `storage` permission allows the extension to keep persistent settings. One of these settings is called `ubpv2.Identity.installationId` and contains (you guessed it) a unique identifier for this Amazon Assistant installation. Even if you log out of Amazon and clear your cookies, this identifier will persist and allow Amazon to connect your activity to your identity.

Two other permissions are also unsurprising. The `notifications` permission presumably lets the extension display a desktop notification to keep you updated about your order status. The `contextMenus` permission lets it add an “Add to Amazon Lists” item to the browser’s context menu.

The `cookies` permission is unusual however. In principle, it allows the extension to access cookies on any website. Yet it is currently only used to access Amazon cookies in order to recognize when the user logs in. The same could be achieved without this privilege, merely by accessing `document.cookie` on an Amazon website (which is how the extension in fact does it in one case).

Even weirder is the `management` permission which is only requested by the Firefox extension but not the Chrome one. This permission gives an extension access to other browser extension and even allows uninstalling them. Requesting it is highly unusual and raises suspicions. Yet there is only code to call [management.uninstallSelf()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/management/uninstallSelf) and [management.getSelf()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/management/getSelf), the two function that don’t require this permission! And even this code appears to be unused.

Now it’s not unusual for extensions to request wide reaching privileges. It’s not even unusual to request privileges that aren’t currently used, prompting Google to [explicity forbid this](https://developer.chrome.com/docs/webstore/program_policies/#permissions) in their Chrome Web Store policy. The unusual part here is how almost all of these capabilities are transferred to Amazon web properties.

## The unusual setup

When you start looking into how the extension uses its privileges, it’s hard to overlook the fact that it appears to be an empty shell. Yes, there is a fair amount of code. But all of it is just glue code. Neither the extension’s user interface nor any of its logic is to be found anywhere. What’s going on? It gets clearer if you inspect the extension’s background page in Developer Tools:

{{< img src="background_page.png" alt="Inspector showing 8 iframes in the background page with pages from amazon.com loaded" width="669" />}}

Yes, that’s eight remote frames loaded into the extension’s background page, all pointing to Amazon domains. And the ninth remote frame loads when you click the extension icon, it contains the user interface of the panel shown above. All these panels communicate with each other and the extension via Amazon’s internal UBP protocol, exchanging messages via [window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

How does the extension know what page to load in the frames and what these should be allowed to do? It doesn’t, this information is downloaded as [FeatureManifest.js](https://ubp-ubpextension-us-prod.s3-us-west-2.amazonaws.com/FeatureManifests/all/FeatureManifest.js) from an Amazon server. This file defines a number of “processes,” each with its list of provided and consumed APIs and events. And while the extension code makes sure that processes only access what they are allowed to access, this file on an Amazon web service sets the rules.

Here is what this file currently has to say about `AAWishlistProcess`, a particularly powerful process:

{{< highlight json >}}
"AAWishlistProcess" : {
  "manifestVersion" : "2015-03-26",
  "manifest" : {
    "name" : "AAWishlistProcess",
    "version" : {"major" : 1, "minor" : 1, "build" : 1, "revision" : 1},
    "enabled" : true,
    "processType" : "Remote",
    "configuration" : {
      "url" : "https://horizonte.browserapps.amazon.com/wishlist/aa-wishlist-process.html",
      "assetTag" : "window.eTag = \"e19e28ac-784e-4e22-8e2b-6d36a9d3aaf2\"; window.lastUpdated= \"2021-01-14T22:57:46.422Z\";"
    },
    "consumedAPIs" : {
      "Identity" : [ "getAllWeblabTreatments", "getCustomerPreferences" ],
      "Dossier" : [ "buildURLs" ],
      "Platform" : [
        "getPlatformInfo", "getUWLItem", "getActiveTabInfo", "createElement",
        "createSandbox", "createSandboxById", "createLocalSandbox", "modifySandbox",
        "showSandbox", "sendMessageToSandbox", "destroySandbox", "scrape",
        "listenerSpecificationScrape", "applyStyle", "resetStyle", "registerAction",
        "deregisterAction", "createContextMenuItem", "deleteAllContextMenuItems",
        "deleteContextMenuItemById", "getCookieInfo", "bulkGetCookieInfo",
        "getStorageValue", "putStorageValue", "deleteStorageValue", "publish"
      ],
      "Reporter" : [ "appendMetricData" ],
      "Storage" : [ "get", "put", "putIfAbsent", "delete" ]
    },
    "consumedEvents" : [
      "Tabs.PageTurn", "Tabs.onRemoved", "Sandbox.Message.UBPSandboxMessage",
      "Action.Message", "Platform.PlatformDataUpdate",
      "Contextmenu.ItemClicked.AAWishlistProcess", "Identity.CustomerPreferencesUpdate",
      "Gateway.AddToListClick"
    ],
    "providedAPIs" : {
    },
    "providedEvents" : [ "Wishlist.update", "Storage.onChange.*", "Storage.onChange.*.*", "Storage.onChange.*.*.*", "Storage.onChange.*.*.*.*", "Storage.onChange.*.*.*.*.*", "Storage.onDelete.*", "Storage.onDelete.*.*", "Storage.onDelete.*.*.*", "Storage.onDelete.*.*.*.*", "Storage.onDelete.*.*.*.*.*" ],
    "CTI" : {
      "Category" : "AmazonAssistant",
      "Type" : "Engagement",
      "Item" : "Wishlist"
    }
  }
},
{{< /highlight >}}

The interesting consumed APIs are the ones belonging to `Platform`: that “process” is provided by the extension. So the extension lets this website among other things request information on the active tab, create context menu items, retrieve cookies and access extension’s storage.

## Let’s try it out!

We don’t have to speculate, it’s easy to try things out that this website is allowed to do. For this, change to the Console tab in Developer Tools and make sure `aa-wishlist-process.html` is selected as context rather than `top`. Now enter the following command making sure incoming messages are logged:

{{< highlight js >}}
window.onmessage = event => console.log(JSON.stringify(event.data, undefined, 2));
{{< /highlight >}}

*Note*: For me, `console.log()` didn’t work inside a background page’s frame on Firefox, so I had to do this on Chrome.

Now let’s subscribe to the `Tabs.PageTurn` event:

{{< highlight js >}}
parent.postMessage({
  mType: 0,
  source: "AAWishlistProcess",
  payload: {
    msgId: "test",
    mType: "rpcSendAndReceive",
    payload: {
      header: {
        messageType: 2,
        name: "subscribe",
        namespace: "PlatformHub"
      },
      data: {
        args: {
          eventName: "Tabs.PageTurn"
        }
      }
    }
  }
}, "*");
{{< /highlight >}}

A message from `PlatformHub` comes in indicating that the call was successful (`"error": null`). Good, if we now open `https://example.com/` in a new tab… Three messages come in, first one indicating that the page is loading, second that its title is now known and finally the third one indicating that the page loaded:

{{< highlight json >}}
{
  "mType": 0,
  "source": "PlatformHub",
  "payload": {
    "msgId": "3eee7d9b-ee2b-4f1d-be92-693119b5654c",
    "mType": "rpcSend",
    "payload": {
      "header": {
        "messageType": 2,
        "name": "publish",
        "namespace": "PlatformHub",
        "sourceProcessName": "Platform",
        "extensionStage": "prod"
      },
      "data": {
        "args": {
          "eventName": "Tabs.PageTurn",
          "eventArgs": {
            "tabId": "31",
            "url": "http://example.com/",
            "status": "complete",
            "title": "Example Domain"
          }
        }
      }
    }
  }
}
{{< /highlight >}}

Yes, that’s essentially the [tabs.onUpdated extension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated) exposed to a web page. The `Tabs.onRemoved` event works similarly, that’s [tabs.onRemoved extension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onRemoved) exposed.

Now let’s try calling `Platform.getCookieInfo`:

{{< highlight js >}}
parent.postMessage({
  mType: 0,
  source: "AAWishlistProcess",
  payload: {
    msgId: "test",
    mType: "rpcSendAndReceive",
    payload: {
      header: {
        messageType: 1,
        name: "getCookieInfo",
        namespace: "Platform"
      },
      data: {
        args: {
          url: "https://www.google.com/",
          cookieName: "CONSENT"
        }
      }
    }
  }
}, "*");
{{< /highlight >}}

A response comes in:

{{< highlight json >}}
{
  "mType": 0,
  "source": "PlatformHub",
  "payload": {
    "msgId": "fefc2939-70c3-4138-8bb6-a6120b57e563",
    "mType": "rpcReply",
    "payload": {
      "cookieFound": true,
      "cookieInfo": {
        "name": "CONSENT",
        "domain": ".google.com",
        "value": "PENDING+376",
        "path": "/",
        "session": false,
        "expirationDate": 2145916800.121322
      }
    },
    "t": 1615035509370,
    "rMsgId": "test",
    "error": null
  }
}
{{< /highlight >}}

Yes, that’s the `CONSENT` cookie I have on `google.com`. So that’s pretty much [cookies.get() extension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/get) available to this page.

## Overview of functionality exposed to Amazon web services

Here are the `Platform` APIs that the extension allows Amazon web services to call:

| Call name | Purpose |
|:---------:|:-------:|
| getPlatformInfo<br>getFeatureList | Retrieves information about the extension and supported functionality |
| openNewTab | Opens a page in a new tab, not subject to the pop-up blocker |
| removeTab | Closes a given tab |
| getCookieInfo<br>bulkGetCookieInfo | Retrieves cookies for any website |
| createDesktopNotification | Displays a desktop notification |
| createContextMenuItem<br>deleteAllContextMenuItems<br>deleteContextMenuItemById | Manages extension’s context menu items |
| renderButtonText | Displays a “badge” on the extension’s icon (typically a number indicating unread messages) |
| getStorageValue<br>putStorageValue<br>deleteStorageValue<br>setPlatformCoreInfo<br>clearPlatformInfoCache<br>updatePlatformLocale<br>isTOUAccepted<br>acceptTermsOfUse<br>setSmileMode<br>setLocale<br>handleLegacyExternalMessage | Accesses extension storage/settings |
| getActiveTabInfo | Retrieves information about the current tab (tab ID, title, address) |
| createSandbox<br>createLocalSandbox<br>createSandboxById<br>modifySandbox<br>showSandbox<br>sendMessageToSandbox<br>instrumentSandbox<br>getSandboxAttribute<br>destroySandbox | Injects a frame (any address) into any tab and communicates with it |
| scrape<br>listenerSpecificationScrape<br>getPageReferrer<br>getPagePerformanceTimingData<br>getPageLocationData<br>getPageDimensionData<br>getUWLItem | Extracts data from any tab using various methods |
| registerAction<br>deregisterAction | Listens to an event on a particular element in any tab |
| applyStyle<br>resetStyle | Sets CSS styles on a particular element in any tab |
| instrumentWebpage | Queries information about the page in any tab, clicks elements, sends `input` and `keydown` events |
| createElement | Creates an element in any tab with given ID, class and styles |
| closePanel | Closes the extension’s drop-down panel |
| reloadExtension | Reloads the extension, installing any pending updates |

And here are the interesting events it provides:

| Event name | Purpose |
|:---------:|:-------:|
| Tabs.PageTurn | Triggered on tab changes, contains tab ID, address, loading status, title |
| Tabs.onRemoved | Triggered when a tab is closed, contains tab ID |
| WebRequest.onBeforeRequest<br>WebRequest.onBeforeSendHeaders<br>WebRequest.onCompleted | Correspond to [webRequest API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest) listeners (this functionality is currently inactive, the extension has no `webRequest` permission) |

Given [extension’s privileges](#the-extension-s-privileges), not much is missing here. The `management` permission is unused as I mentioned before, so listing installed extensions isn’t possible. Cookie access is read-only, setting cookies isn’t possible. And general webpage access appears to stop short of arbitrary code execution. But does it?

The `createSandbox` call can be used with any frame address, no checks performed. This means that a `javascript:` address is possible as well. So if we run the following code in the context of `aa-wishlist-process.html`:

{{< highlight js >}}
parent.postMessage({
  mType: 0,
  source: "AAWishlistProcess",
  payload: {
    msgId: "test",
    mType: "rpcSendAndReceive",
    payload: {
      header: {
        messageType: 1,
        name: "createSandbox",
        namespace: "Platform"
      },
      data: {
        args: {
          tabId: 31,
          sandboxSpecification: {
            proxy: "javascript:alert(document.domain)//",
            url: "test",
            sandboxCSSSpecification: "none"
          }
        }
      }
    }
  }
}, "*");
{{< /highlight >}}

Yes, a message pops up indicating that this successfully executed JavaScript code in the context of the `example.com` domain. So there is at least one way for Amazon services to do anything with the web pages you visit. This particular attack worked only on Chrome however, not on Firefox.

## Is there even another way?

As I already pointed out [in a previous article](/2020/10/28/what-would-you-risk-for-free-honey/#the-trouble-with-shopping-assistants), it’s hard to build a shopping assistant that wouldn’t receive all its configuration from some server. This makes shopping assistants generally a privacy hazard. So maybe this privacy and security disaster was unavoidable?

No, for most part this isn’t the case. Amazon’s remote “processes” aren’t some server-side magic. They are merely static JavaScript files running in a frame. Putting these JavaScript files into the extension would have been possible with almost no code changes. And it would open up considerable potential for code simplification and performance improvements if Amazon is interested.

This design was probably justified with “we need this to deploy changes faster.” But is it really necessary? The [FeatureManifest.js file](https://ubp-ubpextension-us-prod.s3-us-west-2.amazonaws.com/FeatureManifests/all/FeatureManifest.js) mentioned above happens to contain update times of the components. Out of nine components, five had their last update five or six months ago. One was updated two months ago, another a month ago. Only two were updated recently (four and twelve days ago).

It seems that these components are maintained by different teams who work on different release schedules. But even if Amazon cannot align the release schedules here, this doesn’t look like packaging all the code with the extension would result in unreasonably frequent releases.

## What’s the big deal?

Why does it make a difference where this code is located? It’s the same code doing the same things, whether it is immediately bundled with the extension or whether the extension merely downloads it from the web and gives it access to the necessary APIs, right?

Except: there is no way of knowing that it is always the same code. For example, there isn’t actually a single `FeatureManifest.js` file on the web but rather 15 of them, depending on your language. Similarly, there are 15 versions of the JavaScript files it references. Presumably, this is merely about adjusting download servers to the ones closer to you. The logic in all these files should be exactly identical. But I don’t have the resources to verify this, and maybe Amazon is extracting way more data for users in Brazil for example.

And this is merely what’s visible from the outside. What if some US government agency asks Amazon for the data of a particular user? Theoretically, Amazon can serve up a modified `FeatureManifest.js` file for that user only, one that gives them way more access. And this attack wouldn’t leave any traces whatsoever. No extension release where malicious code could theoretically be discovered. Nothing.

That’s the issue here: Amazon Assistant is an extension with very extensive privileges. How are these being used? If all logic were contained in the extension, we could analyze it. As things are right now however, all we can do is assuming that everybody gets the same logic. But that’s really at Amazon’s sole discretion.

{{< img src="settings.png" alt="Settings panel of Amazon Assistant stating: If you turn off a feature, Amazon Assistant will no longer collect related information." width="321" />}}

There is another aspect here. Even the regular functionality of Amazon Assistant is rather invasive, with the extension letting Amazon know of every website you visit as well as some of your search queries. In theory, the extension has settings to disable this functionality. In practice, it’s impossible to verify that the extension will always respect these settings.

## Is this allowed?

If we are talking about legal boundaries such as GDPR, Amazon provides a [privacy policy for Amazon Assistant](https://www.amazon.com/aa/privacy). I’m no expert, but my understanding is that this meets the legal requirements, as long as what Amazon does matches this policy. For the law, it doesn’t matter what Amazon *could* do.

That’s different for browser vendors however who have an interest in keeping their extensions platform secure. Things are most straightforward for Mozilla, their [add-on policies](https://extensionworkshop.com/documentation/publish/add-on-policies/#development-practices) state:

> Add-ons must be self-contained and not load remote code for execution

While, technically speaking, no remote code is being executed in extension context here, delegating all extension privileges to remote code makes no difference in practice. So Amazon Assistant clearly violates Mozilla’s policies, and we can expect Mozilla to enforce their policies here. With Honey, [another shopping assistant violating this rule](/2020/10/28/what-would-you-risk-for-free-honey/) the enforcement process is already in its fifth month, and the extension is still available on Mozilla Add-ons without any changes. Well, maybe at some point…

With Chrome Web Store things are rather fuzzy. The [recently added policy](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/#declare-any-remote-code) states:

> Your extension should avoid using remote code except where absolutely necessary. Extensions that use remote code will need extra scrutiny, resulting in longer review times. Extensions that call remote code and do not declare and justify it using the field shown above will be rejected.

This isn’t a real ban on remote code. Rather, remote code can be used where “absolutely necessary.” Extension authors then need to declare and justify remote code. So in case of Amazon Assistant there are two possibilities: either the developers declared this usage of remote code and Google accepted it. Or they didn’t declare it, and Google didn’t notice remote code being loaded here. There is no way for us to know which is true, and so no way of knowing whether Google’s policies are being violated. This in turn means that there is no policy violation to be reported, we can only hope for Google to detect a policy violation on their own, something that couldn’t really be relied upon in the past.

Opera again is very clear in their [Acceptance Criteria](https://dev.opera.com/extensions/acceptance-criteria/):

> No external JavaScript is allowed. All JavaScript code must be contained in the extension. External APIs are ok.

Arguably, what we have here is way more than “external APIs.” So Amazon Assistant violates Opera’s policies as well and we can expect enforcement action here.

Finally, there is Microsoft Edge. The only related statement I could find in [their policies](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/store-policies/developer-policies) reads:

> For example, your extension should not download a remote script and subsequently run that script in a manner that is not consistent with the described functionality.

What exactly is consistent with the described functionality? Is Amazon Assistant delegating its privileges to remote scripts consistent with its description? I have really no idea. Not that there is a working way of reporting policy violations to Microsoft, so this is largely a theoretical discussion.

## Conclusions

Amazon Assistant extension requests a wide range of privileges in your browser. This in itself is neither untypical nor unjustified (for most part). However, it then provides access to these privileges to several Amazon web services. In the worst case, this allows Amazon to get full information on the user’s browsing behavior, extract information about accounts they are logged into and even manipulate websites in an almost arbitrary way.

Amazon doesn’t appear to make use of these possibilities beyond what’s necessary for the extension functionality and covered by their privacy policy. With web content being dynamic, there is no way of ensuring this however. If Amazon is spying on a subgroup of their users (be it out of their accord or on behalf of some government agency), this attack would be almost impossible to detect.

That’s the reason why the rules for Mozilla Add-ons and Opera Add-ons websites explicitly prohibit such extension design. It’s possible that Chrome Web Store and Microsoft Store policies are violated as well here. We’ll have to see which browser vendors take action.
