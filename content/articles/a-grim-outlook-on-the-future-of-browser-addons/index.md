---
categories:
- mozilla
- add-ons
- google
date: 2020-08-31 13:04:10+02:00
description: Mozilla limiting users’ choice to 9 add-ons on mobile is only the latest
  development. Add-on support is degrading across all browsers and will continue to
  do so.
lastmod: '2020-09-02 05:13:19'
title: A grim outlook on the future of browser add-ons
---

A few days ago Mozilla [announced the release of their new Android browser](https://blog.mozilla.org/blog/2020/08/25/introducing-a-new-firefox-for-android-experience/). This release, dubbed “Firefox Daylight,” is supposed to achieve nothing less than to “revolutionize mobile browsing.” And that also goes for browser extensions of course:

> Last but not least, we revamped the extensions experience. We know that add-ons play an important role for many Firefox users and we want to make sure to offer them the best possible experience when starting to use our newest Android browsing app. We’re kicking it off with the top 9 add-ons for enhanced privacy and user experience from our Recommended Extensions program.

What this text carefully avoids stating directly: that's the only nine (as in: single-digit 9) add-ons which you will be able to install on Firefox for Android now. After being able to use thousands of add-ons before, this feels like a significant downgrade. Particularly given that there appears to be no technical reason why none of the other add-ons are allowed any more, it being merely a policy decision. I already verified that my add-ons can still run on Firefox for Android but aren't allowed to, same should be true for the majority of other add-ons.

{{< img src="extensions-evolution.png" width="600" alt="Historical Firefox browser extension icons (puzzle pieces) representing the past, an oddly shaped and inconvenient puzzle piece standing for the present and a tombstone for the potential future" >}}
<em>
  Evolution of browser extensions. Image credits:
  <a href="https://dxr.mozilla.org/mozilla-central/source/" rel="nofollow">Mozilla</a>,
  <a href="https://openclipart.org/detail/28292/iconpuzzle2green" rel="nofollow">jean_victor_balin</a>
</em>
{{< /img >}}

{{< toc >}}

## Why would Mozilla kill mobile add-ons?

Before this release, Firefox was the only mobile browser to allow arbitrary add-ons. Chrome experimented with add-ons on mobile but never actually released this functionality. Safari implemented a halfhearted ad blocking interface, received much applause for it, but never made this feature truly useful or flexible. So it would seem that Firefox had a significant competitive advantage here. Why throw it away?

Unfortunately, supporting add-ons comes at a considerable cost. It isn't merely the cost of developing and maintaining the necessary functionality, there is also the performance and security impact of browser extensions. Mozilla has been struggling with this for a while. The initial solution was reviewing all extensions before publication. It was a costly process which also introduced delays, so by now all add-ons are published immediately but are still supposed to be reviewed manually eventually.

Mozilla is currently facing challenges both in terms of market share and financially, the latter being linked to the former. This once again became obvious when Mozilla [laid off a quarter of its workforce](https://blog.mozilla.org/blog/2020/08/11/changing-world-changing-mozilla/) a few weeks ago. In the past, add-ons have done little to help Mozilla achieve a breakthrough on mobile, so costs being cut here isn't much of a surprise. And properly reviewing nine extensions is certainly cheaper than keeping tabs on a thousand.

## But won't Mozilla add more add-ons later?

Yes, they also say that more add-ons will be made available later. But if you look closely, all of Mozilla's communication around that matter has been focused on containing damage. I've looked through a bunch of blog posts, and nowhere did it simply say: “When this is released, only a handful add-ons will be allowed, and adding more will require our explicit approval.” A number of Firefox users relies on add-ons, so I suspect that the strategy is to prevent an outcry from those.

This might also be the reason why extension developers haven't been warned about this “minor” change. Personally, I learned about it from a user's issue report. While there has been some communication around Recommended Extensions program, it was never mentioned that participating in this program was a prerequisite for extensions to stay usable.

I definitely expect Mozilla to add more add-ons later. But it will be the ones that users are most vocal about. Niche add-ons with only few users? Bad luck for you…

What this also means: the current state of the add-on ecosystem is going to be preserved forever. If only popular add-ons are allowed, other add-ons won't get a chance to become popular. And since every add-on has to start small, developing anything new is a wasted effort.

**Update** (2020-09-01): There are some objections from the Mozilla community stating that I'm overinterpreting this. Yes, maybe I am. Maybe add-ons are still a priority to Mozilla. So much that for this release they:

* declared gatekeeping add-ons a virtue rather than a known limitation (“revamped the extensions experience”).
* didn't warn add-on developers about the user complains to be expected, leaving it to them to figure out what's going on.
* didn't bother setting a timeline when the gatekeeping is supposed to end and in fact didn't even state unambiguously that ending it is the plan.
* didn't document the current progress anywhere, so nobody knows what works and what doesn't in terms of extension APIs (still [work in progress](https://github.com/mozilla-mobile/fenix/issues/14034) at the time of writing).

I totally get it that the development team has more important issues to tackle now that their work has been made available to a wider audience. I'm merely not very confident that once they have all these issues sorted out they will still go back to the add-on support and fix it. Despite all the best intentions, there is nothing as permanent as a temporary stopgap solution.

## Isn't the state of affairs much better on the desktop?

Add-on support in desktop browsers looks much better of course, with all major browsers supporting add-ons. Gatekeeping also isn't the norm here, with Apple being the only vendor so far to discourage newcomers. However, a steady degradation has been visible here as well, sadly an ongoing trend.

Browser extensions were pioneered by Mozilla and originally had the same level of access as the browser's own code. This allowed amazingly powerful extensions, for example the [vimperator extension](https://en.wikipedia.org/wiki/Vimperator) implemented completely different user interface paradigms which were inspired by the vim editor. Whether you are a fan of vim or not (few people are), being able to do something like this was very empowering.

So it's not surprising that Mozilla attracted a very active community of extension builders. There has been lots of innovation, extensions showcasing the full potential of the browser. Some of that functionality has been eventually adopted by the browsers. Remember [Firebug](https://en.wikipedia.org/wiki/Firebug_(software)) for example? The similarity to Developer Tools as they are available in any modern browser is striking.

{{< img src="firebug.png" width="600" alt="Historical Firefox browser extension icons (puzzle pieces) representing the past, an oddly shaped and inconvenient puzzle piece standing for the present and a tombstone for the potential future" >}}
<em>
  Firebug screenshot. Image credits:
  <a href="https://commons.wikimedia.org/wiki/File:Firebug_extension_screenshot.png" rel="nofollow">Wikipedia</a>
</em>
{{< /img >}}

Once Google Chrome came along, this extension system was doomed. It simply had too many downsides to survive the fierce competition in the browser market. David Teller [explains in his blog post](https://yoric.github.io/post/why-did-mozilla-remove-xul-addons/) why Mozilla had no choice but to remove it, and he is absolutely correct of course.

As to the decision about what to replace it with, I'm still not convinced that Mozilla made a good choice when they decided to copy Chrome's extension APIs. While this made development of cross-browser extensions easier, it also limited Firefox extensions to the functionality supported by Chrome. Starting out as a clear leader in terms of customization, Firefox was suddenly chasing Chrome and struggling to keep full compatibility. And of course Google refused to cooperate on standardization of its underdocumented extension APIs (surprise!).

## Where is add-on support on desktop going?

Originally, Mozilla promised that they wouldn't limit themselves to the capabilities provided by Chrome. They intended to add more functionality soon, so that more powerful extensions would be possible. They also intended to give extension developers a way to write new extension APIs themselves, so that innovation could go beyond what browser developers anticipated. None of this really materialized, other than a few trivial improvements to Chrome's APIs.

And so Google with its Chrome browser is now determining what extensions should be able to do -- in any browser. After all, Mozilla's is the only remaining independent extensions implementation, and it is no real competition any more. Now that they have this definition power, Google unsurprisingly decided to [cut the costs incurred by extensions](https://www.ghacks.net/2019/11/13/google-implements-controversial-manifest-v3-in-chrome-canary-80/). Among other things, this change will remove `webRequest` API which is the one most powerful tool currently available to extensions. I expect Mozilla to follow suit sooner or later. And this is unlikely to be the last functionality cut.

## Conclusions

The recent browser wars set a very high bar on what a modern browser should be. We got our lean and fast browsers, supporting vast amounts of web standards and extremely powerful web applications. The cost was high however: users' choice was reduced significantly, it's essentially Firefox vs. Chrome in its numerous varieties now, other browser engines didn't survive. The negative impacts of Google's almost-monopole on web development aren't too visible yet, but in the browser customization space they already show very clearly.

Google Chrome is now the baseline for browser customization. On mobile devices this means that anything beyond “no add-on support whatsoever” will be considered a revolutionary step. Mozilla isn't the first mobile browser vendor to celebrate themselves for providing a few selected add-ons. Open add-on ecosystems for mobile browsers are just not going to happen any more.

And on desktop Google has little incentive to keep the bar high for add-on support. There will be further functionality losses here, all in the name of performance and security. And despite these noble goals it means that users are going to lose out: the innovative impact of add-ons is going away. In future, all innovation will have to originate from browser vendors themselves, there will be no space for experiments or niche solutions.