---
categories:
- xiaomi
- security
- privacy
- reverse-engineering
date: 2020-05-04 15:50:01+02:00
description: Xiaomi browsers collect not merely your browsing history but also searches,
  downloads, YouTube videos watched and much more.
lastmod: '2021-03-06 17:24:41+01:00'
title: Are Xiaomi browsers spyware? Yes, they are...
---

In case you missed it, there was a [Forbes article](https://www.forbes.com/sites/thomasbrewster/2020/04/30/exclusive-warning-over-chinese-mobile-giant-xiaomi-recording-millions-of-peoples-private-web-and-phone-use/) on Mi Browser Pro and Mint Browser which are preinstalled on Xiaomi phones. The article accuses Xiaomi of exfiltrating a history of all visited websites. Xiaomi on the other hand accuses Forbes of misrepresenting the facts. They claim that the data collection is following best practices, the data itself being aggregated and anonymized, without any connection to user's identity.

TL;DR: It is really that bad, and even worse actually.

**Update** (2021-03-06): It has been close to a year since I wrote this article. In this time Xiaomi did little to address this issue. On the other hand, a similar issue [has been discovered in Xiaomi’s payment app](https://twitter.com/evstykas/status/1340433914763079681), which would even transmit account data to the “analytics” servers. So it can be assumed that other Xiaomi apps are similarly compromised.

If you've been following my blog for a while, you might find this argumentation familiar. It's almost identical to Avast's communication after they were [found spying on the users](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/) and [browser vendors pulled their extensions from add-on stores](/2019/12/03/mozilla-removes-avast-extensions-from-their-add-on-store-what-will-google-do/). In the end I was given proof that [their data anonymization attempts were only moderately successful](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/) if you allow me this understatement.

Given that neither the Forbes article nor the security researchers involved seem to provide any technical details, I wanted to take a look for myself. I decompiled Mint Browser 3.4.0 and looked for clues. This isn't the latest version, just in case Xiaomi already modified to code in reaction to the Forbes article. **Update** (2020-05-08): If you don't need the technical explanation, the [newer article](/2020/05/08/what-data-does-xiaomi-collect-about-you/) gives an overview of the issue.

*Disclaimer*: I think that this is the first time I analyzed a larger Android application, so please be patient with me. I might have misinterpreted one thing or another, even though the big picture seems to be clear. Also, my conclusions are based exclusively on code analysis, I've never seen this browser in action.

{{< toc >}}

## The general analytics setup

The Forbes article explains that the data is being transmitted to a Sensors Analytics backend. The Xiaomi article then provides the important clue: `sa.api.intl.miui.com` is the host name of this backend. They then go on explaining how it's a server that Xiaomi owns rather than a third party. But they are merely trying to distract us: if sensitive data from my browser is being sent to this server, why would I care who owns it?

We find this server name mentioned in the class `miui.globalbrowser.common_business.g.i` (yes, some package and class names are mangled). It's used in some initialization code:

{{< highlight java >}}
final StringBuilder sb = new StringBuilder();
sb.append("https://sa.api.intl.miui.com/sa?project=global_browser_mini&r=");
sb.append(A.e);
a = sb.toString();
{{< /highlight >}}

Looking up `A.e`, it turns out to be a country code. So the `i.a` static member here ends up holding the endpoint URL with the user's country code filled in. And it is being used in the class’ initialization function:

{{< highlight java >}}
public void a(final Context c) {
    SensorsDataAPI.sharedInstance(this.c = c, i.a, this.d);
    SensorsDataAPI.sharedInstance().identify(com.xiaomi.mistatistic.sdk.e.a(this.c));
    this.c();
    this.d();
    this.e();
    this.b();
}
{{< /highlight >}}

The Sensors Analytics API is public, so we can look up the [SensorsDataAPI class](https://github.com/sensorsdata/sa-sdk-android/blob/512fc04a9183550561ab6b8745fb71f3d1f75f7f/SensorsAnalyticsSDK/src/main/java/com/sensorsdata/analytics/android/sdk/SensorsDataAPI.java) and learn that the first `sharedInstance()` call creates an instance and sets its server URL. The next line calls `identify()` setting an "anonymous ID" for this instance which will be sent along with every data point, more on that later.

The call to `this.c()` is also worth noting as this will set a bunch of additional properties to be sent with each request:

{{< highlight java >}}
public void c() {
    final JSONObject jsonObject = new JSONObject();
    jsonObject.put("uuid", (Object)com.xiaomi.mistatistic.sdk.e.a(this.c));
    int n;
    if (H.f(miui.globalbrowser.common.a.a())) {
        n = 1;
    }
    else {
        n = 0;
    }
    jsonObject.put("internet_status", n);
    jsonObject.put("platform", (Object)"AndroidApp");
    jsonObject.put("miui_version", (Object)Build$VERSION.INCREMENTAL);
    final String e = A.e;
    a(e);
    jsonObject.put("miui_region", (Object)e);
    jsonObject.put("system_language", (Object)A.b);
    SensorsDataAPI.sharedInstance(this.c).registerSuperProperties(jsonObject);
}
{{< /highlight >}}

There we have the same "anonymous ID" sent as `uuid` parameter, just in case. In addition, the usual version, region, language data is being sent.

For me, it wasn't entirely trivial to figure out where this class is being initialized from. Turns out, from class `miui.globalbrowser.common_business.g.b`:

{{< highlight java >}}
public static void a(final String s, final Map<String, String> map) {
    a(s, map, true);
}

public static void a(final String s, final Map<String, String> map, final boolean b) {
    if (b) {
        i.a().a(s, map);
    }
    miui.globalbrowser.common_business.g.d.a().a(s, map);
}
{{< /highlight >}}

So the `miui.globalbrowser.common_business.g.b.a()` call will set the third parameter to `true` by default. This call accesses a singleton `miui.globalbrowser.common_business.g.i` instance (will be created if it doesn't exist) and makes it actually track an event (`s` is the event name here and `map` are the parameters being sent in addition to the default ones). The additional `miui.globalbrowser.common_business.g.d.a()` call triggers their MiStatistics analytics framework which I didn't investigate.

And that's it. We now have to find where in the code `miui.globalbrowser.common_business.g.b` class is used and what data it receives. All that data will be sent to Sensors Analytics backend regularly.

## How anonymous is that ID?

Looking up `com.xiaomi.mistatistic.sdk.e.a()` eventually turns up ID generation code very close to the one cited in the Xiaomi blog post:

{{< highlight js >}}
public static String d(final Context context) {
    if (!TextUtils.isEmpty((CharSequence)y.g)) {
        return y.g;
    }
    final long currentTimeMillis = System.currentTimeMillis();
    final String a = L.a(context, "anonymous_id", "");
    final long a2 = L.a(context, "aigt", 0L);
    final long a3 = L.a(context, "anonymous_ei", 7776000000L);
    if (!TextUtils.isEmpty((CharSequence)a) && currentTimeMillis - a2 < a3) {
        y.g = a;
    }
    else {
        L.b(context, "anonymous_id", y.g = UUID.randomUUID().toString());
    }
    L.c(context, "aigt", currentTimeMillis);
    return y.g;
}
{{< /highlight >}}

The `L.a()` call is retrieving a value from `context.getSharedPreferences()` with fallback. `L.b()` and `L.c()` calls will store a value there. So Xiaomi is trying to tell us: "Look, the ID is randomly generated, without any relation to the user. And it is renewed every 90 days!"

Now 90 days are a rather long time interval even for a randomly generated ID. With enough data points it should be easy to deduce the user's identity from it. But there is another catch. See that `aigt` preference? What is its value?

The *intention* here seems to be that `aigt` is the timestamp when the ID was generated. So if that timestamp deviates from current time by more than 7776000000 milliseconds (90 days) a new ID is going to be generated. However, this implementation is buggy, it will update `aigt` on every call rather than only when a new ID is generated. So the only scenario where a new ID will be generated is: this method wasn't called for 90 days, meaning that the browser wasn't started for 90 days. And that's rather unlikely, so one has to consider this ID permanent.

And if this weren't enough, there is another catch. If you look at the [SensorsDataAPI class](https://github.com/sensorsdata/sa-sdk-android/blob/512fc04a9183550561ab6b8745fb71f3d1f75f7f/SensorsAnalyticsSDK/src/main/java/com/sensorsdata/analytics/android/sdk/SensorsDataAPI.java) again, you will see that the "anonymous ID" is merely a fallback when a login ID isn't available. And what is the login ID here? We'll find it being set in the `miui.globalbrowser.common_business.g.i` class:

{{< highlight java >}}
public void b() {
    final Account a = miui.globalbrowser.common.c.b.a(this.c);
    if (a != null && !TextUtils.isEmpty((CharSequence)a.name)) {
        SensorsDataAPI.sharedInstance().login(a.name);
    }
}
{{< /highlight >}}

That's exactly what it looks like: a Xiaomi account ID. So if the user is logged into the browser, the tracking data will be connected to their Xiaomi account. And that one is linked to the user's email address at the very least, probably to other identifying parameters as well.

## What is being collected?

As mentioned above, we need to look at the places where `miui.globalbrowser.common_business.g.b` class methods are called. And very often these are quite typical for product analytics, for example:

{{< highlight java >}}
final HashMap<String, String> hashMap = new HashMap<String, String>();
if (ex.getCause() != null) {
    hashMap.put("cause", ex.getCause().toString());
}
miui.globalbrowser.common_business.g.b.a("rv_crashed", hashMap);
{{< /highlight >}}

So there was a crash and the vendor is notified about the issue. Elsewhere the data indicates that a particular element of the user interface was opened, also very useful information to improve the product. And then there is this in class `com.miui.org.chromium.chrome.browser.webview.k`:

{{< highlight java >}}
public void onPageFinished(final WebView webView, final String d) {
    ...
    if (!this.c && !TextUtils.isEmpty((CharSequence)d)) {
        miui.globalbrowser.common_business.g.b.a("page_load_event_finish", "url", this.a(d));
    }
    ...
}

public void onPageStarted(final WebView webView, final String e, final Bitmap bitmap) {
    ...
    if (!this.b && !TextUtils.isEmpty((CharSequence)e)) {
        miui.globalbrowser.common_business.g.b.a("page_load_event_start", "url", this.a(e));
    }
    ...
}
{{< /highlight >}}

That's the code sending all visited websites to an analytics server. Once when the page starts loading, and another time when it finishes. And the Xiaomi blog post explains why this code exists: "The URL is collected to identify web pages which load slowly; this gives us insight into how to best improve overall browsing performance."

Are you convinced by this explanation? Because I'm not. If this is all about slow websites, why not calculate the page load times locally and transmit only the slow ones? This still wouldn't be great for privacy but an order of magnitude better than what Xiaomi actually implemented. Xiaomi really needs to try harder if we are to assume incompetence rather than malice here. How was it decided that sending all visited addresses is a good compromise? Was privacy even considered in that decision? Would they still make the same decision today? And if not, how did they adapt their processes to reflect this?

But there are far more cases where their analytics code collects too much data. In class `com.miui.org.chromium.chrome.browser.omnibox.NavigationBar` we'll see:

{{< highlight java >}}
final HashMap<String, String> hashMap = new HashMap<String, String>();
hashMap.put("used_searchengine", com.miui.org.chromium.chrome.browser.search.b.a(this.L).f());
hashMap.put("search_position", miui.globalbrowser.common_business.g.e.c());
hashMap.put("search_method", miui.globalbrowser.common_business.g.e.b());
hashMap.put("search_word", s);
miui.globalbrowser.common_business.g.b.a("search", hashMap);
{{< /highlight >}}

So searching from the navigation bar won't merely track the search engine used but also what you searched for. In the class `miui.globalbrowser.download.J` we see for example:

{{< highlight java >}}
final HashMap<String, String> hashMap = new HashMap<String, String>();
hashMap.put("op", s);
hashMap.put("suffix", s2);
hashMap.put("url", s3);
if (d.c(s4)) {
    s = "privacy";
}
else {
    s = "general";
}
hashMap.put("type", s);
b.a("download_files", hashMap);
{{< /highlight >}}

This isn't merely tracking the fact that files were downloaded but also the URLs downloaded. What kind of legitimate interest could Xiaomi have here?

And then this browser appears to provide some custom user interface for YouTube videos. Almost everything is being tracked there, for example in class `miui.globalbrowser.news.YMTSearchActivity`:

{{< highlight java >}}
final HashMap<String, String> hashMap = new HashMap<String, String>();
hashMap.put("op", "search");
hashMap.put("search_word", text);
hashMap.put("search_type", s);
hashMap.put("page", this.w);
miui.globalbrowser.common_business.g.b.a("youtube_search_op", hashMap);
{{< /highlight >}}

Why does Xiaomi need to know what people search on YouTube? And not just that, elsewhere they seem to collect data on what videos people watch and how much time they spend doing that. Xiaomi also seems to know what websites people have configured in their speed dial and when they click those. This doesn't leave a good impression, could it be surveillance functionality after all?

## Conclusions

If you use Mint Browser (and presumably Mi Browser Pro similarly), Xiaomi doesn't merely know which websites you visit but also what you search for, which videos you watch, what you download and what sites you added to the Quick Dial page. Heck, they even track which porn site triggered the reminder to switch to incognito mode! Yes, if Xiaomi wants anybody to believe that this wasn't malicious they have a lot more explaining to do.

The claim that this data is anonymized cannot be maintained either. Even given the random user ID (which appears to be permanent by mistake) deducing user's identity should be easy, we've [seen it before](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/). But they also transmit user's Xiaomi account ID if they know it, which is directly linked to the user's identity.

Xiaomi now announced that they will turn off collection of visited websites in incognito mode. That's a step in the right direction, albeit a tiny one. Will they still collecting all the other data in incognito mode? And even if not, why collect so much data during regular browsing? What reason is there that justifies all these privacy violations?

**Update** (2020-05-07): I looked into the privacy-related changes implemented in Mint Browser 3.4.3. It's was a bigger improvement than what it sounded like, the "statistics" collection functionality can be disabled entirely. However, you have to make sure that you have "Incognito Mode" turned on and "Enhanced Incognito Mode" turned off -- that's the only configuration where you can have your privacy.
