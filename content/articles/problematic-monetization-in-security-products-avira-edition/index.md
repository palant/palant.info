---
categories:
- avira
- security
- privacy
date: 2019-12-11 15:22:09
description: Avira extensions monetize themselves by offering shopping deals, implemented
  in an unusually risky way. Privacy questions aren't really resolved in the privacy
  policy.
image: avira_protection.png
lastmod: '2019-12-12 12:31:42'
title: Problematic monetization in security products, Avira edition
---

A while back we've seen how Avast [monetizes their users](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/). Today we have a much smaller fish to fry, largely because the Avira's extensions in question aren't installed by default and require explicit user action for the additional "protection." So these have far fewer users, currently 400 thousands on Firefox and slightly above a million on Chrome according to official add-on store numbers. It doesn't make their functionality any less problematic however.

That's especially the case for Avira Browser Safety extension that Avira offers for Firefox and Opera. While the [vendor's homepage](https://www.avira.com/en/avira-browser-safety) lists "Find the best deals on items you’re shopping for" as last feature in the list, the extension description in the add-on stores "forgets" to mention this monetization strategy. I'm not sure why the identical Chrome extension is called "Avira Safe Shopping" but at least here the users get some transparency.

{{< img src="avira_protection.png" alt="Avira user interface offering Browser Safety extension as protection feature" width="600" />}}

{{toc}}

## Summary of the findings

The Avira Browser Safety extension is identical to Avira Safe Shopping and monetizes by offering "best shopping deals" to the users. This functionality is underdocumented, particularly in Avira's privacy policy. It is also risky however, as Avira chose to implement it in such a way that it will execute JavaScript code from Avira's servers on arbitrary websites as well as in the context of the extension itself. In theory, this allows Avira or anybody with control of this particular server to target individual users, spy on them or mess with their browsing experience in almost arbitrary ways.

In addition to that, the security part of the extension is implemented in a suboptimal way and will upload the entire browsing history of the users to Avira's servers without even removing potentially sensitive data first. Again, Avira's privacy policy is severely lacking and won't make any clear statements as to what happens with this data.

## How does this monetization approach work?

You've probably seen some of the numerous websites offering you coupon codes for certain shops to help you get the best deal. Or maybe you've even used browser extensions doing the same. If you ever asked yourself what these are getting out of it: the shop owners are paying them for referring customers to the shop. So even if you already were at this shop and selected the product you wanted to buy, if you then wandered off to a coupon deal website and had it send you back to the shop -- the owner of the coupon deal website gets paid a certain percentage of your spending.

And that's the reason why users of Avira Browser Safety, having installed that browser extension for protection, will occasionally see a message displayed on top of a website. Whenever some user takes advantage of the offers, the shop owners pay Avira. Not directly of course but via their partner Ciuvo GmbH which appears to provide the technology behind this feature.

{{< img src="coupon_deal.png" alt="Avira Browser Safety promoting deals for a website" width="830" />}}

## Why is this feature problematic?

Monetizing a product in this way isn't unusual. Ciuvo has their own browser extension sharing some code with Avira's. And a bunch of other antivirus vendors also offer shopping extensions, without these being considered problematic as long as users install them by choice. However, Avira for some reason decided that they want full control over this feature without having to release a new extension version. So whenever the extension asks `https://offers.avira.com/aviraoffers/api/v2/offers` for a list of deals, the response contains a JavaScript URL among other things.

{{< img src="offers_script.png" alt="Script URL returned along with the offers" width="670" />}}

What does the extension do with this script? It runs it in the context of the extension where it can do anything that the extension can do (meaning: "Access your data for all websites"). Mind you, this functionality is specific to Avira, Ciuvo's own browser extension gets along without it just fine.

It's not just that. Before the extension requests offers, it analyzes the page. The rules for performing this analysis are also determined by the server when responding to `https://offers.avira.com/aviraoffers/api/v2/analyze` request. The response contains a list of "JS expressions" which is essentially that: JavaScript code to be run in the context of the page, again functionality missing from the Ciuvo extension.

{{< img src="analysis_script.png" alt="JavaScript code meant to perform page analysis" width="827" />}}

And how are the websites selected where these actions have to be performed? They are also determined by the Avira server of course, every now an then the extension will download a huge list from `https://offers.avira.com/aviraoffers/api/v2/whitelist`.

The end result is: Avira decides what websites this extension should mess with and it decides how the extension should mess with them. And while functionality in the released extension applies to all users, Avira (or anybody taking control of `offers.avira.com`) could target individual users to ship a malicious payload to them. In fact, they could even change the extension functionality completely, e.g. turning it into spyware or adware -- but only for users in Brazil, so that it doesn't get noticed. That's a whole lot of trust to ask for, and it makes Avira infrastructure a very valuable hacking target.

## Let's talk about privacy

Even if you ignore the fact that Avira can repurpose this extension at any time, there is the question of privacy. In the process of "page analysis" the extension collects and transmits considerable amounts of data. You can see the script guiding this data collection as `csl` in the image above. Typically, it will extract the description of the product you are looking at as well as pricing information. Is there maybe some price comparison service out there running on this data? However, it will also transmit your Google search query for example if the search produces shopping results. All that data is being accompanied by a random albeit persistent user identifier.

Having access to that much data, Avira will certainly have a well-written privacy policy? Actually, the first challenge is finding it: Avira Browser Safety listing on Mozilla Add-ons doesn't even link to the [privacy policy](https://www.avira.com/en/general-privacy). And while this privacy policy has individual sections for various products, Avira Browser Safety isn't listed. But the identical Avira Safe Shopping extension is listed, so we can check there:

> If you use Avira Safe Shopping, it is part of our contractual obligation to present you with suitable products from other providers or other providers' conditions for the same product. Data processing is done exclusively in accordance with the performance of the contract.

Does this mean that Avira doesn't store any of this data whatsoever? I'd certainly hope so, but I'm not sure that this is the meaning. Also, why send a user identifier along if you don't keep the data?

There is also the question about what data third parties receive here. For example, if you select a coupon on the website displayed above you first get sent to `https://offers.avira.com/aviraoffers/api/v2/tracker` (no, doesn't sound like Avira isn't keeping any data) which redirects you to `ciuvo.com` which redirects you to `savings.com` which (after setting lots of cookies) redirects you to `pjtra.com` which redirects you to `pepperjamnetwork.com` which (after also setting lots of cookies) finally sends you back to the shop. For other websites you will see other redirect chains involving other companies.

## And what about browsing history data?

There is also the actual security part of the extension, preventing you from visiting malicious websites. In order to decide which website is malicious it sends requests to `https://v2.auc.avira.com/api/query`. In the process it uploads your entire browsing history, along with any potentially sensitive URL parameters. While the `session` parameter seen here is temporary, a session is created by requesting `https://v2.auc.avira.com/api/auth` with a persistent user identifier, so in principle the entire browsing history for any user can be reconstructed on the server side.

{{< img src="query.png" alt="Browsing history being sent to Avira servers along with all parameters" width="734" />}}

There are two factors that distinguish this from the [Avast case](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/) and make this look like lack of concern rather than outright spying. First, there is no context information being collected here. And second, the server responses are cached to some degree, so visiting a website won't always result in a request to Avast servers.

Still, Avira would be well-advised to at least remove query and anchor parts from the addresses. Also, their privacy policy needs clear statements on how this data is processed and whether any of it is being retained.

## Conclusions

The excessive data collection, incomplete privacy policy, unexpected functionality and execution of remote code are all issues that violate Mozilla Add-ons policies. I notified Mozilla and I assume that they will ask Avira to fix these. Maybe the Firefox extension will even be renamed to match the one for Chrome?

**Update** (2019-12-12): As of now, Avira Browser Safety extension is no longer listed on Mozilla Add-ons. I did not receive any reply from Mozilla yet other than "we are looking into this."

I did not report any of this to Google, none of these issues have been considered a concern in the past. In particular, Google allows execution of remote code as long as there is no proof for it being used for malicious purposes. But I hope that Avira will improve their Chrome extension as well nevertheless.
