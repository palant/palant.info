---
categories:
- security
- privacy
- add-ons
- google
date: 2024-10-30T14:03:06+0100
description: A bunch of malicious extensions in Chrome Web Store have hidden affiliate
  fraud functionality, collect users’ browsing profiles, or both. These extensions
  appear to be connected to the Karma shopping assistant, developed by Karma Shopping
  Ltd. which is not a small company.
lastmod: '2024-11-13 08:27:30'
title: The Karma connection in Chrome Web Store
---

Somebody [brought to my attention](https://gist.github.com/c0m4r/45e15fc1ec13c544393feafca30e74de) that the Hide YouTube Shorts extension for Chrome changed hands and turned malicious. I looked into it and could confirm that it contained two undisclosed components: one performing [affiliate fraud](https://www.investopedia.com/terms/a/affiliate-fraud.asp) and the other sending users’ every move to some Amazon cloud server. But that wasn’t all of it: I discovered eleven more extensions written by the same people. Some contained only the affiliate fraud component, some only the user tracking, some both. A few don’t appear to be malicious yet.

While most of these extensions were supposedly developed or bought by a person without any other traces online, one broke this pattern. Karma shopping assistant has been on Chrome Web Store since 2020, the company behind it founded in 2013. This company employs more than 50 people and secured tons of cash in venture capital. Maybe a mistake on my part?

After looking thoroughly this explanation seems unlikely. Not only does Karma share some backend infrastructure and considerable amounts of code with the malicious extensions. Not only does Karma Shopping Ltd. admit to selling users’ browsing profiles in their privacy policy. There is even more tying them together, including a mobile app developed by Karma Shopping Ltd. whereas the identical Chrome extension is supposedly developed by the mysterious evildoer.

{{< img src="karma.png" width="718" alt="Screenshot of the karmanow.com website, with the Karma logo visible and a yellow button “Add to Chrome - It’s Free”" />}}

{{< toc >}}

## The affected extensions

Most of the extensions in question changed hands relatively recently, the first ones in the summer of 2023. The malicious code has been added immediately after the ownership transfer, with some extensions even requesting additional privileges citing bogus reasons. A few extensions have been developed this year by whoever is behind this.

Some extensions from the latter group don’t have any obvious malicious functionality at this point. If there is tracking, it only covers the usage of the extension’s user interface rather than the entire browsing behavior. This can change at any time of course.

| Name | Weekly active users | Extension ID | Malicious functionality |
|------|--------------------:|--------------|-------------------------|
| Hide YouTube Shorts | 100,000 | aljlkinhomaaahfdojalfmimeidofpih | Affiliate fraud, browsing profile collection |
| DarkPDF | 40,000 | cfemcmeknmapecneeeaajnbhhgfgkfhp | Affiliate fraud, browsing profile collection |
| Sudoku On The Rocks | 1,000 | dncejofenelddljaidedboiegklahijo | Affiliate fraud |
| Dynamics 365 Power Pane | 70,000 | eadknamngiibbmjdfokmppfooolhdidc | Affiliate fraud, browsing profile collection |
| Israel everywhere | 70 | eiccbajfmdnmkfhhknldadnheilniafp | – |
| Karma \| Online shopping, but better | 500,000 | emalgedpdlghbkikiaeocoblajamonoh | Browsing profile collection |
| Where is Cookie? | 93 | emedckhdnioeieppmeojgegjfkhdlaeo | – |
| Visual Effects for Google Meet | 1,000,000 | hodiladlefdpcbemnbbcpclbmknkiaem | Affiliate fraud |
| Quick Stickies | 106 | ihdjofjnmhebaiaanaeeoebjcgaildmk | – |
| Nucleus: A Pomodoro Timer and Website Blocker | 20,000 | koebbleaefghpjjmghelhjboilcmfpad | Affiliate fraud, browsing profile collection |
| Hidden Airline Baggage Fees | 496 | kolnaamcekefalgibbpffeccknaiblpi | Affiliate fraud |
| M3U8 Downloader | 100,000 | pibnhedpldjakfpnfkabbnifhmokakfb | Affiliate fraud |

**Update** (2024-11-11): Hide YouTube Shorts, DarkPDF, Nucleus and Hidden Airline Baggage Fees have been taken down. Two of them have been marked as malware and one as violating Chrome Web Store policies, meaning that existing extension users will be notified. I cannot see the reason for different categorization, the functionality being identical in all of these extensions. The other extensions currently remain active.

## Hiding in plain sight

Whoever wrote the malicious code chose not to obfuscate it but to make it blend in with the legitimate functionality of the extension. Clearly, the expectation was that nobody would look at the code too closely. So there is for example this:

```js
if (window.location.href.startsWith("http") ||
    window.location.href.includes("m.youtube.com")) {
  …
}
```

It *looks* like the code inside the block would only run on YouTube. Only when you stop and consider the logic properly you realize that it runs on every website. In fact, that’s the block wrapping the calls to malicious functions.

The malicious functionality is split between content script and background worker for the same reason, even though it could have been kept in one place. This way each part looks innocuous enough: there is some data collection in the content script, and then it sends a `check_shorts` message to the background worker. And the background worker “checks shorts” by querying some web server. Together this just *happens* to send your entire browsing history into the Amazon cloud.

Similarly, there are some complicated checks in the content script which eventually result in a `loadPdfTab` message to the background worker. The background worker dutifully opens a new tab for that address and, strangely, closes it after 9 seconds. Only when you sort through the layers it becomes obvious that this is actually about adding an affiliate cookie.

And of course there is a bunch of usual complicated conditions, making sure that this functionality is not triggered too soon after installation and generally doesn’t pop up reliably enough that users could trace it back to this extension.

## Affiliate fraud functionality

The affiliate fraud functionality is tied to the `kra18.com` domain. When this functionality is active, the extension will regularly download data from `https://www.kra18.com/v1/selectors_list?&ex=90` (90 being the extension ID here, the server accepts eight different extension IDs). That’s a long list containing 6,553 host names:

{{< img src="selectors.png" width="325" alt="Screenshot of JSON data displayed in the browser. The selectors key is expanded, twenty domain names like drinkag1.com are visible in the list." />}}

Whenever one of these domains is visited and the moons are aligned in the right order, another request to the server is made with the full address of the page you are on. For example, the extension could request `https://www.kra18.com/v1/extension_selectors?u=https://www.tink.de/&ex=90`:

{{< img src="affiliate_link.png" width="573" alt="Screenshot of JSON data displayed in the browser. There are keys shortsNavButtonSelector, url and others. The url key contains a lengthy URL from awin1.com domain." />}}

The `shortsNavButtonSelector` key is another red herring, the code only *appears* to be using it. The important key is `url`, the address to be opened in order to set the affiliate cookie. And that’s the address sent via `loadPdfTab` message mentioned before if the extension decides that right now is a good time to collect an affiliate commission.

There are also additional “selectors,” downloaded from `https://www.kra18.com/v1/selectors_list_lr?&ex=90`. Currently this functionality is only used on the `amazon.com` domain and will replace some product links with links going through `jdoqocy.com` domain, again making sure an affiliate commission is collected. That domain is owned by Common Junction LLC, an affiliate marketing company that published a [case study](https://www.cj.com/case-study/shoptagr-cj-publisher-onboarding-team-case-study) on how their partnership with Karma Shopping Ltd. (named Shoptagr Ltd. back then) helped drive profits.

## Browsing profile collection

Some of the extensions will send each page visit to `https://7ng6v3lu3c.execute-api.us-east-1.amazonaws.com/EventTrackingStage/prod/rest`. According to the extension code, this is an Alooma backend. Alooma is a data integration platform which has been acquired by Google a while ago. Data transmitted could look like this:

{{< img src="tracking.png" width="488" alt="Screenshot of query string parameters displayed in Developer Tools. The parameters are: token: sBGUbZm3hp, timestamp: 1730137880441, user_id: 90, distinct_id: 7796931211, navigator_language: en-US, referrer: https://www.google.com/, local_time: Mon Oct 28 2024 18:51:20 GMT+0100 (Central European Standard Time), event: page_visit, component: external_extension, external: true, current_url: https://example.com/" />}}

Yes, this is sent for each and every page loaded in the browser, at least after you’ve been using the extension for a while. And `distinct_id` is my immutable user ID here.

But wait, it’s a bit different for the Karma extension. Here you can opt out! Well, that’s only if you are using Firefox because Mozilla is rather strict about unexpected data collection. And if you manage to understand what “User interactions” means on this options page:

{{< img src="karma_options.png" width="575" alt="Screenshot of an options page with two switches labeled User interactions and URL address. The former is described with the text: Karma is a community of people who are working together to help each other get a great deal. We collect anonymized data about coupon codes, product pricing, and information about Karma is used to contribute back to the community. This data does not contain any personably identifiable information such as names or email addresses, but may include data supplied by the browser such as url address." />}}

Well, I may disagree with the claim that [url addresses do not contain personably identifiable information](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/). And: yes, this is the entire page. There really isn’t any more text.

The data transmitted is also somewhat different:

{{< img src="tracking2.png" width="495" alt="Screenshot of query string parameters displayed in Developer Tools. The parameters are: referrer: https://www.google.com/, current_url: https://example.com/, browser_version: 130, tab_id: 5bd19785-e18e-48ca-b400-8a74bf1e2f32, event_number: 1, browser: chrome, event: page_visit, source: extension, token: sBGUbZm3hp, version: 10.70.0.21414, timestamp: 1730138671937, user_id: 6372998, distinct_id: 6b23f200-2161-4a1d-9400-98805c17b9e3, navigator_language: en-US, local_time: Mon Oct 28 2024 19:04:31 GMT+0100 (Central European Standard Time), ui_config: old_save, save_logic: rules, show_k_button: true, show_coupon_scanner: true, show_popups: true" />}}

The `user_id` field no longer contains the extension ID but my personal identifier, complementing the identifier in `distinct_id`. There is a `tab_id` field adding more context, so that it is not only possible to recognize which page I navigated to and from where but also to distinguish different tabs. And some more information about my system is always useful of course.

## Who is behind this?

Eleven extensions on my list are supposedly developed by a person going by the name Rotem Shilop or Roni Shilop or Karen Shilop. This isn’t a very common last name, and if this person really exists it managed to leave no traces online. Yes, I also searched in Hebrew. Yet one extension is developed by Karma Shopping Ltd. (formerly Shoptagr Ltd.), a company based in Israel with at least 50 employees. An accidental association?

It doesn’t look like it. I’m not going into the details of shared code and tooling, let’s just say: it’s very obvious that all twelve extensions are being developed by the same people. Of course, there is still the possibility that the eleven malicious extensions are not associated directly with Karma Shopping but with some rogue employee or contractor or business partner.

However, it isn’t only the code. As [explained above](#browsing-profile-collection), five extensions including Karma share the same tracking backend which is found nowhere else. They are even sending the same access token. Maybe this backend isn’t actually run by Karma Shopping and they are only one of the customers of some third party? Yet if you look at the data being sent, clearly the Karma extension is considered first-party. It’s the other extensions which are sending `external: true` and `component: external_extension` flags.

Then maybe Karma Shopping is merely buying data from a third party, without actually being affiliated with their extensions? Again, this is possible but unlikely. One indicator is the `user_id` field in the data sent by these extensions. It’s the same extension ID that they use for internal communication with the `kra18.com` server. If Karma Shopping were granting a third party access to their server, wouldn’t they assign that third party some IDs of their own?

And those affiliate links produced by the `kra18.com` server? Some of them clearly mention `karmanow.com` as the affiliate partner.

{{< img src="affiliate_link2.png" width="855" alt="Screenshot of JSON data displayed in the browser. url key is a long link pointing to go.skimresources.com. sref query parameter of the link is https://karmanow.com. url query parameter of the link is www.runinrabbit.com." />}}

Finally, if we look at Karma Shopping’s mobile apps, they develop two of them. In addition to the Karma app, the app stores also contain an app called “Sudoku on the Rocks,” developed by Karma Shopping Ltd. Which is a very strange coincidence because an identical “Sudoku on the Rocks” extension also exists in the Chrome Web Store. Here however the developer is Karen Shilop. And Karen Shilop chose to include hidden affiliate fraud functionality in their extension.

By the way, guess who likes the Karma extension a lot and left a five-star review?

{{< img src="review.png" width="631" alt="Screenshot of a five-star review by Rona Shilop with a generic-looking avatar of woman with a cup of coffee. The review text says: Thanks for making this amazing free extension. There is a reply by Karma Support saying: We’re so happy to hear how much you enjoy shopping with Karma." />}}

I contacted Karma Shopping Ltd. via their public relations address about their relationship to these extensions and the Shilop person but didn’t hear back so far.

**Update** (2024-10-30): An extension developer told me that they were contacted on multiple independent occasions about selling their Chrome extension to Karma Shopping, each time by C-level executives of the company, from official `karmanow.com` email addresses. The first outreach was in September 2023, where Karma was supposedly looking into adding extensions to their portfolio as part of their growth strategy. They offered to pay between $0.2 and $1 per weekly active user.

**Update** (2024-11-11): Another hint pointed me towards [this GitHub issue](https://github.com/ArshSB/DarkPDF/issues/11). While the content has been removed here, you can still see the original content in the edit history. It’s the author of the Hide YouTube Shorts extension asking the author of the DarkPDF extension about that Karma company interested in buying their extensions.

## What does Karma Shopping want with the data?

It is obvious why Karma Shopping Ltd. would want to add their affiliate functionality to more extensions. After all, affiliate commissions are their line of business. But why collect browsing histories? Only to publish [semi-insightful articles on people’s shopping behavior](https://jonathan-65927.medium.com/far-from-being-impulsive-buyers-millennials-agonize-over-online-purchases-bc0dbbf5f2ba)?

Well, let’s have a look at [their privacy policy](https://www.karmanow.com/privacy) which is actually meaningful for a change. Under 1.3.4 it says:

> **Browsing Data.** In case you a user of our browser extensions we may collect data regarding web browsing data, which includes web pages visited, clicked stream data and information about the content you viewed.
>
> **How we Use this Data.** We use this Personal Data (1) in order to provide you with the Services and feature of the extension and (2) we will share this data in an aggregated, anonymized manner, for marketing research and commercial use with our business partners.
>
> **Legal Basis.** (1) We process this Personal Data for the purpose of providing the Services to you, which is considered performance of a contract with you. (2) When we process and share the aggregated and anonymized data we will ask for your consent.

First of all, this tells us that Karma collecting browsing data is official. They also openly state that they are selling it. Good to know and probably good for their business as well.

As to the legal basis: I am no lawyer but I have a strong impression that they don’t deliver on the “we will ask for your consent” promise. No, not even that Firefox options page qualifies as informed consent. And this makes this whole data collection rather doubtful in the light of GDPR.

There is also a difference between anonymized and pseudonymized data. The data collection seen here is pseudonymized: while it doesn’t include my name, there is a persistent user identifier which is still linked to me. It is usually fairly easy to deanonymize pseudonymized browsing histories, e.g. because people tend to visit their social media profiles rather often.

Actually anonymized data would not allow associating it with any single person. This is very hard to achieve, and we’ve seen [promises of aggregated and anonymized data go very wrong](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/). While it’s theoretically possible that Karma correctly anonymizes and aggregates data on the server side, this is a rather unlikely outcome for a company that, as [we’ve seen above](#browsing-profile-collection), confuses the lack of names and email addresses with anonymity.

But of course these considerations only apply to the Karma extension itself. Because related extensions like Hide YouTube Shorts just straight out lie:

{{< img src="privacy.png" width="494" alt="Screenshot of a Chrome Web Store listing. Text under the heading Privacy: The developer has disclosed that it will not collect or use your data." />}}

Some of these extensions actually used to have a privacy policy before they were bought. Now only three still have an identical and completely bogus privacy policy. Sudoku on the Rocks happens to be among these three, and the same privacy policy is linked by the Sudoku on the Rocks mobile apps which are officially developed by Karma Shopping Ltd.