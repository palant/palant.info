---
categories:
- korea
- security
- privacy
date: 2023-01-02T14:25:10+0100
description: Websites in South Korea often require installation of “security applications.”
  Not only do these mandatory applications not help security, way too often they introduce
  issues.
lastmod: '2023-01-26 05:53:49'
title: South Korea’s online security dead end
---

**Edit** (2023-01-04): A Korean translation of this article is now available [here](https://www.woojinkim.org/wiki/spaces/me/pages/733085820/South+Korea+s+online+security+dead+end), thanks to Woojin Kim. **Edit** (2023-01-07): Scheduled one more disclosure for February.

Last September I started investigating a South Korean application with unusually high user numbers. It took me a while to even figure out what it really did, there being close to zero documentation. I eventually realized that the application is riddled with security issues and, despite being advertised as a security application, makes the issue it is supposed to address far, far worse.

That’s how my journey to the South Korea’s very special security application landscape started. Since then I investigated several other applications and realized that the first one wasn’t an outlier. All of them caused severe security and privacy issues. Yet they were also installed on almost every computer in South Korea, being a prerequisite for using online banking or government websites in the country.

{{< img src="message.png" alt="Message on www.citibank.co.kr stating: [IP Logger] program needs to be installed to ensure safe use of the service. Do you want to move to the installation page?" width="600" />}}

Before I start publishing articles on the individual applications’ shortcomings I wanted to post a summary of how (in my limited understanding) this situation came about and what exactly went wrong. From what I can tell, South Korea is in a really bad spot security-wise right now, and it needs to find a way out ASAP.

{{< toc >}}

## Historical overview

I’ve heard about South Korea being very “special” every now and then. I cannot claim to fully understand the topic, but there is a whole [Wikipedia article on it](https://en.wikipedia.org/wiki/Web_compatibility_issues_in_South_Korea). Apparently, the root issue were the US export restrictions on strong cryptography in the 90ies. This prompted South Korea to develop their own cryptographic solutions.

It seems that this started a fundamental distrust in security technologies coming out of the United States. So even when the export restrictions were lifted, South Korea continued adding their own security layers on top of SSL. All users had to install special applications just to use online banking.

Originally, these applications used Microsoft’s proprietary ActiveX technology. This only worked in Internet Explorer and severely hindered adoption of other browsers in South Korea.

Wikipedia lists several public movements aimed at improving this situation. Despite the pressure from these, it took until well after 2010 that things actually started changing.

Technologically, the solutions appear to have gone through several iterations. The first one were apparently [NPAPI plugins](https://en.wikipedia.org/wiki/NPAPI), the closest thing to ActiveX in non-Microsoft browsers. I’ve also seen solutions based on browser extensions which are considerably simpler than NPAPI plugins.

Currently, the vendors appear to have realized that privileged access to the browser isn’t required. Instead, they merely need a communication channel from the websites to their application. So now all these applications run a local web server that websites communicate with.

## Current situation

Nowadays, a typical Korean banking website will require five security applications to be installed before you are allowed to log in. One more application is suggested to manage this application zoo. And since different websites require different sets of applications, a typical computer in South Korea probably runs a dozen different applications from half a dozen different vendors. Just to be able to use the web.

{{< img src="applications.png" alt="Screenshot of a page titled “Install Security Program.” Below it the text “To access and use services on Busan Bank website, please install the security programs. If your installation is completed, please click Home Page to move to the main page. Click [Download Integrated Installation Program] to start automatica installation. In case of an error message, please click 'Save' and run the downloaded the application.” Below that text the page suggests downloading “Integrated installation (Veraport)” and five individual applications." width="859" />}}

Each of these applications comes with a website SDK that the website needs to install, consisting of half a dozen JavaScript files. So your typical Korean banking website takes quite a while to load and initialize.

Interestingly, most of these applications don’t even provide centralized download servers. The distribution and updates have been completely offloaded to websites using these security applications.

And that is working exactly as well as you’d expect. Even looking at mere usability, I’ve noticed an application that a few years ago went through a technology change: from using a browser extension to using a local web server for communication. Some banks still distribute and expect the outdated application version, others work with the new one. For users it is impossible to tell why they have the application installed, yet their bank claims that they don’t. And they complain en masse.

Obviously, websites distributing applications also makes them a target. And properly securing so many download servers is unrealistic. So a few years ago the North Korean Lazarus group made the news by [compromising some of these servers in order to distribute malware](https://threatpost.com/hacked-software-south-korea-supply-chain-attack/161257/).

## Software quality

I took a thorough look at the implementation of several security applications widely used in South Korea. While I’ll go into the specific issues in future blog posts, some tendencies appear universal across the entire landscape.

One would think, being responsible for the security of an entire nation would make vendors of such software be extra vigilant. That’s not what I saw however. In fact, security-wise these applications are often decades behind state of the art.

This starts with a simple fact: some of these applications are written in the [C programming language](https://en.wikipedia.org/wiki/C_(programming_language)), not even C++. It being a low-level programming language, these days it is typically used in code that has to work close to hardware such as device drivers. Here however it is used in large applications interacting with websites in complicated ways.

The manual approach to memory management in C is a typical source of exploitable memory safety issues like [buffer overflows](https://owasp.org/www-community/vulnerabilities/Buffer_Overflow). Avoiding them in C requires utmost care. While such bugs weren’t the focus of my investigation, I couldn’t fail noticing that the developers of these applications didn’t demonstrate much experience avoiding memory safety issues.

Modern compilers provide a number of security mechanisms to help alleviate such issues. But these applications don’t use modern compilers, relying on Visual Studio versions released around 15 years ago instead.

And even the basic security mechanisms supported by these ancient compilers, such as [Address Space Layout Randomization (ALSR)](https://en.wikipedia.org/wiki/Address_space_layout_randomization) and [Data Execution Prevention (DEP)](https://learn.microsoft.com/en-us/windows/win32/memory/data-execution-prevention), tend to be disabled. There is really no good reason for that, these are pure security benefit “for free.”

To make matters even worse, the open source libraries bundled in these applications tend to see no updates whatsoever. So far the record holder was a library which turned out to be more than a decade old. There have been more than 50 releases of this library since then, with many improvements and security fixes. None of them made it into the application.

## Security through obscurity

Given how South Korea’s security applications are all about cryptography, they are surprisingly bad at it. In most cases, cryptography is merely being used as obfuscation, only protecting against attackers who cannot reverse engineer the algorithm. Other issues I’ve seen were dropping encryption altogether if requested or algorithm parameters that have been deprecated decades ago.

In fact, vendors of these applications appear to view reverse engineering as the main issue. There is very little transparency and much security through obscurity here. It’s hard to tell whether this approach actually works to deter hackers or we merely don’t learn about the successful attacks.

Either way, I’ve seen multiple applications use software “protection” that decrypts the code at runtime to prevent reverse engineering. While I don’t have much experience with such mechanisms, I found that attaching to the process with x64dbg at runtime and using the Scylla plugin does just fine to get a decrypted exe/dll file that can be fed into a disassembler.

There are services that will immediately shut down the application if a debugger is attached. And one application even attempts to prevent browser’s Developer Tools from being used. Neither mechanism mitigates security risks, the goal here is rather maintaining obscurity.

## Explanation attempts

I think the main issue here is that the users are not the customers. While this is supposedly all about their safety, the actual customers are the banks. The users don’t get to choose whether to install an application, it is required. And banks can delegate liability away.

If somebody loses money due to a hack, the bank cannot possibly be at fault. The bank did everything right after all. It made the user install all the important security applications. That seems to be the logic here.

This creates a market for bogus security applications. Most of them fail at properly addressing an issue. Way too often they even make matters considerably worse. And in the few cases where meaningful functionality is present, a modern web browser is perfectly capable of it without any third-party software.

But none of this matters as long as banks continue to buy these applications. And whether they do is only related to whether they see a value for themselves, not whether the application does anything meaningful.

The vendors know that of course. That’s why they haven’t been investing into the security of their applications for decades, it simply doesn’t matter. What matters are the features that banks will see. Ways for them to customize the application. Ways for them to collect even more of users’ data. Ways for them to spend money and to get (perceived) security back without any noteworthy effort.

## Getting out of the dead end

Unfortunately, I know too little about the Korean society to tell how they would get out of this less than perfect situation. One thing I’m pretty certain about however: improving the existing security applications won’t do it.

Yes, I reported the security and privacy issues I found. I gave the vendors some time to protect the users before my disclosure. And I hope they will.

It isn’t really going to change the situation however. Because many of these issues are by design. And if they fix all of them, they will no longer have a product to sell.

In fact, the ideal outcome is dismantling South Korea’s special security landscape altogether. Not relying on any of these security applications will be a huge win for security. This likely won’t be possible without some definitive legislative action however. Ideally one that will give users a choice again and outlaw forcing installation of third-party applications just to use basic online services.

## Schedule of future disclosures

When I report security issues vendors generally get 90 days to fix them. Once that deadline is over I disclose my research. If you are interested in reading the disclosures, you can subscribe to the [RSS feed of this blog](/rss.xml). Alternatively, you could also check my blog on the scheduled disclosure dates:

* 2023-01-09: [TouchEn nxKey: The keylogging anti-keylogger solution](/2023/01/09/touchen-nxkey-the-keylogging-anti-keylogger-solution/)
* 2023-01-25: [IPinside: Korea’s mandatory spyware](/2023/01/25/ipinside-koreas-mandatory-spyware/)
* 2023-02-06: [Weakening TLS protection, South Korean style](/2023/02/06/weakening-tls-protection-south-korean-style/)
* 2023-03-06 (March 6th)