---
categories:
- security
- privacy
- add-ons
date: 2024-10-01T13:59:48+0200
description: I found 17 extensions using the Impact Hero SDK in Chrome Web Store.
  These mislead users about their functionality, enable it without real consent, then
  lie about its ecological impact. And there is more shady stuff going on.
images:
- /2024/10/01/lies-damned-lies-and-impact-hero-refoorest-allcolibri/privacy_policy2.png
lastmod: '2024-11-13 18:21:35'
title: Lies, damned lies, and Impact Hero (refoorest, allcolibri)
---

*Transparency note*: According to Colibri Hero, they attempted to establish a business relationship with eyeo, a company that I co-founded. I haven’t been in an active role at eyeo since 2018, and I left the company entirely in 2021. Colibri Hero was only founded in 2021. My investigation here was prompted by a [blog comment](/2024/07/15/how-insecure-is-avast-secure-browser/#c000004).

Colibri Hero (also known as allcolibri) is a company with a noble mission:

> We want to create a world where organizations can make a positive impact on people and communities.

One of the company’s products is the refoorest browser extension, promising to make a positive impact on the climate by planting trees. Best of it: this costs users nothing whatsoever. According to the refoorest website:

> Plantation financed by our partners

So the users merely need to have the extension installed, indicating that they want to make a positive impact. And since the concept was so successful, Colibri Hero recently turned it into an SDK called Impact Hero (also known as Impact Bro), so that it could be added to other browser extensions.

What the company carefully avoids mentioning: its 56,000 “partners” aren’t actually aware that they are financing tree planting. The refoorest extension and extensions using the Impact Hero SDK automatically open so-called affiliate links in the browser, making certain that the vendor pays them an affiliate commission for whatever purchases the users make. As the extensions do nothing to lead users to a vendor’s offers, this functionality likely counts as [affiliate fraud](https://www.investopedia.com/terms/a/affiliate-fraud.asp).

The refoorest extension also makes very clear promises to its users: planting a tree for each extension installation, two trees for an extension review as well as a tree for each vendor visit. Clearly, this is not actually happening according to the numbers published by Colibri Hero themselves.

What does happen is careless handling of users’ data despite the “100% Data privacy guaranteed” promise. In fact, the company didn’t even bother to produce a proper privacy policy. There are various shady practices including a general lack of transparency, with the financials never disclosed. As proof of trees being planted the company links to a “certificate” which is … surprise! … its own website.

Mind you, I’m not saying that the company is just pocketing the money it receives via affiliate commissions. Maybe they are really paying Eden Reforestation (not actually called that any more) to plant trees and the numbers they publish are accurate. As a user, this is quite a leap of faith with a company that shows little commitment to facts and transparency however.

{{< toc >}}

## What is Colibri Hero?

Let’s get our facts straight. First of all, what is Colibri Hero about? To quote their mission statement:

> Because more and more companies are getting involved in social and environmental causes, we have created a SaaS solution that helps brands and organizations bring impactful change to the environment and communities in need, with easy access to data and results. More than that, our technology connects companies and non-profit organizations together to generate real impact.
>
> Our e-solution brings something new to the demand for corporate social responsibility: brands and organizations can now offer their customers and employees the chance to make a tangible impact, for free. An innovative way to create an engaged community that feels empowered and rewarded.

You don’t get it? Yes, it took me a while to understand as well.

This is about companies’ bonus programs. Like: you make a purchase, you get ten points for the company’s loyalty program. Once you have a few hundred of those points, you can convert them into something tangible: getting some product for free or at a discount.

And Colibri Hero’s offer is: the company can offer people to donate those points, for a good cause. Like planting trees or giving out free meals or removing waste from the oceans. It’s a win-win situation: people can feel good about themselves, the company saves themselves some effort and Colibri Hero receives money that they can forward to social projects (after collecting their commission of course).

I don’t know whether the partners get any proof of money being donated other than the overview on the Colibri Hero website. At least I could not find any independent confirmation of it happening. All photos published by the company are generic and from unrelated events. Except one: there is photographic proof that some notebooks (as in: paper that you write on) have been distributed to girls in Sierra Leone.

Few Colibri Hero partners report the impact of this partnership or even its existence. The numbers are public on Colibri Hero website however if you know where to look for them and who those partners are. And since Colibri Hero left the directory index enabled for their Google Storage bucket, the logos of their partners are public as well.

So while Colibri Hero never published a transparency report themselves, it’s clear that they partnered up with less than 400 companies. Most of these partnerships appear to have never gone beyond a trial, the impact numbers are negligible. And despite Colibri Hero boasting their partnerships with big names like Decathlon and Foot Locker, the corresponding numbers are rather underwhelming for the size of these businesses.

Colibri Hero runs a shop which they don’t seem to link anywhere but which gives a rough impression of what they charge their partners. Combined with the public impact numbers (mind you, these have been going since the company was founded in 2021), this impression condenses into revenue numbers far too low to support a company employing six people in France, not counting board members and ethics advisors.

## And what about refoorest?

This is likely where the refoorest extension comes in. While given the company’s mission statement this browser extension with its less than 100,000 users across all platforms (most of them on Microsoft Edge) sounds like a side hustle, it should actually be the company’s main source of income.

The extension’s promise sounds very much like that of the Ecosia search engine: you search the web, we plant trees. Except that with Ecosia you have to use their search engine while refoorest supports any search engine (as well as Linkedin and Twitter/X which they don’t mention explicitly). Suppose you are searching for a new pair of pants on Google. One of the search results is Amazon. With refoorest you see this:

{{< img src="refoorest_search.png" width="639" alt="Screenshot of a Google search result pointing to Amazon’s Pants category. Above it an additional link with the text “This affiliate partner is supporting refoorest’s tree planting efforts” along with the picture of some trees overlaid with the text “+1”." />}}

If you click the search result you go to Amazon as usual. Clicking that added link above the search result however will send you to the refoorest.com domain, where you will be redirected to the v2i8b.com domain (an affiliate network) which will in turn redirect you to amazon.com (the main page, not the pants one). And your reward for that effort? One more tree added to your refoorest account! Planting trees is really easy, right?

One thing is odd about this extension’s listing on Chrome Web Store: for an extension with merely 20,000 users, 2.9K ratings is *a lot*.

{{< img src="refoorest_listing.png" width="556" alt="Screenshot of a Chrome Web Store listing. The title says: “refoorest: plant trees for free.” The extension is featured, has 2.9K ratings with the average of 4.8 stars and 20,000 users." />}}

One reason is: the extension incentivizes leaving reviews. This is what the extension’s pop-up looks like:

{{< img src="refoorest_popup.png" width="337" alt="Screenshot of an extension pop-up. At the bottom a section titled “Share your love for refoorest” and the buttons “Leave a Review +2” and “Add your email +2”" />}}

Review us and we will plant two trees! Give us your email address and we will plant another two trees! Invite fifteen friends and we will plant a whole forest for you!

## The newcomer: Impact Hero

Given the success of refoorest, it’s unsurprising that the company is looking for ways to expand this line of business. What they recently came up with is the Impact Hero SDK, or Impact Bro as its website calls it (yes, really). It adds an “eco-friendly mode” to existing extensions. To explain it with the words of the Impact Bros (highlighting of original):

> With our eco-friendly mode, **you can effortlessly plant trees and offset carbon emissions at no cost as you browse the web.** This allows us to improve the environmental friendliness of our extension.

Wow, that’s quite something, right? And how is that possible? That’s explained a little further in the text:

> Upon visiting one of these merchant partners, you'll observe a brief opening of a new tab. This tab facilitates the calculation of the required carbon offset.

Oh, calculation of the required carbon offset, makes sense. That’s why it loads the same website that I’m visiting but via an affiliate network. Definitely not to collect an affiliate commission for my purchases.

Just to make it very clear: the thing about calculating carbon offsets is a bold lie. This SDK earns money via affiliate commissions, very much in the same way as the refoorest extension. But rather than limiting itself to search results and users’ explicit clicks on their link, it will do this whenever the user visits some merchant website.

Now this is quite unexpected functionality. Yet [Chrome Web Store program policies](https://developer.chrome.com/docs/webstore/program-policies) require the following:

> All functionalities of extensions should be clearly disclosed to the user, with no surprises.

Good that the Impact Hero SDK includes a consent screen, right? Here is what it looks like in the Chat GPT extension:

{{< img src="consent_screen.png" width="369" alt="Screenshot of a pop-up with the title: “Update! Eco-friendly mode, Chat GPT.” The text says “Help make the world greener as you browse. Just allow additional permissions to unlock a better future.” There are buttons labeled “Allow to unlock” and “Deny.”" />}}

Yes, this doesn’t really help users make an informed decision. And if you think that the “Learn more” link helps, it leads to the page where I copied the “calculation of the required carbon offset” bullshit from.

The whole point of this “consent screen” seems to be tricking you into granting the extension access to all websites. Consequently, this consent screen is missing from extensions that already have access to all websites out of the box (including the two extensions owned by Colibri Hero themselves).

There is one more area that Colibri Hero focuses on to improve its revenue: their list of merchants that the extensions download each hour. [This discussion](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/wZCMjRseCj0/m/6levMJgAAgAJ) puts the size of the list at 50 MB on September 6. When I downloaded it on September 17 it was already 62 MB big. By September 28 the list has grown to 92 MB. If this size surprises you: there are lots of duplicate entries. `amazon.com` alone is present 615 times in that list (some metadata differs, but the extensions don’t process that metadata anyway).

## Affected extensions

In addition to refoorest I could identify two extensions bought by Colibri Hero from their original author as well as 14 extensions which apparently added Impact Hero SDK expecting their share of the revenue. That’s Chrome Web Store only, the refoorest extension at the very least also exists in various other extension stores, even though it has been removed from Firefox Add-ons just recently.

Here is the list of extensions I found and their current Chrome Web Store stats:

| Name | Weekly active users | Extension ID |
|------|--------------------:|--------------|
| Bittorent For Chrome | 40,000 | aahnibhpidkdaeaplfdogejgoajkjgob |
| Pro Sender - Free Bulk Message Sender | 20,000 | acfobeeedjdiifcjlbjgieijiajmkang |
| Memory Match Game | 7,000 | ahanamijdbohnllmkgmhaeobimflbfkg |
| Turbo Lichess - Best Move Finder | 6,000 | edhicaiemcnhgoimpggnnclhpgleakno |
| TTV Adblock Plus | 100,000 | efdkmejbldmccndljocbkmpankbjhaao |
| CoPilot™ Extensions For Chrome | 10,000 | eodojedcgoicpkfcjkhghafoadllibab |
| Local Video-Audio Player | 10,000 | epbbhfcjkkdbfepjgajhagoihpcfnphj |
| AI Shop Buddy | 4,000 | epikoohpebngmakjinphfiagogjcnddm |
| Chat GPT | 700,000 | fnmihdojmnkclgjpcoonokmkhjpjechg |
| GPT Chat | 10,000 | jncmcndmaelageckhnlapojheokockch |
| Online-Offline MS Paint Tool | 30,000 | kadfogmkkijgifjbphojhdkojbdammnk |
| refoorest: plant trees for free | 20,000 | lfngfmpnafmoeigbnpdfgfijmkdndmik |
| Reader Mode | 300,000 | llimhhconnjiflfimocjggfjdlmlhblm |
| ChatGPT 4 | 20,000 | njdepodpfikogbbmjdbebneajdekhiai |
| VB Sender - Envio em massa | 1,000 | nnclkhdpkldajchoopklaidbcggaafai |
| ChatGPT to Notion | 70,000 | oojndninaelbpllebamcojkdecjjhcle |
| Listen On Repeat YouTube Looper | 30,000 | pgjcgpbffennccofdpganblbjiglnbip |

**Edit** (2024-10-01): Opera already removed refoorest from their add-on store.

## But are they actually planting trees?

That’s a very interesting question, glad you asked. See, refoorest considers itself to be in direct competition with the Ecosia search engine. And Ecosia publishes [detailed financial reports](https://blog.ecosia.org/ecosia-financial-reports-tree-planting-receipts/) where they explain how much money they earn and where it went. Ecosia is also listed as a partner on the [Eden: People+Planet website](https://www.eden-plus.org/partners/ecosystem-partners), so we have independent confirmation here that they in fact donated at least a million US dollars.

I searched quite thoroughly for comparable information on Colibri Hero. All I could find was this statement:

> We allocate a portion of our income to operating expenses, including team salaries, social charges, freelancer payments, and various fees (such as servers, technical services, placement fees, and rent). Additionally, funds are used for communications to maximize the service's impact.
Then, 80% of the profits are donated to global reforestation projects through our partner, Eden Reforestation.

While this sounds good in principle, we have no idea how high their operational expenses are. Maybe they are donating half of their revenue, maybe none. Even if this 80% rule is really followed, it’s easy to make operational expenses (like the salary of the company founders) so high that there is simply no profit left.

**Edit** (2024-10-01): It seems that I overlooked them in the [list of partners](https://www.eden-plus.org/partners?search=refoorest). So they did in fact donate at least 50 thousand US dollars. Thanks to Adrien de Malherbe of Colibri Hero for pointing this out. **Edit** (2024-10-02): According to the Internet Archive, refoorest got listed here in May 2023 and they have been in the “$50,000 - $99,999” category ever since. They were never listed with a smaller donation, and they never moved up either – almost like this was a one-time donation. As of October 2024, the Eden: People+Planet website puts the cost of planting a tree at $0.75.

And other than that they link to the certificate of the number of trees planted:

{{< img src="certificate.png" width="626" alt="Screenshot of the text “Check out refoorest’s impact” followed by the statement “690,121 trees planted”" />}}

But that’s their own website, just like the maps of where trees are being planted. They can make it display any number.

Now you are probably thinking: “Wladimir, why are you so paranoid? You have no proof that they are lying, just trust them to do the right thing. It’s for a good cause!” Well, actually…

Remember that the refoorest extension promises its users to plant a specific number of trees? One for each extension installation, two for a review, one more tree each time a merchant website is visited? What do you think, how many trees came together this way?

One thing about Colibri Hero is: they don’t seem to be very fond of protecting data access. Not only their partners’ stats are public, the user data is as well. When the extension loads or updates the user’s data, there is no authentication whatsoever. Anybody can just open my account’s data in their browser provided that they know my user ID:

{{< img src="user_data.png" width="341" alt="Screenshot of JSON data displayed in the browser. There are among others a timestamp field displaying a date and time, a trees field containing the number 14 and a browser field saying “chrome.”" />}}

So anybody can track my progress – how many trees I’ve got, when the extension last updated my data, that kind of thing. Any stalkers around? Older data (prior to May 2022) even has an email field, though this one was empty for the accounts I saw.

How you might get my user ID? Well, when the extension asks me to promote it on social networks and to my friends, these links contain my user ID. There are plenty of such links floating around. But as long as you aren’t interested in a specific user: the user IDs are incremental. They are even called `row_index` in the extension source code.

See that `index` value in my data? We now know that 2,834,418 refoorest accounts were created before I decided to take a look. Some of these accounts certainly didn’t live long, yet the average still seems to be beyond 10 trees. But even ignoring that: two million accounts are two million trees just for the install.

According to their own numbers refoorest planted less that 700,000 trees, far less than those accounts “earned.” In other words: when these users were promised real physical trees, that was a lie. They earned virtual points to make them feel good, when the actual count of trees planted was determined by the volume of affiliate commissions.

Wait, was it actually determined by the affiliate commissions? We can get an idea by looking at the historical data for the number of planted trees. While Colibri Hero doesn’t provide that history, the refoorest website was captured by the Internet Archive at a significant number of points in time. I’ve collected the numbers and plotted them against the respective date. Nothing fancy like line smoothing, merely lines connecting the dots:

{{< img src="trees_planted.png" width="803" alt="A graph plotting the number of trees on the Y axis ranging from 0 to 700,000 against the date on X axis ranging from November 2020 to September 2024. The chart is an almost straight line going from the lower left to the upper right corner. The only outliers are two jumps in year 2023." />}}

Well, that’s a straight line. There is a constant increase rate of around 20 trees per hour here. And I hate to break it to you, a graph like that is rather unlikely to depend on anything related to the extension which certainly grew its user base over the course of these four years.

There are only two anomalies here where the numbers changed non-linearly. There is a small jump end of January or start of February 2023. And there is a far larger jump later in 2023 after a three month period where the Internet Archive didn’t capture any website snapshots, probably because the website was inaccessible. When it did capture the number again it was already above 500,000.

## The privacy commitment

Refoorest website promises:

> 100% Data privacy guaranteed

The Impact Hero SDK explainer promises:

> This new feature does not retain any information or data, ensuring 100% compliance with GDPR laws.

Ok, let’s first take a look at their respective privacy policies. Here is the refoorest privacy policy:

{{< img src="privacy_policy1.png" width="747" alt="Screenshot of a text section titled “Nature of the data collected” followed by unformatted text: “In the context of the use of the Sites, refoorest may collect the following categories of data concerning its Users: Connection data (IP addresses, event logs ...) Communication of personal data to third parties Communication to the authorities on the basis of legal obligations Based on legal obligations, your personal data may be disclosed by application of a law, regulation or by decision of a competent regulatory or judicial authority. In general, we undertake to comply with all legal rules that could prevent, limit or regulate the dissemination of information or data and in particular to comply with Law No. 78-17 of 6 January 1978 relating to the IT, files and freedoms. ”" />}}

If you find that a little bit hard to read, that’s because whoever copied that text didn’t bother to format lists and such. Maybe better to read it on the Impact Bro website?

{{< img src="privacy_policy2.png" width="757" alt="Screenshot of an unformatted wall of text: “Security and protection of personal data Nature of the data collected In the context of the use of the Sites, Impact Bro may collect the following categories of data concerning its Users: Connection data (IP addresses, event logs ...) Communication of personal data to third parties Communication to the authorities on the basis of legal obligations Based on legal obligations, your personal data may be disclosed by application of a law, regulation or by decision of a competent regulatory or judicial authority. In general, we undertake to comply with all legal rules that could prevent, limit or regulate the dissemination of information or data and in particular to comply with Law No. 78-17 of 6 January 1978 relating to the IT, files and freedoms.”" />}}

Sorry, that’s even worse. Not even the headings are formatted here.

Either way, nothing shows appreciation for privacy like a standard text which is also used by pizza restaurants and similarly caring companies. Note how that references “Law No. 78-17 of 6 January 1978”? That’s some French data protection law that I’m pretty certain is superseded by GDPR. A reminder: GDPR came in effect in 2018, three years before Colibri Hero was even founded.

This privacy policy isn’t GDPR-compliant either. For example, it has no mention of consumer rights or who to contact if I want my data to be removed.

Data like what’s stored in those refoorest accounts which happen to be publicly visible. Some refoorest users might actually find that fact unexpected.

Or data like the email address that the extension promises two trees for. Wait, they don’t actually have that one. The email address goes straight to Poptin LTD, a company registered in Israel. There is no verification that the user owns the address like double opt-in. But at least Poptin has a proper GDPR-compliant privacy policy.

There is plenty of tracking going on all around refoorest, with data being collected by Cloudflare, Google, Facebook and others. This should normally be explained in the privacy policy. Well, not in this one.

Granted, there is *less* tracking around the Impact Hero SDK, still a far shot away from the “not retain any information or data” promise however. The “eco-friendly mode” explainer loads Google Tag Manager. The affiliate networks that extensions trigger automatically collect data, likely creating profiles of your browsing. And finally: why is each request going through a Colibri Hero website before redirecting to the affiliate network if no data is being collected there?

## Happy users

We’ve already seen that a fair amount of users leaving a review for the refoorest extension have been incentivized to do so. That’s the reason for “insightful” reviews like this one:

{{< img src="review.png" width="425" alt="A five-star review from Jasper saying: “sigma.” Below it a text says “1 out of 3 found this helpful.”" />}}

Funny enough, several of them then complain about not receiving their promised trees. That’s due to an extension issue: the extension doesn’t actually track whether somebody writes a review, it simply adds two trees with a delay after the “Leave a review” button is clicked. A bug in the code makes it “forget” that it meant to do this if something else happens in between. Rather that fixing the bug they removed the delay in the current extension version. The issue is still present when you give them your email address though.

But what about the user testimonies on their webpage?

{{< img src="testimonies.png" width="355" alt="A section titled “What our users say” with three user testimonies, all five stars. Emma says: “The extension allows you to make a real impact without altering your browsing habits. It's simple and straightforward, so I say: YES!” Stef says: “Make a positive impact on the planet easily and at no cost! Download and start using refoorest today. What are you waiting for? Act now!” Youssef says: “This extension is incredibly user-friendly. I highly recommend it, especially because it allows you to plant trees without leaving your home.”" />}}

Yes, this sounds totally like something real users would say, definitely not written by a marketing person. And these user photos definitely don’t come from something like the Random User Generator. Oh wait, [they do](https://randomuser.me/photos).

In that context it makes sense that one of the company’s founders engages with the users in a blog titled “Eco-Friendly Living” where he posts daily articles with weird ChatGPT-generated images. According to metadata, all articles have been created on the same date, and each article took around four minutes – he must be a very fast typer. Every article presents a bunch of brands, and the only thing (currently) missing to make the picture complete are affiliate links.

## Security issue

It’s not like the refoorest extension or the SDK do much. Given that, the company managed to produce a rather remarkable security issue. Remember that their links always point to a Colibri Hero website first, only to be redirected to the affiliate network then? Well, for some reason they thought that performing this redirect in the extension was a good idea.

So their extension and their SDK do the following:

```js
if (window.location.search.indexOf("partnerurl=") > -1) {
  const url = decodeURIComponent(gup("partnerurl", location.href));

  location.href = url;

  return;
}
```

Found a `partnerurl` parameter in the query string? Redirect to it! You wonder what websites this code is active on? All of them of course! What could possibly go wrong…

Well, the most obvious thing to go wrong is: this might be a `javascript:` URL. A malicious website could open `https://example.com/?partnerurl=javascript:alert(1)` and the extension will happily navigate to that URL. This *almost* became a [Universal Cross-Site Scripting (UXSS) vulnerability](https://www.acunetix.com/blog/articles/universal-cross-site-scripting-uxss/). Luckily, the browser prevents this JavaScript code from running, at least with Manifest V3.

It’s likely that the same vulnerability already existed in the refoorest extension back when it was using Manifest V2. At that point it was a critical issue. It’s only with the improvements in Manifest V3 that extensions’ content scripts are subject to a [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) which prevents execution of arbitrary Javascript code.

So now this is merely an open redirect vulnerability. It could be abused for example to disguise link targets and abuse trust relationships. A link like `https://example.com/?partnerurl=https://evil.example.net/` looks like it would lead to a trusted `example.com` website. Yet the extension would redirect it to the malicious `evil.example.net` website instead.

## Conclusions

We’ve seen that Colibri Hero is systematically misleading extension users about the nature of its business. Users are supposed to feel good about doing something for the planet, and the entire communication suggests that the “partners” are contributing finances due to sharing this goal. The aspect of (ab)using the system of affiliate marketing is never disclosed.

This is especially damning in case of the refoorest extension where users are being incentivized by a number of trees supposedly planted as a result of their actions. At no point does Colibri Hero disclose that this number is purely virtual, with the actual count of trees planted being far lower and depending on entirely different factors. Or rather no factors at all if their reported numbers are to be trusted, with the count of planted trees always increasing at a constant rate.

For the Impact Hero SDK this misleading communication is paired with clearly insufficient user consent. Most extensions don’t ask for user consent at all, and those that do aren’t allowing an informed decision. The consent screen is merely a pretense to trick the users into granting extended permissions.

This by itself is already in gross violation of the Chrome Web Store policies and warrants a takedown action. Other add-on stores have similar rules, and Mozilla in fact already removed the refoorest extension prior to my investigation.

Colibri Hero additionally shows a pattern of shady behavior, such as quoting fake user testimonies, referring to themselves as “proof” of their beneficial activity and a general lack of transparency about finances. None of this is proof that this company isn’t donating money as it claims to do, but it certainly doesn’t help trusting them with it.

The technical issues and neglect for users’ privacy are merely a sideshow here. These are somewhat to be expected for a small company with limited financing. Even a small company can do better however if the priorities are aligned.