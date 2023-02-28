---
categories:
- lastpass
- security
- password-manager
date: 2023-02-28T12:58:21+0100
description: LastPass breach was aided by lax security policy, allowing accessing
  critical data from a home computer. Also, companies implementing federated login
  are also affected by the breach, despite LastPass originally denying it.
lastmod: '2023-02-28 14:07:43'
title: 'LastPass breach update: The few additional bits of information'
---

Half a year after the LastPass breach started in August 2022, information on it remains sparse. It took until December 2022 for LastPass to admit losing their users’ partially encrypted vault data. This statement was [highly misleading](/2022/12/26/whats-in-a-pr-statement-lastpass-breach-explained/), e.g. making wrong claims about the protection level provided by the encryption. Some of the failures to protect users only became apparent after some time, such as [many accounts configured with a dangerously low password iterations setting](/2022/12/28/lastpass-breach-the-significance-of-these-password-iterations/), the company hasn’t admitted them to this day.

{{< img src="email.png" width="547" alt="Screenshot of an email with the LastPass logo. The text: Dear LastPass Customer, We recently notified you that an unauthorized party was able to gain access to a third-party cloud-based storage service which is used by LastPass to store backups. Earlier today, we posted an update to our blog with important information about our ongoing investigation. This update includes details regarding our findings to date, recommended actions for our customers, as well as the actions we are currently taking." />}}

Despite many questions being raised, LastPass maintained strict radio silence since December. Until yesterday they published [an article with details of the breach](https://support.lastpass.com/help/incident-2-additional-details-of-the-attack). If you were hoping to get answers: nope. If you look closely, the article again carefully avoids making definitive statements. There is very little to learn here.

TL;DR: The breach was helped by a lax security policy, an employee was accessing critical company data from their home computer. Also, contrary to what LastPass claimed originally, business customers using Federated Login Services are very much affected by this breach. In fact, the attackers might be able to decrypt company data without using any computing resources on bruteforcing master passwords.

{{< toc >}}

## The compromised senior DevOps engineer

According to LastPass, only four DevOps engineers had access to the keys required to download and decrypt LastPass backup data from Amazon Web Services (AWS). These keys were stored in the LastPass’ own corporate LastPass vault, with only these four people having access.

The attackers learned about that when they initially compromised LastPass in August 2022. So they specifically targeted one of these DevOps engineers and infected their home computer with a keylogger. Once this engineer used their home computer to log into the corporate LastPass vault, the attackers were able to access all the data.

While LastPass makes it sound like the employee’s fault, one has to ask: what kind of security policies allowed an employee to access highly critical company assets from their home computer? Was this kind of access sanctioned by the company? And if yes, e.g. as part of the Bring Your Own Device (BYOD) policy – what kind of security measures were in place to prevent compromise?

Also, in another transparent attempt to shift blame LastPass mentions a vulnerability in a third-party media software which was supposedly used for this compromise. LastPass does not mention either the software or the vulnerability, yet I highly doubt that the attackers burned a zero-day vulnerability. LastPass would certainly mention it if they did, as it supports their case of being overrun by highly sophisticated attackers.

However, [Ars Technica quotes an anonymous source](https://arstechnica.com/information-technology/2023/02/lastpass-hackers-infected-employees-home-computer-and-stole-corporate-vault/) claiming that the software in question was Plex media server. Plex has two known vulnerabilities potentially allowing remote code execution: CVE-2019-19141 and CVE-2018-13415. The former is unlikely to have been exploited because it requires an authenticated attacker, which leaves us with a vulnerability from 2018.

And that certainly explains why LastPass wouldn’t mention the specific vulnerability used. Yes, allowing an employee to access company secrets from a computer where they also run an at least four years old Plex version that is directly accessible from the internet – that’s pretty damning.

## Timeline of the breach

Other than that, we learn fairly little from the LastPass statement. In particular, the timeline of the breach remains unclear:

> the threat actor […] was actively engaged in a new series of reconnaissance, enumeration, and exfiltration activities aligned to the cloud storage environment spanning from August 12, 2022 to October 26, 2022.

What is the significance of these dates? Were these activities successful? What did they exfiltrate? When did LastPass detect that? Even after reading this and surrounding passages multiple times, this still isn’t clear to me.

If I have to guess, this is what the timeline of the events looks like:

1. The attackers initially breach LastPass on August 12, 2022.
2. Among other things, they manage to steal the AWS credentials but not the decryption keys.
3. They immediately start downloading data from AWS, hoping to get the decryption keys later.
4. Since valid credentials are used, LastPass only detects and stops the exfiltration on October 26, 2022.

And as we learned above, the attackers at some (unknown) point got the decryption keys from a senior DevOps engineer’s home computer. Which is all that they needed to get partially encrypted LastPass vault data of presumably all users – two months are more than enough time to download all of it.

Yes, I know that this interpretation of the events is probably the least favorable way of reading the statement. Given how LastPass only admits what they cannot avoid admitting, I expect this interpretation to be close to be the truth however.

## Bad news for business customers

Back in December, LastPass had good news for business customers:

> The threat actor did not have access to the key fragments stored in customer Identity Provider’s or LastPass’ infrastructure and they were not included in the backups that were copied that contained customer vaults. Therefore, if you have implemented the Federated Login Services, you do not need to take any additional actions.

As people pointed out, Super Admin accounts cannot be federated. So even businesses implementing Federated Login Services should have taken a closer look at their Super Admin accounts. That’s another issue LastPass failed to admit so far.

But that isn’t the biggest issue. As Chaim Sanders [noticed](https://medium.com/@chaim_sanders/its-all-bad-news-an-update-on-how-the-lastpass-breach-affects-lastpass-sso-9b4fa64466f6), LastPass’ recently published [recommendations for business customers](https://support.lastpass.com/help/security-bulletin-recommended-actions-for-business-administrators#topic_9) directly contradict their previous statements:

> The K2 component was exfiltrated by the threat actor as it was stored in the encrypted backups of the LastPass MFA/Federation Database for which the threat actor had decryption keys.

As Chaim Sanders explains, business accounts using Federated Login Services are using a “hidden master password” consisting of the parts K1 and K2. And now we learn that K2 was stored without any protection in the backups that the attackers exfiltrated – just like URLs in the vault data.

But at least the K1 component is safe, since that one is stored with the company, right? Well, it didn’t leak in the breach. However, Chaim Sanders points out that this part is identical for the entire company and can be trivially extracted by any employee.

So the attackers can compromise any of the company’s employees, similarly to how they compromised LastPass’ DevOps engineer. And they will get the K1 component, enabling them to decrypt the LastPass data for the entire company. No need to throw lots of computing resources on bruteforcing here.

Just read the [full article by Chaim Sanders](https://medium.com/@chaim_sanders/its-all-bad-news-an-update-on-how-the-lastpass-breach-affects-lastpass-sso-9b4fa64466f6), it’s really bad news for any company using LastPass. And to make matters worse, LastPass makes resetting K1 very complicated.

## Any security improvements?

While the LastPass statement goes to great lengths explaining how they want to prevent data from leaking again in the same way, something is suspiciously missing: improvements for the encryption of customer data. It’s great that LastPass wants to make exfiltrating their data harder in future, but why not make this data useless to the attackers?

Two issues would have been particularly easy to fix:

1. The new master password policy introduced in 2018 is not being enforced for existing accounts. So while new accounts need long master passwords, my old test account still goes with eight characters.
2. The password iterations setting hasn’t been updated for existing accounts, leaving some accounts configured with 1 iteration despite the default being 100,100 since 2018. My test account in particular is configured with 5,000 iterations which, quite frankly, shouldn’t even be a valid setting.

The good news: when I logged into LastPass today, I could see the Security Dashboard indicating new messages for me.

{{< img src="menu.png" width="276" alt="Screenshot of the LastPass menu. Security Dashboard has a red dot on its icon." />}}

Going there, I get a message warning me about my weak master password:

{{< img src="alert.png" width="496" alt="Screenshot of a LastPass message titled “Master password alert.” The message text says: “Master password strength: Weak (50%). For your protection, change your master password immediately.” Below it a red button titled “Change password.”" />}}

Judging by a web search, this isn’t a new feature but has been there for a while. It’s quite telling that I only noticed this message when I went there specifically looking for it. This approach is quite different from forcing users to set a strong master password, which is what LastPass should have done if they wanted to protect all users.

And the password iterations? LastPass has recently increased the default to 600,000 iterations. But this is once again for new accounts only.

There is no automatic password iterations update for my test account. There isn’t even a warning message. As far as LastPass is concerned, everything seems to be just fine. And even for business users, LastPass currently [tells admins to update the setting manually](https://support.lastpass.com/help/security-bulletin-recommended-actions-for-business-administrators#topic_2), once again promising an automated update at some point in the future.