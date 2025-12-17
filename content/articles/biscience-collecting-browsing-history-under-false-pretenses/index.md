---
author: Anonymous Researcher
categories:
- add-ons
- privacy
- google
date: 2025-01-13T13:57:04+0100
description: BIScience is a long-established data broker that owns multiple extensions
  in the Chrome Web Store (CWS) that collect clickstream data under false pretenses.
  They also provide a software development kit (SDK) to partner third-party extension
  developers to collect and sell clickstream data from users, again under false pretenses.
lastmod: '2025-12-17 16:56:32'
original: false
title: 'BIScience: Collecting browsing history under false pretenses'
---

* This is a guest post by a researcher who wants to remain anonymous. You can contact the author [via email](mailto:extension.agent604@passinbox.com).
{.post-copyright}

Recently, John Tuckner of Secure Annex and Wladimir Palant published [great research](https://secureannex.com/blog/sclpfybn-moneitization-scheme/) about how BIScience and its various brands collect user data. This inspired us to publish part of our ongoing research to help the extension ecosystem be safer from bad actors.

This post details what BIScience does with the collected data and how their public disclosures are inconsistent with actual practices, based on evidence compiled over several years.

{{< img src="biscience-website.png" width="600" alt="Screenshot of a website citing a bunch of numbers: 10 Million+ opt-in panelists globally and growing, 60 Global Markets, 4.5 Petabyte behavioral data collected monthly, 13 Months average retention time of panelists, 250 Million online user events per day, 2 Million eCommerce product searches per day, 10 Million keyword searches recorded daily, 400 Million unique domains tracked daily">}}
  Screenshot of claims on the BIScience website
{{< /img >}}

{{< toc >}}

## Who is BIScience?

BIScience is a long-established data broker that owns multiple extensions in the Chrome Web Store (CWS) that collect clickstream data under false pretenses. They also provide a software development kit (SDK) to partner third-party extension developers to collect and sell clickstream data from users, again under false pretenses. This SDK will send data to `sclpfybn.com` and other endpoints controlled by BIScience.

"Clickstream data" is an analytics industry term for "browsing history". It consists of every URL users visit as they browse the web.

According to their website, BIScience "provides the deepest digital & behavioral data intelligence to market research companies, brands, publishers & investment firms". They sell clickstream data through their [Clickstream OS](https://www.biscience.com/clickstreamos/) product and sell derived data under other product names.

BIScience owns AdClarity. They provide "advertising intelligence" for companies to monitor competitors. In other words, they have a large database of ads observed across the web. They use data collected from services operated by BIScience and third parties they partner with.

BIScience also owns Urban Cyber Security. They provide VPN, ad blocking, and safe browsing services under various names: Urban VPN, 1ClickVPN, Urban Browser Guard, Urban Safe Browsing, and Urban Ad Blocker. Urban collects user browsing history from these services, which is then sold by BIScience to third parties through Clickstream OS, AdClarity, and other products.

BIScience also owned GeoSurf, a residential proxy service that shut down in December 2023.

### BIScience collects data from millions of users

BIScience is a huge player in the browser extension ecosystem, based on their own claims and our observed activity. They also collect data from other sources, including Windows apps and Android apps that spy on other running apps.

The websites of BIScience and AdClarity make the following claims:
* They collect data from 25 million users, over 250 million user events per day, 400 million unique domains
* They process 4.5 petabytes of data every month
* They are the "largest human panel based ad intelligence platform"

These numbers are the most recent figures from all pages on their websites, not only the home pages. They have consistently risen over the years based on archived website data, so it's safe to say any lower figures on their website are outdated.

## BIScience buys data from partner third-party extensions

BIScience proactively contacts extension developers to buy clickstream data. They claim to buy this data in anonymized form, and in a manner compliant with Chrome Web Store policies. Both claims are demonstrably false.

Several third-party extensions integrate with BIScience's SDK. Some are listed in the Secure Annex [blog post](https://secureannex.com/blog/sclpfybn-moneitization-scheme/), and we have identified more in the [IOCs section](#iocs). There are additional extensions which use their own custom endpoint on their own domain, making it more difficult to identify their sale of user data to BIScience and potentially other data brokers. Secure Annex identifies October 2023 as the earliest known date of BIScience integrations. Our evidence points to 2019 or earlier.

Our internal data shows the Visual Effects for Google Meet extension and other extensions collecting data since at least mid-2022. BIScience has likely been collecting data from extensions since 2019 or earlier, based on public GitHub posts by BIScience representatives ([2021](https://github.com/120Studio/120home/issues/22), [2021](https://github.com/RaeAtBiscience/RaeAtBiscience/blob/main/ME.me), [2022](https://github.com/Rae1223/monetisation)) and the 2019 [DataSpii research](https://arstechnica.com/information-technology/2019/07/dataspii-inside-the-debacle-that-dished-private-data-from-apple-tesla-blue-origin-and-4m-people/) that found some references to AdClarity in extensions. BIScience was founded in 2009 when they launched GeoSurf. They later [launched AdClarity](https://techcrunch.com/2012/02/16/adclarity-launch/) in 2012.

## BIScience receives raw data, not anonymized data

Despite BIScience's claims that they only acquire anonymized data, their own extensions send raw URLs, and third-party extensions also send raw URLs to BIScience. Therefore BIScience collects granular clickstream data, not anonymized data.

If they meant to say that they only use/resell anonymized data, that's not comforting either. BIScience receives the raw data and may store, use, or resell it as they choose. They may be compelled by governments to provide the raw data, or other bad actors may compromise their systems and access the raw data. In general, collecting more data than needed increases risks for user privacy.

Even if they anonymize data as soon as they receive it, anonymous clickstream data can contain sensitive or identifying information. A notable example is the [Avast-Jumpshot case](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/) discovered by Wladimir Palant, who also wrote a [deep dive](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/) into why anonymizing browsing history is very hard.

As the [U.S. FTC investigation found](https://www.ftc.gov/legal-library/browse/cases-proceedings/2023033-avast), Jumpshot stored unique device IDs that did not change over time. This allowed reidentification with a sufficient number of URLs containing identifying information or when combined with other commercially-available data sources.

Similarly, BIScience's collected browsing history is also tied to a unique device ID that does not change over time. A user's browsing history may be tied to their unique ID for years, making it easier for BIScience or their buyers to perform reidentification.

BIScience's [privacy policy](https://www.biscience.com/privacy/) states granular browsing history information is sometimes sold with unique identifiers (emphasis ours):
> In most cases the Insights are shared and [sold] in an aggregated non-identifying manner, however, *in certain cases we will sell or share the insights with a general unique identifier*, this identifier does not include your name or contact information, it is a random *serial number associated with an End Users’ browsing activity*. However, in certain jurisdictions this is considered Personal Data, and thus, we treat it as such.

## Misleading CWS policies compliance

When you read the Chrome Web Store privacy disclosures on every extension listing, they say:
> This developer declares that your data is
> * Not being sold to third parties, outside of [approved use cases](https://developer.chrome.com/docs/webstore/program-policies/limited-use/)
> * Not being used or transferred for purposes that are unrelated to the item's core functionality
> * Not being used or transferred to determine creditworthiness or for lending purposes

You might wonder:
1. How is BIScience allowed to sell user data from their own extensions to third parties, through AdClarity and other BIScience products?
2. How are partner extensions allowed to sell user data to BIScience, a third party?

BIScience and partners take advantage of loopholes in the Chrome Web Store policies, mainly exceptions listed in the [Limited Use policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use/) which are the "approved use cases". These exceptions appear to allow the transfer of user data to third parties for *any* of the following purposes:
> * if necessary to providing or improving your single purpose;
> * to comply with applicable laws;
> * to protect against malware, spam, phishing, or other fraud or abuse; or,
> * as part of a merger, acquisition or sale of assets of the developer after obtaining explicit prior consent from the user

The Limited Use policy later states:
> All other transfers, uses, or sale of user data is completely prohibited, including:
> * Transferring, using, or selling data for personalized advertisements.
> * Transferring or selling user data to third parties like advertising platforms, data brokers, or other information resellers.
> * Transferring, using, or selling user data to determine credit-worthiness or for lending purposes.

BIScience and partner extensions develop user-facing features that _allegedly_ require access to browsing history, to claim the "necessary to providing or improving your single purpose" exception. They also often implement safe browsing or ad blocking features, to claim the "protect against malware, spam, phishing" exception.

Chrome Web Store appears to interpret their policies as allowing the transfer of user data, if extensions claim Limited Use exceptions through their privacy policy or other user disclosures. Unfortunately, bad actors _falsely_ claim these exceptions to sell user data to third parties.

This is despite the [CWS User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq#ques_12) stating (emphasis ours):
> 12. Can my extension collect web browsing activity not necessary for a user-facing feature, such as collecting behavioral ad-targeting data or other monetization purposes? \
> No. The Limited Uses of User Data section states that an extension can only collect and transmit web browsing activity to the extent required for a user-facing feature that is prominently described in the Chrome Web Store page and user interface. *Ad targeting or other monetization of this data isn't for a user-facing feature*. And, *even if a user-facing feature required collection of this data, its use for ad targeting or any other monetization of the data wouldn't be permitted* because the Product is only permitted to use the data for the user-facing feature.

In other words, even if there is a "legitimate" feature that collects browsing history, the same data cannot be sold for profit.

Unfortunately, when we and other researchers ask Google to enforce these policies, they appear to lean towards giving bad actors the benefit of the doubt and allow the sale of user data obtained under false pretenses.

We have the ~~receipts~~ contracts, emails, and more to prove BIScience and partners transfer and sell user data in a "completely prohibited" manner, primarily for the purpose of "transferring or selling user data to third parties like advertising platforms, data brokers, or other information resellers" with intent to monetize the data.

### BIScience extensions exception claims

Urban products (owned by BIScience) appear to provide ad blocking and safe browsing services, both of which may claim the "protect against malware, spam, phishing" exception. Their VPN products (Urban VPN, 1ClickVPN) may claim the "necessary to providing single purpose" exception.

These exceptions are abused by BIScience to collect browsing history data for prohibited purposes, because they also sell this user data to third parties through AdClarity and other BIScience products. There are ways to provide these services without processing raw URLs in servers, therefore they do not need to collect this data. They certainly don't need to sell it to third parties.

Reputable ad blocking extensions, such as Adblock Plus, perform blocking solely on the client side, without sending every URL to a server. Safe browsing protection can also be performed client side or in a more [privacy-preserving manner](https://security.googleblog.com/2024/03/blog-post.html) even when using server-side processing.

### Partner extensions exception claims, guided by BIScience

Partner third-party extensions collect data under even worse false pretenses. Partners are _encouraged_ by BIScience to implement bogus services that exist solely to collect and sell browsing history to BIScience. These bogus features are only added to claim the Limited Use policy exceptions.

We analyzed several third-party extensions that partner with BIScience. None have legitimate business or technical reasons to collect browsing history and sell it to BIScience.

BIScience provides partner extensions with two integration options: They can add the BIScience SDK to automatically collect data, or partners can send their self-collected data to a BIScience API endpoint or S3 bucket.

The consistent message from the documents and emails provided by BIScience to our sources is essentially this, in our own words: _You can integrate our SDK or send us browsing history activity if you make a plausible feature for your existing extension that has nothing to do with your actual functionality that you have provided for years. And here are some [lies you can tell CWS](https://github.com/milesrichardson/testing-extmon/blob/ff4492da1098da0ca2ae1853ae5aebca3659ad28/unpacked/hodiladlefdpcbemnbbcpclbmknkiaem/README.md#how-to-explain-to-google-why-we-need-such-permissions) to justify the collection._

#### BIScience SDK
The SDKs we have observed provide either safe browsing or ad blocking features, which makes it easy for partner extensions to claim the "protect against malware, spam, phishing" exception.

The SDK checks raw URLs against a BIScience service hosted on `sclpfybn.com`. With light integration work, an extension can allege they offer safe browsing protection or ad blocking. We have not evaluated how effective this safe browsing protection is compared to reputable vendors, but we suspect it performs minimal functionality to pass casual examination. We confirmed this endpoint also collects user data to resell it, which is unrelated to the safe browsing protection.

#### Unnecessary features

Whether implemented through the SDK or their own custom integration, the new "features" in partner extensions were completely unrelated to the extension's existing core functionality. All the analyzed extensions had working core functionality before they added the BIScience integrations.

Let's look at this _illuminating_ graphic, sent by BIScience to one of our sources:

{{< img src="biscience-graphic.png" width="611" alt="A block diagram titled “This feature, whatever it may be, should justify to Google Play or Google Chrome, why you are looking for access into users url visits information.” The scheme starts with a circle labeled “Get access to user’s browsing activity.” An arrow points towards a rectangle labeled “Send all URLs, visited by user, to your backend.” An arrow points to a rhombus labeled “Does the particular URL meets some criteria?” An asterisk in the rhombus points towards a text passage: “The criteria could fall under any of your preferences: -did you list the URL as malware? -is the URL a shopping website? -does the URL contain sensitive data? -is the URL travel related? etc.” An arrow labeled “No” points to a rectangle labeled “Do nothing; just store the URL and meta data.” An arrow labeled “Yes” points to a rectangle labeled “Store URL and meta data; provide related user functionality.” Both the original question and yes/no paths are contained within a larger box labeled “User functionality” but then have arrows pointing to another rectangle outside that box labeled “Send the data to Biscience endpoint.”" />}}

Notice how the graphic shows raw URLs are sent to BIScience regardless of whether the URL is needed to provide the user functionality, such as safe browsing protection. The step of sending data to BIScience is explicitly outside and separate from the user functionality.

#### Misleading privacy policy disclosures

BIScience's integration guide suggests changes to an extension's privacy policy in an attempt to comply with laws and Chrome Web Store policies, such as:
> Company does not sell or rent your personal data to any third parties. We do, however, need to share your personal data to run our everyday business. We share your personal data with our affiliates and third-party service providers for everyday business purposes, including to:
> * Detect and suggest to close malware websites;
> * Analytics and Traffic Intelligence

This and other suggested clauses contradict each other or are misleading to users.

Quick fact check:
* Extension doesn't sell your personal data: **False**, the main purpose of the integration with BIScience is to sell browsing history data.
* Extension _needs_ to share your personal data: **False**, this is not necessary for everyday business. Much less for veiled reasons such as malware protection or analytics.

An astute reader may also notice BIScience considers browsing history data as personal data, given these clauses are meant to disclose transfer of browsing history to BIScience.

#### Misleading user consent

BIScience's contracts with partners require opt-in consent for browsing history collection, but in practice these consents are misleading at best. Each partner must write their own consent prompt, which is not provided by BIScience in the SDK or documentation.

As an example, the extension Visual Effects for Google Meet integrated the BIScience safe browsing SDK to develop a new "feature" that collects browsing history:

{{< img src="visual-effects-popup.png" width="400" alt="Screenshot of a pop-up titled “Visual Effects is now offering Safe-Meeting.” The text says: “To allow us to enable integrated anti-mining and malicious site protection for the pages you visit please click agree to allow us access to your visited websites. Any and all data collected will be strictly anonymous.” Below it a prominent button with the label “Agree” and a much smaller link labeled “Disagree.”" />}}

We identified other instances of consent prompts that are even more misleading, such as a vague "To continue using our extension, please allow web history access" within the main product interface. This was only used to obtain consent for the BIScience integration and had no other purpose.

## Our hope for the future

When you read the Chrome Web Store privacy disclosures on every extension listing, you might be inclined to believe the extension isn't selling your browsing history to a third party. Unfortunately, Chrome Web Store allows this if extensions pretend they are collecting "anonymized" browsing history for "legitimate" purposes.

Our hope is that Chrome Web Store closes these loopholes and enforces stricter parts of the existing Limited Use and Single Purpose policies. This would align with the Chrome Web Store principles of [Be Safe, Be Honest, and Be Useful](https://developer.chrome.com/docs/webstore/program-policies/#be-safe).

If they don't close these loopholes, we want CWS to clarify existing privacy disclosures shown to all users in extension listings. These disclosures are currently insufficient to communicate that user data is being sold under these exceptions.

Browser extension users deserve better privacy and transparency.

## Related reading

If you want to learn more about browser extensions collecting your browsing history for profit:

* [Technical details of BIScience data collection](https://secureannex.com/blog/sclpfybn-moneitization-scheme/) by John Tuckner of Secure Annex
* [Avast Online Security and Avast Secure Browser are spying on you](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/) by Wladimir Palant
* [Avast's broken data anonymization approach](/2020/01/27/avasts-broken-data-anonymization-approach/) by Wladimir Palant
* [Insights from Avast/Jumpshot data: Pitfalls of data anonymization](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/) by Wladimir Palant
* [Most other articles about Add-Ons by Wladimir Palant](/categories/add-ons/)
* [U.S. FTC investigation into Avast/Jumpshot](https://www.ftc.gov/legal-library/browse/cases-proceedings/2023033-avast)
* [Motherboard and PCMag investigation into Avast/Jumpshot](https://www.vice.com/en/article/avast-antivirus-sells-user-browsing-data-investigation/)
* [2019 DataSpii research](https://arstechnica.com/information-technology/2019/07/dataspii-inside-the-debacle-that-dished-private-data-from-apple-tesla-blue-origin-and-4m-people/) by [Sam Jadali](https://securitywithsam.com/2019/07/dataspii-leak-via-browser-extensions/). This case involved Nacho Analytics, another analytics company using clickstream data.


## IOCs

The Secure Annex [blog post](https://secureannex.com/blog/sclpfybn-moneitization-scheme/) publicly disclosed many domains related to BIScience. We have observed additional domains over the years, and have included all the domains below.

We have chosen not to disclose some domains used in custom integrations to protect our sources and ongoing research.

Collection endpoints seen in third-party extensions:
* sclpfybn[.]com
* tnagofsg[.]com

Collection endpoints seen in BIScience-owned extensions and software:
* urban-vpn[.]com
* ducunt[.]com
* adclarity[.]com

Third-party extensions which have disclosed in their privacy policies that they share raw browsing history with BIScience (credit to Wladimir Palant for identifying these):
* sandvpn[.]com
* getsugar[.]io

Collection endpoints seen in online data, software unknown but likely in third-party software:
* cykmyk[.]com
* fenctv[.]com

Collection endpoint in third-party software, identified in 2019 DataSpii research:
* pnldsk[.]adclarity[.]com