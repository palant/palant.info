---
title: "South Korea’s banking security: Intermediate conclusions"
date: 2023-02-20T07:15:01+0100
description: "South Korea’s online banking relies on a number of “security” applications. Here I am looking into whether these applications can potentially make things more secure."
categories:
- korea
- security
- privacy
---

A while back I wrote [my first overview of South Korea’s unusual approach to online security](/2023/01/02/south-koreas-online-security-dead-end/). After that I published two articles on [specific](/2023/01/09/touchen-nxkey-the-keylogging-anti-keylogger-solution/) [applications](/2023/01/25/ipinside-koreas-mandatory-spyware/). While I’m not done yet, this is enough information to draw some intermediate conclusions.

The most important question is: all the security issues and bad practices aside, does this approach to banking security make sense? Do these applications have the potential to make people more secure when rolled out mandatorily nation-wide?

{{< img src="message.png" alt="Message on www.citibank.co.kr stating: [IP Logger] program needs to be installed to ensure safe use of the service. Do you want to move to the installation page?" width="600" />}}

TL;DR: I think that the question above can be answered with a clear “no.” The approaches make little sense given actual attack scenarios, they tend to produce security theater rather than actual security. And while security theater can sometimes be useful, the issues in question have proper solutions.

{{< toc >}}

## Endpoint protection

The probably least controversial point here is: users’ devices need protection, ideally preventing them from being compromised. So when a user accesses their bank, their computer should really be theirs, with nobody secretly watching over their shoulder. Over time, two types of applications emerged with the promise to deliver that: antivirus and firewall.

But Microsoft has you covered there. Starting with Windows 7, there is a very effective built-in firewall (Windows Firewall) and a decent built-in antivirus (Windows Defender). So you are protected out of the box, and installing a third-party antivirus application will not necessarily make you safer. In fact, these antivirus applications way too often [end](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/) [up](/2020/06/22/exploiting-bitdefender-antivirus-rce-from-any-website/) [weakening](/2019/08/19/kaspersky-in-the-middle--what-could-possibly-go-wrong/) [the](/2020/01/13/pwning-avast-secure-browser-for-fun-and-profit/) [protection](/2020/02/25/mcafee-webadvisor-from-xss-in-a-sandboxed-browser-extension-to-administrator-privileges/).

Of course, I have no idea how good AhnLab’s antivirus is. Maybe it is really good, way better than Windows Defender. Does it mean that it makes sense for South Korean banking websites to force installation of AhnLab Safe Transaction?

Well, most of the time AhnLab Safe Transaction sits idly in the background. It only activates when you are on a banking website. In other words: it will not prevent your computer from being compromised, as a malware infection doesn’t usually happen on a banking website. It will merely attempt to save the day when it is already too late.

## Keyboard protection

And speaking of “too late,” I see a number of “security” applications in South Korea attempting to protect keyboard input. The idea here is: yes, the computer is already compromised. But we’ll encrypt keyboard input between the keyboard and the website, so that the malicious application cannot see it.

I took [a closer look at TouchEn nxKey](/2023/01/09/touchen-nxkey-the-keylogging-anti-keylogger-solution/), which is one such solution. The conclusion here was:

> So whatever protection nxKey might provide, it relies on attackers who are unaware of nxKey and its functionality. Generic attacks may be thwarted, but it is unlikely to be effective against any attacks targeting specifically South Korean banks or government organizations.

And this isn’t because they did such a bad job (even though they did). As a general rule, you cannot add software to magically fix a compromised environment. Whatever you do, the malicious software active in this environment can always implement countermeasures.

We’ve already seen this two decades ago when banking trojans became a thing and would steal passwords. Some websites decided to use on-screen keyboards, so that the password would not be entered via a physical keyboard.

The banking trojans adapted quickly: in addition to merely recording the keys pressed, they started recording mouse clicks along with a screenshot of the area around the mouse cursor. And at that point on-screen keyboards became essentially useless. Yet they are still common in South Korea.

Just to state this again: once a computer is compromised, it cannot be helped. The only solution is [multi-factor authentication](https://en.wikipedia.org/wiki/Multi-factor_authentication). In banking context this means that the transaction details always need to be confirmed on a separate and hopefully unaffected device.

## IP address detection

Two decades ago I was a moderator of an online chat. Most chat visitors would behave, but some were trolls only looking to annoy other people. I would ban the trolls’ IP address, but they would soon come back with a different IP address.

Twenty years later I see South Korean banks still struggling with the same inadequate protection measures. Rather than finding new ways, they continue fighting anonymous proxies and VPNs. As a result, they demand that customers [install IPinside, a privacy-invasive de-anonymization tool](/2023/01/25/ipinside-koreas-mandatory-spyware/).

Quite frankly, I’m not even certain which exact threat this addresses. Assuming that it addresses a threat at all rather than merely serving as an excuse to collect more data about their customers.

Banks generally don’t care about IP addresses when limiting login attempts. After three unsuccessful login attempts the account is locked, this is common practice ensuring that guessing login credentials is impracticable.

Is the goal maybe recognizing someone using stolen login credentials? But that’s also something which is best addressed by [multi-factor authentication](https://en.wikipedia.org/wiki/Multi-factor_authentication). Banking trojans learned avoiding such geo-blocking a long time ago, they simply use the victim’s compromised computer both to exfiltrate login credentials and to apply them for a malicious transaction. As far as the bank can see, the transaction comes from the computer belonging to the legitimate owner of the account.

Or is the goal actually preventing attacks against vulnerabilities of the banking website itself, allowing to recognize the source of the attack and to block it? But accessing banking websites prior to login doesn’t require IPinside, so it has no effect here. And once the malicious actors are logged in, the bank can recognize and lock the compromised account.

## Certificate-based logins

One specific of the South Korean market is the prevalence of certificate-based logins, something that was apparently mandated for online banking at a certain point but no longer is. There are still applications to manage these certificates and to transfer them between devices.

Now certificate-based logins are something that browsers supported out of the box for a long time (“client-authenticated TLS handshake”). Yet I’ve seen very few websites actually use this feature and none in the past five years. The reason is obvious: this is a usability nightmare.

While regular people understand passwords pretty well, certificates are too complicated. The necessity to back up certificates and to move them to all devices used makes them particularly error-prone.

At the same time they don’t provide additional value in the banking context. While certificates are theoretically much harder to guess than passwords, this has no practical relevance if an account is locked after three guessing attempts. And using certificates in addition to passwords doesn’t work as proper two-factor authentication: there is no independent device to show the transaction details on, so one cannot know what is being confirmed with the certificate.

However, if one really wanted to secure important accounts with a hardware token instead of a password, browsers have supported the [WebAuthn protocol](https://en.wikipedia.org/wiki/WebAuthn) for a while now. No third-party applications are required for that.

## Software distribution

Even without any security issues, the mere number of applications users are supposed to install is causing considerable issues. One application required by every bank in the country? Well, probably manageable. Ten applications which you might need depending on the website, and where you have to keep the right version in mind? Impossible for regular users to navigate.

Add to this that software vendors completely delegated the software distribution to the banks, who have no experience with distributing software securely. So when security software is being downloaded from banking websites, it’s often years behind the latest version and I’ve also seen plain HTTP (unencrypted) downloads. Never mind abandoned download pages still distributing ancient software.

This is already playing out badly with my disclosures. While the software vendors still have to develop fixes for the security issues I reported, they have no proper way of distributing updates once done. They will need to ask each of the banks using the software, and quite a few are bound to delay this even further because their website cannot work with the latest software version. And even then, users will still need to install the update manually.

Now *if* all these applications were actually necessary, one option to deal with this would be adding efficient auto-update functionality, similar to the one implemented in web browsers. No matter how old the version installed by the user, it would soon contact the vendor’s (secure) update server and install the very latest version. And banks would need to implement processes allowing them to stay compatible with this latest version, staying with outdated and potentially vulnerable software would not be an option.

Of course, that’s not the solution South Korea went with. Instead they got Veraport: an application meant to automate management of multiple security applications. And it is still the banks determining what needs to be installed and when it should be updated. Needless to say that it didn’t really make this mess any smaller, but it did get [abused by North Korean hackers](https://threatpost.com/hacked-software-south-korea-supply-chain-attack/161257/).
