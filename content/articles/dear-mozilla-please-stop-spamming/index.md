---
categories:
- mozilla
date: 2019-04-03 19:26:47
description: Detailing Mozilla's failures to send newsletters only to users who actually
  opted in.
lastmod: '2019-04-05 08:18:50'
title: Dear Mozilla, please stop spamming!
---

Dear Mozilla, of course I learned about your new file sharing project from the news. But it seems that you wanted to be really certain, so today I got this email:

<p style="margin-left: 20px; margin-right: 20px;">{{< img "mozilla_spam.png" "Email screenshot" 828 >}}</p>

Do you still remember how I opted out of all your emails last year? Luckily, I know that email preferences of all your users are managed via [Mozilla Basket](https://basket.readthedocs.io/) and I also know how to retrieve raw data. So here it is:

<p style="margin-left: 20px; margin-right: 20px;">{{< img "basket_data.png" "Screenshot of Basket data" 415 >}}</p>

It clearly says that I've opted out, so you didn't forget. So why do you keep sending me promotional messages?

This isn't your only issue however. A year ago I reported a [security issue in Mozilla Basket](https://bugzil.la/1446612) (not publicly accessible). The essence is that subscribing anybody to Mozilla's newsletters is trivial even if that person opted out previously. The consensus in this bug seems to be that this is "working as expected." This cannot seriously be it, right?

Now there is some legislation that is IMHO being violated here, e.g. the CAN-SPAM Act and GDPR. And your privacy policy ends with the email address one can contact to report compliance issues. So I did.

<p style="margin-left: 20px; margin-right: 20px;">{{< img "mozilla_bounce.png" "Screenshot of Mozilla's bounce mail" 957 >}}</p>

Oh well...