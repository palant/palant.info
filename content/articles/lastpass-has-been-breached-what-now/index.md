---
categories:
- lastpass
- security
- password-managers
date: 2022-12-23T14:30:06+0100
description: You should be very concerned about the LastPass breach. Depending on
  who you are, now might be the right time to change your passwords.
lastmod: '2022-12-25 14:43:52'
title: 'LastPass has been breached: What now?'
---

If you have a LastPass account you should have received an email updating you on the state of affairs concerning a recent LastPass breach. While this email and the [corresponding blog post](https://blog.lastpass.com/2022/12/notice-of-recent-security-incident/) try to appear transparent, they don’t give you a full picture. In particular, they are rather misleading concerning a very important question: should you change all your passwords now?

{{< img src="email.png" width="547" alt="Screenshot of an email with the LastPass logo. The text: Dear LastPass Customer, We recently notified you that an unauthorized party was able to gain access to a third-party cloud-based storage service which is used by LastPass to store backups. Earlier today, we posted an update to our blog with important information about our ongoing investigation. This update includes details regarding our findings to date, recommended actions for our customers, as well as the actions we are currently taking." />}}

The following statement from the blog post is a straight-out lie:

> If you use the default settings above, it would take millions of years to guess your master password using generally-available password-cracking technology.

This makes it sound like decrypting the passwords you stored with LastPass is impossible. It also prepares the ground for blaming you, should the passwords be decrypted after all: you clearly didn’t follow the recommendations. Fact is however: decrypting passwords is expensive but it is well within reach. And you need to be concerned.

I’ll delve into the technical details below. But the executive summary is: it very much depends on who you are. If you are someone who might be targeted by state-level actors: danger is imminent and you should change all your passwords ASAP. You should also consider whether you still want them uploaded to LastPass servers.

If you are a regular “nobody”: access to your accounts is probably not worth the effort. Should you hold the keys to your company’s assets however (network infrastructure, HR systems, hot legal information), it should be a good idea to replace these keys now.

Unless LastPass underestimated the scope of the breach that is. If their web application has been compromised nobody will be safe. Happy holidays, everyone!

{{< toc >}}

## What happened really?

According to the LastPass announcement, “an unauthorized party gained access to a third-party cloud-based storage service, which LastPass uses to store archived backups of our production data.” What data? All the data actually: “company names, end-user names, billing addresses, email addresses, telephone numbers, and the IP addresses from which customers were accessing the LastPass service.” And of course:

> The threat actor was also able to copy a backup of customer vault data

That’s where your passwords are kept. Luckily, these are encrypted. Whether the encryption will hold is a different question, one that I’ll discuss below.

But first: one important detail is still missing. When did this breach happen? Given that LastPass now seems to know which employee was targeted to gain access, they should also know when it happened. So why not say it?

I can only see one explanation: it happened immediately after their August 2022 breach. After investigating that incident, in September 2022 LastPass concluded:

> Although the threat actor was able to access the Development environment, our system design and controls prevented the threat actor from accessing any customer data or encrypted password vaults.

I suspect that this conclusion was premature and what has been exposed now is merely the next step of the first breach which was already ongoing in September. Publishing the breach date would make it obvious, so LastPass doesn’t to save their face.

## How long does decrypting passwords take?

Whenever LastPass has a security incident they are stressing their Zero Knowledge security model. What it supposedly means:

> LastPass does not have any access to the master passwords of our customers’ vaults – without the master password, it is not possible for anyone other than the owner of a vault to decrypt vault data

Ok, let’s assume that indeed no master passwords have been captured (more on that below). This means that attackers will have to guess master passwords in order to decrypt stored passwords. How hard would that be?

The minimums requirements for a LastPass master password are:

* At least 12 characters long
* At least 1 number
* At least 1 lowercase letter
* At least 1 uppercase letter
* Not your email 

So “Abcdefghijk1” is considered perfectly fine as your master password, “lY0{hX3.bV” on the other hand is not.

Let’s look at the passwords meeting these exact baseline requirements. They consist of ten lowercase letters, one uppercase letter and one digit. If one were to generate such a password randomly, there were 4.8 · 10<sup>18</sup> possible passwords. This seems like a lot.

But it all stands and falls with the way the encryption key is derived from the master password. Ideally, it should be a very slow process which is hard to speed up. Unfortunately, the PBKDF2 algorithm used by LastPass is rather dated and can run very efficiently on a modern graphics card for example. I’ve already [explored this issue four years ago](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/#cracking-the-encryption). Back then my conclusion was:

> Judging by [these numbers](https://discourse.codinghorror.com/t/hacker-hack-thyself/5290/22), a single GeForce GTX 1080 Ti graphics card (cost factor: less than $1000) can be used to test 346,000 guesses per second.

In response to my concerns LastPass increased the number of PBKDF2 iterations from 5,000 to 100,100. That’s much better of course, but this graphics card can still test more than 17,000 guesses per second.

**Update** (2022-12-23): While LastPass changed the default in 2018, it seems that they never bothered changing the settings for existing accounts like I suggested. So there are still LastPass accounts around configured with 5,000 PBKDF2 iterations. The screenshot below shows my message on Bugcrowd from February 2018, so LastPass was definitely aware of the issue.

{{< img src="bugcrowd.png" width="870" alt="Screenshot from Bugcrowd. bobc sent a message (5 years ago): Ok thank you. Our default is now 100k rounds and artificial limits on number of rounds have been removed. palant sent a message (5 years ago) Yes, the default changed it seems. But what about existing accounts?" />}}

If someone tries to blindly test all the 4.8 · 10<sup>18</sup> possible passwords, a match will be found on average after 4,5 million years. Except that this graphics card is no longer state of the art. Judging by [these benchmark results](https://gist.github.com/Chick3nman/32e662a5bb63bc4f51b847bb422222fd), a current NVIDIA GeForce RTX 4090 graphics card could test more than 88,000 guesses per second!

And we are already down to on average “merely” 860 thousand years to guess a baseline LastPass password. No, not “millions of years” like LastPass claims. And that’s merely a single graphics card anyone could buy for $2000, it will be faster if someone is willing to throw more/better hardware at the problem.

But of course testing all the passwords indiscriminately is only an approach that makes sense for truly random passwords. Human-chosen passwords on the other hand are nowhere close to being random. That’s especially the case if your master password is on some list of previously leaked passwords like [this one](https://crackstation.net/crackstation-wordlist-password-cracking-dictionary.htm). More than a billion passwords? No problem, merely slightly more than four hours to test them all on a graphics card.

But even if you managed to choose a truly unique password, humans are notoriously bad at choosing (and remembering) good passwords. Password cracking tools like hashcat know that and will first test passwords that humans are more likely to choose. Even with the more complicated passwords humans can come up with, cracking them should take determined attackers months at most.

By the way: no, [diceware](https://en.wikipedia.org/wiki/Diceware) and similar approaches don’t automatically mean that you are on the safe side. The issue here is that word lists are necessarily short in order to keep the words easily rememberable. Even with a 7776 words dictionary which is on the large side already, a three words combination can on average be guessed in a month on a single graphics card. Only a four words password gives you somewhat reasonable safety, for something as sensitive as a password manager master password five words are better however.

**Update** (2022-12-23): Originally, the calculations above were done with 190,000 guesses per second rather than 88,000 guesses. I wrongly remembered that LastPass used PBKDF2-HMAC-SHA1, but it’s the somewhat slower PBKDF2-HMAC-SHA256.

### Possible improvements

The conclusion is really: PBKDF2 is dead for securing important passwords. Its performance barely changed on PC and mobile processors in the past years, so increasing the number of iterations further would introduce unreasonable delays for the users. Yet the graphics card performance skyrocketed, making cracking passwords much easier. This issue affects not merely LastPass but also the competitor 1Password for example.

Implementors of password managers should instead switch to modern algorithms like [scrypt](https://en.wikipedia.org/wiki/Scrypt) or [Argon2](https://en.wikipedia.org/wiki/Argon2). These have the important property that they cannot easily be sped up with specialized hardware. That’s a change that KeePass for example [implemented in 2017](https://keepass.info/news/n170109_2.35.html), I did the same for my password manager [a year later](https://github.com/palant/pfp/releases/tag/2.0.0).

## Does it mean that all passwords are compromised?

The good news: no, the above doesn’t mean that all passwords stored by LastPass should be considered compromised. Their database contains data for millions of users, and the key derivation process uses per-user salts (the user’s email address actually). Attempting to crack the encryption for all users would be prohibitively expensive.

The big question is: who is responsible for this breach? Chances are, it’s some state-level actor. This would mean that they have a list of accounts they want to target specifically. And they will throw significant resources at cracking the password data for these accounts. Which means: if you are an activist, dissident or someone else who might get targeted by a state-level adversary, the best time to change all your passwords was a month ago. The second best time is right now.

But there is also a chance that some cybercrime gang is behind this breach. These have little reason to invest significant hardware resources into getting your Gmail password, there are easier ways to get it such as phishing. They will rather abuse all the metadata that LastPass was storing unencrypted.

Unless of course you have access to something of value. For example, if your LastPass data contains the credentials needed to access your company’s Active Directory server, decrypting your passwords to compromise your company network might make it worthwhile. In that case you should also strongly consider changing your credentials.

By the way, how would the attackers know which “encrypted vaults” contain valuable information? I [mentioned it before](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/#the-encrypted-vault-myth): LastPass doesn’t actually encrypt everything in their “vault.” Passwords are encrypted but the corresponding page addresses are not. So seeing who holds the keys to what is trivial.

## But everyone else is safe, right?

The above assumes that the LastPass statement is correct and only the backup storage has been accessed. I’m far from certain that this is correct however. They’ve already underestimated the scope of the breach back in September.

The worst-case scenario is: some of their web application infrastructure could be compromised. When you use the LastPass web application, it will necessarily get the encryption key required to decrypt your passwords. Even if LastPass doesn’t normally store it, a manipulated version of the web application could send the encryption key to the attackers. And this would make the expensive guessing of the master password unnecessary, the passwords could be easily decrypted for everybody.

Note: you *are* using the web application, even if you always seem to use the LastPass browser extension. That’s because the browser extension will [fall back to the web application for many actions](/2019/03/18/should-you-be-concerned-about-lastpass-uploading-your-passwords-to-its-server/). And it will provide the web application with the encryption key when it does that. I’ve never looked into their Android app but presumably it behaves in a similar way.