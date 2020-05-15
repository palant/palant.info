---
categories:
- avast
- privacy
- security
- antivirus
date: 2020-01-08 13:35:06
description: Despite their claims that there is no privacy issue, Avast has made considerable
  changes to the Online Security extension. The current versions are much more privacy-friendly.
lastmod: '2020-01-16 09:43:23'
title: Avast complies to respect users' privacy
---

December last year has been an interesting month in Avast-land. After my [investigation into Avast's data collection practices](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/) didn't attract any attention initially, [Mozilla and Opera removed Avast's browser extensions from their respective add-on stores](/2019/12/03/mozilla-removes-avast-extensions-from-their-add-on-store-what-will-google-do/) immediately after I reported them. Google spent two weeks evaluating the issue but eventually did the same. The matter of Avast selling users' data even [attracted attention of high-level politicians](https://www.vice.com/en_us/article/v744v9/senator-ron-wyden-asks-avast-selling-users-browsing-data).

{{< img src="avast.png" alt="Avast watching you while browsing the web" width="600" />}}

Avast's official communication throughout that month was nothing short of amazing. I found it hard to believe that a company could keep denying any wrongdoing despite all the evidence to the contrary. Avast's CEO Ondrej Vlcek even [gave an interview to the Forbes magazine](https://www.forbes.com/sites/thomasbrewster/2019/12/09/are-you-one-of-avasts-400-million-users-this-is-why-it-collects-and-sells-your-web-habits/) where he claimed that there was no privacy scandal here. Users clearly disagreed, and so did most journalists. But the company's stance didn't change: all the data collected is necessary to protect users, and selling it later without user's agreement is completely unproblematic due to the data being "anonymized."

So when on December 22nd they finally brought out updated versions of their extensions, I was very curious to see what they changed other than [writing a usable privacy policy](https://addons.mozilla.org/addon/avast-online-security/privacy/). The updates have been accepted by all browser vendors and, at the time of writing, all four extensions are available for Firefox and Chrome. The Opera Add-ons site currently lists three extensions, with Avast Online Security still missing.

Let's say this much up front: the changes are far more extensive and far more convincing than I would have expected. While Chrome and Opera versions appear identical however, there are some additional changes in the Firefox version. That's presumably to comply with stricter privacy requirements of the Mozilla Add-ons site.

**Update (2020-01-10)**: Avast contacted me to clarify the situation. One piece of information stood out here: "we completely discontinued the practice of using any data from the browser extensions for any other purpose than the core security engine." In other words, Avast isn't merely doing the bare minimum required to comply with store policies, they completely give up collecting too much data via their browser extensions and they won't share this data with anybody either. That's a massive privacy improvement for any Avast users out there. The open question is whether this policy change also applies to the Avast SafePrice extension and Avast Secure Browser. I'll update the post again once I have the answer. **Update (2020-01-16)**: The quoted statement from Avast seemed unambiguous, yet further communication established that sharing data with Jumpshot is going to be opt-in functionality for users of the free antivirus application. It's still an improvement of course but quite different from the initial statement. As to Avast SafePrice and Avast Secure Browser, improvements are expected here in future. Supposedly, the data collected by these was never used, a statement that is impossible to validate.

Just to be clear: with the large codebases and without any official information from Avast I might have overlooked some of the changes. On Firefox I looked at Avast Online Security 19.4.426, on Chrome at Avast Online Security 19.4.433 and on Opera at AVG Online Security 19.4.433.

{{< toc >}}

## The bogus consent screen

One change is very obvious when you install the Firefox extension. Upon installation the extension will open this consent screen:

{{< img src="consent_screen.png" width="539" alt="Consent screen asking permission to look at web addresses" />}}

Currently, this only happens if you install Avast Online Security from Mozilla Add-ons website. That's because the antivirus application installs an older version of the extension, and the consent screen isn't displayed on updates. I assume however that installs via the antivirus application will also produce this consent screen once a new version of the application is available. Chrome and Opera extensions generally won't show this screen.

But that doesn't really matter. Do you think that clicking "No thanks" here will switch the extension to a privacy friendly mode? No, the extension will rather drop dead and suggest that the user uninstalls it. This consent screen satisfies [Mozilla's requirement to have any URL collection be strictly opt-in](https://extensionworkshop.com/documentation/publish/add-on-policies/#data-disclosure-collection-and-management) but the user does not really having a choice here. Luckily, this isn't the only change.

## The "share data with Jumpshot" setting

**Update (2020-01-10)**: This section originally discussed an "Allow usage data to be shared with Jumpshot with analytics" setting only visible to Firefox users. As mentioned above, Avast no longer wants to share extension data with Jumpshot or other third parties. According to them, having this setting still present in the Firefox extension was an oversight and has been corrected in Avast Online Security 19.4.434.

{{< img src="jumpshot_setting.png" width="280" alt="Setting named 'Allow usage data to be shared with Jumpshot with analytics'" />}}

In previous versions this setting was called "Allow usage data to be shared with 3rd parties for analytics." When analyzing the extension before I didn't really understand what this setting was doing, because changing it showed so little effect and because of the misleading internal name `communityIQ`. As I realize now, this setting (and the setting of the same name in the antivirus application) was responsible for the fact that I didn't see user identifiers being sent to the servers under some conditions.

This setting still exists internally in the current version of the extension. It is off by default however and will only be switched on if the Avast antivirus application is installed and data sharing is allowed there.

{{< img src="antivirus_setting.png" width="510" alt="Setting named 'Allow usage data to be shared with 3rd parties for analysis of trends, business, and marketing'" />}}

Since the settings of the Avast antivirus application are quite extensive: this particular setting can be found under General &gt; Personal Privacy.

## The new data collection practices

If you are a Firefox user, things are quite simple: only minimal data will be sent to Avast now. In addition to the full page address, that data includes information about the extension and the browser you are using.

It's the same with Chrome and Opera users who didn't agree to share data with third parties, only a minimal amount of data is sent. If they accepted to share their data however, the extension will send [the same data set as previous versions](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/#what-data-is-being-sent) to the Avast servers.

This is a considerable improvement to the previous versions where the "share data" setting had a very limited effect. When unchecked it would ensure that user identifiers are omitted, but otherwise all data would be sent along with a `dnl` flag (short for "do not log"). Also, this setting was on by default, particularly for users who never installed the antivirus application and hence couldn't deny data collection on its consent screen.

**Update (2020-01-10)**: Regardless of the browser used, the latest extension versions will now always set the `dnl` flag. That's different from Avast Online Security 19.4.426 for Firefox that I looked at two days ago. According to Avast, this flag no longer serves a purpose and will go away eventually.

## What does the "dnl" flag do?

Since the `dnl` flag is being processed on the server side, we can only speculate about what it does. It would be logical to assume that it is being processed according to its name: if data comes in with a request that has the `dnl` flag set, that data is only used to produce a response but nothing is stored. Given that previous versions of Avast extensions were setting this flag as well and at least users of the Avast antivirus application have seen a consent screen asking them to allow data usage, it would make the whole issue a much smaller one.

There are some oddities here however which make me doubt whether the logical assumption is the correct one. First are the official statements by Avast in reaction to this issue being raised. If data was being shared with Jumpshot only for the users who agreed to it, why not say so? Even if the users have no way to validate this claim, it's still a much stronger statement than "the data is anonymized, nothing to be concerned about."

<strike>And if the `dnl` flag is being considered correctly by the server, why is it always set for Chrome and Opera users? With the majority of Avast users on Chrome, I don't think that Avast would give up so much data intentionally. So it must be a bug, one that has been in production for more than two weeks now. Even with the holiday season, somebody certainly would have noticed a sharp decline in the number of data samples collected? With data being so important to Avast's business, they certainly would have rushed a fix?</strike>

**Update (2020-01-10)**: The speculation in the paragraph above is incorrect, the `dnl` flag always being set is intentional and not a bug. That's in line with Avast's decision to stop sharing data with third parties. So I am now more inclined to believe that historically the `dnl` flag indeed caused data to be discarded at some point, ideally before this data was passed on to Jumpshot.

## And the shopping helpers?

I didn't spend too much time investigating Avast SafePrice. This extension being a shopping helper, it apparently cannot be expected to be too privacy-friendly. So there is no "data sharing" setting and no `dnl` flag here. Merely a bogus consent screen was added on Firefox: "either you allow us to collect all this data or the extension won't be usable." To add insult to injury, the extension won't remember you declining or closing this consent screen, so when you restart your browser it will simply assume consent.

{{< img src="consent_screen_safeprice.png" width="352" alt="Consent screen asking for access to an extensive set of data" />}}

At least I noticed one change to the data collection practices. While the data collected here is still quite extensive and will always contain a unique user identifier as well as window and tab identifiers for example, the page address is now being shortened to contain protocol and host name only. At least that much.

**Update (2020-01-10)**: I clarified that the consent screen is required by Mozilla's policies. There has been a number of other corrections based on information provided by Avast, these are marked separately.

**Update (2020-01-16)**: Avast's statement above has been extended based on further communication.
