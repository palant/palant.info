---
categories:
- website
- hugo
date: 2020-09-03 13:43:19+02:00
description: I extended the comment system of this blog to process Webmention requests.
  These go through the same pre-moderation process and will appear as comments if
  approved.
lastmod: '2020-09-03 16:54:00'
title: Added Webmention support to the blog
---

A discussion on Mastodon convinced me to take a look at the [Webmention standard](https://www.w3.org/TR/webmention/), and I even implemented a receiver for this blog. Essentially, this is a newer variant of the [Pingback](https://en.wikipedia.org/wiki/Pingback) mechanism: when one blog links to another, the software behind one blog will notify the other. For my blog, I implemented this as part of the commenting mechanism, and approved Webmentions will appear as comments with minimally different representation.

Given that this website is built via the Hugo static site generator, the commenting system is [rather unusual](/2019/04/04/switching-my-blog-to-a-static-site-generator/#somewhat-dynamic-commenting-functionality). Comments received are added to the pre-moderation queue. Once approved, they are added to the [blog's GitHub repository](https://github.com/palant/palant.info) and will be built along with the other content. Webmention requests are handled in the same way.

{{< toc >}}

## Security considerations

You might have heard about [Pingback being misused for DDoS attacks](https://blog.sucuri.net/2014/03/more-than-162000-wordpress-sites-used-for-distributed-denial-of-service-attack.html). A naive Webmention implementation could be misused in the same way. The issue is [documented](https://indieweb.org/DDOS) and one mitigation is even listed in the standard itself: don't initiate verification requests immediately, spread them out randomly. Pre-moderation does exactly that as a side-effect: when receiving a Webmention request, my server only performs some basic verification and saves the URL to the queue. Downloading this URL to verify that it actually contains a link to my site and to extract metadata only happens during review.

There are also some concerns when processing data from an untrusted server. I made sure to set a timeout so that this request doesn't take too long, and I also won't download more than 1 MB of data, to limit the memory usage of it.

Finally, spam is also a concern. Manual moderation should also help here, I won't approve Webmentions from link farms or misleading articles of course. Still, automated spamming via a standardized interface like Webmention is easier than abusing blog-specific comment functionality. If this becomes an issue, I might disable this functionality as a last resort.

## Metadata processing

A Webnotification request only contains two pieces of data: the URL containing the link and the URL being linked to. When displaying this in the comments section, one would ideally have more data: an author, a title and maybe even a text excerpt. The standard doesn't say how one is supposed to get those, but it does refer to the [h-entry microformat](http://microformats.org/wiki/h-entry).

I looked at three existing implementations to get some inspiration. Two tried to extract h-entry data from the page, but they weren't terribly consistent. For example, they assumed that the first h-entry on the page is the relevant one.

For my implementation, I decided to look for the h-entry containing the link to my article. If I can find one, I will get author, title and URL from its metadata. I will also take its content and shorten it – this becomes the “comment” text.

As a fallback, if no relevant h-entry is found or if it doesn't contain the necessary metadata, I'll also process the document's `<meta>` tags and similar information. The description field will be used as comment text if present.

## The actual code

The [change to the comment server](https://github.com/palant/palant.info_commentserver/commit/af14866feb0eafd3f881d408340bcc716baf8475) increased the code size by around 160 lines -- much of the existing logic could be reused here. As to the actual website, I had to [add the required link tag](https://github.com/palant/palant.info/commit/b7224cd16d16b93f008b2ae3aaf5047038251129) and [adjust comment display slightly](https://github.com/palant/palant.info/commit/dc1490a3689e563e4a999636b90d6a03706c4bf4). This seems to work but I suspect that further adjustments will become necessary once real Webmention requests start coming in. Not that I'm confident to ever receive one, the standard not being widely adopted yet.

I haven't implemented a sender yet, maybe I will at some point. It would have to run when changes are deployed to the website, detecting new articles and notifying link targets.