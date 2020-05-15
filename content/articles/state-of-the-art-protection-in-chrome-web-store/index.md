---
categories:
- add-ons
- security
- privacy
date: 2019-09-09 14:04:00
description: Google will take down legitimate extensions in Chrome Web Store without
  prior notice and without clear instructions on how to get them published again.
  No problem as long as the bad guys are kept out?
lastmod: '2019-09-09 20:26:06'
title: State of the art protection in Chrome Web Store
---

All of you certainly know already that Google is guarding its Chrome Web Store vigilantly and making sure that no bad apples get in. So when you hit "Report abuse" your report will certainly be read carefully by another human being and acted upon ASAP. Well, eventually... maybe... [when it hits the news](/2018/04/18/the-ticking-time-bomb-fake-ad-blockers-in-chrome-web-store/). If it doesn't, then it probably wasn't important anyway and these extensions might stay up despite [being taken down by Mozilla three months ago](https://bugzilla.mozilla.org/show_bug.cgi?id=1557258).

{{< img src="canons.jpg" alt="Canons protecting an old fort" >}}
<em>Image by <a href="https://www.flickr.com/photos/34534185@N00" rel="nofollow">Sheba_Also</a></em>
{{< /img >}}

As to your legitimate extensions, these will be occasionally taken down as collateral damage in this fierce fight. Like my extension which was [taken down due to missing a screenshot](/2018/07/03/google-to-developers-we-take-down-your-extension-because-we-can/) because of not having any user interface whatsoever. It's not possible to give an advance warning either, like asking the developer to upload a screenshot within a week. This kind of lax policies would only encourage the bad guys to upload more malicious extensions without screenshots of course.

And the short downtime of a few weeks and a [few hours of developer time spent trying to find anybody capable of fixing the problem](https://github.com/AurelienLourot/google-input-tools-large-keyboard/issues/1) are surely a small price to pay for a legitimate extension in order to defend the privilege of staying in the exclusive club of Chrome extension developers. So I am actually proud that this time my other browser extension, PfP: Pain-free Passwords, was taken down by Google in its relentless fight against the bad actors.

Here is the email I've got:

{{< img src="mail.png" alt="Garbled text of Google's mail" width="856" />}}

Hard to read? That might be due to the fact that this plain text email was sent as `text/html`. A completely understandable mistake given how busy all Google employees are. We only need to copy the link to the policy here and we'll get this in a nicely formatted document.

{{< img src="privacy_policy_requirements.png" alt="Policy requiring privacy policy to be added to the designated field" width="680" />}}

So there we go. All I need to do is to write a privacy policy document for the extension which isn't collecting any data whatsoever, then link it from the appropriate field. Could it be so easy? Of course not, the bad guys would be able to figure it out as well otherwise. Very clever of Google not to specify which one the "designated field" is. I mean, if you publish extensions on Mozilla Add-ons, there is literally a field saying "Privacy Policy" there. But in Chrome Web Store you only get Title, Summary, Detailed Description, Category, Official Url, Homepage Url, Support Url, Google Analytics ID.

See what Google is doing here? There is really only one place where the bad guys could add their privacy policy, namely that crappy unformatted "Detailed Description" field. Since it's so unreadable, users ignore it anyway, so they will just assume that the extension has no privacy policy and won't trust it with any data. And as an additional bonus, "Detailed Description" isn't the designated field for privacy policy, which gives Google a good reason to take bad guys' extensions down at any time. Brilliant, isn't it?

In the meantime, PfP takes a vacation from Chrome Web Store. I'll let you know how this situation develops.

**Update** (2019-09-10): As commenter drawdrove points out, the field for the privacy policy actually exists. Instead of placing it under extension settings, Google put it in the overall developer settings. So all of the developer's extensions share the same privacy policy, no matter how different. Genius!

PfP is now back in Chrome Web Store. But will the bad guys also manage to figure it out?
