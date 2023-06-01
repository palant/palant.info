---
categories:
- security
- privacy
- add-ons
- google
date: 2023-05-31T13:37:16+0200
description: 'So far I discovered 18 malicious extensions with 55 million users in
  total. Most popular ones are: Autoskip for Youtube, Crystal Ad block and Brisk VPN.
  They have been active for two years, undetected by Google.'
lastmod: '2023-06-01 13:04:00'
title: More malicious extensions in Chrome Web Store
---

Two weeks ago I wrote about the [PDF Toolbox extension containing obfuscated malicious code](/2023/05/16/malicious-code-in-pdf-toolbox-extension/). Despite reporting the issue to Google via two different channels, the extension remains online. It even gained a considerable number of users after I published my article.

A reader tipped me off however that the Zoom Plus extension also makes a request to serasearchtop[.]com. I checked it out and found two other versions of the same malicious code. And I found more extensions in Chrome Web Store which are using it.

So now we are at 18 malicious extensions with a combined user count of 55 million. The most popular of these extensions are Autoskip for Youtube, Crystal Ad block and Brisk VPN: nine, six and five million users respectively.

{{< toc >}}

## The extensions

So far I could identify the following 18 malicious extensions. All but two of them are listed as “Featured” in Chrome Web Store. User counts reflect the state for 2023-05-30.

| Name | Weekly active users | Extension ID|
|------|------------|-------------|
| Autoskip for Youtube | 9,008,298 | lgjdgmdbfhobkdbcjnpnlmhnplnidkkp |
| Crystal Ad block | 6,869,278 | lklmhefoneonjalpjcnhaidnodopinib |
| Brisk VPN | 5,595,420 | ciifcakemmcbbdpmljdohdmbodagmela |
| Clipboard Helper | 3,499,233 | meljmedplehjlnnaempfdoecookjenph |
| Maxi Refresher | 3,483,639 | lipmdblppejomolopniipdjlpfjcojob |
| Quick Translation | 2,797,773 | lmcboojgmmaafdmgacncdpjnpnnhpmei |
| Easyview Reader view | 2,786,137 | icnekagcncdgpdnpoecofjinkplbnocm |
| PDF toolbox | 2,782,790 | bahogceckgcanpcoabcdgmoidngedmfo |
| Zoom Plus | 2,370,645 | ajneghihjbebmnljfhlpdmjjpifeaokc |
| Base Image Downloader | 2,366,136 | nadenkhojomjfdcppbhhncbfakfjiabp |
| Clickish fun cursors | 2,353,436 | pbdpfhmbdldfoioggnphkiocpidecmbp |
| Maximum Color Changer for Youtube | 2,226,293 | kjeffohcijbnlkgoaibmdcfconakaajm |
| Readl Reader mode | 1,852,707 | dppnhoaonckcimpejpjodcdoenfjleme |
| Image download center | 1,493,741 | deebfeldnfhemlnidojiiidadkgnglpi |
| Font Customizer | 1,471,726 | gfbgiekofllpkpaoadjhbbfnljbcimoh |
| Easy Undo Closed Tabs | 1,460,691 | pbebadpeajadcmaoofljnnfgofehnpeo |
| OneCleaner | 1,457,548 | pinnfpbpjancnbidnnhpemakncopaega |
| Repeat button | 1,456,013 | iicpikopjmmincpjkckdngpkmlcchold |

Note that this list is unlikely to be complete. It’s based on a sample of roughly a thousand extensions that I have locally, not all the Chrome Web Store contents.

## The malicious code

There is a [detailed discussion of the malicious code](/2023/05/16/malicious-code-in-pdf-toolbox-extension/) in my previous article. I couldn’t find any other extension using the same code as PDF Toolbox, but the two variants I discovered now are very similar. There are minor differences:

* First variant masquerades as Mozilla’s WebExtension browser API Polyfill. The “config” download address is `https://serasearchtop.com/cfg/<Extension_ID>/polyfill.json`, and the mangled timestamp preventing downloads within the first 24 hours is `localStorage.polyfill`.
* The second variant masquerades as Day.js library. It downloads data from `https://serasearchtop.com/cfg/<Extension_ID>/locale.json` and stores the mangled timestamp in `localStorage.locale`.

Both variants keep the code of the original module, the malicious code has been added on top. The WebExtension Polyfill variant appears to be older: the extensions using it usually had their latest release end of 2021 or early in 2022. The extensions using the Day.js variant are newer, and the code has been obfuscated more thoroughly here.

The extension logic remains exactly the same however. Its purpose is making two very specific function calls, from the look of it: `chrome.tabs.onUpdated.addListener` and `chrome.tabs.executeScript`. So these extensions are meant to inject some arbitrary JavaScript code into every website you visit.

## What does it *actually* do?

As with PDF Toolbox, I cannot observe the malicious code in action. The configuration data produced by serasearchtop[.]com is always empty for me. Maybe it’s not currently active, maybe it only activates some time after installation, or maybe I have to be in a specific geographic region. Impossible to tell.

So I went checking out what other people say. Many reviews for these extensions appear to be fake. There are also just as many reviews complaining about functional issues: people notice that these extensions aren’t really being developed. Finally, a bunch of Brisk VPN reviews mention the extension being malicious, sadly without explaining how they noticed.

But I found my answer in the reviews for the Image Download Center extension:

{{< img src="reviews.png" width="852" alt="Review by Sastharam Ravendran in July 2021: SPAM. Please avoid. Few days after install, my search results in google were randomly being re-directed elsewhere. I was lost and clueless. I disabled all extensions and enabled them one by one to catch this culprit. Hate it when extension developers, use us as baits for such things. google should check and take action ! A reply by Mike Pemberton in January 2022: had the same happen to me with this extension from the Micrsoft edge store. Another reply by Ande Walsh in September 2021: This guy is right. This is a dirty extension that installs malware. AVOID." />}}

So it would seem that at least back in 2021 (yes, almost two years ago) the monetization approach of this extension was redirecting search pages. I’m pretty certain that these users reported the extension back then, yet here we still are. Yes, I’ve never heard about the “Report abuse” link in Chrome Web Store producing any result. Maybe it is a fake form only meant to increase customer satisfaction?

There is a similar two years old review on the OneCleaner extension:

{{< img src="reviews2.png" width="852" alt="Review by Vincent Descamps: Re-adding it to alert people: had to remove it, contains a malware redirecting to bing search engine when searching something on google using charmsearch.com bullcrap" />}}

Small correction: the website in question was actually called CharmSearching[.]com. If you search for it, you’ll find plenty discussions on how to remove malware from your computer. The domain is no longer active, but this likely merely means that they switched to a less known name. Like… well, maybe serasearchtop[.]com. No proof, but serasearchtop[.]com/search/?q=test redirects to Google.

Mind you: just because these extensions monetized by redirecting search pages two years ago, it doesn’t mean that they still limit themselves to it now. There are way more dangerous things one can do with the power to inject arbitrary JavaScript code into each and every website.