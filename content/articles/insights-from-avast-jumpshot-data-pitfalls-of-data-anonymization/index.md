---
title: "Insights from Avast/Jumpshot data: Pitfalls of data anonymization"
date: 2020-02-18T10:00:43+01:00
description: Analyzing a sample of Jumpshot data confirms the suspicion that Avast did indeed sell personally identifiable data of their users, lots of it.
image: anonymizer.jpeg
categories:
  - avast
  - security
  - privacy
---

There has been a surprising development after my [previous article on the topic](/2020/01/27/avasts-broken-data-anonymization-approach/), Avast having [announced that they will terminate Jumpshot and stop selling users' data](https://www.pcmag.com/news/avast-to-end-browser-data-harvesting-terminates-jumpshot). That's not the end of the story however, with the Czech Office for Personal Data Protection [starting an investigation into Avast's practices](https://www.uoou.cz/en/vismo/dokumenty2.asp?id_org=200156&id=1896). I'm very curious to see whether this investigation will confirm Avast's claims that they were always fully compliant with the [GDPR](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation) requirements. For my part, I now got a glimpse of what the Jumpshot data actually looks like. And I learned that I massively overestimated Avast's success when anonymizing this data.

{{< img src="anonymizer.jpeg" width="600" alt="Conveyor belt putting false noses on avatars in a futile attempt of masking their identity" />}}

In reality, the data sold by Jumpshot contained plenty of user identifiers, names, email addresses, even home addresses. That's partly due to Avast being incapable or unwilling to remove user-specific data as they [planned to](https://patents.google.com/patent/US20160203337A1). Many issues are generic however and almost impossible to avoid. This once again underlines the central takeaway: anonymizing browser history data is very hard. That's especially the case if you plan to sell it to advertisers. You *can* make data completely anonymous, but you will have to dumb it down so much in the process that advertisers won't have any use for it any more.

Why did I decide to document Avast's failure in so much detail? My goal is to spread appreciation for the task of data anonymization: it's very hard to ensure that no conclusions about users' identity are possible. So maybe whoever is toying with the idea of collecting anonymized data will better think twice whether they really want do go there. And maybe next time we see a vendor collecting data we'll ask the right questions about how they ensure it's a "completely anonymous" process.

{{toc}}

## The data

The data I saw was an example that Jumpshot provided to potential customers: an excerpt of real data for one week of 2019. Each record included an exact timestamp (milliseconds precision), a persistent user identifier, the platform used (desktop or mobile, which browser), the approximate geographic location (country, city and ZIP code derived from the user's IP address), a guess for user's gender and age group.

What it didn't contain was "every click, on every site." This data sample didn't belong to the "All Clicks Feed" which has received much media attention. Instead, it was the "Limited Insights Pro Feed" which is supposed to merely cover user's shopping behavior: which products they looked at, what they added to the cart and whether they completed the order. All of that limited to shopping sites and grouped by country (Germany, UK and USA) as well as product category such as Shoes or Men's Clothing.

This doesn't sound like there would be all too much personal data? But there is, thanks to a "referrer" field being there. This one is supposed to indicate how the user came to the shopping site, e.g. from a Google search page or by clicking an ad on another website. Given the [detailed information collected by Avast](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/#what-data-is-being-sent), determining this referrer website should have been easy -- yet Avast somehow failed this task. And so the supposed referrer is typically a completely unrelated random web page that this user visited, and sometimes not even a page but an image or JSON data.

If you extract a list of these referrers (which I did), you see news that people read, their web mail sessions, search queries completely unrelated to shopping, and of course porn. You get a glimpse into what porn sites are most popular, what people watch there and even what they search for. For each user, the "limited insights" actually contain a tiny slice of their entire browsing behavior. Over the course of a week this exposed way too much information on some users however, and Jumpshot customers watching users over longer periods of time could learn a lot about each user even without the "All Clicks Feed."

## What about anonymization?

Some parameters and address parts have been censored in the data. For example, you will see an entry like the following:

    http://example.com/email/edit-details/[PII_EMAIL_abcdef1234567890]

A heuristic is at work here and will replace anything looking like an email address with a placeholder. Other heuristics will produce placeholders like `[PII_USER_abcdef1234567890]` and `[PII_NM_abcdef1234567890]` -- these seem to be more rudimentary, applying based on parameter names. This is particularly obvious in entries like this one:

    https://www.ancestry.co.uk/name-origin?surname=[PII_NM_abcdef1234567890]

Obviously, the `surname` parameter here is merely a search query. Given that search queries aren't being censored elsewhere, it doesn't make much sense to censor them here. But this heuristic isn't terribly clever and cannot detect whether the parameter refers to the user.

Finally, the [generic algorithm described in the previous article](/2020/01/27/avasts-broken-data-anonymization-approach/#the-patented-data-scrubbing-approach) seems to apply, this one will produce placeholders like `[PII_UNKWN_abcdef1234567890]`.

## Failures to censor user-specific parameters

It isn't a big surprise that heuristic approaches will miss some data. The generic algorithm seemed sane from [its description in the patent](https://patents.google.com/patent/US20160203337A1) however and should be able to recognize most user-specific data. In reality, this algorithm appears misimplemented, censoring only few of the relevant parameters and without an apparent system. So you will see addresses like the following without any censoring applied:

    https://nolp.dhl.de/nextt-online-public/set_identcodes.do?zip=12345&idc=9876543210987654321

Residents of Germany will immediately recognize this as a DHL package tracking link. The `idc` parameter is the package identifier whereas the sometimes present `zip` parameter is the recipient's ZIP code. And now you'd need to remember that DHL only requires you to know these two pieces of information to access the "detailed view," the one that will show you the name of whoever received the package. Yes, now we have a name to associate the browsing history with. And even if the `zip` parameter isn't in the tracking link -- remember, the data contains a guess for it based on the user's IP address, a fairly accurate one in fact.

Want more examples? Quite a few "referrers" are related to the authentication process of websites. A search for keywords like "oauth", "openid" or "token" will produce lots of hits, usually without any of the parameters being censored. Worst-case scenario here: somebody with access to Jumpshot data could hijack an already authenticated session and impersonate this user, allowing them to access and modify user's data. One has to hope that larger websites like Facebook and Google use short enough expiration intervals that such attacks would be impracticable for Jumpshot customers.

JWT tokens are problematic even under ideal conditions however. [JWT](https://jwt.io/) is an authentication approach which works without server-side state, all the relevant information is encoded in the token itself. These tokens are easily found by searching for the ".ey" keyword. There are some issued by Facebook, AOL, Microsoft and other big names. And after reversing Base64 encoding you get something like:

    {"instanceId":"abcd1234","uid":12345,"nonce":"dcba4321","sid":"1234567890"}

Most values here are implementation-specific and differ from site to site. But usually there is some user identifier, either a numerical one (can likely be converted into a user name somewhere on the website), occasionally an email or even an IP address. It also often contains tokens related to the user's session and potentially allowing hijacking it: session identifier, nonce, sometimes even OAuth tokens.

Last but not least, there is this:

    https://mail.yandex.ru/u1234/?uid=987654321&login=myyandexname#inbox

This address also wasn't worth censoring for Avast. Now I never used Yandex Mail but I guess that this user's email address is `myyandexname@yandex.ru`. There are quite a few addresses looking like this, most of them contain only the numerical user identifier however. I strongly suspect that some Yandex service or API allows translating these numerical IDs into user names however, thus allowing to deduce user's email address.

## Shortcomings of the heuristics

Now let's have a look at the heuristic removing email addresses, the last line of defense. This one will reliably remove any URL-encoded email addresses, so you won't find anything like `me%40example.com` in the data. But what about unusual encodings? Heuristics aren't flexible, so these won't be detected.

It starts with the obvious case of URL encoding applied twice: `me%2540example.com`. The Avast data contains plenty of email addresses encoded like this, for example:

    https://m.facebook.com/login.php?next=https%3A%2F%2Fm.facebook.com%2Fn%2F
    %3Fthread_fbid%3D123456789%26source%3Demail%26cp%3Dme%2540example.com

Did you notice what happened here? The email address isn't a parameter to Facebook's `login.php`. The only parameter here is `next`, it's the address to navigate to after a successful login. And that address just happens to contain the user's email address as a parameter, for whatever reason. Hence URL encoding applied twice.

Another scenario:

    https://www.google.com/url?q=http://example.com/
    confirm?email%3dme%2540example.com&source=gmail

What's that, a really weird Google query? The `source=gmail` parameter indicates that it isn't, it's rather a link that somebody clicked in Gmail. Apparently, Gmail will will send such links as "queries" to the search engine before the user is redirected to their destination. And the destination address contains the email address here, given how the link originated from an address confirmation email apparently. Links from newsletters will also frequently contain the user's email address.

And then there is this unexpected scenario:

    https://mail.yahoo.com/d/search/name=John%2520Smith&emailAddresses=me%2540example.com

I have no idea why search in Yahoo Mail will encode parameters twice but it does. And searches of Yahoo Mail users contain plenty of names and email addresses of the people they communicate with.

Note that I only mentioned the most obvious encoding approach here. Some websites encode their parameters using Base64 encoding for some reason, and these also contain email addresses quite frequently.

## Where do these users live?

So far we have names, email and IP addresses. That's interesting of course but where do these users actually live? Jumpshot data provides only a rough approximation for that. Luckily (or unfortunately -- for the users), Google Maps is a wildly popular service, and so it is very present in the data. For example:

    https://www.google.de/maps/@52.518283,13.3735008,17z

That's a set of very precise geographical coordinates, could it be the user's home? It could be, but it also might be a place where they wanted to go, or just an area that they looked at. The following entry is actually way more telling:

    https://www.google.de/maps/dir/Platz+der+Republik+1,+10557+Berlin/
    Museum+für+Kommunikation,+Leipziger+Straße,+Berlin/@52.5140286,13.3774848,16z

By Avast's standards, a route planned on Google Maps isn't personally identifiable information -- any number of people could have planned the same route. However, if the start of the route is an address and the end a museum, a hotel or a restaurant, it's a fairly safe bet that the address is actually the user's home address. Even when it isn't obvious which end of the route the user lives at, the ZIP code in the Jumpshot data helps one make an educated guess here.

And then you type "Platz der Republik 1, Berlin" into a search engine and in quite a few cases the address will immediately map to a name. So your formerly anonymous user is now called Angela Merkel.

## Wasn't it all aggregated?

In 2015 Avast's then-CTO Ondřej Vlček [promised](https://forum.avast.com/?topic=171725.0):

> These aggregated results are the only thing that Avast makes available to Jumpshot customers and end users.

Aggregation would combine data from multiple users into a single record, an approach that would make conclusions about individual users much harder. Sounds quite privacy-friendly? Unfortunately, Jumpshot's marketing already cast significant doubt on the claims that aggregation is being used consistently.

What was [merely a suspicion](/2020/01/27/avasts-broken-data-anonymization-approach/#what-about-aggregation) in my previous blog post is now a fact. I don't want to say anything about Jumpshot data in general, I haven't seen all of it. But the data I saw wasn't aggregated at all, each record was associated with exactly one user and there was a unique user identifier to tell records from different users apart. Also, I've seen marketing material for the "All Clicks Feed" suggesting that this data isn't aggregated either.

The broken promises here aren't terribly surprising, aggregated data is much harder to monetize. I already quoted Graham Cluley before with [his prediction](https://www.grahamcluley.com/week-avg-flogs-web-browsing-search-history/) from 2015:

> But let’s not kid ourselves. Advertisers aren’t interested in data which can’t help them target you. If they really didn’t feel it could help them identify potential customers then the data wouldn’t have any value, and they wouldn’t be interested in paying AVG to access it.

## Conclusions

I looked into a week's worth of data from a "limited insights" product sold by Jumpshot and I was already able to identify a large number of users, sometimes along with their porn watching habits. The way this data was anonymized by Avast is insufficient to say the least. Companies with full access to the "every click, on every site" product were likely able to identify and subsequently stalk the majority of the affected users. The process of identifying users was easy to automate, e.g. by looking for double encoded email addresses or planned Google Maps routes.

The only remaining question is: why is it that Avast was so vehemently denying selling any personally identifiable data? Merely a few days before deciding to shut down Jumpshot Avast's CEO Ondřej Vlček repeated in a [blog post](https://blog.avast.com/our-commitment-to-responsible-data-use):

> We want to reassure our users that at no time have we sold any personally identifiable information to a third party.

So far we only suspected, now we can all be certain that this statement isn't true. To give them the benefit of doubt, how could they have not known? The issues should have been pretty obvious to anybody who took a closer look at the data. The whole scandal took months to unwind. Does this mean that throughout all that time Avast kept repeating this statement, giving it to journalists and spreading it on social media, yet nobody bothered to verify it? If we follow this line of thought then the following statement from the same blog post is clearly a bold lie:

> The security and privacy of our users worldwide is Avast’s priority

I for my part removed all the raw and processed Jumpshot data in presence of witnesses after concluding this investigation. Given the nature of this data, this seems to be the only sensible course of action.
