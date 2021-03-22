---
title: "Follow-up on Amazon Assistant’s data collection"
date: 2021-03-22T17:16:21+0100
description: "A closer look at Amazon Assistant’s TitanClient component, charged with data collection. Lots of data being collected here, on Google Search and various web shops."
categories:
- amazon
- privacy
---

In my [previous article on Amazon Assistant](/2021/03/08/how-amazon-assistant-lets-amazon-track-your-every-move-on-the-web/), one sentence caused considerable irritation:

> Mind you, I’m not saying that Amazon is currently doing any of this.

Yes, when I wrote that article I didn’t actually know how Amazon was using the power they’ve given themselves. The mere potential here, what they could do with a minimal and undetectable change on one of their servers, that was scary enough for me. I can see that other people might prefer something more tangible however.

So this article now analyzes what data Amazon actually collects. Not the kind of data that necessarily flows to Amazon servers to make the product work. No, we’ll look at a component dedicated exclusively to “analytics,” collecting data without providing any functionality to the user.

{{< img src="amazon_assistant.png" alt="Amazon Assistant log with a borg eye" width="600" >}}
<em>
  Image credits:
  <a href="https://www.amazon.com/" rel="nofollow">Amazon</a>,
  <a href="https://openclipart.org/detail/12544/game-baddie-borg" rel="nofollow">nicubunu</a>,
  <a href="https://pixabay.com/vectors/mask-drone-psychopath-terminator-153936/" rel="nofollow">OpenClipart</a>
</em>
{{< /img >}}

The logic explained here applies to Amazon Assistant browser extension for Mozilla Firefox, Google Chrome and Microsoft Edge. It is also used by Amazon Assistant for Android, to a slightly limited extent however: Amazon Assistant can only access information from the Google Chrome browser here, and it has less information available to it. Since this logic resides on an Amazon web server, I can only show what is happening for me right now. It could change any time in either direction, for all Amazon Assistant users or only a selected few.

{{< toc >}}

## Summary of the findings

The “TitanClient” process in Amazon Assistant is its data collection component. While it’s hard to determine which websites it is active on, it’s definitely active on Google search pages as well as shopping websites such as eBay, AliExpress, Zalando, Apple, Best Buy, Barnes & Noble. And not just the big US or international brands, German building supplies stores like Hornbach and Hagebau are on its list as well, just like the Italian book shop IBS. You can get a rough idea of Amazon’s interests [here](https://archive.is/PeT9f). While belonging to a different Amazon Assistant feature, this list appears to be a subset of all affected websites.

When active on a website, the TitanClient process transmits the following data for each page loaded:

* The page address (the path part is hashed but can usually be recovered)
* The referring page if any (again, the path part is hashed but can usually be recovered)
* Tab identifier, allowing to distinguish different tabs in your browsing session
* Time of the visit
* A token linked to user’s Amazon account, despite the [privacy policy](https://archive.is/7vKJw) claiming that no connection to your account is being established

In addition, the following data is dependent on website configuration. Any or all of these data pieces can be present:

* Page type
* Canonical address
* Product identifier
* Product title
* Product price
* Product availability
* Search query (this can be hashed, but usually isn’t)
* Number of the current search page
* Addresses of search results (sometimes hashed but can usually be recovered)
* Links to advertised products

This is sufficient to get a very thorough look at your browsing behavior on the targeted websites. In particular, Amazon knows what you search for, what articles you look at and how much competition wants to have for these.

## How do we know that TitanClient isn’t essential extension functionality?

As mentioned in the [previous article](/2021/03/08/how-amazon-assistant-lets-amazon-track-your-every-move-on-the-web/), Amazon Assistant loads eight remote “processes” and gives them considerable privileges. The code driving these processes is very complicated, and at that point I couldn’t quite tell what these are responsible for. So why am I now singling out the TitanClient process as the one responsible for analytics? Couldn’t it be implementing some required extension functionality?

The consumed APIs of the process as currently defined in [FeatureManifest.js file](https://archive.is/6Bzws) are a good hint:

{{< highlight json >}}
"consumedAPIs" : {
  "Platform" : [
    "getPageDimensionData", "getPageLocationData", "getPagePerformanceTimingData",
    "getPageReferrer", "scrape", "getPlatformInfo", "getStorageValue",
    "putStorageValue", "deleteStorageValue", "publish"
  ],
  "Reporter" : [ "appendMetricData" ],
  "Storage" : [ "get", "put", "delete" ],
  "Dossier" : [ "buildURLs" ],
  "Identity" : [
    "getCohortToken", "getPseudoIdToken", "getAllWeblabTreatments",
    "getRTBFStatus", "confirmRTBFExecution"
  ]
},
{{< /highlight >}}

If you ignore extension storage access and event publishing, it’s all data retrieval functionality such as the `scrape` function. There are other processes also using the `scrape` API, for example one named PComp. This one also needs various website manipulation functions such as `createSandbox` however: PComp is the component actually implementing functionality on third-party websites, so it needs to display overlays with Amazon suggestions there. TitanClient does not need that, it is limited to data extraction.

So while processes like PComp and AAWishlistProcess collect data as a side-effect of doing their job, with TitanClient it isn’t a side-effect but the only purpose. The data collected here shows what Amazon is really interested in. So let’s take a closer look at its inner workings.

## When is TitanClient enabled?

Luckily, Amazon made this job easier by providing an [unminified version of TitanClient code](https://web.archive.org/web/20210322152830/https://bit-titan-client-uk-prod.s3.amazonaws.com/e725859646e657e903aaa9c7b937ca8e/titan/prod/BITTitanClient.built.js). A comment in function `BITTitanProcess.prototype._handlePageTurnEvent` explains when a tab change notification (called “page turn” in Amazon Assistant) is ignored:

    /**
     * Ignore page turn event if any of the following conditions:
     * 1. Page state is not {@link PageState.Loading} or {@link PageState.Loaded} then
     * 2. Data collection is disabled i.e. All comparison toggles are turned off in AA
     *    settings.
     * 3. Location is not supported by titan client.
     */

The first one is obvious: TitanClient will wait for a page to be ready. For the second one we have to take a look at `TitanDataCollectionToggles.prototype.isTitanDataCollectionDisabled` function:

{{< highlight js >}}
return !(this._isPCompEnabled || this._isRSCompEnabled || this._isSCompEnabled);
{{< /highlight >}}

This refers to extension settings that can be found in the “Comparison Settings” section: “Product,” “Retail Searches” and “Search engines” respectively. If all of these are switched off, the data collection will be disabled. Is the data collection related to these settings in any way? No, these settings normally apply to the PComp process which is a completely separate component. The logic is rather: if Amazon Assistant is allowed to mess with third-party websites in *some* way, it will collect data there.

Finally, there is a third point: which locations are supported by TitanClient? When it starts up, it will make a request to `aascraperservice.prod.us-east-1.scraper.assistant.a2z.com`. The response contains a `spaceReferenceMap` value: an address pointing to `aa-scraper-supported-prod-us-east-1.s3.amazonaws.com`, some binary data. This binary data is a [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter), a data structure telling TitanService which websites it should be active on. Obfuscation bonus: it’s impossible to tell which websites this data structure contains, one can only try some guesses.

## The instructions for “supported” websites

What happens when you visit a “supported” website such as `www.google.com`? First, `aascraperservice.prod.us-east-1.scraper.assistant.a2z.com` will be contacted again for instructions:

    POST / HTTP/1.1
    Host: aascraperservice.prod.us-east-1.scraper.assistant.a2z.com
    Content-Type: application/json; charset=UTF-8
    Content-Length: 73

    {"originURL":"https://www.google.com:443","isolationZones":["ANALYTICS"]}

It’s exactly the same request that PComp process is sending, except that the latter sets `isolationZones` value to `"FEDERATION"`. The response contains lots of JSON data with scraping instructions. I’ll quote some interesting parts only, e.g. the instructions for extracting the search query:

{{< highlight json >}}
{
  "cleanUpRules": [],
  "constraint": [{
    "type": "None"
  }],
  "contentType": "SearchQuery",
  "expression": ".*[?#&]q=([^&]+).*\n$1",
  "expressionType": "UrlJsRegex",
  "isolationZones": ["ANALYTICS"],
  "scraperSource": "Alexa",
  "signature": "E8F21AE75595619F581DA3589B92CD2B"
}
{{< /highlight >}}

The extracted value will sometimes be passed through [MD5 hash function](https://en.wikipedia.org/wiki/MD5) before being sent. This isn’t a reason to relax however. While technically speaking a hash function cannot be reversed, some web services have huge databases of pre-calculated MD5 hashes, so MD5 hashes of typical search queries can all be found there. Even worse: an additional result with type `FreudSearchQuery` will be sent where the query is never hashed. A comment in the source code explains:

    // TODO: Temporary experiment to collect search query only blessed by Freud filter.

Any bets on how long this “temporary” experiment has been there? There are comments referring to the Freud filter dated 2019 in the codebase.

The following will extract links to search results:

{{< highlight json >}}
{
  "attributeSource": "href",
  "cleanUpRules": [],
  "constraint": [{
    "type": "None"
  }],
  "contentType": "SearchResult",
  "expression": "//div[@class='g' and (not(ancestor::div/@class = 'g kno-kp mnr-c g-blk') and not(ancestor::div/@class = 'dfiEbb'))] // div[@class='yuRUbf'] /a",
  "expressionType": "Xpath",
  "isolationZones": ["ANALYTICS"],
  "scraperSource": "Alexa",
  "signature": "88719EAF6FD7BE959B447CDF39BCCA5D"
}
{{< /highlight >}}

These will also sometimes be hashed using MD5. Again, in theory MD5 cannot be reversed. However, you can probably guess that Amazon wouldn’t collect useless data. So they certainly have a huge database with pre-calculated MD5 hashes of all the various links they are interested in, watching these pop up in your search results.

Another interesting instruction is extracting advertised products:

{{< highlight json >}}
{
  "attributeSource": "href",
  "cleanUpRules": [],
  "constraint": [{
    "type": "None"
  }],
  "contentType": "ProductLevelAdvertising",
  "expression": "#tvcap .commercial-unit ._PD div.pla-unit-title a",
  "expressionType": "Css",
  "isolationZones": ["ANALYTICS"],
  "scraperSource": "Alexa",
  "signature": "E796BF66B6D2BDC3B5F48429E065FE6F"
}
{{< /highlight >}}

No hashing here, this is sent as plain text.

## Data sent back

Once the data is extracted from a page, TitanClient generates an event and adds it to the queue. You likely won’t see it send out data immediately, the queue is flushed only every 15 minutes. When this happens, you will typically see three requests to `titan.service.amazonbrowserapp.com` with data like:

{{< highlight json >}}
{
  "clientToken": "gQGAA3ikWuk…",
  "isolationZoneId": "FARADAY",
  "clientContext": {
    "marketplace": "US",
    "region": "NA",
    "partnerTag": "amz-mkt-chr-us-20|1ba00-01000-org00-linux-other-nomod-de000-tclnt",
    "aaVersion": "10.2102.26.11554",
    "cohortToken": {
      "value": "30656463…"
    },
    "pseudoIdToken": {
      "value": "018003…"
    }
  },
  "events": [{
    "sequenceNumber": 43736904,
    "eventTime": 1616413248927,
    "eventType": "View",
    "location": "https://www.google.com:443/06a943c59f33a34bb5924aaf72cd2995",
    "content": [{
        "contentListenerId": "D61A4C…",
        "contentType": "SearchResult",
        "scraperSignature": "88719EAF6FD7BE959B447CDF39BCCA5D",
        "properties": {
            "searchResult": "[\"391ed66ea64ce5f38304130d483da00f\",…]"
        }
    }, {
        "contentListenerId": "D61A4C…",
        "contentType": "PageType",
        "scraperSignature": "E732516A4317117BCF139DE1D4A89E20",
        "properties": {
            "pageType": "Search"
        }
    }, {
        "contentListenerId": "D61A4C…",
        "contentType": "SearchQuery",
        "scraperSignature": "E8F21AE75595619F581DA3589B92CD2B",
        "properties": {
            "searchQuery": "098f6bcd4621d373cade4e832627b4f6",
            "isObfuscated": "true"
        }
    }, {
        "contentListenerId": "D61A4C…",
        "contentType": "FreudSearchQuery",
        "scraperSignature": "E8F21AE75595619F581DA3589B92CD2B",
        "properties": {
            "searchQuery": "test",
            "isObfuscated": "false"
        }
    }],
    "listenerId": "D61A4C…",
    "context": "59",
    "properties": {
        "referrer": "https://www.google.com:443/d41d8cd98f00b204e9800998ecf8427e"
    },
    "userTrustLevel": "Unknown",
    "customerProperties": {}
  }],
  "clientTimeStamp": 1616413302828,
  "oldClientTimeStamp": 1616413302887
}
{{< /highlight >}}

The three requests differ by `isolationZoneId`: the values are ANALYTICS, HERMES and FARADAY. Judging by the configuration, browser extensions always send data to all three, with different `clientToken` values. Amazon Assistant for Android however only messages ANALYTICS. Code comments give slight hints towards the difference between these zones, e.g. ANALYTICS:

    * {@link IsolationZoneId#ANALYTICS} is tied to a Titan Isolation Zone used
    * for association with business analytics data
    * Such data include off-Amazon prices, domains, search queries, etc.

HERMES is harder to understand:

    * {@link IsolationZoneId#HERMES} is tied to a Titan Isolation Zone used for
    * P&C purpose.

If anybody can guess what P&C means: let me know. Should it mean “Privacy & Compliance,” this seems to be the wrong way to approach it. As to FARADAY, the comment is self-referring here:

    * {@link IsolationZoneId#FARADAY} is tied to a Titan Isolation Zone used for
    * collect data for Titan Faraday integration.

An important note: FARADAY is the only zone where `pseudoIdToken` is sent along. This one is generated by the Identity service for the given Amazon account and session identifier. So here Amazon can easily say “Hello” to you personally.

The remaining tokens are fairly unspectacular. The `cohortToken` appears to be a user-independent value used for A/B testing. When decoded, it contains some UUIDs, cryptographic keys and encrypted data. `partnerTag` contains information about this specific Android Assistant build and the platform it is running on.

As to the actual event data, `location` has the path part of the address “obfuscated,” yet it’s easy to find out that `06a943c59f33a34bb5924aaf72cd2995` is the MD5 hash of the word `search`. So the location is actually `https://www.google.com:443/search`. At least query parameters and anchor are being stripped here. `referrer` is similarly “obfuscated”: `d41d8cd98f00b204e9800998ecf8427e` is the MD5 hash of an empty string. So I came here from `https://www.google.com:443/`. And `context` indicates that this is all about tab 59, allowing to distinguish actions performed in different tabs.

The values under `content` are results of scraping the page according to the rules mentioned above. `SearchResult` lists ten MD5 hashes representing the results of my search, and it is fairly easy to find out what they represent. For example, `391ed66ea64ce5f38304130d483da00f` is the MD5 hash of `https://www.test.de/`.

Page type has been recognized as `Search`, so there are two more results indicating my search query. Here, the “regular” `SearchQuery` result contains yet another MD5 hash: a quick search will quickly tell that `098f6bcd4621d373cade4e832627b4f6` means `test`. But in case anybody still has doubts, the “experimental” `FreudSearchQuery` result confirms that this is indeed what I searched for. Same query string as plain text here.

## Who is Freud?

You might have wondered why Amazon would invoke the name of Sigmund Freud. As it appears, Freud has the deciding power over which searches should be private and which can just be shared with Amazon without any obfuscation.

TitanClient will break up each search query into words, removing English stop words like “each” or “but.” The remaining words will be hashed individually using [SHA-256 hash](https://en.wikipedia.org/wiki/SHA-2) and the hashes sent to `aafreudservice.prod.us-east-1.freud.titan.assistant.a2z.com`. As with MD5, SHA-256 cannot technically be reversed but one can easily build a database of hashes for every English word. The Freud service uses this database to decide for each word whether it is “blessed” or not.

And if TitanClient receives Freud’s blessing for a particular search query, it considers it fine to be sent in plain text. And: no, Freud does not seem to object to sex of whatever kind. He appears to object to any word when used together with “test” however.

That might be the reason why Amazon doesn’t quite seem to trust Freud at this point. Most of the decisions are made by a simpler classifier which works like this:

    * We say page is blessed if
    * 1. At least one PLA is present in scrapped content. OR
    * 2. If amazon url is there in organic search results.

For reference: PLA means “Product-Level Advertising.” So if your Google search displays product ads or if there is a link to Amazon in the results, all moderately effective MD5-based obfuscation will be switched off. The search query, search results and everything else will be sent as plain text.

## What about the privacy policy?

The [privacy policy for Amazon Assistant](https://archive.is/7vKJw) currently says:

> **Information We Collect Automatically**. Amazon Assistant automatically collects information about websites you view where we may have relevant product or service recommendations when you are not interacting with Amazon Assistant. … You can also control collection of “Information We Collect Automatically” by disabling the Configure Comparison Settings.

This explains why TitanClient is only enabled on search sites and web shops, these are websites where Amazon Assistant might recommend something. It also explains why TitanClient is disabled if all features under “Comparison Settings” settings are disabled. It has been designed to fit in with this privacy policy without having to add anything too suspicious here. Albeit not quite:

> We do not connect this information to your Amazon account, except when you interact with Amazon Assistant

As we’ve seen above, this isn’t true for data going to the FARADAY isolation zone. The `pseudoIdToken` value sent here is definitely connected to the user’s Amazon account.

> For example, we collect and process the URL, page metadata, and limited page content of the website you are visiting to find a comparable Amazon product or service for you

This formulation carefully avoids mentioning search queries, even though it is vague enough that it doesn’t really exclude them either. And it seems to implicate that the purpose is only suggesting Amazon products, even though that’s clearly not the only purpose. As the previous sentence admits:

> This information is used to operate, provide, and improve … Amazon’s marketing, products, and services (including for *business analytics* and fraud detection).

I’m not a lawyer, so I cannot tell whether sending conflicting messages like that is legit. But Amazon clearly goes for “we use this for anything we like.” Now does the data at least stay within Amazon?

> Amazon shares this information with Amazon.com, Inc. and subsidiaries that Amazon.com, Inc. controls

This sounds like P&C above doesn’t mean “Peek & Cloppenburg,” since sharing data with this company (clearly not controlled by Amazon) would violate this privacy policy. Let’s hope that this is true and the data indeed stays within Amazon. It’s not like I have a way of verifying that.
