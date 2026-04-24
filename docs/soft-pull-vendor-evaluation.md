# Soft-Pull Pre-Qualification Vendor Evaluation

**Prepared for:** Jeremiah Johnson, Love Auto Group
**Prepared:** April 24, 2026
**Context:** loveautogroup.net currently captures financing leads via our
own form. Next step is deciding whether to add a real soft-pull
pre-qualification tool (customer enters info → page returns "You're likely
approved for $X at Y%" with zero credit-score impact). Every article + ad
I've ever read on this says soft-pull pre-qual is the single highest-ROI
website addition for an independent used-car dealer at scale.

This doc is a vendor comparison + recommendation so you can make the call
without having to do the homework yourself.

---

## TL;DR recommendation

**Pick 700Credit's QuickQualify.** Three reasons:

1. Only product in the category that explicitly markets to independent
   dealers (vs. franchise-only).
2. Pulls a real FICO + full credit file back to the dealer — not just
   "probably approved" — so Jeremiah has enough to structure a deal
   before the customer walks in.
3. Integrates into RouteOne / CUDL / Dealertrack / AppOne out of the
   box, which matches the path you'd go down anyway for indirect
   lending.

Realistic monthly cost based on the indirect-dealer market:
**$250–500/mo + ~$3–8 per lead** (actual quote requires calling
866-273-3848 — pricing isn't public).

If you want the cheapest path first instead: start with our current
lead form + add a **Capital One Auto Navigator link** in the hero.
$0 setup, $0/mo, no integration. Just sends qualified customers to
Cap One's pre-qual page. Rough conversion path — you don't own the
lead the way QuickQualify gives you — but it costs nothing and works
tomorrow.

---

## The contenders

Five viable vendors, ranked by fit for an independent Illinois
used-car dealer at Love Auto Group's current volume.

### 1. 700Credit — QuickQualify (RECOMMENDED)

The category standard for independent dealers. Been around 20+ years,
explicitly built for the independent channel (Cars.com, Carsforsale,
AppOne, CUDL all run on it).

**What the customer sees:** iframe embedded on our /financing page.
Fills ~8 fields: name, address, employer, monthly income, DOB
(optional but helps), driver's license (optional). Hits Submit.

**What 700Credit does:** runs a soft inquiry with Experian
(no credit-score impact). Within seconds, returns to the dealer:
FICO score, full credit file, auto-tradeline history, bureau data.
Lead gets pushed into our CRM + any compatible system
(Dealertrack, CUDL, RouteOne, AppOne).

**What the customer sees next:** a "We got your info, someone will
call you shortly" screen. No instant decision on the consumer side
— the decision surfaces to us, we call them with a structured offer.
This is the single most important distinction from consumer-branded
tools like Capital One Auto Navigator.

**Integration:** iframe widget on our /financing page OR API if we
want to design our own form and POST to them. iframe is ~15 minutes
of work; API is ~4–6 hours of Bill's time.

**Pricing:** not public. Industry chatter puts it at $250–500/mo
subscription + per-lead fees around $3–8. Some plans bundle in the
full 700Credit suite (prescreen + pre-qual + credit pulls + compliance
docs). Get a quote directly: 866-273-3848.

**Compliance shift:** 700Credit owns the FCRA adverse-action
obligation on the soft-pull side. GLBA Safeguards obligations for
the lead data still sit with us, but since we're not storing SSN or
full credit files on our servers (it all lives in 700Credit's
system), the burden is materially lower than if we were.

**Downside:** they'll push hard on upgrading you to their full
suite (credit pulls, prescreen, compliance docs, AutoCheck, etc.).
Stay scoped.

---

### 2. Capital One Auto Navigator (cheapest path)

Not a dealer tool — a consumer-branded Capital One product. But it
has a dealer-participation program: when a customer pre-qualifies
for a Cap One auto loan, Cap One shows them cars from participating
dealers. If you're a Cap One participating dealer, you get surfaced
to pre-qualified shoppers who come through their funnel.

**What it costs:** $0 to enroll (assuming you're already a Cap One
auto finance dealer — check your existing lender roster).

**What it does for us:** we add a "Pre-qualify with Capital One —
no score impact" button in our /financing hero. Button opens
Cap One's pre-qual flow in a new tab. Customer qualifies on Cap
One's site, then Cap One surfaces our inventory to them.

**What we lose vs. QuickQualify:** we don't own the lead directly.
We don't get the FICO score back. We rely on Cap One to route the
buyer to us (which they do, but only if we have Cap One as a lender
partner). If the customer doesn't come back, we've sent a lead to
Cap One for free.

**When this is the right call:** you're not ready to spend
$250-500/mo on QuickQualify, you already have Cap One as a lender
partner, and you're fine with a no-ownership tradeoff for zero cost.

---

### 3. DealerFi (emerging)

Newer player, AI-powered, launched 2024–2025. Integrated with
700Credit in May 2025 — so it's effectively a product-layer on top
of 700Credit's pre-qual rails. Pitches itself as a conversational /
AI-driven front end.

**Why it's on the list:** if you liked QuickQualify but wanted a
more modern UI than 700Credit's default iframe, DealerFi is the
"skin" on top of it. Pricing probably stacks on top of 700Credit's
base fees — so likely $500-1000/mo combined.

**Why I'd skip it for now:** too new to have a track record on a
small independent lot. Come back to it in 12-18 months once there
are more independent-dealer reviews.

---

### 4. AutoFi (digital retailing platform)

Not strictly a soft-pull tool — it's a broader "digital retailing"
platform that includes payment calculation, trade valuation, AND
instant lender offers. Enterprise-focused (Ford uses them, as do
large dealer groups).

**Why I'd skip:** too heavy for our size. They're selling an
end-to-end "buy online" flow, not just a pre-qual tool. Pricing is
enterprise-scale (likely $1,000-3,000/mo). Overkill for a
5–8-unit-a-month lot. Revisit when you're doing 30+/mo and a
fraction of those want to complete the deal online.

---

### 5. Dealertrack CreditBureau.com (if you already use RouteOne)

If Love Auto Group already has a Dealertrack or RouteOne login
(most indirect-finance dealers do), they have their own web-embed
pre-qual products that come at reduced cost to existing customers.

**Why I'd skip for now:** their standalone web pre-qual embeds are
not great — they're designed assuming the customer has already
chosen a specific vehicle at a specific dealer, which means
worse pre-stage conversion vs. 700Credit's "shop first, qualify
later" flow.

**When this becomes relevant:** if/when you upgrade to full
RouteOne integration to actually submit credit apps to multiple
lenders at once, their pre-qual product becomes a cheap add-on.
Today you're not there yet.

---

## Side-by-side comparison

| Vendor | Setup cost | Monthly | Per-lead | Returns FICO? | Owns lead | Our effort | Independent-friendly |
|---|---|---|---|---|---|---|---|
| **700Credit QuickQualify** | $0-300 | $250-500 | $3-8 | Yes | Yes | ~15 min iframe | ✅ Yes |
| Capital One Auto Navigator | $0 | $0 | $0 | No | No (Cap One does) | ~10 min link | ✅ Yes |
| DealerFi | ? | ~$500-1000 (on top of 700Credit) | ? | Via 700Credit | Yes | ~1 hour | ✅ Emerging |
| AutoFi | $2k-5k | $1k-3k | ? | Yes | Yes | Days | ⚠️ Enterprise |
| Dealertrack CreditBureau | Incl. w/ existing | Reduced w/ existing | ? | Yes | Yes | 1-2 hours | ✅ If existing customer |

---

## Decision framework

**Go with 700Credit QuickQualify IF**:
- Website is driving 5+ financing-form submissions per week today and
  we expect that to grow to 15+ once we have real pre-qual
- You're willing to commit $3-6k/yr to a vendor
- You want to OWN the lead and have the FICO data in hand when you
  call the customer
- You plan to grow into a heavier RouteOne integration eventually

**Go with Capital One Auto Navigator IF**:
- You want zero monthly cost
- You're already a Cap One auto finance dealer (check — most
  dealers are)
- You're fine with Cap One owning the first customer touchpoint
- You want a "ship today" option while evaluating 700Credit on a
  longer timeline

**Stay on the current lead form IF**:
- Financing leads are <5/month and growing slowly
- You prefer to invest the $3-6k/yr in inventory, photos, or
  marketing instead
- You have the manpower to key every lead into RouteOne manually
  without it being the bottleneck

---

## If you pick 700Credit, the setup path

1. **Call 700Credit sales at 866-273-3848** (or go
   [their website](https://www.700credit.com/soft-pulls/quickqualify/)
   and submit the demo form). Ask specifically for
   "QuickQualify pricing for an independent used-car dealer doing
   roughly 5-8 units/month." Don't let them upsell you into the
   full suite on day one.

2. **Sign the dealer agreement** (they'll send it after the quote).
   Requires dealer license verification — you have this, one-page.

3. **Get the iframe embed code** they send back. Give it to me. I'll
   drop it into the /financing hero between the dual CTAs and the
   Payment Calculator, wired to load only when the user clicks
   "Quick Pre-Qualify" (so the rest of the page stays fast).

4. **Set up the lead delivery**: they push into email by default,
   but can push into our LEADS KV via webhook if we ask. Simplest:
   have them also email `loveautogroup@gmail.com` and separately
   POST to a new `/api/prequal-webhook` Pages Function I'll build —
   that writes to the same LEADS KV with a `source: "700credit"` tag
   so the /admin/leads panel shows both types in one view.

5. **Update Privacy Policy + add FCRA soft-pull disclosure** on the
   /financing page. Diane (legal skill) can draft the language; this
   is required regardless of vendor, and 700Credit has template
   copy you can adapt.

Estimated total time from call → live: **10-14 days**.

Estimated total cost first year: **$3,500-7,000** (assuming
$250-500/mo + 10-30 leads/mo at $3-8 each, plus ~$100 one-time
setup).

---

## If you pick Capital One Auto Navigator, the setup path

1. **Check your Cap One dealer partnership status**. Log into the
   Cap One dealer portal (or call your Cap One auto rep). If you're
   a participating dealer for indirect lending, you have access to
   the Auto Navigator integration today.

2. **Grab the Cap One deep link** (goes to their pre-qual form with
   your dealer ID embedded).

3. **Tell me the URL**. I swap the "Quick Pre-Qualify" button on
   /financing to open that URL in a new tab, and update its
   sub-copy to read "Powered by Capital One — no score impact."

4. Done. ~15 min of my time, $0 of your money, next build after push.

Not as powerful as QuickQualify but doesn't cost anything and takes
a day to ship.

---

## Next decision point

Three answers from you, and I can drive the rest:

1. **A / B / C / D?** (A = 700Credit, B = Cap One link, C = both,
   D = neither for now)
2. **If A:** want me to draft the 700Credit sales email/call script
   so you have the right questions ready?
3. **If B:** do you know offhand if Love Auto Group has a Cap One
   auto dealer relationship? (If not, I'll look up the enrollment
   process.)

---

## Sources

- [700Credit QuickQualify product page](https://www.700credit.com/soft-pulls/quickqualify/)
- [700Credit DealerFi integration announcement, May 2025](https://www.globenewswire.com/news-release/2025/05/20/3084638/0/en/700Credit-Introduces-Soft-Pull-Prequalification-Integration-with-the-DealerFi-AI-Powered-Platform.html)
- [Capital One Auto Navigator pre-qualification](https://www.capitalone.com/cars/prequalify)
- [AutoFi Digital Retailing Solutions](https://www.autofi.com/digital-retailing-solutions/)
- [700Credit Carsforsale.com integration](https://www.prweb.com/releases/700credit-introduces-soft-pull-prequalification-integration-with-the-carsforsalecom-302269831.html)
