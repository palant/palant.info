---
categories:
- security
- password-managers
date: 2019-07-08 09:05:09
description: Technically, RememBear is very similar to its competitor 1Password. Security-wise
  the tool doesn't appear to be as advanced however, and I quickly found six issues
  (severity varies) which have all been fixed since.
lastmod: '2019-07-08 12:31:31'
title: Various RememBear security issues
---

Whenever I write about security issues in some password manager, people will ask what I'm thinking about their tool of choice. And occasionally I'll take a closer look at the tool, which is what I did with the RememBear password manager in April. Technically, it is very similar to its competitor 1Password, to the point that the developers are being accused of plagiarism. Security-wise the tool doesn't appear to be as advanced however, and I quickly found six issues (severity varies) which have all been fixed since. I also couldn't fail noticing a bogus security mechanism, something that I [already wrote about](/2019/04/11/bogus-security-mechanisms-encrypting-localhost-traffic/).

## Stealing remembear.com login tokens

Password managers will often give special powers to "their" website. This is generally an issue, because compromising this website (e.g. via an all too common [XSS vulnerability](https://en.wikipedia.org/wiki/Cross-site_scripting)) will give attackers access to this functionality. In case of RememBear, things turned out to be easier however. The following function was responsible for recognizing privileged websites:

{{< highlight js >}}
isRememBearWebsite() {
    let remembearSites = this.getRememBearWebsites();
    let url = window.getOriginUrl();
    let foundSite = remembearSites.firstOrDefault(allowed => url.indexOf(allowed) === 0, undefined);
    if (foundSite) {
        return true;
    }
    return false;
}
{{< /highlight >}}

We'll get back to `window.getOriginUrl()` later, it not actually producing the expected result. But the important detail here: the resulting URL is being compared against some whitelisted origins by checking whether it starts with an origin like `https://remembear.com`. No, I didn't forget the slash at the end here, there really is none. So this code will accept `https://remembear.com.malicious.info/` as a trusted website!

Luckily, the consequences aren't as severe as with similar LastPass issues for example. This would only give attacker's website access to the RememBear login token. That token will automatically log you into the user's RememBear account, which cannot be used to access passwords data however. It will "merely" allow the attacker to manage user's subscription, with the most drastic available action being deleting the account along with all passwords data.

## Messing with AutoFill functionality

AutoFill functionality of password managers is another [typical area](https://palant.de/2018/08/29/password-managers-please-make-sure-autofill-is-secure/) where security issues are found. RememBear requires a user action to activate AutoFill which is an important preventive measure. Also, AutoFill user interface will be displayed by the native RememBear application, so websites won't have any way of messing with it. I found multiple other aspects of this functionality to be exploitable however.

Most importantly, RememBear would not verify that it filled in credentials on the right website (a recent regression according to the developers). Given that considerable time can pass between the user clicking the bear icon to display AutoFill user interface and the user actually selecting a password to be filled in, one cannot really expect that the browser tab is still displaying the same website. RememBear will happily continue filling in the password however, not recognizing that it doesn't belong to the current website.

Worse yet, RememBear will try to fill out passwords in all frames of a tab. So if `https://malicious.com` embeds a frame from `https://mybank.com` and the user triggers AutoFill on the latter, `https://malicious.com` will potentially receive the password as well (e.g. via a hidden form). Or even less obvious: if you go to `https://shop.com` and that site has third-party frames e.g. for advertising, these frames will be able to intercept any of your filled in passwords.

## Public Suffix List implementation issues

One point on my [list of common AutoFill issues](https://palant.de/2018/08/29/password-managers-please-make-sure-autofill-is-secure/) is: Domain name is *not* "the last two parts of a host name." On the first glance, RememBear appears to have this done correctly by using Mozilla's Public Suffix List. So it knows in particular that the relevant part of `foo.bar.example.co.uk` is `example.co.uk` and not `co.uk`. On a closer glance, there are considerable issues in the C# based implementation however.

For example, there is some rather bogus logic in the `CheckPublicTLDs()` function and I'm not even sure what this code is trying to accomplish. You will only get into this function for multi-part public suffixes where one of the parts has more than 3 characters -- meaning `pilot.aero` for example. The code will correctly recognize `example.pilot.aero` as being the relevant part of the `foo.bar.example.pilot.aero` host name, but it will come to the same conclusion for `pilot.aeroexample.pilot.aero` as well. Since domains are being registered under the `pilot.aero` namespace, the two host names here actually belong to unrelated domains, so the bug here allows one of them to steal credentials for the other.

The other issue is that the syntax of the Public Suffix List is processed incorrectly. This results for example in the algorithm assuming that `example.asia.np` and `malicious.asia.np` belong to the same domain, so that credentials will be shared between the two. With `asia.np` being the public suffix here, these host names are unrelated however.

## Issues saving passwords

When you enter a password on some site, RememBear will offer you to save it -- fairly common functionality. However, this will fail spectacularly under some circumstances, and that's partially due to the already mentioned `window.getOriginUrl()` function which is implemented as follows:

{{< highlight js >}}
if (window.location.ancestorOrigins != undefined
    && window.location.ancestorOrigins.length > 0) {
    return window.location.ancestorOrigins[0];
}
else {
    return window.location.href;
}
{{< /highlight >}}

Don't know what `window.location.ancestorOrigins` does? I didn't know either, it being a barely documented Chrome/Safari feature which [undermines referrer policy protection](https://github.com/whatwg/html/issues/1918). It contains the list of origins for parent frames, so this function will return the origin of the parent frame if there is any -- the URL of the current document is completely ignored.

While AutoFill doesn't use `window.getOriginUrl()`, saving passwords does. So if in Chrome `https://evil.com` embeds a frame from `https://mybank.com` and the user logs into the latter, RememBear will offer to save the password. But instead of saving that password for `https://mybank.com` it will store it for `https://evil.com`. And `https://evil.com` will be able to retrieve the password later if the user triggers AutoFill functionality on their site. But at least there will be some warning flags for the user along the way...

There was one more issue: the function `hostFromString()` used to extract host name from URL when saving passwords was using a custom URL parser. It wouldn't know how to deal with "unusual" URL schemes, so for `data:text/html,foo/example.com://` or `about:blank#://example.com` it would return `example.com` as the host name. Luckily for RememBear, its content scripts wouldn't run on any of these URLs, at least in Chrome. In their old (and already phased out) Safari extension this likely was an issue and would have allowed websites to save passwords under an arbitrary website name.

## Timeline

* 2019-04-09: After discovering the first security vulnerability I am attempting to find a security contact. There is none, so I [ask on Twitter](https://twitter.com/WPalant/status/1115636636510052353). I get a response on the same day, suggesting to invite me to a private bug bounty program. This route fails (I've been invited to that program previously and rejected), so we settle on using the support contact as fallback.
* 2019-04-10: Reported issue: "RememBear extensions leak remembear.com token."
* 2019-04-10: RememBear fixes "RememBear extensions leak remembear.com token" issue and updates their Firefox and Chrome extensions.
* 2019-04-11: Reported issue "No protection against logins being filled in on wrong websites."
* 2019-04-12: Reported issues: "Unrelated websites can share logins", "Wrong interpretation of Mozilla's Public Suffix list", "Login saved for wrong site (frames in Chrome)", "Websites can save logins for arbitrary site (Safari)."
* 2019-04-23: RememBear fixes parts of the "No protection against logins being filled in on wrong websites" issue in the Chrome extension.
* 2019-04-24: RememBear confirms that "Websites can save logins for arbitrary site (Safari)" issue doesn't affect any current products but they intend to remove `hostFromString()` function regardless.
* 2019-05-27: RememBear reports having fixed all outstanding issues in the Windows application and Chrome extension. macOS application is supposed to follow a week later.
* 2019-06-12: RememBear updates Firefox extension as well.
* 2019-07-08: Coordinated disclosure.