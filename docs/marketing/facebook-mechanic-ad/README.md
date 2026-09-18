# Facebook Marketplace ad — Basic Mechanic Work (independent, no branding)

- `ad-1080x1350.png` — the finished ad image (4:5, Marketplace / feed friendly).
- `ad.html` — editable source. Replace the phone number and location placeholders, change prices, and
  the HTML and re-render.
- `listing-copy.md` — title, description, and tags for the Marketplace form.
- `fonts/` — Anton and Montserrat (Google Fonts, OFL) so the render does
  not depend on network access.

## Re-render after editing

```sh
cd docs/marketing/facebook-mechanic-ad
chromium --headless --no-sandbox --hide-scrollbars \
  --window-size=1080,1350 --screenshot=ad-1080x1350.png "file://$PWD/ad.html"
```

Any Chromium build works. Opening `ad.html` in a browser and taking a
1080×1350 screenshot gives the same result.
