---
categories:
- yahoo
- aol
- verizon
- email
- security
date: 2020-03-09 07:43:05
description: Yahoo! and AOL let anybody controlling the phone number gain access to
  the account, even if that phone number was never verified.
lastmod: '2020-03-28 17:40:32'
title: 'Yahoo! and AOL: Where two-factor authentication makes your account less secure'
---

If you are reading this, you probably know already that you are supposed to use two-factor authentication for your most important accounts. This way you make sure that nobody can take over your account merely by guessing or stealing your password, which [makes an account takeover far less likely](https://security.googleblog.com/2019/05/new-research-how-effective-is-basic.html). And what could be more important than your email account that [everything else ties into](https://krebsonsecurity.com/2013/06/the-value-of-a-hacked-email-account/)? So you probably know, when Yahoo! greets you like this on login -- it's only for your own safety:

{{< img src="yahoo_login.png" width="600" alt="Yahoo! asking for a recovery phone number on login" />}}

Yahoo! makes sure that "Remind me later" link is small and doesn't look like an action, so it would seem that adding a phone number is the only way out here. And why would anybody oppose adding it anyway? But here is the thing: complying *reduces* the security of your account considerably. This is due to the way Verizon Media (the company which acquired Yahoo! and AOL a while ago) implements account recovery. And: yes, everything I say about Yahoo! also applies to AOL accounts.

{{< toc >}}

## Summary of the findings

I'm not the one who discovered the issue. A Yahoo! user wrote me:

> I entered my phone number to the Yahoo! login, and it asked me if I wanted to receive a verification key/access key (2fa authentication). So I did that, and typed in the access key...
> Surprise, I logged in ACCIDENTALLY to the Yahoo! mail of the previous owner of my current phone number!!!

I'm not even the first one to write about this issue. For example, Brian Krebs [mentioned this a year ago](https://krebsonsecurity.com/2019/03/why-phone-numbers-stink-as-identity-proof/). Yet here we still are: anybody can take over a Yahoo! or AOL account as long as they control the recovery phone number associated with it.

So if you've got a new phone number recently, you could check whether its previous owner has a Yahoo! or AOL account. Nothing will stop you from taking over that account. And not just that: adding a recovery phone number doesn't necessarily require verification! So when I tested it out, I was offered access to a Yahoo! account which was associated with my phone number even though the account owner almost certainly never proved owning this number. No, I did not log into their account...

## How two-factor authentication is *supposed* to work

The idea behind two-factor authentication is making account takeover more complicated. Instead of logging in with merely a password (something you know), you also have to demonstrate access to a device like your phone (something you have). There is a number of ways how malicious actors could learn your password, e.g. if you are in the habit of reusing passwords; chances are that your password has been compromised in one of the [numerous data breaches](https://haveibeenpwned.com/). So it's a good idea to set the bar for account access higher.

The already mentioned article by Brian Krebs [explains](https://krebsonsecurity.com/2019/03/why-phone-numbers-stink-as-identity-proof/) why phone numbers aren't considered a good second factor. Not only do phone numbers change hands quite often, criminals have been hijacking them en masse via [SIM swapping attacks](https://en.wikipedia.org/wiki/SIM_swap_scam). Still, despite sending SMS messages to a phone number being considered a weak authentication scheme, it provides some value when used *in addition* to querying the password.

## The Yahoo! and AOL account recovery process

But that's not how it works with Yahoo! and AOL accounts. I added a recovery phone to my Yahoo! account and enabled two-factor authentication with the same phone number (yes, you have to do it separately). So my account should have been as secure as somehow possible.

And then I tried "recovering" my account. From a different browser. Via a Russian proxy. While still being logged into this account in my regular browser. That should have been enough for Yahoo! to notice something being odd, right?

{{< img src="yahoo_recovery.png" width="551" alt="Yahoo! form for account recovery, only asking for a phone number" />}}

Clicking "Forgot username" brought me to a form asking me for a recovery phone number or email address. I entered the phone number and received a verification code via SMS. Entered it into the web page and voilà!

{{< img src="yahoo_accounts.png" width="630" alt="Yahoo! offering me access to my account and as well as some \"X Y\" account" />}}

Now it's all very straightforward: I click on my account, set a new password and disable two-factor authentication. The session still open in my regular browser is logged out. As far as Yahoo! is concerned, somebody from Russia just took over my account using only the weak SMS-based authentication, not knowing my password or even my name. Yet Yahoo! didn't notice anything suspicious about this and didn't feel any need for additional checks. But wait, there is a notification sent to the recovery email address!

{{< img src="yahoo_notification.png" width="409" alt="Yahoo! notifying me about account takeover" />}}

Hey, big thanks Yahoo! for carefully documenting the issue. But you could have shortened the bottom part as "If this wasn't you then we are terribly sorry but the horse has already left the barn." If somebody took over my account and changed my password, I'll most likely not get a chance to review my email addresses and phone numbers any more.

## Aren't phone numbers verified?

Now you are probably wondering: who is that other "X Y" account? Is that my test account? No, it's not. It's some poor soul who somehow managed to enter my phone number as their recovery phone. Given that this phone number has many repeating digits, it's not too surprising that somebody typed it in merely to avoid Yahoo! nagging them. The other detail is surprising however: didn't they have to verify that they actually own this number?

Now I had to go back to Yahoo!&rsquo;s nag screen:

{{< img src="yahoo_nagscreen.png" width="430" alt="Yahoo! asking for a recovery phone number on login" />}}

If I enter a phone number into that text field and click the small "Add" link below it, the next step will require entering a verification code that I receive via SMS. However, if I click the much bigger and more obvious "Add email or mobile no." button, it will bring me to another page where I can enter my phone number. And there the phone number will be added immediately, with the remark "Not verified" and a suggestion to verify it later. Yet the missing verification won't prevent this the phone number from being used in account recovery.

With the second flow being the more obvious one, I suspect that a large portion of Yahoo! and AOL users never verified that they actually own the phone number they set as their recovery phone. They might have made a typo, or they might have simply invented a number. These accounts can be compromised by the rightful owner of that number at any time, and Verizon Media will just let them.

## What does Verizon Media think about that?

Do the developers at Verizon Media realize that their trade-off is tilted way too much towards convenience and sacrifices security as a result? One would think so, at the very least after a big name like Brian Krebs wrote about this issue. Then again, having dealt with the bureaucratic monstrosity that is Yahoo! even before they got acquired, I was willing to give them the benefit of the doubt.

Of course, there is no easy way of reaching the right people at Yahoo!. Their own documentation suggests reporting issues via their HackerOne bug bounty program, and I gave it a try. Despite my explicitly stating that the point was making the right team at Verizon aware of the issue, my report was immediately closed as a duplicate by HackerOne staff. The other report (filed last summer) was also closed by HackerOne staff, stating that exploitation potential wasn't proven. There is no indication that either report ever made it to the people responsible.

So it seems that the only way of getting a reaction from Verizon Media is by asking publicly and having as many people as possible chime in. Google and Microsoft make account recovery complicated for a reason, the weakest factor is not enough there. So Verizon Media, why don't you? Do you care so little about security?
