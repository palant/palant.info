---
categories:
- privacy
- keepa
- add-ons
date: 2021-08-02T14:46:39+0200
description: The Keepa browser extension collects detailed data about your Amazon
  visits despite claiming otherwise in the privacy policy. It will also actively use
  your bandwidth to scrape the Amazon website.
lastmod: '2025-08-23 00:45:07'
title: Data exfiltration in Keepa Price Tracker
---

As readers of this blog [might remember](/2020/10/28/what-would-you-risk-for-free-honey/), shopping assistants aren’t exactly known for their respect of your privacy. They will typically use their privileged access to your browser in order to extract data. For them, this ability is a competitive advantage. You pay for a free product with a privacy hazard.

Usually, the vendor will claim to anonymize all data, a claim that can rarely be verified. Even if the anonymization actually happens, it’s [really hard to do this right](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/). If anonymization can be reversed and the data falls into the wrong hands, this [can have severe consequences for a person’s life](https://www.washingtonpost.com/religion/2021/07/20/bishop-misconduct-resign-burrill/).

{{< img src="keepa.png" width="600" alt="Meat grinder with the Keepa logo on its side is working on the Amazon logo, producing lots of prices and stars" >}}
<em>
  Image credits:
  <a href="https://keepa.com/" rel="nofollow">Keepa</a>,
  <a href="https://openclipart.org/detail/29021/meat-mincing-machine" rel="nofollow">palomaironique</a>,
  <a href="https://de.wikipedia.org/wiki/Datei:Amazon_logo.svg" rel="nofollow">Nikon1803</a>
</em>
{{< /img >}}

Today we will take a closer look at a browser extension called “Keepa – Amazon Price Tracker” which is used by at least two million users across different browsers. The extension is being brought out by a German company and the privacy policy is refreshingly short and concise, suggesting that no unexpected data collection is going on. The reality however is: not only will this extension extract data from your Amazon sessions, it will even use your bandwidth to load various Amazon pages in the background.

{{< toc >}}

## The server communication

The Keepa extension keeps a persistent [WebSocket connection](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) open to its server `dyn.keepa.com`. The server parameters include your unique user identifier, stored both in the extension and as a cookie on keepa.com. As a result, this identifier will survive both clearing browse data and reinstalling the extension, you’d have to do both for it to be cleared. If you choose to register on keepa.com, this identifier will also be tied to your user name and email address.

Looking at the messages being exchanged, you’ll see that these are binary data. But they aren’t encrypted, it’s merely [deflate-compressed](https://en.wikipedia.org/wiki/Deflate) JSON-data.

{{< img src="websocket.png" width="748" alt="Developer tools showing binary messages being exchanged" />}}

You can see the original message contents by copying the message as a Base64 string, then running the following code in the context of the extension’s background page:

{{< highlight js >}}
pako.inflate(atob("eAGrViouSSwpLVayMjSw0FFQylOyMjesBQBQGwZU"), {to: "string"});
{{< /highlight >}}

This will display the initial message sent by the server:

{{< highlight json >}}
{
  "status": 108,
  "n": 71
}
{{< /highlight >}}

## What does Keepa learn about your browsing?

Whenever I open an Amazon product page, a message like the following is sent to the Keepa server:

{{< highlight json >}}
{
  "payload": [null],
  "scrapedData": {
    "tld": "de"
  },
  "ratings": [{
    "rating": "4,3",
    "ratingCount": "2.924",
    "asin": "B0719M4YZB"
  }],
  "key": "f1",
  "domainId": 3
}
{{< /highlight >}}

This tells the server that I am using Amazon Germany (the value 3 in `domainId` stands for `.de`, 1 would have been `.com`). It also indicates the product I viewed (`asin` field) and how it was rated by Amazon users. Depending on the product, additional data like the sales rank might be present here. Also, the page scraping rules are determined by the server and can change any time to collect more sensitive data.

A similar message is sent when an Amazon search is performed. The only difference here is that `ratings` array contains multiple entries, one for each article in your search results. While the search string itself isn’t being transmitted (not with the current scraping rules at least), from the search results it’s trivial to deduce what you searched for.

## Extension getting active on its own

That’s not the end of it however. The extension will also regularly receive instructions like the following from the server (shortened for clarity):

{{< highlight json >}}
{
  "key": "o1",
  "url": "https://www.amazon.de/gp/aod/ajax/ref=aod_page_2?asin=B074DDJFTH&…",
  "isAjax": true,
  "httpMethod": 0,
  "domainId": 3,
  "timeout": 8000,
  "scrapeFilters": [{
    "sellerName": {
      "name": "sellerName",
      "selector": "#aod-offer-soldBy div.a-col-right > a:first-child",
      "altSelector": "#aod-offer-soldBy .a-col-right span:first-child",
      "attribute": "text",
      "reGroup": 0,
      "multiple": false,
      "optional": true,
      "isListSelector": false,
      "parentList": "offers",
      "keepBR": false
    },
    "rating": {
      "name": "rating",
      "selector": "#aod-offer-seller-rating",
      "attribute": "text",
      "regExp": "(\\d{1,3})\\s?%",
      "reGroup": 1,
      "multiple": false,
      "optional": true,
      "isListSelector": false,
      "parentList": "offers",
      "keepBR": false
    },
    …
  }],
  "l": [{
    "path": ["chrome", "webRequest", "onBeforeSendHeaders", "addListener"],
    "index": 1,
    "a": {
      "urls": ["<all_urls>"],
      "types": ["main_frame", "sub_frame", "stylesheet", "script", …]
    },
    "b": ["requestHeaders", "blocking", "extraHeaders"]
  }, …, null],
  "block": "(https?:)?\\/\\/.*?(\\.gif|\\.jpg|\\.png|\\.woff2?|\\.css|adsystem\\.)\\??"
}
{{< /highlight >}}

The address `https://www.amazon.de/gp/aod/ajax/ref=aod_page_2?asin=B074DDJFTH` belongs to an air compressor, not a product I’ve ever looked at but one that Keepa is apparently interested in. The extension will now attempt to extract data from this page despite me not navigating to it. Because of `isAjax` flag being set here, this address is loaded via [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest), after which the response text is being put into a frame of extensions’s background page. If `isAjax` flag weren’t set, this page would be loaded directly into another frame.

The `scrapeFilters` key sets the rules to be used for analyzing the page. This will extract ratings, prices, availability and any other information via CSS selectors and regular expressions. Here Keepa is also interested in the seller’s name, elsewhere in the shipping information and security tokens. There is also functionality here to read out contents of the Amazon cart, I didn’t look too closely at that however.

The `l` key is also interesting. It tells the extension’s background page to call a particular method with the given parameters, here [chrome.webRequest.onBeforeSendHeaders.addListener](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders) method is being called. The `index` key determines which of the predefined listeners should be used. The purpose of the predefined listeners seems to be removing some security headers as well as making sure headers like `Cookie` are set correctly.

## The server’s effective privileges

Let’s take a closer look at the privileges granted to the Keepa server here, these aren’t entirely obvious. Loading pages in the background isn’t meant to happen within the user’s usual session, there is some special cookie handling meant to produce a separate session for scraping only. This doesn’t appear to always work reliably, and I am fairly certain that the server can make pages load in the usual Amazon session, rendering it capable of impersonating the user towards Amazon. As the server can also extract arbitrary data, it is for example entirely possible to add a shipping address to the user’s Amazon account and to place an order that will be shipped there.

The `l` key is also worth taking a second look. At first the impact here seems limited by the fact that the first parameter will always be a function, one out of a few possible functions. But the server could use that functionality to call `eval.call(function(){}, "alert(1)")` in the context of the extension’s background page and execute arbitrary JavaScript code. Luckily, this call doesn’t succeed thanks to the extension’s [default Content Security Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy#default_content_security_policy).

But there are more possible calls, and some of these succeed. For example, the server could tell the extension to call  `chrome.tabs.executeScript.call(function(){}, {code: "alert(1)"})`. This will execute arbitrary JavaScript code in the current tab if the extension has access to it (meaning any Amazon website). It would also be possible to specify a tab identifier in order to inject JavaScript into background tabs: `chrome.tabs.executeScript.call(function(){}, 12, {code: "alert(1)"})`. For this the server doesn’t need to know which tabs are open: tab identifiers are sequential, so it’s possible to find valid tab identifiers simply by trying out potential candidates.

## Privacy policy

Certainly, a browser extension collecting all this data will have a privacy policy to explain how this data is used? Here is the [privacy policy](https://keepa.com/privacypolicy.html) of the German-based Keepa GmbH in full:

> You can use all of our services without providing any personal information. However, if you do so we will not sell or trade your personal information under any circumstance. Setting up a tracking request on our site implies that you'd like us to contact you via the contact information you provided us. We will do our best to only do so if useful and necessary - we hate spam as much as you do. If you login/register using Social-Login or OpenID we will only save the username and/or email address of the provided data. Should you choose to subscribe to one of our fee-based subscriptions we will share your email and billing address with the chosen payment provider - solely for the purpose of payment related communication and authentication. You can delete all your information by deleting your account through the settings.

This doesn’t sound right. Despite being linked under “Privacy practices” in the Chrome Web Store, it appears to apply only to the Keepa website, not to any of the extension functionality. The [privacy policy](https://addons.mozilla.org/en-US/firefox/addon/keepa/privacy/) on the Mozilla Add-ons site is more specific despite also being remarkably short (formatting of the original preserved):

> **You can use this add-on without providing any personal information.** If you do opt to share contact information, we will only use it to provide you updates relevant to your tracking requests. Under no circumstances will your personal information be made available to a third party. This add-on does not collect any personal data beyond the contact information provided by you.
>
> Whenever you visit an Amazon product page the ASIN (Amazon Standard Identification Number) of that product is used to load its price history graph from Keepa.com. We do **not** log such requests.
>
> The extension creates required functional cookies containing a session and your settings on Keepa.com, which is required for session management (storing settings and accessing your Keepa.com account, if you create one). No other (tracking, advertising) cookies are created.

This refers to some pieces of the Keepa functionality but it once again completely omits the data collection outlined here. It’s reassuring to know that they don’t log product identifiers when showing product history, but they don’t need to if on another channel their extension sends far more detailed data to the server. This makes the first sentence, formatted as bold text, a clear lie. Unless of course you don’t consider the information collected here personal. I’m not a lawyer, maybe in the legal sense it isn’t.

I’m fairly certain however that this privacy policy doesn’t meet the legal requirements of the [GDPR](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation). To be compliant it would need to mention the data being collected, explain the legal grounds for doing so, how it is being used, how long it is being kept and who it is shared with.

That said, this isn’t the only regulation violated by Keepa. As a German company, they are obliged to publish a legal note (in German: Impressum) on their website so that visitors can immediately recognize the party responsible. Keepa hides both this information and the privacy policy in a submenu (one has to click “Information” first) under the misleading name “Disclaimer.” The legal requirements are for both pages to be reachable with one click, and the link title needs to be unambiguous.

## Conclusions

Keepa extension is equipped to collect any information about your Amazon visits. Currently it will collect information about the products you look at and the ones you search for, all that tied to a unique and persistent user identifier. Even without you choosing to register on the Keepa website, there is considerable potential for the collected data to be deanonymized.

Some sloppy programming had the (likely unintended) consequence of making the server even more powerful, essentially granting it full control over any Amazon page you visit. Luckily, the extension’s privileges don’t give it access to any websites beyond Amazon.

The company behind the extension fails to comply with its legal obligations. The privacy policy is misleading in claiming that no personal data is being collected. It fails to explain how the data is being used and who it is shared with. There are certainly companies interested in buying detailed online shopping profiles, and a usable privacy policy needs to at least exclude the possibility of the data being sold.