---
categories:
- add-ons
- security
- google
date: 2025-01-08T14:41:17+0100
description: There are hundreds of extensions in Chrome Web Store using bogus “translation”
  to mess up search results. Most extensions are produced by a few extensions clusters
  who are flooding Chrome Web Store with spam.
lastmod: '2025-01-09 05:31:36'
title: How extensions trick CWS search
---

A few months ago I searched for “Norton Password Manager” in Chrome Web Store and got lots of seemingly unrelated results. Not just that, the actual Norton Password Manager was listed last. These search results are still essentially the same today, only that Norton Password Manager moved to the top of the list:

{{< img src="search_results.png" width="503" alt="Screenshot of Chrome Web Store search results listing six extensions. While Norton Password Manager is at the top, the remaining search results like “Vytal - Spoof Timezone, Geolocation & Locale”, “Free VPN - 1VPN” or “Charm - Coupons, Promo Codes, & Discounts” appear completely unrelated. All extensions are marked as featured." />}}

I was stumped how Google managed to mess up search results so badly and even [posted the following on Mastodon](https://infosec.exchange/users/WPalant/statuses/113396203134184793):

> Interesting. When I search for “Norton Password Manager” on Chrome Web Store, it first lists five completely unrelated extensions, and only the last search result is the actual Norton Password Manager. Somebody told me that website is run by a company specializing in search, so this shouldn’t be due to incompetence, right? What is it then?

Somebody suggested that the extensions somehow managed to pay Google for this placement which seems… well, rather unlikely. For reasons, I came back to this a few weeks ago and decided to take a closer look at the extensions displayed there. These seemed shady, with at least three results being former open source extensions (as in: still claiming to be open source but the code repository linked didn’t contain the current state).

And then I somehow happened to see what it looks like when I change Chrome Web Store language:

{{< img src="search_results2.png" width="503" alt="Screenshot of Chrome Web Store search results listing the same six extensions. The change in language is visible because the “Featured” badge is now called something else. All extension descriptions are still English however, but they are different. 1VPN calls itself “Browsec vpn urban vpn touch tunnelbear vpn 1click vpn 1clickvpn - 1VPN” and Vytal calls itself “Vytal - Works With 1click VPN & Hotspot VPN”." />}}

Now I don’t claim to know Swahili but what happened here clearly wasn’t translating.

{{< toc >}}

## The trick

Google Chrome is currently available in 55 languages. Browser extensions can choose to support any subset of these languages, even though most of them support exactly one. Not only the extension’s user interface can be translated, its name and short description can be made available in multiple languages as well. Chrome Web Store considers such translations according to the user’s selected language. Chrome Web Store also has an extensive description field which isn’t contained within the extension but can be translated.

Apparently, some extension authors figured out that the Chrome Web Store search index is shared across all languages. If you wanted to show up in the search when people look for your competitors for example, you could add their names to your extension’s description – but that might come across as spammy. So what you do instead is sacrificing some of the “less popular” languages and stuff the descriptions there full of relevant keywords. And then your extension starts showing up for these keywords even when they are entered in the English version of the Chrome Web Store. After all, who cares about Swahili other than maybe five million native speakers?

I’ve been maintaining a [Github repository with Chrome extension manifests](https://github.com/palant/chrome-extension-manifests-dataset) for a while, uploading new snapshots every now and then. Unfortunately, it only contained English names and descriptions. So now I’ve added a directory with localized descriptions for each extension. With that data, most of the issues became immediately obvious – even if you don’t know Swahili.

{{< img src="json.png" width="638" alt="Screenshot of a JSON listing. The key name is sw indicating Swahili language. The corresponding description starts with “Charm is a lightweight, privacy friendly coupon finder.” Later on it contains a sequence of newlines, followed by a wall of text along the lines of: “GMass: Powerful mail merge for GMail Wikiwand - Wikipedia, and beyond Super dark mode Desktopify”" />}}

**Update** (2025-01-09): Apparently, Google has already been made aware of this issue [a year ago at the latest](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/JMtfgiagcgY/m/TNMERoXWAwAJ). Your guess is as good as mine as to why it hasn’t been addressed yet.

## Who is doing it?

Sifting through the suspicious descriptions and weeding out false positives brought up 920 extensions with bogus “translations” so far, and I definitely didn’t get all of them (see [the extension lists](#the-extensions-in-question)). But that doesn’t actually mean hundreds of extension developers. I’ve quickly noticed patterns, somebody applying roughly the same strategy to a large cluster of extensions. For example, European developers tended to “sacrifice” some Asian languages like Bengali whereas developers originating in Asia preferred European languages like Estonian. These strategies were distinctly different from each other and there wasn’t a whole lot of them, so there seems to be a relative low number of parties involved. Some I could even put a name on.

### Kodice LLC / Karbon Project LP / BroCode LTD

One such cluster of extensions [has been featured on this blog in 2023 already](/2023/06/08/another-cluster-of-potentially-malicious-chrome-extensions/). Back then I listed 108 of their extensions which was only a small sample of their operations. Out of that original sample, 96 extension remain active in Chrome Web Store. And out of these, 81 extensions are abusing translations to improve their ranking in the extension search. From the look of it, all their developers are speaking Russian now – I guess they are no longer hiring in Ukraine. I’ve expanded on the original list a bit, but attribution is unfortunately too time consuming here. So it’s likely way more than the 122 extensions I now list for this cluster.

Back in 2023 some of these extensions were confirmed to spy on users, commit affiliate fraud or inject ads into web pages. The others seemed benign which most likely meant that they were accumulating users and would turn malicious later. But please don’t mention Kodice LLC, Karbon Project LP, BroCode LTD in the context of malicious extensions and Chrome Web Store spam, they don’t like that. In fact, they sent a bogus DMCA takedown notice in an attempt to remove my article from the search engines, claiming that it violates the copyright of the …*checks notes*… Hacker News page discussing that very article. So please don’t say that Kodice LLC, Karbon Project LP, BroCode LTD are spamming Chrome Web Store with their extensions which would inevitably turn on their users – they are definitely the good guys … sorry, good bros I mean.

### PDF Toolbox cluster

Another extension cluster also [appeared on this blog before](/2023/05/31/more-malicious-extensions-in-chrome-web-store/). Back in 2023 an investigation that started with the PDF Toolbox extension brought up 34 malicious extensions. The extensions contained obfuscated code that was hijacking people’s searches and monetizing them by redirecting to Bing. Not that they were limited to it, they could potentially do way more damage.

*Note*: The PDF Toolbox extension is long gone from Chrome Web Store and unrelated to the extension with the same name available there now.

Google removed all the extensions I reported back then, but whoever is behind them kept busy of course. I found 107 extensions belonging to the same cluster, out of these 100 extensions are on my list due to abusing translations to improve their ranking. I didn’t have the time to do an in-depth analysis of these extensions, but at least one (not on the list) is again doing search hijacking and not even hiding it. The few others I briefly looked at didn’t have any obvious malicious functionality – yet.

Unfortunately, I haven’t come across many clues towards who is behind these extensions. There is a slight indication that these extensions might be related to the BroCode cluster, but that’s far from certain given the significant differences between the two. One thing is certain however: you shouldn’t believe their user numbers, these have clearly been inflated artificially.

### ZingFront Software / ZingDeck / BigMData

There is one more huge extensions cluster that I investigated in 2023. Back then I gave up without publishing my findings, in part due to Google’s apparent lack of interest in fighting spam in their add-on store. Lots of websites, lots of fake personas and supposed companies that don’t actually exist, occasionally even business addresses that don’t exist in the real world. There are names like LinkedRadar, FindNiche or SellerCenter, and they aren’t spamming only Chrome Web Store but also mobile app stores and search engines for example. This is clearly a big operation, but initially all I could really tell was that this was the work of people speaking Chinese. Was this a bunch of AI enthusiasts looking to make a quick buck and exchanging ideas?

In the hindsight it took me too long to realize that many of the websites run on ZingFront infrastructure and ZingFront employees are apparently involved. Then things started falling into place, with the clues being so obvious: I found BigMData International PTE. LTD. linked to some of the extensions, ZingDeck Intl LTD. responsible for some of the others. Both companies are located at the same address in Singapore and obviously related. And both appear to be subsidiaries of ZingFront Software, an AI startup in Beijing. ZingDeck claims to have 120 employees, which is quite sufficient to flood Chrome Web Store with hundreds of extensions. Being funded by Baidu Ventures certainly helps as well.

Altogether I could attribute 223 extensions on my list to this cluster. For this article I could not really inspect the functionality of these extensions, but it seems that they are being monetized by selling subscriptions to premium functionality. Same seems to be true for the numerous other offers pushed out by these companies.

I asked ZingFront Software for a comment but haven’t heard back from them so far.

### ExtensionsBox, Lazytech, Yue Apps, Chrome Extension Hub, Infwiz, NioMaker

The extension clusters ExtensionsBox, Lazytech, Yue Apps, Chrome Extension Hub, Infwiz and NioMaker produce very similar extensions and all seem to be run by Chinese-speaking developers. Some of those might actually be one cluster, or they might all be subdivisions of ZingDeck. Quite frankly, I didn’t want to waste even more time figuring out who is working together and who is competing, so I listed them all separately.

### Free Business Apps

This is a large cluster which I haven’t noticed before. It has hundreds of extensions connected to websites like Free Business Apps, PDFWork, DLLPlayer and many more. It contributed “merely” 55 extensions to my list however because the developers of these extensions generally prefer to avoid awkward situations due to mismatched translations. So instead they force the desired (English) keywords into all translations of the extension’s description. This approach is likely aiming for messing up general search engines and not merely Chrome Web Store search. As it is out of scope for this article, only the relatively rare exceptions made my list here.

It isn’t clear who is behind this cluster of extensions. On the one edge of this cluster I found the Ukraine-based Blife LLC, yet their official extensions aren’t linked to the cluster. I asked the company for comment and got a confirmation of what I’ve already suspected after looking at a bunch of court decisions: a previous developer and co-owner left the company, taking some of the assets with him. He now seems to be involved with at least some of the people running this cluster of extensions.

The other edge of the cluster doesn’t seem to be speaking Russian or Ukrainian however, there are instead weak indications that Farsi-speakers are involved. Here I found the Teheran-based Xino Digital, developing some extensions with weak connections to this cluster. While Xino Digital specializes in “Digital Marketing” and “SEO & Organic Traffic,” they seem to lack the resources for this kind of operation. I asked Xino Digital for a comment but haven’t heard back so far.

## The approaches

While all extensions listed use translations to mess with Chrome Web Store search, a number of different approaches can be distinguished. Most extensions combine a few of the approaches listed below. Some extension clusters use the same approaches consistently, others vary theirs. I’ve linked to the applying approaches from the extension list.

### 1. Different extension name

This approach is very popular, likely due to Chrome Web Store search weighting extension name more than its descriptions. So many extensions will use slight variations of their original name depending on the language. Some extensions even go as far as using completely different names, occasionally entirely unrelated to the extension’s purpose – all to show up prominently in searches.

### 2. Different short description

Similarly, some extensions contain different variants of their short description for various languages. The short description typically doesn’t change much and is only used to show up for a bunch of related search keywords. A few extensions replaced their short description for some languages with a list of keywords however.

### 3. Using competitors’ names

In some cases I noticed extensions using names of their competitors or other related products. Some would go as far as “rename” themselves into a competing product in some languages. In other cases this approach is made less obvious, e.g. when extension descriptions provide lists of “alternatives” or “compatible extensions.” I haven’t flagged this approach consistently, simply because I don’t always know who the competitors are.

### 4. Considerably more extensive extension description

Some extensions have a relatively short and concise English description, yet the “translation” into some other languages is a massive wall of text, often making little sense. Sometimes a translation is present, but it is “extended” with a lengthy English passage. In other scenarios only English text is present. This text only seems to exist to place a bunch of keywords.

Note that translation management in Chrome Web Store is quite messy, so multiple variants of the English translation aren’t necessarily a red flag – these might have simply been forgotten. Consequently, I tried to err in favor of extension authors when flagging this approach.

### 5. Keywords at the end of extension description

A very popular approach is taking a translation (or an untranslated English description), then adding a long list of keywords and keyphrases to the end of it in some languages. Often this block is visually separated by a bunch of empty lines, making sure people actually reading the description in this language aren’t too confused.

### 6. Keywords within the extension description

A more stealthy approach is hiding the keywords within the extension description. Some extensions will use slight variations of the same text, only differing in one or two keywords. Others use automated translations of their descriptions but place a bunch of (typically English) keywords in these translations. Occasionally there is a translation which is broken up by a long list of unrelated keywords.

### 7. Different extension description

In a few cases the extension description just looked like a completely unrelated text. Sometimes it seemed to be a copy of a description from a competing extension, other times it made no sense whatsoever.

## And what should Google do about it?

Looking at [Chrome Web Store policy on spam and abuse](https://developer.chrome.com/docs/webstore/program-policies/spam-and-abuse), the formulation is quite clear:

> Developers must not attempt to manipulate the placement of any extensions in the Chrome Web Store.

So Google can and should push back on this kind of manipulation. At the very least, Google might dislike the fact that there are currently at least eleven extensions named “Google Translate” – at least in some languages. In fact, per the same policy Google isn’t even supposed to tolerate spam in Chrome Web Store:

> We don't allow any developer, related developer accounts, or their affiliates to submit multiple extensions that provide duplicate experiences or functionality on the Chrome Web Store.

Unfortunately, Google hasn’t been very keen on enforcing this policy in the past.

There is also a possible technical solution here. By making Chrome Web Store search index per-language, Google could remove the incentives for this kind of manipulation. If search results for Bengali no longer show up in English-language searches, there is no point messing up the Bengali translation any more. Of course, searching across languages is a feature – yet this feature isn’t worth it if Google cannot contain the abuse by other means.

Quite frankly, I feel that Google should go beyond basic containment however. The BroCode and PDF Toolbox clusters are known to produce malicious extensions. These need to be monitored proactively, and the same kind of attention might be worth extending to the other extension clusters as well.

## The extensions in question

One thing up front: Chrome Web Store is messy. There are copycats, pretenders, scammers. So attribution isn’t always a straightforward affair, and there might occasionally be an extension attributed to one of the clusters which doesn’t belong there. It’s way more common that an extension isn’t sorted into its cluster however, simply because the evidence linking it to the cluster isn’t strong enough, and I only had limited time to investigate.

The user counts listed reflect the state on December 13, 2024.

### Kodice / Karbon Project / BroCode

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| What Font - find font & color | 125 | abefllafeffhoiadldggcalfgbofohfa | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Video downloader web | 1,000,000 | acmbnbijebmjfmihfinfipebhcmgbghi | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Picture in Picture - Floating player | 700,000 | adnielbhikcbmegcfampbclagcacboff | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Floating Video Player Sound Booster | 600,000 | aeilijiaejfdnbagnpannhdoaljpkbhe | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Sidebarr - ChatGPT, bookmarks, apps and more | 100,000 | afdfpkhbdpioonfeknablodaejkklbdn | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Adblock for Youtube™ - Auto Skip ad | 8,000 | anceggghekdpfkjihcojnlijcocgmaoo | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Cute Cursors - Custom Cursor for Chrome™ | 1,000,000 | anflghppebdhjipndogapfagemgnlblh | [4](#4-considerably-more-extensive-extension-description) |
| Adblock for Youtube - skip ads | 800,000 | annjejmdobkjaneeafkbpipgohafpcom | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Translator, Dictionary - Accurate Translate | 800,000 | bebmphofpgkhclocdbgomhnjcpelbenh | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Screen Capture, Screenshot, Annotations | 500,000 | bmkgbgkneealfabgnjfeljaiegpginpl | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Sweet VPN | 100,000 | bojaonpikbbgeijomodbogeiebkckkoi | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Sound Booster - Volume Control | 3,000,000 | ccjlpblmgkncnnimcmbanbnhbggdpkie | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Web Client for Instagram™ - Sidegram | 200,000 | cfegchignldpfnjpodhcklmgleaoanhi | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Paint Tool for Chrome | 200,000 | coabfkgengacobjpmdlmmihhhfnhbjdm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| History & Cache Cleaner - Smart Clean | 2,000 | dhaamkgjpilakclbgpabiacmndmhhnop | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Screenshot & Screen Video Record by Screeny | 2,000,000 | djekgpcemgcnfkjldcclcpcjhemofcib | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Video Downloader for U | 3,000,000 | dkbccihpiccbcheieabdbjikohfdfaje | [4](#4-considerably-more-extensive-extension-description) |
| Multi Chat - Messenger for WhatsApp | 2,000,000 | dllplfhjknghhdneiblmkolbjappecbe | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [7](#7-different-extension-description) |
| Night Shift Mode | 200,000 | dlpimjmonhbmamocpboifndnnakgknbf | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Music Downloader - VKsaver | 500,000 | dmbjkidogjmmlejdmnecpmfapdmidfjg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Daily Tab - New tab with ChatGPT | 1,000 | dnbcklfggddbmmnkobgedggnacjoagde | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Web Color Picker - online color grabber | 1,000,000 | dneifdhdmnmmlobjbimlkcnhkbidmlek | [1](#1-different-extension-name), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Paint - Drawings Easy | 300,000 | doiiaejbgndnnnomcdhefcbfnbbjfbib | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Block Site - Site Blocker & Focus Mode | 2,000,000 | dpfofggmkhdbfcciajfdphofclabnogo | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| 2048 Online Classic game | 200,000 | eabhkjojehdleajkbigffmpnaelncapp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Gmail Notifier - gmail notification tool | 100,000 | ealojglnbikknifbgleaceopepceakfn | [6](#6-keywords-within-the-extension-description) |
| Volume Recorder Online | 1,000,000 | ebdbcfomjliacpblnioignhfhjeajpch | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Volume Booster - Sound & Bass boost | 1,000,000 | ebpckmjdefimgaenaebngljijofojncm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Screenshot Tool - Screen Capture & Editor | 1,000,000 | edlifbnjlicfpckhgjhflgkeeibhhcii | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Tabrr Dashboard - New Tab with ChatGPT | 300,000 | ehmneimbopigfgchjglgngamiccjkijh | [6](#6-keywords-within-the-extension-description) |
| New Tab for Google Workspace™ | 200,000 | ehpgcagmhpndkmglombjndkdmggkgnge | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Equalizer - Bass Booster Master | 200,000 | ejigejogobkbkmkgjpfiodlmgibfaoek | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Paint | 300,000 | ejllkedmklophclpgonojjkaliafeilj | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| Online messengers in All-in-One chat | 200,000 | ekjogkoigkhbgdgpolejnjfmhdcgaoof | [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Ultimate Video Downloader | 700,000 | elpdbicokgbedckgblmbhoamophfbchi | [2](#2-different-short-description) |
| Translate for Chrome -Translator, Dictionary | 500,000 | elpmkbbdldhoiggkjfpgibmjioncklbn | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| Color Picker, Eyedropper - Geco colorpick | 2,000,000 | eokjikchkppnkdipbiggnmlkahcdkikp | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Dark Mode for Chrome | 1,000,000 | epbpdmalnhhoggbcckpffgacohbmpapb | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| VPN Ultimate - Best VPN by unblock | 400,000 | epeigjgefhajkiiallmfblgglmdbhfab | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Flash Player Enabler | 300,000 | eplfglplnlljjpeiccbgnijecmkeimed | [1](#1-different-extension-name), [2](#2-different-short-description) |
| ChitChat - Search with ChatGPT | 2,000,000 | fbbjijdngocdplimineplmdllhjkaece | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Simple Volume Booster | 1,000,000 | fbjhgeaafhlbjiejehpjdnghinlcceak | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Free VPN for Chrome - VPN Proxy 1click VPN | 8,000,000 | fcfhplploccackoneaefokcmbjfbkenj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| InSaverify - Web for Instagram™ | 800,000 | fobaamfiblkoobhjpiigemmdegbmpohd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| ChatGPT Assistant - GPT Search | 900,000 | gadbpecoinogdkljjbjffmiijpebooce | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Adblock all advertisement - No Ads extension | 700,000 | gbdjcgalliefpinpmggefbloehmmknca | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Web Sound Equalizer | 700,000 | gceehiicnbpehbbdaloolaanlnddailm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Screenshot Master: Full Page Capture | 700,000 | ggacghlcchiiejclfdajbpkbjfgjhfol | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Dark Theme - Dark mode for Chrome | 900,000 | gjjbmfigjpgnehjioicaalopaikcnheo | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Cute Tab - Custom Dashboard | 60,000 | gkdefhnhldnmfnajfkeldcaihahkhhnd | [1](#1-different-extension-name) |
| Quick Translate: Reading & writing translator | 100,000 | gpdfpljioapjogbnlpmganakfjcemifk | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| HD Video Downloader | 800,000 | hjlekdknhjogancdagnndeenmobeofgm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Web Translate - Online translator | 1,000,000 | hnfabcchmopgohnhkcojhocneefbnffg | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| QR Code Generator | 300,000 | hoeiookpkijlnjdafhaclpdbfflelmci | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| 2048 Game | 1,000,000 | iabflonngmpkalkpbjonemaamlgdghea | [4](#4-considerably-more-extensive-extension-description) |
| Translator | 100,000 | icchadngbpkcegnabnabhkjkfkfflmpj | [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Multilanguage Translator | 1,000,000 | ielooaepfhfcnmihgnabkldnpddnnldl | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| FocusGuard - Block Site & Focus Mode | 400,000 | ifdepgnnjpnbkcgempionjablajancjc | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [7](#7-different-extension-description) |
| Scrnli - Screen Recorder & Screen Capture App | 1,000,000 | ijejnggjjphlenbhmjhhgcdpehhacaal | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Web Paint Tool - draw online | 600,000 | iklgljbighkgbjoecoddejooldolenbj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Screen Recorder and Screenshot Tool | 1,000,000 | imopknpgdihifjkjpmjaagcagkefddnb | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Free VPN Chrome extension - Best VPN by uVPN | 1,000,000 | jaoafpkngncfpfggjefnekilbkcpjdgp | [1](#1-different-extension-name), [2](#2-different-short-description), [7](#7-different-extension-description) |
| Video Downloader Social | 1,000,000 | jbmbplbpgcpooepakloahbjjcpfoegji | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Color Picker Online -  Eyedropper Tool | 189 | jbnefeeccnjmnceegehljhjonmlbkaji | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Volume Booster, equalizer → Audio control | 1,000,000 | jchmabokofdoabocpiicjljelmackhho | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| PDF Viewer | 1,000,000 | jdlkkmamiaikhfampledjnhhkbeifokk | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Adblock Web - Adblocker for Chrome | 300,000 | jhkhlgaomejplkanglolfpcmfknnomle | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| Adblock Unlimited - Adblocker | 600,000 | jiaopkfkampgnnkckajcbdgannoipcne | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Hide YouTube distraction - shorts block | 1,000 | jipbilmidhcobblmekbceanghkdinccc | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| ChatGPT for Chrome - GPT Search | 700,000 | jlbpahgopcmomkgegpbmopfodolajhbl | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| Adblock for YouTube™ | 2,000,000 | jpefmbpcbebpjpmelobfakahfdcgcmkl | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| User Agent Switcher | 100,000 | kchfmpdcejfkipopnolndinkeoipnoia | [1](#1-different-extension-name) |
| Speed Test for Chrome - WiFi speedtest | 400,000 | khhnfdoljialnlomkdkphhdhngfppabl | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Video Downloader professional | 400,000 | knkpjhkhlfebmefnommmehegjgglnkdm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Quick Translate | 700,000 | kpcdbiholadphpbimkgckhggglklemib | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Tab Suspender | 100,000 | laameccjpleogmfhilmffpdbiibgbekf | [1](#1-different-extension-name) |
| Adblock for Youtube - ad blocker tool | 800,000 | lagdcjmbchphhndlbpfajelapcodekll | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| PDF Viewer - open in PDF Reader | 300,000 | ldaohgblglnkmddflcccnfakholmaacl | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Moment - #1 Personal Dashboard for Chrome | 200,000 | lgecddhfcfhlmllljooldkbbijdcnlpe | [1](#1-different-extension-name) |
| Screen Video Recorder & Screenshot | 400,000 | lhannfkhjdhmibllojbbdjdbpegidojj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Dark Theme - Dark Reader for Web | 1,000,000 | ljjmnbjaapnggdiibfleeiaookhcodnl | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Auto Refresh Page - reload page | 500,000 | lkhdihmnnmnmpibnadlgjfmalbaoenem | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Flash Player for Web | 800,000 | lkhhagecaghfakddbncibijbjmgfhfdm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| INSSAVE - App for Instagram | 100,000 | lknpbgnookklokdjomiildnlalffjmma | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Simple Translator, Dictionary, TTS | 1,000,000 | lojpdfjjionbhgplcangflkalmiadhfi | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Web paint tool - Drawww | 60,000 | mclgkicemmkpcooobfgcgocmcejnmgij | [6](#6-keywords-within-the-extension-description) |
| Adblock for Twitch | 200,000 | mdomkpjejpboocpojfikalapgholajdc | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Infinite Dashboard - New Tab like no other | 200,000 | meffljleomgifbbcffejnmhjagncfpbd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| ChatGPT Assistant for Chrome - SidebarGPT | 1,000,000 | mejjgaogggabifjfjdbnobinfibaamla | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Volume Max - Ultimate Sound Booster | 1,000,000 | mgbhdehiapbjamfgekfpebmhmnmcmemg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Good Video Downloader | 400,000 | mhpcabliilgadobjpkameggapnpeppdg | [4](#4-considerably-more-extensive-extension-description) |
| Video Downloader Unlimited | 1,000,000 | mkjjckchdfhjbpckippbnipkdnlidbeb | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| ChatGPT for Google: Search GPT | 500,000 | mlkjjjmhjijlmafgjlpkiobpdocdbncj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Translate - Translator, Dictionary, TTS | 1,000,000 | mnlohknjofogcljbcknkakphddjpijak | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Web Paint - Page Marker & Editor | 400,000 | mnopmeepcnldaopgndiielmfoblaennk | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Auto Refresh & Page Monitor | 1,000,000 | nagebjgefhenmjbjhjmdifchbnbmjgpa | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| VPN Surf - Fast VPN by unblock | 800,000 | nhnfcgpcbfclhfafjlooihdfghaeinfc | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| SearchGPT - ChatGPT for Chrome | 2,000,000 | ninecedhhpccjifamhafbdelibdjibgd | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Video Speed Controller for HTML videos | 400,000 | nkkhljadiejecbgelalchmjncoilpnlk | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Flash Player that Works! | 300,000 | nlfaobjnjbmbdnoeiijojjmeihbheegn | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Sound Booster - increase volume up | 1,000,000 | nmigaijibiabddkkmjhlehchpmgbokfj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Voice Reader: Read Aloud Text to Speech (TTS) | 500,000 | npdkkcjlmhcnnaoobfdjndibfkkhhdfn | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| uTab - Unlimited Custom Dashboard | 200,000 | npmjjkphdlmbeidbdbfefgedondknlaf | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Flash Player for Chrome | 600,000 | oakbcaafbicdddpdlhbchhpblmhefngh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Paint Tool by Painty | 400,000 | obdhcplpbliifflekgclobogbdliddjd | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Night Shift | 200,000 | ocginjipilabheemhfbedijlhajbcabh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Editor for Docs, Sheets & Slides | 200,000 | oepjogknopbbibcjcojmedaepolkghpb | [1](#1-different-extension-name), [2](#2-different-short-description), [6](#6-keywords-within-the-extension-description) |
| Accept all cookies | 300,000 | ofpnikijgfhlmmjlpkfaifhhdonchhoi | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| The Cleaner -  delete Cookies and Cache | 100,000 | ogfjgagnmkiigilnoiabkbbajinanlbn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Screenshot & Screen Recorder | 1,000,000 | okkffdhbfplmbjblhgapnchjinanmnij | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Cute ColorBook - Coloring Book Online | 9,000 | onhcjmpaffbelbeeaajhplmhfmablenk | [1](#1-different-extension-name) |
| What Font - font finder | 400,000 | opogloaldjiplhogobhmghlgnlciebin | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Translator - Select to Translate | 1,000,000 | pfoflbejajgbpkmllhogfpnekjiempip | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Custom Cursors for Chrome | 800,000 | phfkifnjcmdcmljnnablahicoabkokbg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Color Picker - Eyedropper Tool | 100,000 | phillbeieoddghchonmfebjhclflpoaj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Text mode for websites - ReadBee | 500,000 | phjbepamfhjgjdgmbhmfflhnlohldchb | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Dark Mode - Dark Reader for Сhrome | 8,000,000 | pjbgfifennfhnbkhoidkdchbflppjncb | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Sound Booster - Boost My Bass | 900,000 | plmlopfeeobajiecodiggabcihohcnge | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Sound Booster | 100,000 | pmilcmjbofinpnbnpanpdadijibcgifc | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Screen Capture - Screenshot Tool | 700,000 | pmnphobdokkajkpbkajlaiooipfcpgio | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| Floating Video with Playback Controls | 800,000 | pnanegnllonoiklmmlegcaajoicfifcm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Cleaner - history & cache clean | 100,000 | pooaemmkohlphkekccfajnbcokjlbehk | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |

### PDF Toolbox cluster

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| Stick Ninja Game | 3,000,000 | aamepfadihoeifgmkoipamkenlfpjgcm | [4](#4-considerably-more-extensive-extension-description) |
| Emoboard Emoji Keyboard | 3,000,000 | aapdabiebopmbpidefegdaefepkinidd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Flappy Bird Original | 4,000,000 | aejdicmbgglbjfepfbiofnmibcgkkjej | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Superb Copy | 4,000,000 | agdjnnfibbfdffpdljlilaldngfheapb | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Super Volume Booster | 1,000,000 | ahddimnokcichfhgpibgbgofheobffkb | [4](#4-considerably-more-extensive-extension-description) |
| Enlargify | 2,000,000 | aielbbnajdbopdbnecilekkchkgocifh | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| ImgGet | 3,000,000 | anblaegeegjbfiehjadgmonejlbcloob | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Blaze VPN for Chrome | 8,000,000 | anenfchlanlnhmjibebhkgbnelojooic | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Web Paint Smart | 1,000,000 | baaibngpibdagiocgahmnpkegfnldklp | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Click Color Picker | 4,000,000 | bfenhnialnnileognddgkbdgpknpfich | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Dino 3D | 3,000,000 | biggdlcjhcjibifefpchffmfpmclmfmk | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Soundup Sound Booster | 6,000,000 | bjpebnkmbcningccjakffilbmaojljlb | [1](#1-different-extension-name), [2](#2-different-short-description), [7](#7-different-extension-description) |
| Yshot | 3,000,000 | bkgepfjmcfhiikfmamakfhdhogohgpac | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [7](#7-different-extension-description) |
| VidRate | 4,000,000 | bmdjpblldhdnmknfkjkdibljeblmcfoi | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Ultra Volume Booster | 3,000,000 | bocmpjikpfmhfcjjpkhfdkclpfmceccg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Supreme Copy | 6,000,000 | cbfimnpbnbgjbpcnaablibnekhfghbac | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Lumina Night Mode | 400,000 | ccemhgcpobolddhpebenclgpohlkegdg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Amazing Screen Recorder | 6,000,000 | cdepgbjlkoocpnifahdfjdhlfiamnapm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| BPuzzle | 10,000 | cgjlgmcfhoicddhjikmjglhgibchboea | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Super Video Speed Controller | 6,000,000 | chnccghejnflbccphgkncbmllhfljdfa | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Lensify | 1,000,000 | ckdcieaenmejickienoanmjbhcfphmio | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| FontSpotter | 2,000,000 | cncllbaocdclnknlaciemnogblnljeej | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| ImageNest | 2,000,000 | dajkomgkhpnmdilokgoekdfnfknjgckh | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Swift Auto Refresh | 4,000,000 | dbplihfpjfngpdogehdcocadhockmamf | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| StopSurf | 2,000,000 | dcjbilopnjnajannajlojjcljaclgdpd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| PDF SmartBox | 10,000,000 | dgbbafiiohandadmjfcffjpnlmdlaalh | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Dungeon Dodge | 3,000,000 | dkdeafhmbobcccfnkofedleddfbinjgp | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Scope Master | 2,000,000 | dlbfbjkldnioadbilgbfilbhafplbnan | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| RazorWave | 3,000,000 | ecinoiamecfiknjeahgdknofjmpoemmi | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| TurboPlay | 4,000,000 | ehhbjkehfcjlehkfpffogeijpinlgjik | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Emoji keyboard live | 3,000,000 | elhapkijbdpkjpjbomipbfofipeofedj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Flashback Flash Player | 3,000,000 | emghchaodgedjemnkicegacekihblemd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| RampShield Adblock | 2,000,000 | engbpelfmhnfbmpobdooifgnfcmlfblf | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| BackNav | 2,000,000 | epalebfbjkaahdmoaifelbgfpideadle | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Spark blocker | 5,000,000 | gfplodojgophcijhbkcfmaiafklijpnf | [1](#1-different-extension-name), [2](#2-different-short-description), [7](#7-different-extension-description) |
| EmuFlash | 1,000,000 | ghomhhneebnpahhjegclgogmbmhaddpi | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Minesweeper Original | 4,000,000 | gjdmanggfaalgnpinolamlefhcjimmam | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| PixGrid Ruler | 1,000,000 | glkplndamjplebapgopdlbicglmfimic | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Flexi PDF Reader | 1,000,000 | gmpignfmmkcpnildloceikjmlnjdjgdg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Dino Rush | 2,000,000 | hbkkncjljigpfhghnjhjaaimceakjdoo | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Amazing color picker | 4,000,000 | hclbckmnpbnkcpemopdngipibdagmjei | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| ChatGPT Assistant Plus | 6,000,000 | hhclmnigoigikdgiflfihpkglefbaaoa | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Bspace | 3,000,000 | hhgokdlbkelmpeimeijobggjmipechcp | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Bomberman Classic Game | 4,000,000 | hlcfpgkgbdgjhnfdgaechkfiddkgnlkg | [4](#4-considerably-more-extensive-extension-description) |
| Inline Lingo | 4,000,000 | hmioicehiobjekahjabipaeidfdcnhii | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Superpowers for Chatgpt | 4,000,000 | ibeabbjcphoflmlccjgpebbamkbglpip | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Spark Auto Refresh | 4,000,000 | ifodiakohghkaegdhahdbcdfejcghlob | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Video Speed Pro | 6,000,000 | iinblfpbdoplpbdkepibimlgabgkaika | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Elysian EPUB Reader | 10,000 | ijlajdhnhokgdpdlbiomkekneoejnhad | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| Smart Color Picker | 1,000,000 | ilifjbbjhbgkhgabebllmlcldfdgopfl | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Ad Skip Master for Youtube | 6,000,000 | imlalpfjijneacdcjgjmphcpmlhkhkho | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [7](#7-different-extension-description) |
| Shopify spy scraper & parser | 300,000 | injdgfhiepghpnihhgmkejcjnoohaibm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Gloom Dark Mode | 4,000,000 | ioleaeachefbknoefhkbhijdhakaepcb | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| SnapTrans | 3,000,000 | jfcnoffhkhikehdbdioahmlhdnknikhl | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| DownloadAs PNG JPG | 2,000,000 | jjekghbhljeigipmihbdeeonafimpole | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Umbra Dark Mode | 3,000,000 | jjlelpahdhfgabeecnfppnmlllcmejkg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Power Tools for ChatGPT | 11,000,000 | jkfkhkobbahllilejfidknldjhgelcog | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Image Formatter | 7,000 | kapklhhpcnelfhlendhjfhddcddfabap | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Safum free VPN | 6,000,000 | kbdlpfmnciffgllhfijijnakeipkngbe | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| TabColor color picker | 500,000 | kcebljecdacbgcoiajdooincchocggha | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Tonalis Audio Recorder | 3,000,000 | kdchfpnbblcmofemnhnckhjfjndcibej | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| 2048 Classic Game | 6,000,000 | kgfeiebnfmmfpomhochmlfmdmjmfedfj | [4](#4-considerably-more-extensive-extension-description) |
| Pixdownify | 7,000 | kjeimdncknielhlilmlgbclmkbogfkpo | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [7](#7-different-extension-description) |
| Avatar Maker Studio | 3,000,000 | klfkmphcempkflbmmmdphcphpppjjoic | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| TypeScan What Font Finder | 2,000,000 | klopcieildbkpjfgfohccoknkbpchpcd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Rad Video Speed Controller | 1,000,000 | knekhgnpelgcdmojllcbkkfndcmnjfpp | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Sublime Copy | 2,000,000 | kngefefeojnjcfnaegliccjlnclnlgck | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| 2048 Game | 6,000,000 | kopgfdlilooenmccnkaiagfndkhhncdn | [4](#4-considerably-more-extensive-extension-description) |
| Easy PDF Viewer | 600,000 | kppkpfjckhillkjfhpekeoeobieedbpd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Fullshot | 900,000 | lcpbgpffiecejffeokiimlehgjobmlfa | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Page Auto Refresh | 8,000,000 | ldgjechphfcppimcgcjcblmnhkjniakn | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Viddex Video Downloader | 2,000,000 | ldmhnpbmplbafajaabcmkindgnclbaci | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Smart Audio Capture | 3,000,000 | lfohcapleakcfmajfdeomgobhecliepj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Readline | 3,000,000 | lgfibgggkoedaaihmmcifkmdfdjenlpp | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Amazing Auto Refresh | 6,000,000 | lgjmjfjpldlhbaeinfjbgokoakpjglbn | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Picture in Picture player | 5,000,000 | lppddlnjpnlpglochkpkepmgpcjalobc | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Readwell | 1,000,000 | mafdefkoclffkegnnepcmbcekepgmgoe | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Screenshot X | 1,000,000 | mfdjihclbpcjabciijmcmagmndpgdkbp | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| TubeBlock - Adblock for Youtube | 7,000,000 | mkdijghjjdkfpohnmmoicikpkjodcmio | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Shade Dark Mode | 16,000,000 | mkeimkkbcndbdlfkbfhhlfgkilcfniic | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| PDF Wizardry | 3,000,000 | moapkmgopcfpmljondihnidamjljhinm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| ShieldSpan Adblock | 2,000,000 | monfcompdlmiffoknmpniphegmegadoa | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Snap Color Picker | 6,000,000 | nbpljhppefmpifoffhhmllmacfdckokh | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Spelunky Classic | 3,000,000 | nggoojkpifcfgdkhfipiikldhdhljhng | [4](#4-considerably-more-extensive-extension-description) |
| Adkrig | 6,000,000 | ngpkfeladpdiabdhebjlgaccfonefmom | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Snap Screen Recorder | 4,000 | njmplmjcngplhnahhajkebmnaaogpobl | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| SharpGrip | 3,000,000 | nlpopfilalpnmgodjpobmoednbecjcnh | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Block Site Ex | 20,000 | nnkkgbabjapocnoedeaifoimlbejjckj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| PageTurn Book Reader | 1,000,000 | oapldohmfnnhaledannjhkbllejjaljj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| FocusShield | 4,000,000 | ohdkdaaigbjnbpdljjfkpjpdbnlcbcoj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Loudify Volume Booster | 7,000,000 | ohlijedbbfaeobchboobaffbmpjdiinh | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| ChatGPT Toolkit | 6,000,000 | okanoajihjohgmbifnkiebaobfkgenfa | [4](#4-considerably-more-extensive-extension-description) |
| Pac Man Tribute | 3,000,000 | okkijechcafgdmbacodaghgeanecimgd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Wordle Timeless | 3,000,000 | pccilkiggeianmelipmnakallflhakhh | [4](#4-considerably-more-extensive-extension-description) |
| Web Paint Online | 3,000,000 | pcgjkiiepdbfbhcddncidopmihdekemj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Live Screen Recorder | 4,000,000 | pcjdfmihalemjjomplpfbdnicngfnopn | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Screenshot Master | 6,000,000 | pdlmjggogjgoaifncfpkhldgfilgghgc | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Emojet - Emoji Keyboard | 4,000,000 | pgnibfiljggdcllbncbnnhhkajmfibgp | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Metric Spy | 2,000,000 | plifocdammkpinhfihphfbbnlggbcjpo | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Tetris Classic | 6,000,000 | pmlcjncilaaaemknfefmegedhcgelmee | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |

### ZingFront / ZingDeck / BigMData

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| Download Telegram - TG Video Photo Download | 1,000 | aaanclnbkhoomaefcdpcoeikacfilokk | [1](#1-different-extension-name) |
| Open AI ChatGPT for Email - GMPlus | 40,000 | abekedpmkgndeflcidpkkddapnjnocjp | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| AI Cover Letter Generator - Supawork AI | 2,000 | aceohhcgmceafglcfiobamlbeklffhna | [1](#1-different-extension-name), [2](#2-different-short-description) |
| AI Headshot Generator  - Supawork AI | 5,000 | acgbggfkaphffpbcljiibhfipmmpboep | [1](#1-different-extension-name), [6](#6-keywords-within-the-extension-description) |
| IG Follower Export Tool - IG Email Extractor | 10,000 | acibfjbekmadebcjeimaedenabojnnil | [1](#1-different-extension-name) |
| WA Sender - Bulk Message & WA Message & Bulk Sender Tool | 3,000 | aemhfpfbocllfcbpiofnmacfmjdmoecf | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Save Ins Comment - Export Ins Comments | 1,000 | afkkaodiebbdbneecpjnfhiinjegddco | [1](#1-different-extension-name) |
| Coursera Summary with ChatGPT and Take Notes | 3,000 | afmnhehfpjmkajjglfakmgmjcclhjane | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Extension Manager for Chrome™ | 966 | ahbicehkkbofghlofjinmiflogakiifo | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Email Finder & Email Hunter - GMPlus | 10,000 | aihgkhchhecmambgbonicffgneidgclh | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Sora Video To Video - Arting AI | 106 | aioieeioikmcgggaldfknjfoeihahfkb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| ChatGPT for 知乎 | 415 | ajnofpkfojgkfmcniokfhodfoedkameh | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Walmart Finder&ChatGPT Review Analysis | 457 | akgdobgbammbhgjkijpcjhgjaemghhin | [5](#5-keywords-at-the-end-of-extension-description) |
| WA Bulk Message Sender - Premium Sender | 1,000 | amokpeafejimkmcjjhbehganpgidcbif | [1](#1-different-extension-name) |
| One-Click Search Aliexpress Similar Products | 97 | aobhkgpkibbkonodnakimogghmiecend | [5](#5-keywords-at-the-end-of-extension-description) |
| Summary with Bing Chat for YouTube | 9,000 | aohgbidimgkcolmkopencknhbnchfnkm | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Rakuten Customer Service Helper | 42 | apfhjcjhmegloofljjlcloiolpfendka | [5](#5-keywords-at-the-end-of-extension-description) |
| ChatBot AI - ChatGPT & Claude & Bard & Bing | 883 | apknopgplijcepgmlncjhdcdjifhdmbo | [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| NoteGPT: YouTube Summary, Webpages & PDF Summary | 200,000 | baecjmoceaobpnffgnlkloccenkoibbb | [5](#5-keywords-at-the-end-of-extension-description) |
| Dimmy - Discord Chat Exporter | 252 | bbgnnieijkdeodgdkhnkildfjbnoedno | [1](#1-different-extension-name) |
| Gmail Notes - Add notes to email in Gmail | 1,000 | bbpgdlmdmlalbacneejkinpnpngnnghj | [5](#5-keywords-at-the-end-of-extension-description) |
| Sora Image To Video - Arting AI | 372 | bdhknkbhmjkkincjjmhibjeeljdmelje | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Tiktok Customer Service Helper | 66 | bdkogigofdpjbplcphfikldoejopkemf | [5](#5-keywords-at-the-end-of-extension-description) |
| TikClient - Web Client for TikTok™ | 10,000 | beopoaohjhehmihfkpgcdbnppdeaiflc | [1](#1-different-extension-name), [2](#2-different-short-description), [6](#6-keywords-within-the-extension-description) |
| One-Click Search Amazon Similar Products | 146 | bfeaokkleomnhnbhdhkieoebioepbkkb | [5](#5-keywords-at-the-end-of-extension-description) |
| Custom New Tab Page | 864 | bfhappcgfmpmlbmgbgmjjlihddgkeomd | [5](#5-keywords-at-the-end-of-extension-description) |
| Shopee Downloader - Download Videos & Images | 3,000 | bfmonflmfpmhpdinmanpaffcjgpiipom | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Product Photography - Ai Background Generator For Prouduct Photos | 46 | bgehgjenjneoghlokaelolibebejljlh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| TikGPT: Tiktok Listing Optimizer | 665 | bhbjjhpgpiljcinblahaeaijeofhknka | [5](#5-keywords-at-the-end-of-extension-description) |
| Find WhatsApp Link - Group Invite Link | 2,000 | biihmgacgicpcofihcijpffndeehmdga | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| VideoTG - Download & Save telegram Videos Fast & one time! | 4,000 | bjnaoodhkicimgdhnlfjfobfakcnhkje | [1](#1-different-extension-name) |
| Etsy™ AI Review Analysis & Download | 8,000 | bjoclknnffeefmonnodiakjbbdjdaigf | [5](#5-keywords-at-the-end-of-extension-description) |
| iGoo Helper - Security Privacy Unblock VPN | 20,000 | bkcbdcoknmfkccdhdendnbkjmhdmmnfc | [5](#5-keywords-at-the-end-of-extension-description) |
| TikTok Analytics & Sort Video by Engagement | 1,000 | bnjgeaohcnpcianfippccjdpiejgdfgj | [5](#5-keywords-at-the-end-of-extension-description) |
| Rakuten AI Listing editor | 68 | cachgfjiefofkmijjdcdnenjlljpiklj | [5](#5-keywords-at-the-end-of-extension-description) |
| Invite All Friends for Facebook™ in one click | 10,000 | cajeghdabniclkckmaiagnppocmcilcd | [5](#5-keywords-at-the-end-of-extension-description) |
| EbayGPT: ChatGPT Ebay listing optimization | 2,000 | cbmmciaanapafchagldbcoiegcajgepo | [5](#5-keywords-at-the-end-of-extension-description) |
| Comment Exporter | 10,000 | cckachhlpdnncmhlhaepfcmmhadmpbgp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitch Danmaku(NicoNico style) | 646 | cecgmkjinnohgnokkfmldmklhocndnia | [5](#5-keywords-at-the-end-of-extension-description) |
| Easy Exporter - Etsy order exporter | 2,000 | cgganjhojpaejcnglgnpganbafoloofa | [5](#5-keywords-at-the-end-of-extension-description) |
| Privacy Extension for WhatsApp Privacy | 100,000 | cgipcgghboamefelooajpiabilddemlh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Group Extractor for social media platform | 1,000 | chldekfeeeaolinlilgkeaebbcnkigeo | [6](#6-keywords-within-the-extension-description) |
| Sales Sort for eBay™ Advanced Search | 4,000 | cigjjnkjdjhhncooaedjbkiojgelfocc | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| Amazon Customer Service Helper | 70 | cmfafbmoadifedfpkmmgmngimbbgddlo | [5](#5-keywords-at-the-end-of-extension-description) |
| Currency Conversion Calculator | 2,000 | cmkmopgjpnjhmlgcpmagbcfkmakeihof | [5](#5-keywords-at-the-end-of-extension-description) |
| LinkedRadar-Headline Generator for  LinkedIn™ | 1,000 | cnhoekaognmidchcealfgjicikanodii | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| AllegroGPT:ChatGPT for Allegro Open AI Writer | 163 | coljimimahbepcbljijpimokkldfinho | [5](#5-keywords-at-the-end-of-extension-description) |
| ai voice cover | 518 | cpjhnkdcdpifokijolehlmomppnfflop | [1](#1-different-extension-name) |
| WA Contacts Extractor | 30,000 | dcidojkknfgophlmohhpdlmoiegfbkdd | [1](#1-different-extension-name) |
| Twitch chat overlay on fullscreen | 832 | dckidogeibljnigjfahibbdnagakkiol | [5](#5-keywords-at-the-end-of-extension-description) |
| Privacy Extension for WhatsApp Privacy | 660 | dcohaklbddmflhmcnccgcajgkfhchfja | [1](#1-different-extension-name) |
| LINE App Translator Bot - LINE Chat | 1,000 | dimpmploihiahcbbdoanlmihnmcfjbgf | [5](#5-keywords-at-the-end-of-extension-description) |
| Etsy Image Search | 1,000 | dkgoifbphbpimdbjhkbmbbhhfafjdilp | [5](#5-keywords-at-the-end-of-extension-description) |
| AliExpress & eBay - Best price | 575 | dkoidcgcbmejimkbmgjimpdgkgilnncj | [5](#5-keywords-at-the-end-of-extension-description) |
| AliGPT: Aliexpress Listing Optimize | 1,000 | dlbmngbbcpeofkcadbglihfdndjbefce | [5](#5-keywords-at-the-end-of-extension-description) |
| Best ASO Tools for Google Play Store | 10,000 | doffdbedgdhbmffejikhlojkopaleian | [5](#5-keywords-at-the-end-of-extension-description) |
| NoteGPT: AI Flashcard for Quizlet and Cram | 10,000 | eacfcoicoelokngmcgkkdakohpaklgmk | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| ChatSider AI Copilot : ChatGPT & Claude | 2,000 | ecnknpjoomhilbhjipoipllgdgaldhll | [6](#6-keywords-within-the-extension-description) |
| Mercadolivre Customer Service Helper with GPT | 19 | edhpagpcfhelpopmcdjeinmckcjnccfm | [5](#5-keywords-at-the-end-of-extension-description) |
| WA Contacts Extractor Free Extension | 30,000 | eelhmnjkbjmlcglpiaegojkoolckdgaj | [1](#1-different-extension-name), [6](#6-keywords-within-the-extension-description) |
| Unlimited Summary Generator for YouTube™ | 70,000 | eelolnalmpdjemddgmpnmobdhnglfpje | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| AdLibNote: Ad Library Downloader Facebook™ | 10,000 | efaadoiclcgkpnjfgbaiplhebcmbipnn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Ebay Kundendiensthelfer mit GPT | 123 | efknldogiepheifabdnikikchojdgjhb | [5](#5-keywords-at-the-end-of-extension-description) |
| Extension Manager | 8,000 | efolofldmcajcobffimbnokcnfcicooc | [5](#5-keywords-at-the-end-of-extension-description) |
| Send from Gmail - Share a Link Via Email | 5,000 | egefdkphhgpfilgcaejconjganlfehif | [1](#1-different-extension-name), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| Followers Exporter for Ins | 100,000 | ehbjlcniiagahknoclpikfjgnnggkoac | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Website Keyword Extractor & Planner Tool | 10,000 | eiddpicgliccgcgclfoddoiebfaippkj | [6](#6-keywords-within-the-extension-description) |
| AMZ Currency Converter —— Amazon TS | 457 | ekekfjikpoacmfjnnebfjjndfhlldegj | [1](#1-different-extension-name) |
| eCommerce Profit Calculator | 3,000 | elclhhlknlgnkbihjkneaolgapklcakh | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| ChatGPT for Google (No Ads) | 30,000 | elnanopkpogbhmgppdoapkjlfigecncf | [1](#1-different-extension-name), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| AI Resume Builder - Supawork AI | 9,000 | epljmdbeelhhkllonphikmilmofkfffb | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| aliexpress  image video download | 1,000 | epmknedkclajihckoaaoeimohljkjmip | [5](#5-keywords-at-the-end-of-extension-description) |
| InstaNote: Download and Save Video for IG | 10,000 | fbccnclbchlcnpdlhdjfhbhdehoaafeg | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Ebay Niche Finder&ChatGPT Review Analysis | 419 | fencfpodkdpafgfohkcnnjjepolndkoc | [5](#5-keywords-at-the-end-of-extension-description) |
| One-Click Search Etsy Similar Products | 83 | fffpcfejndndidjbakpmafngnmkphlai | [5](#5-keywords-at-the-end-of-extension-description) |
| WA Link Generator | 315 | fgmmhlgbkieebimhondmhbnihhaoccmj | [1](#1-different-extension-name) |
| AI Script Writer & Video to Text for TikTok | 9,000 | fhbibaofbmghcofnficlmfaoobacbnlm | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| WA Bulk Message Sender | 100,000 | fhkimgpddcmnleeaicdjggpedegolbkb | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Free VPN For Chrome - HavenSurf VPN | 3,000 | fnofnlokejkngcopdkaopafdbdcibmcm | [5](#5-keywords-at-the-end-of-extension-description) |
| McdGPT: Mercadolivre AI Listing edit | 340 | fpgcecmnofcebcocojgbnmlakeappphj | [5](#5-keywords-at-the-end-of-extension-description) |
| CRM Integration with LinkedIn for Salesforce | 411 | fpieanbcbflkkhljicblgbmndgblndgh | [5](#5-keywords-at-the-end-of-extension-description) |
| Online Photoshop - Photo Editor Tool | 577 | fplnkidbpmcpnaepdnjconfhkaehapji | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Telegram Private Video Downloader | 20,000 | gdfhmpjihkjpkcgfoclondnjlignnaap | [1](#1-different-extension-name), [2](#2-different-short-description) |
| AI Signature Generator - SignMaker | 74 | gdkcaphpnmahjnbbknailofhkdjgonjp | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Privacy Extension for WhatsApp Web | 2,000 | gedkjjhehhbgpngdjmjoklficpaojmof | [1](#1-different-extension-name) |
| One-Click Search Shein Similar Products | 232 | gfapgmkimcppbjmkkomcjnamlcnengnp | [5](#5-keywords-at-the-end-of-extension-description) |
| Summary with ChatGPT for Google and YouTube | 10,000 | gfecljmddkaiphnmhgaeekgkadnooafb | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| ESale - Etsy™ SEO tool for seller | 10,000 | ghnjojhkdncaipbfchceeefgkkdpaelk | [5](#5-keywords-at-the-end-of-extension-description) |
| Twitter Video Downloader | 10,000 | giallgikapfggjdeagapilcaiigofkoe | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Video Downloader and Summary for TikTok | 3,000 | gibojgncpopnmbjnfdgnfihhkpooodie | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Audio Recorder Online - Capture Screen Audio | 3,000 | gilmhnfniipoefkgfaoociaehdcmdcgk | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| WalmartGPT:ChatGPT for Walmart Open AI Writer | 682 | gjacllhmphdmlfomfihembbodmebibgh | [5](#5-keywords-at-the-end-of-extension-description) |
| ChatShopee - AI Customer Service Helper | 88 | glfonehedbdfimabajjneobedehbpkcf | [5](#5-keywords-at-the-end-of-extension-description) |
| Magic VPN - Best Free VPN for Chrome | 5,000 | glnhjppnpgfaapdemcpihhkobagpnfee | [5](#5-keywords-at-the-end-of-extension-description) |
| Translate and Speak Subtitles for YouTube | 40,000 | gmimaknkjommijabfploclcikgjacpdn | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| Messenger Notifier | 3,000 | gnanlfpgbbiojiiljkemdcampafecbmk | [5](#5-keywords-at-the-end-of-extension-description) |
| One-Click Search Walmart Similar Products | 103 | golgjgpiogjbjbaopjeijppihoacbloi | [5](#5-keywords-at-the-end-of-extension-description) |
| TikTok Hashtags Tool - Hashtags Analytics | 779 | haefbieiimgmamklihjpjhnhfbonfjgg | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Gmail Checker - Multi Account Gmail Notifier | 9,000 | hangbmidafgeohijjheoocjjpdbpaaeh | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Bulk Message Sender for wa | 281 | hcbplmjpaneiaicainjmanjhmdcfpeji | [2](#2-different-short-description) |
| APP For IG DM | 10,000 | hccnecipbimihniebnopnmigjanmnjgh | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Likes Exporter | 6,000 | hcdnbmbdfhhfjejboimdelpfjielfnde | [1](#1-different-extension-name), [2](#2-different-short-description) |
| ChatsNow: ChatGPT AI Sidebar ( GPT, Claude , Gemini) | 20,000 | hcmiiaachajoiijecmakkhlcpagafklj | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| iTextMaster - ChatPDF & PPT AI with ChatGPT | 6,000 | hdofgklnkhhehjblblcdfohmplcebaeg | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| Shopify™ Raise - Shopify™ store analysis tool | 10,000 | hdpfnbgfohonaplgnaahcefglgclmdpo | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| ShopeeGPT - Optimize Titles & Descriptions | 713 | hfgfkkkaldbekkkaonikedmeepafpoak | [5](#5-keywords-at-the-end-of-extension-description) |
| Telegram Desktop - Telegram Online Messenger | 4,000 | hifamcclbbjnekfmfgcalafnnlgcaolc | [5](#5-keywords-at-the-end-of-extension-description) |
| CommentGPT - Shopee review analysis assistant | 321 | hjajjdbieadchdmmifdjgedfhgdnonlh | [5](#5-keywords-at-the-end-of-extension-description) |
| Vimeo™ Downloader and chatGPT Video Summary | 40,000 | hobdeidpfblapjhejaaigpicnlijdopo | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| IG Comment Export Tool | 4,000 | hpfnaodfcakdfbnompnfglhjmkoinbfm | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| SEO Search Keyword Tool | 40,000 | hpmllfbpmmhjncbfofmkkgomjpfaocca | [5](#5-keywords-at-the-end-of-extension-description) |
| IG Video Downloader - SocialPlus | 5,000 | iaonookehgfokaglaodkeooddjeaodnc | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| AdLibNote: Video Downloader for Facebook™ | 10,000 | icphfngeemckldjnnoemfadfploieehk | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| IGExporter - IG Follower Export Tool | 2,000 | iffbofdalhbflagjclkhbkbknhiflcam | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Wasup Translator - Translate WhatsApp Messages | 328 | ifhamodfnpjalblgmnpdidnkjjnmkbla | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Free VPN For Chrome - HavenSurf VPN | 1,000 | ihikodioopffhlfhlcjafeleemecfmab | [5](#5-keywords-at-the-end-of-extension-description) |
| TelePlus - Multi-Accounts Sender | 8,000 | ihopneheidomphlibjllfheciogojmbk | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Keywords Explorer For Google Play Store (ASO) | 2,000 | ijegkehhlkpmicapdfdjahdmpklimdmp | [6](#6-keywords-within-the-extension-description) |
| Mass follow for Twitter | 1,000 | ijppobefgfjffcajmniofbnjkooeneog | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Etsy Customer Service Helper with ChatGPT | 506 | ikddakibljikfamafepngmlnhjilbcci | [5](#5-keywords-at-the-end-of-extension-description) |
| Telegram Group and Channel Search Tool | 7,000 | ilpgiemienkecbgdhdbgdjkafodgfojl | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description), [7](#7-different-extension-description) |
| NoteGPT: Udemy Summary with ChatGPT & Claude | 8,000 | indcipieilphhkjlepfgnldhjejiichk | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Volume booster - Volumax | 2,000 | ioklejjbhddpcdgmpcnnpaoopkcegopp | [6](#6-keywords-within-the-extension-description) |
| AmzGPT: Amazon listing edit | 4,000 | jijophmdjdapikfmbckmhhiheghkgoee | [5](#5-keywords-at-the-end-of-extension-description) |
| TTNote: Video Downloader and Saver | 30,000 | jilgamolkonoalagcpgjjijaclacillb | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| GS Helper For Google Search Google Scholar | 2,000 | jknbccibkbeiakegoengboimefmadcpn | [5](#5-keywords-at-the-end-of-extension-description) |
| WASender - WA Bulk Message Sender | 1,000 | jlhmomandpgagmphfnoglhikpedchjoa | [1](#1-different-extension-name) |
| ai celebrity voice clone | 572 | jlifdodinblfbkbfmjinkpjieglkgfko | [1](#1-different-extension-name) |
| WAPlus CRM - Best WhatsApp CRM with AI | 60,000 | jmjcgjmipjiklbnfbdclkdikplgajhgc | [1](#1-different-extension-name) |
| Save Webpage As PDF | 10,000 | jncaamlnmeladalnajhgbkedibfjlmde | [5](#5-keywords-at-the-end-of-extension-description) |
| Etsy™ Reviews Extractor | 1,000 | jobjhhfnfkdkmfcjnpdjmnmagepnbifi | [5](#5-keywords-at-the-end-of-extension-description) |
| AI Image Generator: Get AI Art with Any Input | 1,000 | jojlhafjflilmhpakmmnchhcbljgmllh | [5](#5-keywords-at-the-end-of-extension-description) |
| TG Sender - TG bulk message send and invite | 20,000 | kchbblidjcniipdkjlbjjakgdlbfnhgh | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| QR Code Generator | 25 | kdhpgmfhaakamldlajaigcnanajekhmp | [1](#1-different-extension-name) |
| Browser VPN - Free and unlimited VPN proxy | 7,000 | kdjilbflpbbilgehjjppohpfplnapkbp | [5](#5-keywords-at-the-end-of-extension-description) |
| Summary Duck Assistant | 1,000 | kdmiipofdmffkgfpkigioehfdehcienf | [1](#1-different-extension-name), [2](#2-different-short-description) |
| FindNiche - aliexpress™ dropshipping & analytics tool | 1,000 | kgggfelpkelliecmgdmfjgnlnhfnohpi | [2](#2-different-short-description), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| LinkedRadar - Email Finder for LinkedIn ™ | 50,000 | kgpckhbdfdhbkfkepcoebpabkmnbhoke | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| WA - Download Group Phone Numbers | 4,000 | khajmpchmhlhfcjdbkddimjbgbchbecl | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| WA Self Sender for WhatsApp Web(Easy Sender) | 10,000 | khfmfdepnleebhonomgihppncahojfig | [1](#1-different-extension-name) |
| GPT for Ecom: Product Listing optimizer | 20,000 | khjklhhhlnbeponjimmaoeefcpgbpgna | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| IG Follower Export Tool - IG Tools | 100,000 | kicgclkbiilobmccmmidfghnijgfamdb | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| WhatsApp Realtime Translate&Account Warm Up&Voice message Transcript | 1,000 | kifbmlmhcfecpiidfebchholjeokjdlm | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| WA Group Sender | 10,000 | kilbeicibedchlamahiimkjeilnkgmeo | [5](#5-keywords-at-the-end-of-extension-description) |
| FindNiche - Shopify™ store traffic analysis | 7,000 | kiniklbpicchjlhhagjhchoabjffogni | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description), [7](#7-different-extension-description) |
| Telegram Restricted Content Downloader | 7,000 | kinmpocfdjcofdjfnpiiiohfbabfhhdd | [1](#1-different-extension-name), [2](#2-different-short-description) |
| website broken link and 404 error checker | 10,000 | kkjfobdnekhdpmgomkpeibhlnmcjgian | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| TG Content Downloader - download telegram restricted files | 983 | kljkjamilbfohkmbacbdongkddmoliag | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Comment Assistant In LinkedIn™ | 978 | kmchjegahcidgahijkjoaheobkjjgkfj | [5](#5-keywords-at-the-end-of-extension-description) |
| Tab Manager - Smart Tab By NoteGPT AI | 7,000 | kmmcaankjjonnggaemhgkofiblbjaakf | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| WA Number Checker | 5,000 | knlfobadedihfdcamebpjmeocjjhchgm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Telegram downloader - TG Video Photo Download | 4,000 | kofmimpajnbhfbdlijgcjmlhhkmcallg | [1](#1-different-extension-name) |
| WA Group Link Finder | 2,000 | kpinkllalgahfocbjnplingmpnhhihhp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| One-Click Search Ozon Similar Products | 96 | laoofjicjkiphingbhcblaojdcibmibn | [5](#5-keywords-at-the-end-of-extension-description) |
| WADeck - WA AI ChatBot &WhatsApp Sender | 40,000 | lbjgmhifiabkcifnmbakaejdcbikhiaj | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| AliNiche Finder&ChatGPT Review Analysis | 484 | ldcmkjkhnmhoofhhfendhkfmckkcepnj | [5](#5-keywords-at-the-end-of-extension-description) |
| Fashion Model-AI Model Generator For Amazon | 1,000 | ldlimmbggiobfbblnjjpgdhnjdnlbpmo | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| WhatsApp Group Management Pro - Export, Broadcast & Monitor Suite | 20,000 | ldodkdnfdpchaipnoklfnfmbbkdoocej | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Photo download & Save image | 8,000 | leiiofmhppbjebdlnmbhnokpnmencemf | [5](#5-keywords-at-the-end-of-extension-description) |
| Aliexpress Customer Service Helper | 191 | lfacobmjpfgkicpkigjlgfjoopajphfc | [5](#5-keywords-at-the-end-of-extension-description) |
| Find WhatsApp Link - Group Invite Link | 10,000 | lfepbhhhpfohfckldbjoohmplpebdmnd | [5](#5-keywords-at-the-end-of-extension-description) |
| Yahoo - optimize listing & AI Writer | 69 | lgahpgiabdhiahneaooneicnhmafploc | [5](#5-keywords-at-the-end-of-extension-description) |
| Amazon Finder&ChatGPT Review Analysis | 821 | lgghbdmnfofefffidlignibjhnijabad | [5](#5-keywords-at-the-end-of-extension-description) |
| AI Resume Builder - LinkedRadar | 10,000 | lijdbieejfmoifapddolljfclangkeld | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| Article Summary with ChatGPT and Take Notes | 8,000 | llkgpihjneoghmffllamjfhabmmcddfh | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| AliNiche - AliExpress™ Product Research Tool | 30,000 | lmlkbclipoijbhjcmfppfgibpknbefck | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| ModelAgents - AI Fashion Models Generator | 5,000 | lmnagehbedfomnnkacohdhdcglefbajd | [5](#5-keywords-at-the-end-of-extension-description) |
| Gmail Address Check & Send Verify Tool | 2,000 | lmpigfliddkbbpdojfpbbnginolfgdoh | [5](#5-keywords-at-the-end-of-extension-description) |
| WA Number Checker - Check & Verify WA Number | 5,000 | lobgnfjoknmnlljiedjgfffpcbaliomk | [1](#1-different-extension-name) |
| Free AI Voice: Best Text to Speech Tool | 1,000 | lokmkeahilhnjbmgdhohjkofnoplpmmp | [5](#5-keywords-at-the-end-of-extension-description) |
| IG Email Extractor - Ins Followers Exporter | 3,000 | lpcfhggocdlchakbpodhamiohpgebpop | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| WA Bulk Sender | 5,000 | mbmlkjlaognpikjodedmallbdngnpbbn | [1](#1-different-extension-name) |
| YouTube Comment Summary with ChatGPT OpenAI | 3,000 | mcooieiakpekmoicpgfjheoijfggdhng | [5](#5-keywords-at-the-end-of-extension-description) |
| Ad Library - Ads Spy Tool For YouTube™ | 2,000 | mdbhllcalfkplbejlljailcmlghafjca | [5](#5-keywords-at-the-end-of-extension-description) |
| Schedule Email by Gmail | 862 | mdndafkgnjofegggbjhkccbipnebkmjc | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Feature Graphic Downloader for Play Store | 546 | meibcokbilaglcmbboefiocaiagghdki | [5](#5-keywords-at-the-end-of-extension-description) |
| One-Click Search eBay Similar Products | 75 | mjibhnpncmojamdnladbfpcafhobhegn | [5](#5-keywords-at-the-end-of-extension-description) |
| Twiclips - Twitch Clip Downloader | 8,000 | mjnnjgpeccmgcobgegepeljeedilebif | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Auto Connect for LinkedIn™ - LeadRadar | 1,000 | mliipdijmfmbnemagicfibpffnejhcki | [1](#1-different-extension-name) |
| Easy Web Data Scraper | 40,000 | mndkmbnkepbhdlkhlofdfcmgflbjggnl | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| wa privacy | 68 | nccgjmieghghlknedlgoeljlcacimpma | [1](#1-different-extension-name) |
| Ad Library - Ads Spy Tool For Pinterest™ | 2,000 | ndopljhdlodembijhnfkididjnahadoj | [5](#5-keywords-at-the-end-of-extension-description) |
| Universal Keyword Planner box | 5,000 | niaagjifaifoebkdkkndbhdoamicolmj | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| AdLibNote: Ad Library Downloader Facebook™ | 30,000 | niepmhdjjdggogblnljbdflekfohknmc | [1](#1-different-extension-name), [2](#2-different-short-description) |
| WA Group Sender & Group Link Scraper | 1,000 | nimhpogohihnabaooccdllippcaaloie | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Ad Library - Ads Spy Tool For Twitter™ | 1,000 | nkdenifdmkabiopfhaiacfpllagnnfaj | [5](#5-keywords-at-the-end-of-extension-description) |
| TikTok Video Tags Summary with ChatGPT | 860 | nmccmoeihdmphnejppahljhfdggediec | [5](#5-keywords-at-the-end-of-extension-description) |
| Image Zoom Tool | 5,000 | nmpjkfaecjdmlebpoaofafgibnihjhhf | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| ChatSider:Free ChatGPT Assistant(GPT4) | 1,000 | nnadblfkldnlfoojndefddknlhmibjme | [7](#7-different-extension-description) |
| Telegram Channels - TG Channel Link Search | 1,000 | nnbjdempfaipgaaipadfgfpnjnnflakl | [5](#5-keywords-at-the-end-of-extension-description) |
| H1B Sponsor Checker, Job Seek - LinkedRadar | 463 | noiaognlgocndhfhbeikkoaoaedhignb | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| WAContactSaver | 7,000 | nolibfldemoaiibepbhlcdhjkkgejdhl | [1](#1-different-extension-name) |
| vk video downloader - vkSaver | 10,000 | npabddfopfjjlhlimlaknekipghedpfk | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Multi Chat - All Chat In One For You - SocialPlus | 1,000 | oaknbnbgdgflakieopfmgegbpfliganc | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Twitch Channel Points Auto Claimer -Twiclips | 3,000 | ocoimkjodcjigpcgfbnddnhfafonmado | [5](#5-keywords-at-the-end-of-extension-description) |
| WalmartHunt-Walmart Dropshipping Tools | 4,000 | oeadfeokeafokjbffnibccbbgbjcdefe | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| TTAdNote: Download and Save Ad No Watermark | 8,000 | oedligoomoifncjcboehdicibddaimja | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Discordmate - Discord Chat Exporter | 20,000 | ofjlibelpafmdhigfgggickpejfomamk | [5](#5-keywords-at-the-end-of-extension-description) |
| Social Media Downloader - SocialPlus | 4,000 | ofnmkjeknmjdppkomohbapoldjmilbon | [1](#1-different-extension-name) |
| NoteGPT: ChatGPT Summary for Vimeo | 5,000 | oihfhipjjdpilmmejmbeoiggngmaaeko | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Aliexpress search by image | 5,000 | ojpnmbhiomnnofaeblkgfgednipoflhd | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Privacy Extension for WhatsApp Web | 4,000 | okglcjoemdnmmnodbllbcfaebeedddod | [1](#1-different-extension-name) |
| Denote: Save Ads TikTok & FB Ad Library | 40,000 | okieokifcnnigcgceookjighhplbhcip | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Allegro Customer Service Helper with Open AI | 13 | olfpfedccehidflokifnabppdkideeee | [5](#5-keywords-at-the-end-of-extension-description) |
| LinkedRadar - LinkedIn Auto Connect Tool | 198 | onjifbpemkphnaibpiibbdcginjaeokn | [1](#1-different-extension-name) |
| WAPI - Send personalized messages | 20,000 | onohcnjmnndegfjgbfdfaeooceefedji | [1](#1-different-extension-name) |
| Entrar for Gmail™ | 5,000 | oolgnmaocjjdlacpbbajnbooghihekpp | [5](#5-keywords-at-the-end-of-extension-description) |
| Group exporter 2 | 19 | opeikahlidceaoaghglikdpfdkmegklg | [1](#1-different-extension-name) |
| Keyword Finder-SEO keywords Tool | 5,000 | oppmgphiknonmjjoepbnafmbcdiamjdh | [5](#5-keywords-at-the-end-of-extension-description) |
| Search Engine Featuring ChatGPT - GPT Search | 775 | pbeiddaffccibkippoefblnmjfmmdmne | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Amazon Price History Tracker - AmzChart | 737 | pboiilknppcopllbjjcpdhadoacfeedk | [5](#5-keywords-at-the-end-of-extension-description) |
| Shopify Wise - Shopify analytics & Dropship tool | 762 | pckpnbdneenegpkodapaeifpgmneefjd | [5](#5-keywords-at-the-end-of-extension-description) |
| Vimeo™ Video Downloader Pro | 70,000 | penndbmahnpapepljikkjmakcobdahne | [5](#5-keywords-at-the-end-of-extension-description) |
| DealsUpp - Contact Saver for WA | 2,000 | pfomiledcpfnldnldlffdebbpjnhkbbl | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Profile Scraper - Leadboot | 2,000 | pgijefijihpjioibahpfadkabebenoel | [1](#1-different-extension-name) |
| -com Remove Background | 105 | pgomkcdpmifelmdhdgejgnjeehpkmdgl | [1](#1-different-extension-name) |
| EasyGood - Free Unlimited VPN Proxy | 1,000 | pgpcjennihmkbbpifnjkdpkagpaggfaa | [5](#5-keywords-at-the-end-of-extension-description) |
| FindNiche - AliExpress™ Data Exporter | 114 | pjjofiojigimijfomcffnpjlcceijohm | [5](#5-keywords-at-the-end-of-extension-description) |
| Share Preview Save to Social | 419 | pkbmlamidkenakbhhialhdmmkijkhdee | [1](#1-different-extension-name), [3](#3-using-competitors-names) |
| Voice Remaker - The Best AI Generator | 10,000 | pnlgifbohdiadfjllfmmjadcgofbnpoi | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Pincase-Pinterest Video & Image Downloader | 10,000 | poomkmbickjilkojghldlelgjmgaabic | [5](#5-keywords-at-the-end-of-extension-description) |
| Ad Library -  Ad Finder & Adspy Tool | 30,000 | ppbmlcfgohokdanfpeoanjcdclffjncg | [5](#5-keywords-at-the-end-of-extension-description) |
| YouTube Video Tags Summary with ChatGPT | 908 | ppfomhocaedogacikjldipgomjdjalol | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |

### ExtensionsBox

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| Amazon Reviews Extractor | 1,000 | aapmfnbcggnbcghjipmpcngmflbjjfnb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Target Images Downloader | 100 | adeimcdlolcpdkaapelfnacjjnclpgpb | [2](#2-different-short-description) |
| Airbnb Images Downloader | 433 | alaclngadohenllpjadnmpkplkpdlkni | [1](#1-different-extension-name), [2](#2-different-short-description) |
| eBay Reviews Extractor | 200 | amagdhmieghdldeiagobdhiebncjdjod | [2](#2-different-short-description) |
| Lazada Images Downloader | 363 | bcfjlfilhmdhoepgffdgdmeefkmifooo | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shopify2Woo - Shopify to WooCommerce | 543 | bfnieimjkglmfojnnlillkenhnehlfcj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Group Extractor | 3,000 | bggmbldgnfhohniedfopliimbiakhjhj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shein Reviews Extractor - Scrape Data to CSV | 388 | bgoemjkklalleicedfflkkmnnlcflnmd | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Airbnb Reviews Extractor | 86 | bklllkankabebbiipcfkcnmcegekeagj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| eBay Images Downloader | 863 | bkpjjpjajaogephjblhpjdmjmpihpepm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Indeed Scraper | 2,000 | bneijclffbjaigpohjfnfmjpnaadchdd | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shein to Shopify CSV Exportor | 130 | cacbnoblnhdipbdoimjhkjoonmgihkec | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Justdial Scraper | 1,000 | ccnfadfagdjnaehnpgceocdgajgieinn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| AI Review Summarizer - Get ChatGPT Review Analysis in One Click | 24 | cefjlfachafjglgeechpnnigkpcehbgf | [2](#2-different-short-description) |
| Booking Hotel Scraper | 123 | cgfklhalcnhpnkecicjabhmhlgekdfic | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Contact Extractor for wa | 2,000 | chhclfoeakpicniabophhhnnjfhahjki | [2](#2-different-short-description) |
| AI Reviews Summary for Google Maps | 17 | cmkkchmnekbopphncohohdaehlgpmegi | [2](#2-different-short-description) |
| AliExpress Images Downloader | 938 | cpdanjpcekhgkcijkifoiicadebljobn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shopy - Shopify Spy | 2,000 | dehlcjmoincicbhdnkbnmkeaiapljnld | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Profile Scraper for LinkedIn™ | 473 | dmonpchcmpmiehffgbkoimkmlfomgmbc | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Trustpilot Reviews Extractor | 481 | eikaihjegpcchpmnjaodjigdfjanoamn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Indeed Review Extractor | 17 | ejmkpbellnnjbkbagmgabogfnbkcbnkb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| AliExpress Reviews Extractor | 409 | elcljdecpbphfholhckkchdocegggbli | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Etsy Reviews Extractor | 306 | fbbobebaplnpchmkidpicipacnogcjpk | [2](#2-different-short-description) |
| Post Scraper | 34 | fcldaoddodeaompgigjhplaalfhgphfo | [2](#2-different-short-description) |
| Images Downloader for WM | 707 | fdakeeindhklmojjbfjhgmpodngnpcfk | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitch Chat Downloader | 132 | fkcglcjlhbfbechmbmcajldcfkcpklng | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Costco Images Downloader | 35 | fpicpahbllamfleebhiieejmagmpfepi | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Etsy Images Downloader | 1,000 | gbihcigegealfmeefgplcpejjdcpenbo | [2](#2-different-short-description) |
| Yelp Scraper | 347 | gbpkfnpijffepibabnledidempoaanff | [2](#2-different-short-description) |
| Lazada Reviews Extractor | 102 | gcfjmciddjfnjccpgijpmphhphlfbpgl | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shopee Reviews Extractor | 484 | gddchobpnbecooaebohmcamdfooapmfj | [2](#2-different-short-description) |
| Comments Exporter for Ins | 47 | gdhcgkncekkhebpefefeeahnojclbgeg | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Wayfair Images Downloader | 169 | ggcepafcjdcadpepeedmlhnokcejdlal | [2](#2-different-short-description) |
| Amazon Images Downloader | 1,000 | ggfhamjeclabnmkdooogdjibkiffdpec | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shein Images Downloader | 3,000 | ghnnkkhikjclkpldkbdopbpcocpchhoi | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Reviews Extractor for WM | 369 | gidbpinngggcpgnncphjnfjkneodombd | [2](#2-different-short-description) |
| Zillow Scraper - Agent & Property Export | 308 | gjhcnbnbclgoiggjlghgnnckfmbfnhbb | [2](#2-different-short-description) |
| G2 Reviews Extractor | 189 | hdnlkdbboofooabecgohocmglocfgflo | [1](#1-different-extension-name), [2](#2-different-short-description) |
| X Jobs Scraper | 35 | hillidkidahkkchnaiikkoafeaojkjip | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Booking Reviews Extractor | 201 | iakjgojjngekfcgbjjiikkhfcgnejjoa | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shein Scraper | 1,000 | ibbjcpcbjnjlpfjinbeeefbldldcinjg | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shopee Images Downloader | 966 | idnackiimdohbfkpcpoakocfkbenhpdf | [2](#2-different-short-description) |
| Yellow Pages Scraper | 2,000 | iijgmfjjmcifekbfiknmefbkgbolonac | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Booking Images Downloader | 27 | ilcbmjpkggalcdabgpjacepgmkpnnooh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Likes Exporter for Ins | 126 | jdfpnhobcnlokhaoihecmgmcnpjnhbmm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Job Scraper for LinkedIn™ | 1,000 | jhmlphenakpfjkieogpinommlgjdjnhb | [2](#2-different-short-description) |
| Wayfair Reviews Extractor | 186 | jjmejjopnabkbaojcijnfencoejjaikb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| XExporter - Export Twitter Followers | 908 | kfopfmdjhlpocbhhddjmhhboigepfpkg | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Costco Reviews Extractor | 31 | lbihigmoeinmajbmkbibikknphemncdl | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Pinterest Images Downloader - Pinterest Video Downloader | 2,000 | lephhdmcccfalhjdfpgilpekldmcahbb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shein to Woo CSV Exportor | 66 | lhjakenfnakjjfgfcoojdeblfmbpkocf | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Image & Video Downloader for Ins | 358 | ljgaknjbenmacaijcnampmhlealmbekk | [2](#2-different-short-description) |
| Comments Exporter | 307 | llcgplklkdgffjmhlidafnajbhbohgen | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Yelp Reviews Extractor | 59 | mnmjkjlaepijnbgapohecanhklhoojbh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| TKCommentExport - Export TikTok Comments | 1,000 | monfhkhegpjfhcmjaklhnckkhlalnoml | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Chats Backup for wa | 1,000 | najkpicijahenooojdcnfdfncbaidcei | [2](#2-different-short-description) |
| Slack™ Member Extractor | 497 | nbhjfblpkhiaiebipjcleioihpcclaea | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Glassdoor Scraper | 387 | ndnomcanokhgenflbdnkfjnhaioogmdk | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Maps Scraper & Leads Extractor | 646 | nhefjmaiappfgfcagoimkgmaanbimphd | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Followers Exporter for Thread | 174 | nhlcgpbandlddfdmabpjinolcgfbmkac | [2](#2-different-short-description) |
| Bulk Barcode Generator | 105 | odipjjckdnfbhnnkdacknhpojbabaocb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Followers Tracker for Ins | 7,000 | ohfgngkhbafacegaaphcinpgmnmjknff | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Airbnb Scraper | 124 | ohgfipogdmabijekgblippmcbfhncjgn | [2](#2-different-short-description) |
| TripAdvisor® Review Scraper | 1,000 | pkbfojcocjkdhlcicpanllbeokhajlme | [2](#2-different-short-description) |
| Bulk QR Code Generator | 154 | pnmchlmkjhphkjnbjehfgdagonbjpipg | [1](#1-different-extension-name), [2](#2-different-short-description) |

### Lazytech

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| Twitter Comment Export Tool | 1,000 | ajigebgoglcjjjkleiiomgbogggihibe | [1](#1-different-extension-name), [2](#2-different-short-description) |
| AliExpress Images Downloader | 1,000 | ajnfoalglmknolmaaipgelpbdpcopjci | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Slack Translator Pro | 475 | ajoplaibmnoheaigdnfbagfchnnjkicc | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Whatsapp Translator Pro | 2,000 | bnbighhfhbnkoinbakcadadhjhjhnogo | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Discord Translator Pro | 2,000 | bpgmpnpdklkcdgiemflkhfhbcibbimhh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Threads Followers Exporter | 447 | cackmcfbjdjnicnoifjcbpbidfnodfid | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Telegram™ Translator - Immersive Translation | 1,000 | cadnjdgggbmgmiokgmbngklhlldabhom | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitter Auto Unfollow Tool | 1,000 | cdejkfmlkpdipdjlookbmifhlihdefld | [1](#1-different-extension-name), [2](#2-different-short-description) |
| FB Group Export Tool | 1,000 | cfkelnkpomgldoeoadoghdjcejdknilb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Etsy Images Downloader | 367 | clcjlefnlochgjgmhkkmggojbcckloel | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Snapchat Translator Pro | 58 | degekmdjhceighgpmeociiolpbpdfmkk | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Skype Translator Pro | 30 | dheinobepcdickihlphioifoadnnlddn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| YouTube™ Comment Translator Pro | 2,000 | dkleeapinhlpifbijbppjcbgiolpagjd | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Followers Exporter | 2,000 | dncpodlbhbfeckciihiifmfpepleaked | [1](#1-different-extension-name) |
| Contact Saver for WhatsApp | 2,000 | dnoeodfoipnecbnnjhgoopnheicjlemm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| FB Messenger™ Translator - Immersive Translation | 1,000 | eeagfonlpjdegifbbipcnbhljledonnc | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitter AutoFollow Pro | 1,000 | elnglbaphfoebenjdbkalpgghijpnklp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Auto Liker | 1,000 | fajlpeonkickmgcbmpnmdofghngjphac | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Auto Unfollow | 1,000 | fcapaeipdkdbongbphfbccnegbcbilah | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Indeed Scraper | 44 | fedomnahgimendnjeifhhgehimjidnof | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Lazada Images Downloader | 1,000 | fgefgonmnflpghpipmaajgagfekcdljp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG HashTag Export Tool | 1,000 | gddkmjkdanijaiogljcfnhaolephjfcj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| FB Messenger Translator Pro | 1,000 | gfmklfdiaiefelfoklndfcchmdopjcke | [1](#1-different-extension-name), [2](#2-different-short-description) |
| TG Downloader - Photos, Videos, Audios | 1,000 | gihehopmfgnaknmbabddbkkebbaopeee | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Bumble Swipe Bot - Auto Filter & Swipe | 955 | gikinafmdccpecjbmnbjkeiadcabffpb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitter Followers Exporter | 1,000 | giplfbjnmilhalcaehoblaegpkgembpi | [1](#1-different-extension-name) |
| Twitch Translator Pro | 1,000 | gmaglilejboehglachimajmepgjckjng | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shein Images Downloader | 1,000 | hamgafmfcmaipelffjbdgikejedlnbmm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| eBay Images Downloader | 1,000 | hedppplfdackfbdjienfgbmecbnldijl | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGEmail - Instagram Email Scraper | 1,000 | hgonoojgigfaikonjkhchoklgjoiphio | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitter Follower Export Tool - Export Followers / Following | 1,000 | hncbinceehncflccpnanfdnbinhjlleh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGFollower - IG Follower Export Tool | 2,000 | iindafjcdjddenmiacdelomccfblfllm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| FB Comments Export Tool | 1,000 | inooeahlmjlhjdblojocgcoohmpjbhif | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Auto Follower - Auto Follow / Unfollow | 1,000 | ipmahbofhgomnebimjlocmemobaamnfp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Apollo Exporter | 867 | joainhjiflchdkpmfadbencgeedodiib | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Temu Images Downloader | 1,000 | jonloekipbhbjfcdpicecchjhhoidncn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| TikTok Follower Export Tool | 1,000 | kcoglbpmmjallcceanhiafgdlhofocml | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitter Comments Exporter | 1,000 | kdcgillnpmlfacikljeafiikgcpdjiha | [1](#1-different-extension-name) |
| IG Growth Pro - Auto Follow & Unfollow | 2,000 | kdibmenfbafnmjineglfmlbnmckhceej | [1](#1-different-extension-name) |
| Telegram Translator Pro | 1,000 | kkafjojibijigkcpgiidnphfnhdnopnf | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitter Auto Unfollow | 1,000 | lfofoljipingdgmjdmleonbnkecfbjli | [1](#1-different-extension-name) |
| Discord Chat Export Tool | 1,000 | lmoceiadfbnpofjbmgemloenlfkhhbhl | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Amazon Images Downloader | 1,000 | mjkalljfgchhnjekdgkennpimdobfjfa | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitter Auto Follower - Auto Follow / Unfollow | 1,000 | mmaekkgncaflnfaimjaefjohpgneagnh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitch™ Translator - Immersive Translation | 1,000 | ndjfdohpdlajffmmhdlifafoihibnokb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Discord™ Translator - Immersive Translation | 1,000 | nenhidhfpjbccpbikiceenfnchkhljmd | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Comment Export Tool | 1,000 | ngigmhodcdcjohafngokbkmleidkigfn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Comments Exporter | 1,000 | nogopabibhapbfcnlfeandndkalcjkik | [1](#1-different-extension-name) |
| Slack™ Translate | 253 | ogeieigjomecilgfebkdbgdckfpbjfah | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGEmail - Email Extractor and Scraper for Ins | 1,000 | ohhcmiegflabbcfihgjkkndpgijmpghk | [1](#1-different-extension-name) |
| IG Auto Like Tool | 1,000 | ohocmgfknbibgiiijhokjifkhpgpahbb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG HashTags Exporter | 1,000 | pgbenbeencahnighlkhingagogpjjdbh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Whatsapp™ Translator - Immersive Translation | 1,000 | phafeggjhdhfcmlanhmgbmcbgocapnik | [1](#1-different-extension-name), [2](#2-different-short-description) |
| TikTok Comment Export Tool | 1,000 | pjjldehmkcnmmkldjielbonlnmbkomlm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Unfollow Pro | 1,000 | pmlkkhcpimkhgalapkfpiknklhalkoeo | [1](#1-different-extension-name) |
| Tinder Swipe Bot - Auto Filter & Swipe | 644 | poocdjijjpnkcmhjecpeicdhljbmgddc | [1](#1-different-extension-name), [2](#2-different-short-description) |

### Yue Apps

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| Etsy Images Downloader | 115 | aakfimfbjikfkfeokmamllkomlejnpdi | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Export Twitter Follower | 1,000 | amflfbkcoeanhfcdcbebeimpjnoebakn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Export TikTok Followers | 378 | bdhcflkeglekljebdpanedpgeojpfefj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Auto Follow | 19 | cpfdfhmnheohcfiddlpjgjjdhgmnnali | [1](#1-different-extension-name) |
| Twitter Unfollower | 536 | eilkgadngbcjchnpmndgafhaihmohfho | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Twitter Auto Follow-Unfollow | 447 | fmkhphcddlhkmggaldkibecjmgpkbpdl | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shein Scraper | 26 | gpbhomcniappgbcehfedaliofagbfado | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Auto Like | 1,000 | hmgfjlghckknhafggpnnniffdiggdmpd | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Follower Export Tool | 3,000 | iacchdhbljnmihoeeelcgljnajfafpkh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Auto Follow | 928 | icjfkeibgfjfkdfjjgafpkpfplpnbidc | [2](#2-different-short-description) |
| Contacts Exporter for WhatsApp | 28 | ifhjahdgkdcpeofnamflcpdkadijbifl | [1](#1-different-extension-name) |
| IG Auto Follow | 5,000 | iiaohnpoogjkomcdkhdfljgpglejpaad | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shein Images Downloader | 1,000 | lphjpapkpnhhffgobpekcmeanpompeka | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IG Auto Unfollow | 77 | mpmpkpbmimeinhimdkbcecbbmgcacndp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| TwExport - Export Tweets From Any Account | 972 | nahaggbplpekgcbbnemjlpnnmpmhnfkh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Export Group Members for Facebook | 40 | oakdlcfhapgllacidemajdmmdcjfbiig | [2](#2-different-short-description) |
| Unfollowers Pro | 3,000 | onkeebndjchpacfplcfojadeedlfdime | [1](#1-different-extension-name), [2](#2-different-short-description), [7](#7-different-extension-description) |
| Export Tweet From Any Account | 167 | opbkmlokpjccgjmffhpndbjahhkbnhon | [1](#1-different-extension-name) |

### Chrome Extension Hub

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| TG Sender - telegram messages bulk sender | 462 | baghjmiifdlhbnfiddfkoomfkhmiamle | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGEmail - Email Extractor and Scraper | 1,000 | cnjelbflcpdehnljcmgolcbccfhgffbn | [1](#1-different-extension-name) |
| Ins Comment Bot - instagram automated comment bot | 22 | dlfigaihoneadjnenjkikkfehnpgbepo | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGFollow - Follower Export Tool | 546 | efjeeadgcomeboceoedbfnnojodaonhj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGCommentsExport - Export Comment for IG | 39 | fahielldgamgakbecenbenagcekhccoj | [1](#1-different-extension-name) |
| Unsubscriby for Youtube | 42 | gcmfheliiklfcjlbnmeahfhmcbjglncl | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Airbnb Scraper | 32 | ioblhofpjfjbfffbibgkjiccljoplikf | [1](#1-different-extension-name), [2](#2-different-short-description) |
| TG Downloader - Telegram Video Download | 2,000 | kockkcmeepajnplekamhbkgjomppgdhp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGPost - Export Instagram photos and videos | 70 | mdhgjlmpioeeainbfmodgcaajgchapnm | [1](#1-different-extension-name), [2](#2-different-short-description) |

### Infwiz

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| WAAutoReply - Web Automatic Reply Assistant | 47 | bilbhjhphaepddlmheloebigdkafebmg | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Reaction Exporter - Extract Like, Love, etc. | 168 | cddgoecgoedcodpohjphbhfdhojlpfik | [1](#1-different-extension-name), [2](#2-different-short-description) |
| WAChecker - Check, Verify & Filter Number | 3,000 | cmelkcfmckopkllanachmbnlfpkhnjal | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGGrowth - auto follow and unfollow | 1,000 | eggdbehenjijmhlbiedecgkehgeilemo | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGCommentsExport - Export Comment for IG | 5,000 | ejneclajijjhnnelphnggambomegmcpd | [1](#1-different-extension-name) |
| Jobs Scraper for Indeed | 16 | fbncpljgpiokofpgcedbfmbnpdmaofpj | [2](#2-different-short-description) |
| Job Scraper for LinkedIn™ | 64 | hhddcmpnadjmcfokollldgfcmfemckof | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Social Profile Info - User Info Lookup From URLs & IDs | 47 | jcmhjgllmdnlfabkppegglnmkmlheopp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Chewy Reviews Scraper - Images | 8 | jhgpmldoffheafnogmaihhgjpoecmgea | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Comment Exporter - Extract Comments | 866 | knpbmoflfeeokanhpkiofaoaohpgfbjh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Message Sender - Web Sender | 7,000 | ldhmkpfefdgmbgmmcldnnjokfjjnldmf | [1](#1-different-extension-name) |
| Download Group Phone Numbers | 8,000 | mhlmhjlkpioopoipgbmcmiblopmmecjc | [1](#1-different-extension-name) |
| Friend Exporter - Extract friends list | 993 | ncekbecnpnoiapeghdneaihmeokakpdp | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Zillow Scraper - Extract Data from Zillow | 2,000 | nlieamdebnjhijflpbkbaijnjpdpieoh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Friend Requests Sender | 201 | padhkflcigakphahffhcgfnfiddimngo | [1](#1-different-extension-name), [2](#2-different-short-description) |
| IGFollow - Follower Export Tool | 100,000 | pkafmmmfdgphkffldekomeaofhgickcg | [1](#1-different-extension-name), [2](#2-different-short-description) |

### NioMaker

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| Friend Requests Sender | 113 | bgdjlbjaemhokfkkjiplclhjjbmlhlof | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Lead Exporter for Apollo | 2,000 | fhlfdnhddefmfmmehofnbnkmcbgdlohn | [1](#1-different-extension-name) |
| Yelp Scraper: Scrape Yelp business data | 46 | fnoknmcjgfgepgngbkeefjgeikbdenki | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Followers Everywhere for LinkedIn™️ | 38 | kdopjbndoijfnnfijfkfponmllfomibn | [1](#1-different-extension-name) |

### FreeBusinessApps

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| Twitch Chat for Full Screen | 4,000 | bgopmpphpeghjpififijeoaojmmaiibh | [6](#6-keywords-within-the-extension-description) |
| Free Time Clock for Google Chrome™ | 3,000 | bhcdneenlaehgbonacefkpjddbomfpkj | [6](#6-keywords-within-the-extension-description) |
| SQLite Viewer | 9,000 | bpedjnknnoaegoaejefbodcdjmjkbbea | [5](#5-keywords-at-the-end-of-extension-description) |
| ESports Tournament Schedule | 111 | caocacliklpndkcbdcbfcjnelfaknioi | [6](#6-keywords-within-the-extension-description) |
| Volume Booster | 1,000 | cejhlkhieeooenehcfmcfgpcfjdhpkop | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Sketchpad for Google Chrome | 7,000 | dbhokcpgjhfjemonpglekkbmmjnkmolf | [6](#6-keywords-within-the-extension-description) |
| Audio Equalizer for Youtube™ | 20,000 | dcjnokfichnijppmkbgpafmdjghibike | [1](#1-different-extension-name) |
| Notepad - Take Notes And Weekly Planner | 10,000 | dfiojogmkjifkcckhabcedniponnmifp | [6](#6-keywords-within-the-extension-description) |
| Rubiks Cube for Google Chrome | 9,000 | dlabgdldanmcjlmnifgogbnffionmfki | [6](#6-keywords-within-the-extension-description) |
| CSS Selector | 10,000 | dobcgekgcmhjmfahepgbpmiaejlpaalc | [6](#6-keywords-within-the-extension-description) |
| Icon Finder | 1,000 | eblcidnbagkebkmakplgppmgecigpaef | [5](#5-keywords-at-the-end-of-extension-description) |
| Enable JavaScript | 10,000 | egljjlhdimceghlkloddalnlpgdgkboj | [6](#6-keywords-within-the-extension-description) |
| Page Marker for Google Chrome™ | 6,000 | ejfomipinjkencnfaaefmhgkipphodnc | [6](#6-keywords-within-the-extension-description) |
| Customized Scrollbar | 977 | elchgoiagofdppjcljnecjmekkkgjhhi | [6](#6-keywords-within-the-extension-description) |
| Compress Video Files | 10,000 | gbffnccbjahakeeailfjmdbhnccklcgp | [6](#6-keywords-within-the-extension-description) |
| Password Generator | 4,000 | gbgffmpdbclmicnofpdbdmmikppclhmf | [6](#6-keywords-within-the-extension-description) |
| Speaker Booster | 8,000 | gkfjamnmcjpbphincgfnagopcddfeakd | [1](#1-different-extension-name) |
| Fast Search for Google Drive™ | 443 | glhpjfhpachnbgipcookemmoocedfjgp | [6](#6-keywords-within-the-extension-description) |
| Dark Mode for Messenger | 273 | hajjeoobbdpmbicdnkpoggllfebkmbfb | [6](#6-keywords-within-the-extension-description) |
| Earth 3D View Map | 8,000 | hfnflfnjflibmhoopdbndehehbhgjcem | [6](#6-keywords-within-the-extension-description) |
| Reactions for Google Meet | 40,000 | hicfolagolebmjahkldfohbmphcoddoh | [6](#6-keywords-within-the-extension-description) |
| Date Time | 7,000 | hjiajhckbofggdeopalpnpmapekkjcmi | [6](#6-keywords-within-the-extension-description) |
| Image Editor | 10,000 | hpiicbccakkjfojofhjcjhbljnafdfbg | [4](#4-considerably-more-extensive-extension-description) |
| Picture in Picture for Videos | 20,000 | icmpjbkbjlbfpimllboiokakocdgfijb | [6](#6-keywords-within-the-extension-description) |
| Mute Tabs | 2,000 | ijidbphagpacfpkhgcjfbdjohkceanea | [6](#6-keywords-within-the-extension-description) |
| Copy To Clipboard | 8,000 | imjkddkepakidnmolhmpfldheaiakojj | [6](#6-keywords-within-the-extension-description) |
| Tab manager | 3,000 | iofngkkljgebpllggmdpcldpifhdckkg | [6](#6-keywords-within-the-extension-description) |
| Online Radio for Google Chrome™ | 4,000 | jlfegkfcihbbpiegahcpjjidojbhfglo | [6](#6-keywords-within-the-extension-description) |
| Custom Dark Mode 3.0 for Youtube, Facebook | 795 | jpgkbhploimngoikjnmggchkcekleehi | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Make Text Readable for Google Chrome™ | 1,000 | kicekkepbmfbaiagdcflfghmnnachmdg | [6](#6-keywords-within-the-extension-description) |
| Online Download Manager | 10,000 | kilhigaineblocfbpikplhgaacgigfnb | [6](#6-keywords-within-the-extension-description) |
| Gmail Adblocker | 1,000 | kkddllkaglcicbicjlobbhmjjangamjh | [5](#5-keywords-at-the-end-of-extension-description) |
| Testing Reading Speed | 4,000 | kmkdgnfgallnjpdldcmplbggbmkgcgdl | [6](#6-keywords-within-the-extension-description) |
| User Agent Switcher | 1,000 | lbdmdckajccnmklminnmlcabkilmhfel | [5](#5-keywords-at-the-end-of-extension-description) |
| Highlighter for Google Chrome™ | 50,000 | lebapnohkilocjiocfcaljckcdoaciae | [6](#6-keywords-within-the-extension-description) |
| Free Spell Checker for Google Chrome™ | 20,000 | ljgdcokhgjdpghmhdkbolccfcfdbklpo | [6](#6-keywords-within-the-extension-description) |
| IMDB Ratings on Netflix | 314 | lkfapihkchheoddiodedjlapfdnmgkio | [6](#6-keywords-within-the-extension-description) |
| Adjust Screen Brightness for Browser | 5,000 | lkomnldkbflfbkebenomadllalainpec | [6](#6-keywords-within-the-extension-description) |
| Timer for Google Meet | 10,000 | lmkdehdoopeeffkakbbkfcmmhmeoakpk | [6](#6-keywords-within-the-extension-description) |
| Make Screenshot for Chrome™ | 1,000 | mhnppmochppgeilojkicdoghhgfnaaig | [1](#1-different-extension-name) |
| Full Page Screenshot for Google Chrome™ | 10,000 | mieibeigpaehbjcbibakjcmkocngijjl | [6](#6-keywords-within-the-extension-description) |
| Custom Progress Bar for YouTube™ | 300,000 | nbkomboflhdlliegkaiepilnfmophgfg | [6](#6-keywords-within-the-extension-description) |
| Chrome Bookmarks | 4,000 | nhcaihbjbbggebncffmeemegdmkamppc | [6](#6-keywords-within-the-extension-description) |
| Tab Snooze | 336 | nomolokefbokmolefakehdnicdpjbmnm | [5](#5-keywords-at-the-end-of-extension-description) |
| History & Cache Cleaner | 10,000 | oiecpgbfcchalgdchgoplichofjadhmk | [5](#5-keywords-at-the-end-of-extension-description) |
| View Chrome History | 40,000 | oiginoblioefjckppeefcofmkkhgbdfc | [6](#6-keywords-within-the-extension-description) |
| Meme Maker for Google Chrome | 2,000 | oipbnbggobjonpojbcegcccfombkfoek | [6](#6-keywords-within-the-extension-description) |
| Bass Boost for Google Chrome™ | 20,000 | omobmjpbljcbgdppgjfmmennpjpgokch | [6](#6-keywords-within-the-extension-description) |
| Knit Patterns | 181 | pfeenapookpacnhhakoilppnmbohncml | [6](#6-keywords-within-the-extension-description) |
| Tic Tac Toe | 3,000 | pfghhddjhifjcneopigibnkifacchpgh | [6](#6-keywords-within-the-extension-description) |
| Clear History & Web Cache | 3,000 | pjhgdolnnlcjdngllidooanllmcagopf | [6](#6-keywords-within-the-extension-description) |
| Citation Manager for Google Chrome™ | 20,000 | pkbcbgfocajmfmpmecphcfilelckmegj | [6](#6-keywords-within-the-extension-description) |
| Full screen your Videos | 3,000 | pkoeokeehkjghkjghoflddedkjnheibp | [6](#6-keywords-within-the-extension-description) |
| iCloud Dashboard | 10,000 | pnncnbibokgjfkolhbodadgcajeiookc | [6](#6-keywords-within-the-extension-description) |
| Responsive Tester | 30,000 | ppbjpbekhmnekpphljbmeafemfiolbki | [6](#6-keywords-within-the-extension-description) |

### Everything else

Most extensions listed below either belong to one of the clusters above but haven’t been attributed, or the cluster they belong to wasn’t important enough to be listed separately. In a few cases these could however be extensions by individual developers who went overboard with search engine optimization.

| Name | Weekly active users | Extension ID| Approaches |
|------|--------------------:|-------------|------------|
| Simple = Select + Search | 20,000 | aagminaekdpcfimcbhknlgjmpnnnmooo | [6](#6-keywords-within-the-extension-description) |
| AI Chat Bot | 1,000 | abagkbkmdgomndiimhnejommgphodgpl | [1](#1-different-extension-name) |
| ChatGPT Translate | 20,000 | acaeafediijmccnjlokgcdiojiljfpbe | [1](#1-different-extension-name) |
| The AllChat - ChatGPT, WhatsApp, Messenger | 1,000 | adipcpcnjgifgnkofmnkdbebgpoamobf | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| save ChatGPT history to evernote | 1,000 | afcodckncacgaggagndhcnmbmeofppok | [3](#3-using-competitors-names) |
| Sound Booster | 1,000 | ahhoaokgolapmhoeojcfbgpfknpmlcaj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Dictionary - Synonyms, Definition, Translator | 40,000 | ahjhlnckcgnoikkfkfnkbfengklhglpg | [1](#1-different-extension-name), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| ContentBlockHelper | 20,000 | ahnpejopbfnjicblkhclaaefhblgkfpd | [6](#6-keywords-within-the-extension-description) |
| Video Speed Controller | 250 | aiiiiipaehnjdjgokjencohlidnopjgd | [4](#4-considerably-more-extensive-extension-description) |
| Black Jack Play Game | 20,000 | akclccfjblcngnchpgekhijggnibifla | [5](#5-keywords-at-the-end-of-extension-description) |
| Free VPN - 1VPN | 600,000 | akcocjjpkmlniicdeemdceeajlmoabhg | [1](#1-different-extension-name), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| Browser Boost - Extra Tools for Chrome | 80,000 | akknpgblpchaoebdoiojonnahhnfgnem | [5](#5-keywords-at-the-end-of-extension-description) |
| Comet - Reddit Comments on YouTube & Webpages | 9,000 | amlfbbehleledmbphnielafhieceggal | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Hololive Wallpaper | 2,000 | anjmcaelnnfglaikhmfogjlppgmoipld | [6](#6-keywords-within-the-extension-description) |
| Roblox Wallpaper | 9,000 | ankmhnbjbelldifhhpfajidadjcammkg | [5](#5-keywords-at-the-end-of-extension-description) |
| Video Downloader Global - videos & streams | 20,000 | baajncdfffcpahjjmhhnhflmbelpbpli | [1](#1-different-extension-name), [2](#2-different-short-description) |
| super cowboy play game | 472 | bconhanflbpldbpagecadkknihjmlail | [5](#5-keywords-at-the-end-of-extension-description) |
| Paint Tool for Web | 3,000 | bcpakobpeakicilokjlkdjhhcbepdmof | [5](#5-keywords-at-the-end-of-extension-description) |
| Sound booster by AudioMax | 900,000 | bdbedpgdcnjmnccdappdddadbcdichio | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Save to Face Book. From web to Saved FB | 63 | bdhnoaejmcmegonoagjjomifeknmncnb | [1](#1-different-extension-name), [2](#2-different-short-description), [6](#6-keywords-within-the-extension-description), [7](#7-different-extension-description) |
| Save ChatGPT to Obsidian markdown file | 641 | bdkpamdmcgamabdeaeehfmaiaejcdfko | [7](#7-different-extension-description) |
| Full Page Screenshot: ScreenTool.io | 6,000 | bfhiekdkiilhblilanjoplmoocmbeepj | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Downloader for Instagram - ToolMaster | 100,000 | bgbclojjlpkimdhhdhbmbgpkaenfmkoe | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Aqua VPN | 20,000 | bgcmndidjhfimbbocplkapiaaokhlcac | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [7](#7-different-extension-description) |
| ChatGPT Assistant - Smart Search | 178 | bgejafhieobnfpjlpcjjggoboebonfcg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [7](#7-different-extension-description) |
| Xiaojinshu - Xiaohongshu material downloader (video, picture) | 2,000 | bhmbklgihbfcpbnaidlcanmbekbjoopg | [1](#1-different-extension-name) |
| Save ChatGPT to Notion | 5,000 | bknieejaaomeegoflpgcckagimnbbgdp | [3](#3-using-competitors-names) |
| Football Wallpapers | 1,000 | blaajilgooofbbpfhdicinfblmefiomn | [6](#6-keywords-within-the-extension-description) |
| Image downloader - picture and photos saver | 500,000 | cbnhnlbagkabdnaoedjdfpbfmkcofbcl | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| IG Follower Export Tool - IG Email Extractor | 1,000 | cekalgbbmdhecljbanbdailpkbndbbgj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Happy Chef Bubble Game | 668 | celnnbmadnnifmnaekgeiipiadahpide | [5](#5-keywords-at-the-end-of-extension-description) |
| midjourney to notion | 1,000 | ceoifmkmbigkoodehbhfeegbngoomiae | [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Dragon Ball Z Wallpaper | 10,000 | cepfoomofdcijdlpinanbciebkdmmddm | [5](#5-keywords-at-the-end-of-extension-description) |
| Change Default Search Engine | 7,000 | cfikbclbljhmmokgdokgjhnpinnmihkp | [5](#5-keywords-at-the-end-of-extension-description) |
| Indeed Scraper | 425 | cgelphinochnndbeinkgdjolojgdkabc | [1](#1-different-extension-name) |
| Story Space. Anonymous viewer for IG and FB | 10,000 | cicohiknlppcipjbfpoghjbncojncjgb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Classic Dark Theme for Web | 700,000 | ckamlnkimkfbbkgkdendoedekcmbpmde | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| ai platform | 687 | cklkofkblkhoafccongdmdpeocoeaeof | [1](#1-different-extension-name) |
| AI Art Generator | 697 | cllklgffiifegpgbpaemekbkgehbeigh | [6](#6-keywords-within-the-extension-description) |
| Twitter Algorithm Rank Validator  - Free Tool | 31 | cmgfmepnimobbicpnjhfojjibhjdoggo | [1](#1-different-extension-name) |
| Adblock - adblocker for Youtube | 700,000 | cohnbaldpeopekjhfifpfpoagfkhdmeo | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [7](#7-different-extension-description) |
| Bass Booster - Сontrol your sound | 800,000 | coobjpohmllnkflglnolcoemhmdihbjd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| SearchGPT Powered | 30,000 | cpmokfkkipanocncbblbdohjginmpdjn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Maps Scraper & Leads Data Extractor | 800 | dahoicbehnalbeamhcpghhoelifghbma | [6](#6-keywords-within-the-extension-description) |
| Wasup WA Sender | 4,000 | dcmcongoliejhianllkdefemgiljjdjl | [5](#5-keywords-at-the-end-of-extension-description) |
| Popup Blocker - Adblock Pop up | 10,000 | ddbjkeokchfmmigaifbkeodfkggofelm | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| AI Avatar Generator | 528 | ddjeklfcccppoklkbojmidlbcfookong | [6](#6-keywords-within-the-extension-description) |
| Telegram Video Downloader | 10,000 | ddkogamcapjjcjpeapeagfklmaodgagk | [1](#1-different-extension-name), [2](#2-different-short-description) |
| GetJam - find Coupons and Promo codes | 10,000 | deamobbcdpcfhkiepmjicnlheiaalbbe | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [7](#7-different-extension-description) |
| WiFi speedtest & Internet Connection Test | 10,000 | deofojifdhnbpkhfpjpnjdplfallmnbf | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Audio Master mini | 900,000 | dfffkbbackkpgmddopaeohbdgfckogdn | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Geometry Dash Wallpaper | 1,000 | dghokgbfkiebbjhilmjmpiafllplnbok | [5](#5-keywords-at-the-end-of-extension-description) |
| ExportShopify | 63 | dgofifcdecfijocmjmdhiiabmocddleb | [5](#5-keywords-at-the-end-of-extension-description) |
| Bass Booster Lite | 1,000 | dhempgjfckmjiblbkandmablebffigdj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| IG Follower Export Tool - Export Follower List Instagram - IG Tools | 343 | dhmgjkbkpjikopbkgagkldnoikomgglo | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Custom Youtube | 64 | dieglohbkhiggnejegkcfcpolnblodfj | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Math AI | 10,000 | dioapkekjoidbacpmfpnphhlobnneadd | [1](#1-different-extension-name), [2](#2-different-short-description), [7](#7-different-extension-description) |
| Batch Save ChatGPT to Notion | 176 | djefhicmpbpmmlagbgooepmbobdhajgn | [7](#7-different-extension-description) |
| Night Theme for Web | 786 | djkdplhjjhmonmiihoaipopjfjalelkb | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| TickerIQ | 200,000 | dlaajbpfmppphhflganljdalclmcockl | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Screen Recording | 10,000 | dlcelhclgobpnegajplgemdhegfiglif | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| Retro Video Downloader | 3,000 | dnbonfnabpogidccioahmeopjhbcojoe | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| View Instagram Stories - InstaStory | 288 | dpckdamgkbgkhifgpealdkekennmkjln | [1](#1-different-extension-name) |
| City Bike Racing Champion Game FEEP | 471 | dpkpeppcigpkhlceinenjkdalhmemljn | [5](#5-keywords-at-the-end-of-extension-description) |
| ChatGPT for WhatsApp | 7,000 | eacpodndpkokbialnikcedfbpjgkipil | [5](#5-keywords-at-the-end-of-extension-description) |
| Vibn AI - ChatGPT: AI-Powered Browsing | 20 | ealomadpdijnflpgabddhepkgcjjeiha | [2](#2-different-short-description) |
| sync evernote to notion | 72 | edppbofcdhkllmbbhnocaenejjlcjoga | [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [7](#7-different-extension-description) |
| Email Extract Pro - Simplify Lead Generation with Notion | 606 | eebaoaeanohonldcbkpnjfkdlcbcaond | [2](#2-different-short-description), [3](#3-using-competitors-names), [7](#7-different-extension-description) |
| Bass Booster - Sound Master Pro | 200,000 | eejonihdnoaebiknkcgbjgihkocneico | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Ever2Notion | 148 | efolkkdddgjcnnngjefpadglbliccloo | [3](#3-using-competitors-names) |
| Claude to Obsidian | 217 | ehacefdknbaacgjcikcpkogkocemcdil | [1](#1-different-extension-name) |
| Auto Tab Saver Pro | 14 | ehdnfngedccloodopehbfgliancjekhi | [1](#1-different-extension-name), [3](#3-using-competitors-names) |
| Tricky Craby Html5 Game | 7,000 | eifmecggecobbcjofbkkobpbjbdifemc | [5](#5-keywords-at-the-end-of-extension-description) |
| Dark Mode - Dark Reader for Chrome | 60,000 | eiionlappbmidcpaabhepkipldnopcch | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Beautiful Nature Pictures Wallpaper | 1,000 | eilemfgfflhnndcaflanfgmohfjgbgof | [6](#6-keywords-within-the-extension-description) |
| Email extract | 400,000 | ejecpjcajdpbjbmlcojcohgenjngflac | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Screen recorder - Recorder Tool | 84 | ekgimgflikldcmjmeeecnkdenimhamch | [5](#5-keywords-at-the-end-of-extension-description) |
| Soccer Online Game Football - HTML5 Game | 40,000 | eknjiacpaibimgjdeldfhepofgjkngck | [6](#6-keywords-within-the-extension-description) |
| Crazy Cursors - Custom Cursors with Trails | 14 | enncggclkhfdeoaglhjkieeipkboaecd | [1](#1-different-extension-name), [3](#3-using-competitors-names) |
| Lumberjack River Game | 1,000 | fbgkmgkcneoolclpopjahcdogpbndkcl | [5](#5-keywords-at-the-end-of-extension-description) |
| Vroxy - Spoof Time Zone, Geolocation & Locale | 1,000 | fcalilbnpkfikdppppppchmkdipibalb | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Linkedin Job Scraper - scraper.plus | 948 | fcfbdnejkoelajenklbcndfokempkclk | [3](#3-using-competitors-names) |
| Music Equalizer for Chrome | 500,000 | fedoeoceggohfajbhbadkfhgckjkieop | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Safety Web - Adblock for Web | 2,000 | ffafhlldnfofnegdfhokdaohngdcdaah | [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| IG Likes Export | 1,000 | fiefnmddjghnmdjfedknoggjfcfejllm | [2](#2-different-short-description) |
| Free YouTube Comment Finder - EasyComment | 1,000 | fifgmgcoibgcehfbpeifpipjnmfdjcoi | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Classic Brick Game 80th | 7,000 | filjhgipogkkmalceianiopidelcacam | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| IG Follower Export Tool - IG Lead Scraper | 48 | fimgpffhikpemjcnfloodfdjfhjkoced | [5](#5-keywords-at-the-end-of-extension-description) |
| Instagram Photos Download - InstaPhotos | 381 | fjccfokbikcaahpgedommonpjadhdmfm | [1](#1-different-extension-name) |
| Save Twitter&Linkedin People to Notion CRM | 61 | fjhnpnojmkagocpmdpjpdjfipfcljfib | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| Life HD Wallpapers New Tab | 787 | flbglpgpbekkajkkolloilfimbaemigj | [1](#1-different-extension-name) |
| INSORT - Sort Reels for IG | 334 | fmdndpmffplgenajipolmpfhflmgdpla | [5](#5-keywords-at-the-end-of-extension-description) |
| Indeed Scraper | 467 | fnmcgefncfbmgeafmdelmjklpblodpnc | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Grand Commander | 1,000 | fnpedebmmbanjapadpnoiogjjhnggdca | [5](#5-keywords-at-the-end-of-extension-description) |
| Succubus HD Wallpapers New Tab Theme | 126 | gahampmajaohlicbcpdienlhclhkdgcg | [1](#1-different-extension-name), [6](#6-keywords-within-the-extension-description) |
| Attack On Titan Live Wallpapers | 6,000 | gajcknbeimpoockhogknhfobnblpkijk | [6](#6-keywords-within-the-extension-description) |
| Red And Black Shards | 9,000 | gamplddolbodndilnmooeilfcmdjkjfn | [6](#6-keywords-within-the-extension-description) |
| Free VPN Proxy - NoName VPN | 1,000 | gceoelahanekobagpkcelbhagpoaidij | [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| GPT Booster - ChatGPT File Uploader & Chats Saver | 9,000 | gcimiefinnihjibbembpfblhcmjclklo | [1](#1-different-extension-name), [2](#2-different-short-description), [6](#6-keywords-within-the-extension-description) |
| GPT Sidebar - Search with ChatGPT | 900,000 | gcmemiedfkhgibnmdljhojmgnoimjpcd | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| IG Reel Download - InsReels | 194 | gcofmhbhbkmagfcdimaokhnhjfnllbek | [1](#1-different-extension-name) |
| Chrome Capture - screenshot & GIF | 300,000 | ggaabchcecdbomdcnbahdfddfikjmphe | [4](#4-considerably-more-extensive-extension-description) |
| Audio Equalizer | 551 | ggcffjkfphpojokoapldgljehpkiccck | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| GPTs Store Search and Favorite GPTs | 735 | ggelblabecfgdgknhkmeffheclpkjiie | [3](#3-using-competitors-names) |
| League of Legends Wallpaper | 1,000 | giidhjojcdpaicnidflfmcfcnokgppke | [5](#5-keywords-at-the-end-of-extension-description) |
| Video Downloader Button | 9,000 | gjpdgbkjopobieebkmihgdoinbkicjck | [1](#1-different-extension-name), [2](#2-different-short-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Screen Virtual Keyboard- specific needs tool | 9,000 | gkiknnlmdgcmhmncldcmmnhhdiakielc | [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Just Video Downloader | 5,000 | gldhgnbopkibmghhioohhcjcckejfmca | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Picture in Picture - floating video player | 1,000,000 | gmehookibnphigonphocphhcepbijeen | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Sound Booster | 10,000 | gmpconpjckclhemcaeinfemgpaelkfld | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Hive - Coupons, Promo Codes, & Discounts | 2,000 | godkpmhfjjbhcgafplpkaobcmknfebeh | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| Profile Picture Maker - AI PFP Maker | 202 | gonmpejcopjdndefhgpcigohdgjkjbjc | [6](#6-keywords-within-the-extension-description) |
| Traffic Car Racing Game | 10,000 | gpchpdllicocpdbbicbpgckckbkjdago | [6](#6-keywords-within-the-extension-description) |
| Mass Delete Tweets - Tweet Deleter | 1,000 | gpeegjjcnpohmbfplpkaiffnheloeggg | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Microsoft Word Translator - Translate Word online | 974 | gphocmbdfjkfghmmdcdghoemljoidkgl | [3](#3-using-competitors-names) |
| Better Color Picker - pick any color in Chrome | 20,000 | gpibachbddnihfkbjcfggbejjgjdijeb | [5](#5-keywords-at-the-end-of-extension-description) |
| Popup and Ads Blocker | 20 | hadifnjapmphiajmfpfgfhaafafchjgh | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| Sound Equalizer | 50,000 | hckjoofeeogkcfehlfiojhcademfgigc | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Multi Ad Blocker Complete for Youtube™ | 4,000 | hdoblclnafbfgihfnphjhadfpgcmohkp | [1](#1-different-extension-name) |
| Video Downloader pro | 1,000,000 | hebjaboacandjnlnhocfikmaghgbfjlp | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| WAFilter - Check & Verify WA Number | 5,000 | hhfjicmmlbnmbobgpfmdkodfjkibogog | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Translator - Click to Translate | 10,000 | hhmocdjpnopefnfaajgfihmpjpibkdcj | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Funny Tweet Generator | 241 | hhpmgfhnfdifcjgmgpgfhmnmgpiddgbg | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Winamp Classic Equalizer | 1,000 | hibihejapokgbbimeemhclbhheljaahc | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| ChatGPT plugin search | 893 | hjdhbhggcljjjfenfbdbbhhngmkglpkl | [3](#3-using-competitors-names) |
| ReminderCall Chrome Ext. | 287 | hlblflbejmlenjnehmmimlopeljbfkea | [1](#1-different-extension-name), [3](#3-using-competitors-names) |
| Automatic ChatGPT Translator: Prompt Genie | 1,000 | hlkbmbkcepacdcimcanmbofgcibjiepm | [3](#3-using-competitors-names) |
| AI Editor For Xiaohongshu™ - XHSPlus | 2,000 | hmeohemhimcjlegdjloglnkfablbneif | [1](#1-different-extension-name) |
| Cute Dog Wallpaper HD Custom New Tab | 10,000 | iaaplcnlmmnknnbhhpedcaiiohdepiok | [6](#6-keywords-within-the-extension-description) |
| Adblocker for Web | 3,000 | icegiccppplejifahamjobjmebhaplio | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Email scraper & Email Extract | 73 | ichccchniaebdhjehjcpmiicifhccpem | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Tomba - Email Finder & Email Extractor Plus | 9,000 | icmjegjggphchjckknoooajmklibccjb | [5](#5-keywords-at-the-end-of-extension-description) |
| Comment Exporter - Export Ins Comments | 454 | idfcdgofkeadinnejohffdlbobehndlf | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Get Color Palette from Website | 75 | idhdojnaebbnjblpgcaneodoihmjpdmo | [1](#1-different-extension-name) |
| Itachi Live Wallpaper | 9,000 | ihmlfoinmmfmcdogoellfomkcdofflfj | [6](#6-keywords-within-the-extension-description) |
| Eclincher | 905 | iicacnkipifonocigfaehlncdmjdgene | [5](#5-keywords-at-the-end-of-extension-description) |
| QRCodie - QR Code Generator | 20 | iioddhggceknofnhkdpnklfopkcahbkc | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Shorts blocker for Youtube | 100,000 | iiohlajanokhbaimiclmahallbcifcdj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| App Client for Instagram™ - InLoad | 800,000 | ikcgnmhndofpnljaijlpjjbbpiamehan | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| FollowFox - IG Follower Export Tool (Email) | 970 | imoljjojcgjocfglobcbbhfbghpdjlfn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| chatgpt partner - Your AI Assistant | 778 | infgmecioihahiifibjcidpgkbampnel | [4](#4-considerably-more-extensive-extension-description) |
| Zombie Shooter Play | 5,000 | iohppfhpbicaflkcobkfikcjgbjjjdch | [5](#5-keywords-at-the-end-of-extension-description) |
| Adblock for YouTube & Chrome - All Block | 400,000 | jajikjbellknnfcomfjjinfjokihcfoi | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| AdBlocker - Ultimate Ads Blocker | 1,000 | jchookncibjnjddblpndekhkigpebmnn | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| Emoji Keyboard New | 1,000 | jddhjkckjlojegjdjlbobembgjoaobfc | [6](#6-keywords-within-the-extension-description) |
| Candy Match 3 Puzzle Games | 2,000 | jdffnpgoekmmkfgfflnpmonkldllfmbh | [5](#5-keywords-at-the-end-of-extension-description) |
| Genius PRO : Adblocker +Total Web Security | 20,000 | jdiegbdfmhkofahlnojgddehhelfmadj | [3](#3-using-competitors-names) |
| Night Theme - Dark Mode | 4,000,000 | jhhjdfldilccfllhlbjdlhknlfbhpgeg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Jarvis AI: Chat GPT, Bing, Claude, Bard, BOT | 10,000 | kbhaffhbhcfmogkkbfanilniagcefnhi | [1](#1-different-extension-name), [2](#2-different-short-description) |
| AI GPT | 30,000 | kblengdlefjpjkekanpoidgoghdngdgl | [1](#1-different-extension-name) |
| Dark Mode Chrome | 300,000 | kdllaademhdfbdhmphefcionnblmobff | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Pubg Wallpaper | 1,000 | kealimbjilfbnmolgombldemenlddfaa | [5](#5-keywords-at-the-end-of-extension-description) |
| Dark Shade | 97 | kfgpocchpfefpnecphkcjoammelpblce | [1](#1-different-extension-name), [2](#2-different-short-description) |
| WA Contacts Extractor - wabulk.net | 9,000 | kfjafldijijoaeppnobnailkfjkjkhec | [1](#1-different-extension-name) |
| Video Downloader | 10,000 | kghcdbkokgjghlfeojcpeoclfnljkbdk | [1](#1-different-extension-name), [2](#2-different-short-description) |
| ChatGPT of OpenAI for Google | 10,000 | kglajnlchongolikjlbcchdapioghjib | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Global Video & Audio Downloader | 827 | kglebmpdljhoplkjggohljkdhppbcenn | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Emoji keyboard online - copy&past your emoji. | 1,000,000 | kgmeffmlnkfnjpgmdndccklfigfhajen | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Volume Booster - Increase sound | 700,000 | kjlooechnkmikejhimjlbdbkmmhlkkdd | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Yummi Fusion Game for Chrome | 313 | kknfaoaopblmapedlbhhicbnpdhlebff | [5](#5-keywords-at-the-end-of-extension-description) |
| Total Adblock | 1,000 | knnnjdihapcnbggclbihkkainodlapml | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [7](#7-different-extension-description) |
| Adblocker for Web | 10,000 | kojabglmkbdlpogbnenbdegoifgobklj | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Simple Translator - Dictionary | 800,000 | koleblagfjjlhlkpacidojjnkhobeikd | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Goku Ultra Instinct | 40,000 | kpehlpkidnkpifjmdgajdhhmcgdigjjn | [6](#6-keywords-within-the-extension-description) |
| Volume Booster - Increase Sound Effect | 20,000 | laldfbfjhaogodemgonegbingpmjldnh | [1](#1-different-extension-name), [6](#6-keywords-within-the-extension-description) |
| Zumba Mania Game - HTML5 Game | 4,000 | lckmeckmnopdeeelhglffajlfgodhoad | [1](#1-different-extension-name) |
| Comments Exporter | 2,000 | ldhjpljmgnggmkpcgaicmocfoefbcojl | [1](#1-different-extension-name), [2](#2-different-short-description) |
| AdBlocker for LinkedIn® | 100 | leabdgiabfjhegkpomifpcfjfhlojcfh | [3](#3-using-competitors-names) |
| Charm - Coupons, Promo Codes, & Discounts | 366 | lfbiblnhjmegapjfcbbodacjajhcgnbe | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| Site Blocker: Stay focused & Block websites | 2,000 | lfbpllmokmhinnopfchemobgglipfini | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Youtube Ad Blocker | 226 | lfcgcabhmgenalfgamodjflggklmaldd | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| Video Downloader - Save m3u8 to MP4 | 10,000 | lfdconleibeikjpklmlahaihpnkpmlch | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Contact Saver For WA & Download Group Phone Numbers - WPPME.COM | 26 | lfopjgadjgdlkjldhekplmeggobolnej | [1](#1-different-extension-name), [6](#6-keywords-within-the-extension-description) |
| ChatGenie for Chatgpt | 8,000,000 | lgfokdfepidpjodalhpbjindjackhidg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Mook: AI Tweet Generator With Chat GPT | 259 | lglmnbmfkbpfpbipjccjlkcgngekdhjk | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Anime Live Wallpapers | 100,000 | lgpgimkhbokanggfjjafplmjcdoclifl | [6](#6-keywords-within-the-extension-description) |
| ai logo creator | 491 | ljgimpibhgleapaoedngmcicjoifojea | [1](#1-different-extension-name), [6](#6-keywords-within-the-extension-description) |
| QR Code Generator | 3,000,000 | lkdokbndiffkmddlfpbjiokmfkafmgkm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| PDF Converter Online | 10,000 | lmgofgkjflllbmfdpamdjjmdjhohibpc | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Video downloader by NNT | 2,000 | loiebadnnjhhmnphkihojemigfiondhf | [1](#1-different-extension-name), [2](#2-different-short-description), [6](#6-keywords-within-the-extension-description) |
| WhichFont | 75 | lpamdogjnihpkoboakafmaiopljkhoib | [5](#5-keywords-at-the-end-of-extension-description) |
| Video Downloader Plus | 100,000 | lpcbiamenoghegpghidohnfegcepamdm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Summer Match 3 Game | 613 | lpfcolgfiohmgebkekkdakcoajfoeadn | [5](#5-keywords-at-the-end-of-extension-description) |
| Privacy Extension For WhatsApp Web - WABULK | 90,000 | mbcghjiodcjankhkllfohcgnckhdbkmi | [1](#1-different-extension-name) |
| Volume Booster + | 800,000 | mbdojfbhgijnafkihnkhllmhjhkmhedg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Flux AI Image Generator | 1,000 | mblmjcogbjicpmhhjmpgjeiaophchpji | [3](#3-using-competitors-names) |
| WA Group Number Exporter | 5,000 | mbmldhpfnohbacbljfnjnmhfmecndfjp | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Claude to Evernote | 59 | mekebjmippjiaajoaeeiemdcfngnnnkm | [7](#7-different-extension-description) |
| WA Number Checker - wabulk.net | 8,000 | meppipoogaadmolplfjchojpjdcaipgj | [1](#1-different-extension-name) |
| WA Number Checker | 1,000 | mgbpamnoiegnkologgggccldjenfchmc | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Translator - Click to Translate | 451 | mghganlaibcgnnooheoaebljgfbghpdl | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| ChatGPT Summary - summarize assistant | 300,000 | mikcekmbahpbehdpakenaknkkedeonhf | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Escape From School Game FEEP | 2,000 | mjkdllcbnonllpedjjmgdhkjnjmcigpo | [5](#5-keywords-at-the-end-of-extension-description) |
| Alfi Adventure Game | 220 | mkonckdeijcimlecklibjbnapmhnbpji | [5](#5-keywords-at-the-end-of-extension-description) |
| Allow Copy - Select & Enable Right Click | 900,000 | mmpljcghnbpkokhbkmfdmoagllopfmlm | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Save image to PDF | 114 | mpdpidnikijhgcbemphajoappcakdgok | [5](#5-keywords-at-the-end-of-extension-description) |
| Screensy - screen recording | 3,000 | mpiihicgfapopgaahidedijlddefkedc | [1](#1-different-extension-name), [2](#2-different-short-description) |
| WhatsApp Salesforce integration | 345 | nacklnnkbcphbhgodnhfgnbdmobomlnm | [5](#5-keywords-at-the-end-of-extension-description) |
| Easy Ad Blocker | 100,000 | naffoicfphgmlgikpcmghdooejkboifd | [3](#3-using-competitors-names) |
| Anime Girls Wallpaper | 10,000 | nahgmphhiadplbfoehklhedcbbieecak | [5](#5-keywords-at-the-end-of-extension-description) |
| PiP (Picture in picture) | 800,000 | nalkmonnmldhpfcpdlbdpljlaajlaphh | [1](#1-different-extension-name), [2](#2-different-short-description), [6](#6-keywords-within-the-extension-description) |
| Vytal - Spoof Timezone, Geolocation & Locale | 50,000 | ncbknoohfjmcfneopnfkapmkblaenokb | [1](#1-different-extension-name), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| Bass Booster Extreme - It Works! | 10,000 | ndhaplegimoabombidcdfogcnpmcicik | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| ProTranslator - Translator for All web | 54 | nemnbfdhbeigohoicapnbdecdlkcpmpj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Adblock for Ytube | 3,000 | nendakennfmpoplpmpgnmcbpfabkibki | [6](#6-keywords-within-the-extension-description) |
| AI Image Generator - Text to Image Online | 20,000 | nfnkkmgbapopddmomigpnhcnffjdmfgo | [1](#1-different-extension-name) |
| Night Shift - Dark Theme for WEB | 155 | ngocaaiepgnlpdlpehhibnpmecaodfpk | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Mad Shark HTML 5 Game | 1,000 | nhbckdjhkcjckhfgpmicgaiddbfdhhll | [5](#5-keywords-at-the-end-of-extension-description) |
| Screen Recorder | 5,000 | nhmaphcpolbbanpfhamgdpjlphbcnieh | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| IgComment - IG Comments Export | 545 | nilbploiiciajeklaogbonjaejdjhfao | [1](#1-different-extension-name) |
| InReach - LinkedIn B2B Email Finder | 1,000 | nloekplnngjkjohmbfhmhjegijlnjfjk | [5](#5-keywords-at-the-end-of-extension-description) |
| Full Page Screenshot - Screen Capture | 1,000 | nmbngkjfkglbmmnlicoejhgaklphedcg | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Exporter for Followers | 400,000 | nmnhoiehpdfllknopjkhjgoddkpnmfpa | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Flash Player - flash emulator | 400,000 | nohenbjhjbaleokplonjkbmackfkpcne | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Dark Mode Wallpapers | 1,000 | npmjehopohdlglmehokclpmbkgpfckcd | [6](#6-keywords-within-the-extension-description) |
| WhatsApp Audio & Voice Message to Text | 112 | npojienggkmiiemiolplijhfdmppacik | [1](#1-different-extension-name), [6](#6-keywords-within-the-extension-description) |
| Your Emoji Keyboard | 1,000 | obekkkgdekegaejajmdpaodefomoomfk | [6](#6-keywords-within-the-extension-description) |
| Adblock for Spotify - Skip ads on music | 10,000 | obiomemfgclpnflokpjjfokafbnoallb | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Manual Finder 2024 | 256 | ocbfgbpocngolfigkhfehckgeihdhgll | [5](#5-keywords-at-the-end-of-extension-description) |
| Flash Player Enable - flash emulator swf | 300,000 | ocfjjghignicohbjammlhhoeimpfnlhc | [1](#1-different-extension-name), [2](#2-different-short-description) |
| GT Cars Mega Ramp Game FEEP | 630 | ociihgpflooiebgncjgjkcaledmkhakk | [5](#5-keywords-at-the-end-of-extension-description) |
| Stick Panda Play Game | 5,000 | ocmbglodnmkcljocboijoemgceokifgg | [5](#5-keywords-at-the-end-of-extension-description) |
| Garena Free Fire Wallpaper | 10,000 | ocnnnfbblcadccdphieemnmbljdomdgl | [5](#5-keywords-at-the-end-of-extension-description) |
| Dictionary for Google Chrome - Synonyms, Definition | 21 | ocooohinghhdfcpfdonkjhhankdolpab | [1](#1-different-extension-name), [3](#3-using-competitors-names) |
| Presto lead extractor for Bing Maps and OSM | 300,000 | oilholdcmnjkebdhokhaamalceecjbip | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Dark Mode - Dark Theme for Chrome | 60,000 | okcnidefkngmnodelljeodakdlfemelg | [1](#1-different-extension-name), [6](#6-keywords-within-the-extension-description) |
| FastSave & Repost for Instagram | 700,000 | olenolhfominlkfmlkolcahemogebpcj | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| ClaudeAI Copilot | 449 | olldnaaindiifeadpdmfggognmkofaib | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Roblox Wallpaper | 6,000 | omamcjggpkjhgbkadieakplbieffjimf | [5](#5-keywords-at-the-end-of-extension-description) |
| Dark Reader for Chrome | 10,000 | omfeeokgnjnjcgdbppmnijlmdnpafmmp | [1](#1-different-extension-name), [4](#4-considerably-more-extensive-extension-description) |
| Browsec VPN - Free VPN for Chrome | 6,000,000 | omghfjlpggmjjaagoclmmobgdodcjboh | [1](#1-different-extension-name), [2](#2-different-short-description), [7](#7-different-extension-description) |
| ChatGPT Sidebar | 3,000 | oopjmodaipafblnphackpcbodmgoggdo | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names), [5](#5-keywords-at-the-end-of-extension-description) |
| Music Equalizer - Improve Sound for everyone | 900,000 | paahdfldanmapppepgbflkhibebaeaof | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Space Pinball Game | 968 | pakghdcedniccgdfjjionnmoacelicmf | [7](#7-different-extension-description) |
| Find Font | 2,000 | pbeodbbpdamofbpkancdlfnegflmhkph | [6](#6-keywords-within-the-extension-description) |
| Web Client for Xiaohongshu | 1,000 | pcbppejbcaaoiaiddaglpphkmfkodhkn | [1](#1-different-extension-name), [5](#5-keywords-at-the-end-of-extension-description) |
| Classic Dark Theme - Night Mode | 2,000,000 | pdpfhanekfkeijhemmfbnnjffiblgefi | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Shopify Scraper - Shopify Store Scraper & spy | 1,000 | pehfmekejnhfofdjabaalbnanmpgjcdn | [1](#1-different-extension-name), [2](#2-different-short-description), [3](#3-using-competitors-names) |
| Screen Editor | 869 | pehmgdedmhpfophbaljpcloeaihhnkhk | [6](#6-keywords-within-the-extension-description) |
| Bulk WA Number Checker & Validator & Search & lookup | 310 | pepdpaiacpcgjoapmhehgmjcicninpgf | [1](#1-different-extension-name), [6](#6-keywords-within-the-extension-description) |
| Email Extractor | 2,000 | pgckgjnbljjlgbedbicefldnkpeehgdo | [1](#1-different-extension-name), [3](#3-using-competitors-names) |
| Adblock for YouTube™ | 30,000 | pginoclcfbhkoomedcodiclncajkkcba | [3](#3-using-competitors-names), [4](#4-considerably-more-extensive-extension-description) |
| Site Blocker - Block Site & Focus Mode | 1,000,000 | pgoeobojimoocdnilcajmjihiabcmabn | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Dark Mode - Midnight Chrome | 1,000 | pidmkmoocippkppbgebgjhnmgkhephlb | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description), [5](#5-keywords-at-the-end-of-extension-description) |
| Save Image As PNG | 1,000 | piigjafeabajlmjkcmcemimcoaekbjmh | [1](#1-different-extension-name), [2](#2-different-short-description) |
| ChatGPT-The Future | 2,000 | pijagnpcnegcogimkghghdihobbeaicn | [4](#4-considerably-more-extensive-extension-description), [6](#6-keywords-within-the-extension-description) |
| Safe3 safe browsing | 900,000 | pimlkaibgdfmbenlhmbjllfkbcfhfnjg | [1](#1-different-extension-name), [2](#2-different-short-description) |
| Fishing Frenzy Games | 4,000 | pkanjcjckofmachobaedghimjboglcjf | [6](#6-keywords-within-the-extension-description) |
| Fortnite Wallpapers | 7,000 | pnmfgeifakoehoojepggpigbkkfolbmk | [6](#6-keywords-within-the-extension-description) |
| Best Cursors - Bloom of Custom Cursor | 100,000 | pnpapokldhgeofbkljienpjofgjkafkm | [1](#1-different-extension-name), [2](#2-different-short-description), [4](#4-considerably-more-extensive-extension-description) |
| Naruto Live Wallpaper | 10,000 | ppemmflajcphagebjphjfoggjcbmgpim | [6](#6-keywords-within-the-extension-description) |