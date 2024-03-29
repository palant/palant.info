---
categories:
- lastpass
- security
- password-managers
date: 2022-12-26T12:12:02+0100
description: The LastPass statement on their latest breach is full of omissions, half-truths
  and outright lies. I’m providing the necessary context for some of their claims.
lastmod: '2023-02-28 14:06:00'
title: 'What’s in a PR statement: LastPass breach explained'
---

Right before the holiday season, LastPass published an [update on their breach](https://blog.lastpass.com/2022/12/notice-of-recent-security-incident/). As people have speculated, this timing was likely not coincidental but rather intentional to keep the news coverage low. Security professionals weren’t amused, this holiday season became a very busy time for them. LastPass likely could have prevented this if they were more concerned about keeping their users secure than about saving their face.

Their statement is also full of omissions, half-truths and outright lies. As I know that not everyone can see through all of it, I thought that I would pick out a bunch of sentences from this statement and give some context that LastPass didn’t want to mention.

{{< img src="statement.png" width="636" alt="Screenshot of the LastPass blog post: Update as of Thursday, December 22, 2022. To Our LastPass Community, We recently notified you that an unauthorized party gained access to a third-party cloud-based storage service, which LastPass uses to store archived backups of our production data. In keeping with our commitment to transparency, we want to provide you with an update regarding our ongoing investigation." />}}

Let’s start with the very first paragraph:

> In keeping with our commitment to transparency, we want to provide you with an update regarding our ongoing investigation.

In fact, this has little to do with any commitment. LastPass is actually required by US law to immediately disclose a data breach. We’ll soon see how transparent they really are in their statement.

> While no customer data was accessed during the August 2022 incident, some source code and technical information were stolen from our development environment and used to target another employee, obtaining credentials and keys which were used to access and decrypt some storage volumes within the cloud-based storage service.

LastPass is trying to present the August 2022 incident and the data leak now as two separate events. But using information gained in the initial access in order to access more assets is actually a typical technique used by threat actors. It is called lateral movement.

So the more correct interpretation of events is: we do not have a new breach now, LastPass rather failed to contain the August 2022 breach. And because of that failure people’s data is now gone. Yes, this interpretation is far less favorable of LastPass, which is why they likely try to avoid it.

Note also how LastPass avoids mentioning when this “target another employee” happened. It likely did already before they declared victory in September 2022, which also sheds a bad light on them.

> The cloud storage service accessed by the threat actor is physically separate from our production environment.

Is that supposed to be reassuring, considering that the cloud storage in question apparently had a copy of all the LastPass data? Or is this maybe an attempt to shift the blame: “It wasn’t our servers that the data has been lifted from”?

> To date, we have determined that once the cloud storage access key and dual storage container decryption keys were obtained, the threat actor copied information from backup that contained basic customer account information and related metadata including company names, end-user names, billing addresses, email addresses, telephone numbers, and the IP addresses from which customers were accessing the LastPass service.

We learn here that LastPass was storing your IP addresses. And since they don’t state how many they were storing, we have to assume: all of them. And if you are an active LastPass user, that data should be good enough to create a complete movement profile. Which is now in the hands of an unknown threat actor.

Of course, LastPass doesn’t mention this implication, hoping that the less tech-savvy users won’t realize.

There is another interesting aspect here: how long did it take to copy the data for millions of users? Why didn’t LastPass detect this *before* the attackers were done with it? We won’t learn that in their statement.

> The threat actor was also able to copy a backup of customer vault data from the encrypted storage container which is stored in a proprietary binary format that contains both unencrypted data, such as website URLs, as well as fully-encrypted sensitive fields such as website usernames and passwords, secure notes, and form-filled data.

Note how LastPass admits not encrypting website URLs but doesn’t group it under “sensitive fields.” But website URLs are very much sensitive data. Threat actors would *love* to know what you have access to. Then they could produce well-targeted phishing emails just for the people who are worth their effort.

Never mind the fact that some of these URLs have parameters attached to them. For example, LastPass will sometimes save password reset URLs. And occasionally they will still be valid. Oops…

None of this is new of course. LastPass has been warned again and again that not encrypting URLs and metadata is a very bad idea. In [November 2015](https://www.blackhat.com/docs/eu-15/materials/eu-15-Vigo-Even-The-Lastpass-Will-Be-Stolen-deal-with-it.pdf) (page 67). In [January 2017](https://hackernoon.com/psa-lastpass-does-not-encrypt-everything-in-your-vault-8722d69b2032). In [July 2018](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/#the-encrypted-vault-myth). And that’s only the instances I am aware of. They chose to ignore the issue, and they continue to downplay it.

> These encrypted fields remain secured with 256-bit AES encryption and can only be decrypted with a unique encryption key derived from each user’s master password using our Zero Knowledge architecture.

Lots of buzzwords here. 256-bit AES encryption, unique encryption key, Zero Knowledge architecture, all that sounds very reassuring. It masks over a simple fact: the only thing preventing the threat actors from decrypting your data is your master password. If they are able to guess it, the game is over.

> As a reminder, the master password is never known to LastPass and is not stored or maintained by LastPass.

Unless they (or someone compromising their servers) decide to store it. Because they absolutely could, and you wouldn’t even notice. E.g. when you enter your master password into the login form on their web page.

But it’s not just that. Even if you use their browser extension consistently, it will [fall back to their website for a number of actions](/2019/03/18/should-you-be-concerned-about-lastpass-uploading-your-passwords-to-its-server/). And when it does so, it will give the website your encryption key. For you, it’s impossible to tell whether this encryption key is subsequently stored somewhere.

None of this is news to LastPass. It’s a risk they repeatedly chose to ignore. And that they keep negating in their official communication.

> Because of the hashing and encryption methods we use to protect our customers, it would be extremely difficult to attempt to brute force guess master passwords for those customers who follow our password best practices.

This prepares the ground for blaming the customers. LastPass should be aware that passwords *will* be decrypted for at least some of their customers. And they have a convenient explanation already: these customers clearly didn’t follow their best practices.

We’ll see below what these best practices are and how LastPass is actually enforcing them.

> We routinely test the latest password cracking technologies against our algorithms to keep pace with and improve upon our cryptographic controls.

Sounds reassuring. Yet I’m aware of only one occasion where they adjusted their defaults: in 2018, when I pointed out that their defaults were [utterly insufficient](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/#cracking-the-encryption). Nothing changed after that, and they again are falling behind.

Now to their password best practices:

> Since 2018, we have required a twelve-character minimum for master passwords. This greatly minimizes the ability for successful brute force password guessing.

If you are a LastPass customer, chances are that you are completely unaware of this requirement. That’s because LastPass didn’t ask existing customers to change their master password. I had my test account since 2018, and even today I can log in with my eight-character password without any warnings or prompts to change it.

So LastPass required twelve characters for the past four years, but a large portion of their customer base likely still uses passwords not complying with this requirement. And LastPass will blame them should their data be decrypted as a result.

> To further increase the security of your master password, LastPass utilizes a stronger-than-typical implementation of 100,100 iterations of the Password-Based Key Derivation Function (PBKDF2), a password-strengthening algorithm that makes it difficult to guess your master password.

Note “stronger-than-typical” here. I seriously wonder what LastPass considers typical, given that 100,000 PBKDF2 iterations are the lowest number I’ve seen in any current password manager. And it’s also the lowest protection level that is still somewhat (barely) acceptable today.

In fact, OWASP currently [recommends 310,000 iterations](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2). LastPass hasn’t increased their default since 2018, despite modern graphics cards becoming much better at guessing PBKDF2-protected passwords in that time – at least by factor 7.

And that isn’t even the full story. In 2018 LastPass increased the default from 5,000 iterations to 100,100. But what happened to the existing accounts? Some have been apparently upgraded, while other people report still having 5,000 iterations configured. It’s unclear why these haven’t been upgraded.

In fact, my test account is also configured with 5,000 iterations. There is no warning when I log in. LastPass won’t prevent me from changing this setting to a similarly low value. LastPass users affected don’t learn that they are at risk. But they get blamed now for not keeping up with LastPass recommendations.

**Update** (2022-12-27): I’ve now seen comments from people who have their accounts configured to 500 iterations. I’m not even sure when this was the LastPass default, but they failed to upgrade people’s accounts back then as well. And now people’s data leaked with protection that is factor 620 (!!!) below what OWASP currently recommends. I am at loss of words at this utter negligence.

In fact, there is so far one confirmed case of an account configured with 1 (in words: one) iteration, which was apparently the LastPass default before they changed to 500. I’ll just leave this standing here.

> If you use the default settings above, it would take millions of years to guess your master password using generally-available password-cracking technology.

I’ll translate: “If you’ve done everything right, nothing can happen to you.” This again prepares the ground for blaming the customers. One would assume that people who “test the latest password cracking technologies” would know better than that. As I’ve calculated, even guessing a truly random password meeting their complexity criteria [would take less than a million years on average](/2022/12/23/lastpass-has-been-breached-what-now/#how-long-does-decrypting-passwords-take) using a single graphics card.

But human-chosen passwords are far from being random. Most people have trouble even remembering a truly random twelve-character password. An older survey found [the average password to have 40 bits of entropy](https://www.microsoft.com/en-us/research/wp-content/uploads/2006/11/www2007.pdf). Such passwords could be guessed in slightly more than two months on the same graphics card. Even an unusually strong password with 50 bits of entropy would take 200 years on average – not unrealistic for a high value target that somebody would throw more hardware on.

Another data point to estimate typical password strength: a [well-known XKCD comic](https://xkcd.com/936/) puts a typical “strong” password at 28 bits of entropy and a truly strong [diceware password](https://en.wikipedia.org/wiki/Diceware) at 44 bits. Guessing time on a single graphics card: on average 25 minutes and 3 years respectively.

The competitor 1Password solves this issue by adding a truly random factor to the encryption, a secret key. Some other password managers switched to key generation methods that are way harder to bruteforce than PBKDF2. LastPass did neither, failed to adjust parameters to modern hardware, and is now preparing to blame customers for this failure.

> There are no recommended actions that you need to take at this time. 

This is just gross negligence. There certainly are recommended actions to take, and not merely for people with overly simple master passwords or too low number of iterations. Sufficiently determined attackers will be able to decrypt the data for almost anyone. The question is merely whether it’s worth it for them.

So anybody who could be a high value target (activists, dissidents, company admins etc.) should strongly consider changing all their passwords right now. You could of course also consider switching to a competitor who in the case of a breach will be more concerned about keeping you safe than about saving their face.

> We have already notified a small subset (less than 3%) of our Business customers to recommend that they take certain actions based on their specific account configurations.

Presumably, that’s the accounts configured with 5,000 iterations, these are at risk and LastPass can easily determine that. But why notify only business customers? My test account for example is also configured with 5,000 iterations and I didn’t receive any notification.

Again, it seems that LastPass attempts to minimize the risk of litigation (hence alerting businesses) while also trying to prevent a public outcry (so not notifying the general public). Priorities…