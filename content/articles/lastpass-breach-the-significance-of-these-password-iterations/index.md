---
categories:
- lastpass
- security
- password-managers
date: 2022-12-28T17:02:28+0100
description: The Password Iterations setting is essential to keep users’ data secure.
  Yet LastPass failed to keep it up-to-date for many accounts.
lastmod: '2022-12-28 21:17:47'
title: 'LastPass breach: The significance of these password iterations'
---

LastPass has been breached, data has been stolen. I already [pointed out](/2022/12/26/whats-in-a-pr-statement-lastpass-breach-explained/) that their official statement is misleading. I also explained that [decrypting passwords in the stolen data is possible](/2022/12/23/lastpass-has-been-breached-what-now/) which doesn’t mean however that everybody is at risk now. For assessing whether you are at risk, a fairly hidden setting turned out critical: password iterations.

LastPass provides [an instruction to check this setting](https://support.lastpass.com/help/how-do-i-change-my-password-iterations-for-lastpass). One would expect it to be 100,100 (the LastPass default) for almost everyone. But plenty of people report having 5,000 configured there, some 500 and occasionally it’s even 1 (in words: one) iteration.

{{< img src="iterations.png" width="600" alt="Screenshot of LastPass preferences. The value in the Password Iterations field: 1" />}}

Let’s say this up front: this isn’t the account holders’ fault. It rather is a massive failure by LastPass. They have been warned, yet they failed to act. And even now they are failing to warn the users who they know are at risk.

{{< toc >}}

## What is this setting about?

This setting is actually central to protecting your passwords if LastPass loses control of your data (like they did now). Your passwords are encrypted. In order to decrypt them, the perpetrators need to guess your master password. The more iterations you have configured, the slower this guessing will be. The [current OWASP recommendation](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2) is 310,000 iterations. So the LastPass default is already factor three below the recommendation.

What’s the impact if you have an even lower iterations number configured? Let’s say you have a fairly strong master password, 50 bits of entropy. For example, it could be an eight character random password, with uppercase and lowercase letters, digits and even some special characters. Yes, such password is already rather hard to remember but you want your passwords to be secure.

Or maybe you went for a [diceware password](https://en.wikipedia.org/wiki/Diceware). You took a word list for four dices (1296 words) and you randomly selected five words for your master password.

Choosing a password with 50 bits entropy without it being randomized? No idea how one would do it. Humans are inherently bad at choosing strong passwords. You’d need a rather long password to get 50 bits, and you’d need to avoid obvious patterns like dictionary words.

Either way, if this is your password and someone got your LastPass vault, guessing your master password on a single graphics card would take on average 200 years. Not unrealistic (someone could get more graphics cards) but usually not worth the effort. But that’s the calculation for 100,100 iterations.

Let’s look at how time estimates and cost change depending on the number of iterations. I’ll be using the cost estimate by [Jeffrey Goldberg who works at 1Password](https://ioc.exchange/@jpgoldberg/109589071740635270).

| Iterations | Guessing time on a single GPU | Cost      |
|-----------:|-------------------------------|----------:|
| 100,100    | &nbsp;200 years               | $1,500,000|
| 5,000      | &nbsp;10 years                | $75,000   |
| 500        | &nbsp;1 year                  | $7,500    |
| 1          | &nbsp;17 hours                | $15       |

And that’s a rather strong password. According to [this older study](https://www.microsoft.com/en-us/research/wp-content/uploads/2006/11/www2007.pdf), the average password has merely 40 bits of entropy. So divide all numbers by 1,000 for that.

## How did the low iteration numbers come about?

The default for LastPass accounts wasn’t always 100,100 iterations. Originally it was merely 1 iteration. At some point this was changed to 500 iterations, later to 5,000. And the final change adjusted this value to 100,100 iterations.

I don’t know exactly when and how these changes happened. Except for the last one: it happened in February 2018 as a result of [my research](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/#cracking-the-encryption).

LastPass was notified through their bug bounty program on Bugcrowd. When they reported fixing the issue I asked them about existing accounts. That was on February 24th, 2018.

{{< img src="bugcrowd.png" width="870" alt="Screenshot from Bugcrowd. bobc sent a message (5 years ago): Ok thank you. Our default is now 100k rounds and artificial limits on number of rounds have been removed. palant sent a message (5 years ago) Yes, the default changed it seems. But what about existing accounts?" />}}

They didn’t reply. So I prompted them again in an email on March 15th and got the reply that the migration should take until end of May.

I asked again about the state of the migration on May 23rd. This time the reply was that the migration is starting right now and is expected to complete by mid-June.

On June 25th I was once again contacted by LastPass, asking me to delay disclosure until they finish migrating existing accounts. I replied asking whether the migration actually started now and got the response: yes, it did last week.

[My disclosure of the LastPass issues](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/) was finally published on July 9th, 2018. After all the delays requested by LastPass, [their simultaneously published statement](https://blog.lastpass.com/2018/07/lastpass-bugcrowd-update/) said:

> we are in the process of automatically migrating all existing LastPass users to the new default.

We can now safely assume that the migration wasn’t actually underway even at this point. One user reported receiving an email about their account being upgraded to a higher password iterations count, and that was mid-2019.

Worse yet, for reasons that are beyond me, LastPass didn’t complete this migration. My test account is still at 5,000 iterations, as are the accounts of many other users who checked their LastPass settings. LastPass would know how many users are affected, but they aren’t telling that.

In fact, it’s painfully obvious that LastPass never bothered updating users’ security settings. Not when they changed the default from 1 to 500 iterations. Not when they changed it from 500 to 5,000. Only my persistence made them consider it for their latest change. And they still failed implementing it consistently.

So we now have people report finding their accounts to be configured with 500 iterations. And for some it’s even merely one iteration. For example [here](https://social.treehouse.systems/@particles/109566045071178513). And [here](https://news.ycombinator.com/item?id=34152779). And [here](https://snabelen.no/@vegardlarsen/109575002998425618).

This is a massive failure on LastPass’ side, they failed to keep these users secure. They cannot claim ignorance. They had years to fix this. Yet they failed.

## What could LastPass do about it now?

There is one thing that LastPass could do easily: query their database for users who have less than 100,100 iterations configured and notify all of them. Obviously, these users are at heightened risk due to the LastPass breach. Some found out about it, most of them likely didn’t. So far, LastPass chose not to notify them.

Of course, LastPass could also deliver on their promise and fix the iterations count for the affected accounts. It won’t help with the current breach but at least it will better protect these accounts in future. So far this didn’t happen either.

Finally, LastPass could change the “Password Iterations” setting and make sure that nobody accidentally configures a value that is too low. It’s Security 101 that users shouldn’t be able to set settings to values that aren’t safe. But right now I changed the iterations count for my test account to 1 and I didn’t even get a warning about it.