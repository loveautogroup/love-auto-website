# Handoff — Facebook Marketplace ad: basic mechanic work

## Goal for the next session
Post the finished ad to Facebook Marketplace using the Facebook account
used for Franky. This is an independent side venture; it is NOT a Love
Auto Group post and must not carry the dealership's name, logo, phone,
or address.

## Where everything is
Repo: loveautogroup/love-auto-website
Branch: claude/facebook-mechanic-ad-htmhdq (pushed, up to date)
Folder: docs/marketing/facebook-mechanic-ad/

- ad-1080x1350.png  — final image, ready to upload as the listing photo
- listing-copy.md   — title, category, price, description, tags, short post version
- ad.html + fonts/  — editable source; re-render command is in README.md

## What the ad says (final, owner-approved)
Headline: "In need of basic mechanic work?"  Sub: "Labor only · You bring the parts"

| Service                              | Price                 |
|--------------------------------------|-----------------------|
| Brakes, all 4 wheels, cars/small SUVs| $100, with rotors $150|
| Brakes, all 4 wheels, trucks/large SUVs | $120, with rotors $180|
| Oil change (customer supplies oil & filter) | $50            |
| Complete tune-up (plugs, filters & inspection) | $100        |
| Suspension work (struts, shocks, control arms) | Ask for a quote |

Pills: Free estimates · Bring your own parts
Location line: Villa Park & Elmhurst area, Serving DuPage County, IL
Phone: 312-925-7520 (call or text)

## Marketplace form values
- Listing type: Item for sale
- Title: Basic Mechanic Work – Brakes $100+, Oil Change $50, Tune-Up $100 – Villa Park / Elmhurst
- Price: $50 (lowest service; Marketplace needs a single number)
- Category: Vehicles → Automotive Services (fallback: Home & Garden → Services)
- Location: Villa Park, IL or Elmhurst, IL
- Description and tags: copy from listing-copy.md

## Why the previous session stopped
No Facebook connector was available, and Facebook Marketplace has no API
for creating listings, so the post has to be made from the Facebook app
or website while logged into Franky's account. The previous session did
not know which account that is.

## Open items
- Suspension has no fixed price; if the owner gives one, edit ad.html,
  re-render, and update listing-copy.md.
- Optional: a 1080x1080 square crop if Marketplace crops the 4:5 image awkwardly.
