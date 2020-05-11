---
categories:
- kaspersky
- security
- privacy
- antivirus
date: 2019-11-27 12:53:53
description: Three more vulnerabilities allowed websites to uninstall browser extensions,
  track users across Private Browsing session or even different browsers and control
  some functionality of Kaspersky software.
image: kaspersky-shattered.jpeg
lastmod: '2019-11-29 10:10:37'
title: 'More Kaspersky vulnerabilities: uninstalling extensions, user tracking, predictable
  links'
---

I'm discuss three more vulnerabilities in Kaspersky software such as Kaspersky Internet Security 2019 here, all exploitable by arbitrary websites. These allowed websites to uninstall browser extensions, track users across Private Browsing session or even different browsers and control some functionality of Kaspersky software. As of Patch F for 2020 products family and Patch I for 2019 products family all of these issues should be resolved.

{{< img src="kaspersky-shattered.jpeg" width="600" alt="Kaspersky functionality shattered" />}}

*Note*: This is the high-level overview. If you want all the technical details you can find them [here](/2019/11/27/assorted-kaspersky-vulnerabilities/). There are also older articles on Kaspersky vulnerabilities: [Internal Kaspersky API exposed to websites](/2019/11/26/internal-kaspersky-api-exposed-to-websites/) and [Kaspersky in the Middle - what could possibly go wrong?](/2019/08/19/kaspersky-in-the-middle-what-could-possibly-go-wrong/)

{{< toc >}}

## Uninstalling browser extensions in Chrome

The Kaspersky Protection browser extension for Google Chrome (but not the one for Mozilla Firefox) has some functionality allowing it to uninstall other browser extensions. While I didn't see this functionality in action, presumably it's supposed to be used when one of your installed extensions is found to be malicious. As I noticed in December 2018, this functionality could be commanded by any website, so websites could trigger uninstallation of ad blocking extensions for example.

{{< img src="removal_prompt.png" alt="Prompt displayed by the browser when Kaspersky Protection tries to remove another extension" width="348" />}}

Luckily, Chrome doesn't let extensions uninstall other browser extensions without asking the user to confirm. The only extension that can be uninstalled silently is Kaspersky Protection itself. For other extensions, websites would have to convince the user into accepting the prompt above -- e.g. by making them think that the legitimate extension is actually malicious, with "Kaspersky Protection" mentioned in the prompt lending them some credibility.

Kaspersky initially claimed to have resolved this issue in July 2019. It turned out however that the issue hasn't been addressed at all. Instead, my page to demonstrate the issue has been blacklisted as malicious in their antivirus engine. Needless to say, this didn't provide any protection whatsoever, changing a single character was sufficient to circumvent the blacklisting.

The second fix went out a few weeks ago and mostly addressed the issue, this time for real. It relied on a plain HTTP (not HTTPS) website being trustworthy however, not something you can rely on when connected to a public network for example. That remaining issue is supposedly addressed by the final patch which is being rolled out right now.

## Unique user identifiers once again

In August this year Heise Online [demonstrated](https://www.heise.de/ct/artikel/Kasper-Spy-Kaspersky-Anti-Virus-puts-users-at-risk-4496138.html) how Kaspersky software provided websites with a user identifier that was unique to the particular system. This identifier would always be present and unchanged, even if you cleared cookies, used Private Browsing mode or switched browsers. So it presented a great way for websites to track even the privacy-conscious users -- a real privacy disaster.

After reading the news I realized that I saw Kaspersky software juggle more unique user identifiers that websites could use for tracking. Most of them have already been defused by the same patch that fixed the vulnerability reported by Heise Online. They overlooked one such value however, so websites could still easily get hold of a system-specific identifier that would never go away.

{{< img src="tracking_id.png" alt="Tracking ID displayed by a website, based on Kaspersky's data" width="432" />}}

After being notified about the issue in August, Kaspersky resolved it with their November patch. As far as I can tell, now there really are no values left that could be used for tracking users.

## Predictable control links

When using Kaspersky software, you might occasionally see Kaspersky's warning pages in your browser. This will especially be the case if a secure connection has been messed with and cannot be trusted.

{{< img src="certwarning_kaspersky.png" alt="Certificate warning page when Kaspersky is installed" width="750" />}}

There is an "I understand the risks" link here which will override the warning. It's almost never a good idea to use it, and the fact that Kaspersky places it so prominently on this page is an issue by itself. But I noticed a bigger issue here: this was a regular link that would trigger some special action in the Kaspersky application. And the application would generate these control links using a very simple pattern, allowing websites to predict what future links would look like.

With this knowledge, somebody could mess with your connection to google.com for example and then override the Kaspersky warning, with the application merely displaying a meaningless generic warning to you. Or a website could permanently disable Safe Money protection on a banking website. Phishing warnings could also be disabled in this way without the user noticing. And quite a bit of other functionality relied on these control links.

I notified Kaspersky about this issue in December 2018, it was resolved in July 2019. The links used by current versions of Kaspersky applications can no longer be predicted. However, the most prominent action on a warning page is still "Let me pretend to know what I'm doing and ignore this warning!"
