---
title: "Mozilla removes Avast extensions from their add-on store, what will Google do?"
date: 2019-12-03T09:47:02+01:00
description: The Avast extensions which were spying on their users are no longer available from Mozilla and Google add-on stores.
image: avast.png
categories:
  - privacy
  - avast
  - mozilla
  - google
---

A month ago I wrote about [Avast browser extensions being essentially spyware](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/). While this article only names Avast Online Security and AVG Online Security extensions, the browser extensions Avast SafePrice and AVG SafePrice show the same behavior: they upload detailed browsing profiles of their users to `uib.ff.avast.com`. The amount of data collected here exceeds by far what would be considered necessary or appropriate even for the security extensions, for the shopping helpers this functionality isn't justifiable at all.

{{< img src="avast.png" alt="Avast watching you while browsing the web" width="600" />}}

After I published my article I got the hint to look at Jumpshot, a company [acquired by Avast in 2013](https://press.avast.com/avast-software-acquires-jumpshot-to-work-magic-against-slow-pc-performance). And indeed, that suddenly made perfect sense. On their website, Jumpshot [praises](https://www.jumpshot.com/product/clickstream-data) its "clickstream data" product:

> Incredibly detailed clickstream data from 100 million global online shoppers and 20 million global app users. Analyze it however you want: track what users searched for, how they interacted with a particular brand or product, and what they bought. Look into any category, country, or domain.

That sounds exactly like the data that Avast collects from their SafePrice and Online Security users. Yes, you are the product -- even if you paid for that antivirus.

Spying on your users is clearly a violation of the terms that both Google and Mozilla make extension developers sign. So yesterday I reported these four extensions to Mozilla and Google. Mozilla immediately disabled the extension listings, so that these extensions can no longer be found on the Mozilla Add-ons site. Mozilla didn't blacklist the extensions however, stating that they are still talking to Avast. So for existing users these extensions will still be active and continue spying on the users.

And what about Google? The only official way to report an extension to them is the "report abuse" link. I used that one of course, but previous experience shows that it never has any effect. Extensions have only ever been removed from Chrome Web Store after considerable news coverage. Or does anybody have a contact at Google how would be able to help?

**Update** (2019-12-03): This article initially stated incorrectly that Google removed these extensions as well. This isn't currently the case, somehow I didn't look them up correctly.
