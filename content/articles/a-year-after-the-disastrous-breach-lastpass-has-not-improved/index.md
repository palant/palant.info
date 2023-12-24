---
categories:
- lastpass
- security
- password-managers
date: 2023-09-05T16:59:32+0200
description: A year after the breach, LastPass still failed to deliver useful mitigation
  steps. The technical issues haven’t been resolved either.
lastmod: '2023-12-24 19:53:23'
title: A year after the disastrous breach, LastPass has not improved
---

In September last year, a breach at LastPass’ parent company GoTo (formerly LogMeIn) culminated in attackers siphoning out all data from their servers. The criticism from the security community has been massive. This was not so much because of the breach itself, such things happen, but because of the many obvious ways in which LastPass made matters worse: taking months to notify users, failing to provide useful mitigation instructions, downplaying the severity of the attack, ignoring technical issues which have been publicized years ago and made the attackers’ job much easier. The list goes on.

Now this has been almost a year ago. LastPass promised to improve, both as far as their communication goes and on the technical side of things. So let’s take a look at whether they managed to deliver.

TL;DR: They didn’t. So far I failed to find evidence of any improvements whatsoever.

**Update** (2023-09-26): It looks like at least the issues listed under “Secure settings” are finally going to be addressed.

{{< img src="ship.jpg" width="600" alt="A very battered ship with torn sails in a stormy sea, on its side the ship’s name: LastPass" />}}

{{< toc >}}

## The communication

### The initial advisory

LastPass’ initial communication around the breach has been nothing short of a disaster. It happened more than three months after the users’ data was extracted from LastPass servers. Yet rather than taking responsibility and helping affected users, their PR statement was [designed to downplay and to shift blame](/2022/12/26/whats-in-a-pr-statement-lastpass-breach-explained/). For example, it talked a lot about LastPass’ secure default settings but failed to mention that LastPass never really enforced those. In fact, people who created their accounts a while ago and used very outdated (insecure) settings never saw as much as a warning.

The statement concluded with “There are no recommended actions that you need to take at this time.” I called this phrase “gross negligence” back when I initially wrote about it, and I still stand by this assessment.

### The detailed advisory

It took LastPass another two months of strict radio silence to publish a more detailed advisory. That’s where we finally [learned some more about the breach](/2023/02/28/lastpass-breach-update-the-few-additional-bits-of-information/). We also learned that business customers using Federated Login are [very much affected by the breach](https://medium.com/@chaim_sanders/its-all-bad-news-an-update-on-how-the-lastpass-breach-affects-lastpass-sso-9b4fa64466f6), the previous advisory explicitly denied that.

But even now, we learn that indirectly, in recommendation 9 out of 10 for LastPass’ business customers. It seems that LastPass considered generic stuff like advice on protecting against phishing attacks more important than mitigation of their breach. And then the recommendation didn’t actually say “You are in danger. Rotate K2 ASAP.” Instead, it said “If, based on your security posture or risk tolerance, you decide to rotate the K1 and K2 split knowledge components…” That’s the conclusion of a large pile of text essentially claiming that there is no risk.

At least the [advisory for individual users](https://support.lastpass.com/s/document-item?language=en_US&bundleId=lastpass&topicId=LastPass/security-bulletin-recommended-actions-free-premium-families.html&_LANG=enus) got the priorities right. It was master password first, iterations count after that, and all the generic advice at the end.

Except: they still failed to admit the scope of the breach. The advice was:

> Depending on the length and complexity of your master password and iteration count setting, you may want to reset your master password.

And this is just wrong. The breach already happened. Resetting the master password will help protect against future breaches, but it won’t help with the passwords already compromised. This advice should have really been:

> Depending on the length and complexity of your master password and iteration count setting, you may want to reset all your passwords.

But this would amount to saying “we screwed up big time.” Which they definitely did. But they still wouldn’t admit it.

### Improvements?

A [blog post by the LastPass CEO Karin Toubba](https://blog.lastpass.com/2023/03/security-incident-update-recommended-actions/) said:

> I acknowledge our customers’ frustration with our inability to communicate more immediately, more clearly, and more comprehensively throughout this event. I accept the criticism and take full responsibility. We have learned a great deal and are committed to communicating more effectively going forward.

As I’ve outlined above, the detailed advisory published simultaneously with this blog post still left a lot to be desired. But this sounds like a commitment to improve. So maybe some better advice has been published in the six months which passed since then?

No, this doesn’t appear to be the case. Instead, the detailed advisory moved to the “Get Started – About LastPass” section of their support page. So it’s now considered generic advice for LastPass users. Any specific advice on mitigating the fallout of the breach, assuming that it isn’t too late already? There doesn’t seem to be any.

The LastPass blog has been publishing lots of articles again, often multiple per week. There doesn’t appear to be any useful information at all here however, only PR. To add insult to injury, LastPass published an article in July titled “How Zero Knowledge Keeps Passwords Safe.” It gives a generic overview of zero knowledge which largely doesn’t apply to LastPass. It concludes with:

> For example, zero-knowledge means that no one has access to your master password for LastPass or the data stored in your LastPass vault, except you (not even LastPass).

This is bullshit. That’s not how LastPass has been designed, and I [wrote about it five years ago](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/). Other people did as well. LastPass didn’t care, otherwise this breach wouldn’t have been such a disaster.

## Secure settings

### The issue

LastPass likes to boast how their default settings are perfectly secure. But even assuming that this is true, what about the people who do not use their defaults? For example the people who created their LastPass account a long time ago, back when the defaults were different?

The iterations count is [particularly important](/2022/12/28/lastpass-breach-the-significance-of-these-password-iterations/). Few people have heard about it, it being hidden under “Advanced Settings.” Yet when someone tries to decrypt your passwords, this value is an extremely important factor. A high value makes successful decryption much less likely.

As of 2023, the current default value is 600,000 iterations. Before the breach the default used to be 100,100 iterations, making decryption of passwords six times faster. And before 2018 it was 5,000 iterations. Before 2013 it was 500. And before 2012 the default was 1 iteration.

What happened to all the accounts which were created with the old defaults? It appears that for most of these LastPass failed to fix the settings automatically. People didn’t even receive a warning. So when the breach happened, quite a few users reported having their account configured with 1 iteration, massively weakening the protection provided by the encryption.

It’s the same with the master password. In 2018 LastPass introduced much stricter master password rules, requiring at least 12 characters. While I don’t consider length-based criteria very effective to guide users towards secure passwords, LastPass failed to enforce even this rule for existing accounts. Quite a few people first learned about the new password complexity requirement when reading about the breach.

### Improvements?

I originally [asked LastPass about enforcing a secure iterations count setting for existing accounts](/2022/12/28/lastpass-breach-the-significance-of-these-password-iterations/#how-did-the-low-iteration-numbers-come-about) in February 2018. LastPass kept stalling until I published [my research](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/) without making certain that all users are secure. And they ignored this issue another four years until the breach happened.

And while the breach prompted LastPass to increase the default iterations count, they appear to be still ignoring existing accounts. I just logged into my test account and checked the settings:

{{< img src="iterations.png" width="669" alt="Screenshot of LastPass settings. “Password Iterations” setting is set to 5000." />}}

There is no warning whatsoever. Only if I try to change this setting, a message pops up:

> For your security, your master password iteration value must meet the LastPass minimum requirement: 600000

But people who are unaware of this setting will not be warned. And while LastPass definitely could update this setting automatically when people log in, they still choose not to do it for some reason.

It’s the same with the master password. The password of my test account is weak because this account has been created years ago. If I try to change it, I will be forced to choose a password that is at least 12 characters long. But as long as I just keep using the same password, LastPass won’t force me to change it – even though it definitely could.

There isn’t even a definitive warning when I log in. There is only this notification in the menu:

{{< img src="menu.png" width="276" alt="Screenshot of the LastPass menu. Security Dashboard has a red dot on its icon." />}}

Only after clicking “Security Dashboard” will a warning message show up:

{{< img src="alert.png" width="496" alt="Screenshot of a LastPass message titled “Master password alert.” The message text says: “Master password strength: Weak (50%). For your protection, change your master password immediately.” Below it a red button titled “Change password.”" />}}

If this is such a critical issue that I need to change my master password immediately, why won’t LastPass just tell me to do it when I log in?

This alert message apparently pre-dates the breach, so there don’t seem to be any improvements in this area either.

**Update** (2023-09-26): Last week LastPass sent out an email to all users:

{{< img src="email.png" alt="New master password requirements. LastPass is changing master password requirements for all users: all master passwords must meet a 12-character minimum. If your master password is less than 12-characters, you will be required to update it." width="534" />}}

According to this email, LastPass will start enforcing stronger master passwords at some unspecified point in future. Currently, this requirement is still not being enforced, and the email does not list a timeline for this change.

More importantly, when I logged into my LastPass account after receiving this email, the iterations count finally got automatically updated to 600,000. The email does not mention any changes in this area, so it’s unclear whether this change is being applied to all LastPass accounts this time.

Brian Krebs is [quoting LastPass CEO](https://infosec.exchange/@briankrebs/111111474807762193) with the statement: “We have been able to determine that a small percentage of customers have items in their vaults that are corrupt and when we previously utilized automated scripts designed to re-encrypt vaults when the master password or iteration count is changed, they did not complete.” Quite frankly, I find this explanation rather doubtful.

First of all, reactions to my articles indicate that the percentage of old LastPass accounts which weren’t updated is far from small. There are lots of users finding an outdated iterations count configured in their accounts, yet only two reported their accounts being automatically updated so far.

Second: my test account in particular is unlikely to contain “corrupted items” which previously prevented the update. Back in 2018 I changed the iterations count to 100,000 and back to 5,000 manually. This worked correctly, so no corruption was present at that point. The account was virtually unused after that except for occasional logins, no data changes.

## Unencrypted data

### The issue

LastPass PR likes to use “secure vault” as a description of LastPass data storage. This implies that all data is secured (encrypted) and cannot be retrieved without the knowledge of the master password. But that’s not the case with LastPass.

LastPass encrypts passwords, user names and a few other pieces of data. Everything else is unencrypted, in particular website addresses and metadata. That’s a very bad idea, as security researchers kept pointing out again and again. In [November 2015](https://www.blackhat.com/docs/eu-15/materials/eu-15-Vigo-Even-The-Lastpass-Will-Be-Stolen-deal-with-it.pdf) (page 67). In [January 2017](https://hackernoon.com/psa-lastpass-does-not-encrypt-everything-in-your-vault-8722d69b2032). In [July 2018](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/#the-encrypted-vault-myth). And there are probably more.

LastPass kept ignoring this issue. So when last year their data leaked, the attackers gained not only encrypted passwords but also plenty of plaintext data. Which LastPass was forced to admit but once again downplayed by claiming website addresses not to be sensitive data. And users were rightfully outraged.

### Improvements?

Today I logged into my LastPass account and then opened `https://lastpass.com/getaccts.php`. This gives you the XML representation of your LastPass data as it is stored on the server. And I fail to see any improvements compared to this data one year ago. I gave LastPass the benefit of the doubt and created a new account record. Still:

```xml
<account url="68747470733a2f2f746573742e6465" last_modified="1693940903" …>
```

The data in the `url` field is merely hex-encoded which can be easily translated back into `https://test.de`. And the `last_modified` field is a Unix timestamp, no encryption here either.

## Conclusions

A year after the breach, LastPass still hasn’t provided their customers with useful instructions on mitigating the breach, nor has it admitted the full scope of the breach. They also failed to address any of the long-standing issues that security researchers have been warning about for years. At the time of writing, owners of older LastPass accounts still have to become active on their own in order to fix outdated security settings. And much of LastPass data isn’t being encrypted.

I honestly cannot explain LastPass’ denial to fix security settings of existing accounts. Back when I was nagging them about it, they straight out lied to me. Don’t they have any senior engineers on staff, so that nobody can implement this change? Do they really not care as long as they can blame the users for not updating their settings? Beats me.

As to not encrypting all the data, I am starting to suspect that LastPass actually wants visibility into your data. Do they need to know which websites you have accounts on in order to guide some business decisions? Or are they making additional income by selling this data? I don’t know, but LastPass persistently ignoring this issue makes me suspicious.

Either way, it seems that LastPass considers the matter of their breach closed. They published their advisory in March this year, and that’s it. Supposedly, they improved the security of their infrastructure, which nobody can verify of course. There is nothing else coming, no more communication and no technical improvements. Now they will only be publishing more lies about “zero knowledge architecture.”