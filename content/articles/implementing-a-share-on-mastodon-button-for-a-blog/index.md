---
title: "Implementing a “Share on Mastodon” button for a blog"
date: 2023-10-19T15:31:41+0200
description: "Normally, adding a share button to a blog is a trivial task. In case of Mastodon, it is complicated by the fact that you need to choose your home instance. And it is further complicated if you decide to support further Fediverse applications beyond Mastodon."
categories:
- hugo
- mastodon
---

I decided that I would make it easier for people to share my articles on social media, most importantly on Mastodon. However, my Hugo theme didn’t support showing a “Share on Mastodon” button yet. It wasn’t entirely trivial to add support either: unlike with centralized solutions like Facebook where a simple link is sufficient, here one would need to choose their home instance first.

As far as existing solutions go, the only reasonably sophisticated approach appears to be [Share₂Fedi](https://s2f.kytta.dev/). It works nicely, privacy-wise one could do better however. So I ended up [implementing my own solution](https://github.com/reuixiy/hugo-theme-meme/commit/4243546da6efc5ced2aaf05c3faa8f3e6b677cd4) while also generalizing that solution to support a variety of different Fediverse applications in addition to Mastodon.

{{< img src="share.png" width="600" alt="Screenshot of a web page titled “Share on Fediverse”" />}}

{{< toc >}}

## Why not Share₂Fedi?

If all you want is quickly adding a “Share on Fediverse” button, Share₂Fedi is really the simplest solution. It only requires a link, just like your typical share button. You link to the Share₂Fedi website, passing the text to be shared as a query parameter. The user will be shown an interstitial page there, allowing them to select a Fediverse instance. After submitting the form they will be redirected to the Fediverse instance in question for the final confirmation.

Unfortunately, the privacy aspect of this solution isn’t quite optimal. Rather than having all the processing happen on the client side, Share₂Fedi relies on server-side processing. This means that your data is being stored in the server logs at the very least. This data being the address and title of the article being shared, it isn’t terribly sensitive. Yet why send any data to a third party when you could send none?

I was told that Share₂Fedi was implemented in this way in order to work even with client-side JavaScript disabled. Which is a fair point but not terribly convincing seeing how your typical social media website won’t work without JavaScript.

But it is possible to self-host Share₂Fedi of course. It is merely something I’d rather avoid. See, this blog is built with the Hugo static site generator, and there is very little server-side functionality here. I’d rather keep it this way.

## Share on Mastodon or on Fediverse?

Originally, I meant to add buttons for individual applications. First a “Share on Mastodon” button. Then maybe “Share on Lemmy.” Also “Share on Kbin.” Oh, maybe also Friendica. Wait, Misskey exposes the same sharing endpoint as Mastodon?

I realized that this approach doesn’t really scale, with the Fediverse consisting of many different applications. Supporting the applications beyond Mastodon is trivial, but adding individual buttons for each application would create a mess.

So maybe have a “Share on Fediverse” button instead of “Share on Mastodon”? Users have to select an instance anyway, and the right course of action can be determined based on the type of this instance. There is a [Fediverse logo](https://commons.wikimedia.org/wiki/File:Fediverse_logo_proposal.svg) as well.

Only concern: few people know the Fediverse logo so far, way fewer than the people recognizing the Mastodon logo. So I decided to show both “Share on Mastodon” and “Share on Fediverse” buttons. When clicked, both lead to the exact same page.

{{< img src="share_buttons.png" width="106" alt="A black-and-white version of the Mastodon logo next to a similarly black-and-white version of the Fediverse logo" />}}

And that page would choose the right endpoint based on the selected instance. Here are the endpoints for individual Fediverse applications (mostly taken over from Share₂Fedi, some additions by me):

```json
{
  "calckey": "share?text={text}",
  "diaspora": "bookmarklet?title={title}&notes={description}&url={url}",
  "fedibird": "share?text={text}",
  "firefish": "share?text={text}",
  "foundkey": "share?text={text}",
  "friendica": "compose?title={title}&body={description}%0A{url}",
  "glitchcafe": "share?text={text}",
  "gnusocial": "notice/new?status_textarea={text}",
  "hometown": "share?text={text}",
  "hubzilla": "rpost?title={title}&body={description}%0A{url}",
  "kbin": "new/link?url={url}",
  "mastodon": "share?text={text}",
  "meisskey": "share?text={text}",
  "microdotblog": "post?text=[{title}]({url})%0A%0A{description}",
  "misskey": "share?text={text}"
}
```

*Note*: From what I can tell, Lemmy and Pleroma don’t have an endpoint which could be used.

## What to share?

Share₂Fedi assumes that all Fediverse applications accept unstructured text. So that’s the default for my solution as well: a text consisting of the article’s title, description and address.

When it comes to the Fediverse, one size does not fit all however. Some applications like Diaspora expect more structured input. Micro.blog on the other hand expects Markdown input, special markup is required for a link to be displayed. And Kbin has the most exotic solution: it accepts only the article’s address, all other article metadata is then retrieved automatically.

So I resorted to displaying all the individual fields on the intermediate sharing page:

{{< img src="share_form.png" width="447" alt="A form titled “Share on Fediverse” with pre-filled fields Post title, Description and Link. The “Fediverse instance” field is focused and empty." />}}

These fields are pre-filled and cannot be edited. After all, what good would editing these fields do if some of them might be thrown away or mashed together in the next step? So editing the text is delegated to the Fediverse instance, and this page is only about choosing an instance.

## Trouble determining the Fediverse application

So, in order to choose the right endpoint, one has to know what Fediverse application powers the selected instance. Luckily, that’s easy. First, one downloads the `.well-known/nodeinfo` file of the instance. Here is the one for infosec.exchange:

```json
{
  "links": [
    {
      "rel": "http://nodeinfo.diaspora.software/ns/schema/2.0",
      "href": "https://infosec.exchange/nodeinfo/2.0"
    }
  ]
}
```

We need the link marked with `rel` value `http://nodeinfo.diaspora.software/ns/schema/2.0`. Next we download this one and get:

```json
{
  "version": "2.0",
  "software": {
    "name": "mastodon",
    "version": "4.3.0-alpha.0+glitch"
  },
  "protocols": ["activitypub"],
  "services": {
    "outbound": [],
    "inbound": []
  },
  "usage": {
    "users": {
      "total": 60802,
      "activeMonth": 17803,
      "activeHalfyear": 33565
    },
    "localPosts": 2081420
  },
  "openRegistrations": true,
  "metadata": {}
}
```

There it is: software name is identified as `mastodon`, so we know to use the `share?text=` endpoint.

The catch is: when I tried implementing this check, most Fediverse applications didn’t have consistent [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) on their node info responses. And this means that third-party websites (like my blog) would be allowed to request these endpoints but wouldn’t get access to the response. So no software name for me.

Now obviously it shouldn’t be like this, allowing third-party websites to access the node info is very much desirable. And most Fediverse applications being open source software, I fixed this issue for [Mastodon](https://github.com/mastodon/mastodon/pull/27413), [Diaspora](https://github.com/diaspora/diaspora/pull/8436), [Friendica](https://github.com/friendica/friendica/pull/13549) and [Kbin](https://codeberg.org/Kbin/kbin-core/pulls/1195). GNU Social, Misskey, Lemmy, Pleroma, Pixelfed and Peertube already had it working correctly.

But the issue remains: it will take quite some time until we can expect node info downloads to work reliably. One could use a CORS proxy of course, but it would run contrary to the goal of not relying on third parties. Or use a self-hosted CORS proxy, but that’s again adding server-side functionality.

I went with another solution. The Fediverse Observer website offers an [API](https://api.fediverse.observer/) that allows querying its list of Fediverse instances. For example, the following query downloads information on all instances it knows.

```graphql
{nodes(softwarename: ""){
  softwarename
  domain
  score
  active_users_monthly
}}
```

Unfortunately, it doesn’t have meaningful filtering capabilities. So I have to filter it after downloading: I only keep the servers with an uptime score above 90 and at least 10 active users in the past month. This results in a list of roughly 2200 instances, meaning 160 KiB uncompressed – a reasonable size IMHO, especially compared to the 5.5 MiB of the unfiltered list.

For my blog, Hugo will download this list when building the static site and incorporate it into the sharing page. So for most Fediverse instances, the page will already know what software is running on it. And if it doesn’t know an instance? Fall back to downloading the node info. And if that fails as well, just assume that it’s Mastodon.

Is this a perfect solution? Certainly not. Is it good enough? Yes, I think so. And we need that list of Fediverse instances anyway, for autocomplete functionality on the instance field.

## The complete code

This solution is now part of the MemE theme for Hugo, see [the corresponding commit](https://github.com/reuixiy/hugo-theme-meme/commit/4243546da6efc5ced2aaf05c3faa8f3e6b677cd4). `components/post-share.html` partial is where the buttons are being displayed. These link to the `fedishare.html` page and pass various parameters via the anchor part of the URL (*not* the query string so that these aren’t being saved to server logs).

The `fedishare.html` page is stored under assets. That’s because having a template turned into a static page would otherwise not happen by default and require additional changes to the configuration file. But that asset loads the `fedishare.html` partial where the actual logic is located.

Building that page involves querying the Fediverse Observer API and filtering the response. Websites that are built too frequently can [set up Hugo’s cache](https://gohugo.io/getting-started/configuration/#configure-file-caches) to avoid hitting the network every time.

The resulting list is put into a `<datalist>` element, used for autocomplete on the instance field. The same list is also being used by the `getSoftwareName()` function in the `fedishare.js` asset, the script powering the page. Fallback for unknown instances is retrieving node info, and fallback here is just assuming Mastodon.

Once this chooses some Fediverse application, the script will take the corresponding endpoint, replace the placeholders by actual values and trigger navigation to that address.
