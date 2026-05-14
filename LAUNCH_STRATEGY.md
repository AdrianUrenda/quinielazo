# Quinielazo 2026 — Launch Strategy
## Instagram & TikTok · Max £200/month paid spend

---

## 1. Context & Timing

The 2026 FIFA World Cup kicks off in June 2026 across USA, Canada, and Mexico. With a Spanish-speaking primary audience, Mexico is the anchor market. The tournament is the single biggest cultural moment for this demographic in four years — every week from now until the final is an organic marketing event.

**Window:** Now through the Group Stage is the critical acquisition phase. Most casual fans join prediction pools *before* the tournament starts or in the first week. After that, churn is high and new user acquisition drops sharply.

---

## 2. Channel Strategy

### Instagram — Trust & Community
Instagram is where the **purchase intent** lives. This is the channel to show the product, build credibility, and drive sign-ups. The audience skews 25–40 and is comfortable taking action (clicking links, sharing stories).

**Content pillars:**
| Pillar | Format | Cadence |
|---|---|---|
| Product demos | Reels (15–30s) showing the prediction flow on mobile | 3x/week |
| Social proof | Screenshots of group leaderboards (real or seeded) | 2x/week |
| Tournament hooks | "¿Cuántos puntos sacarías si...?" match result polls | Daily during matches |
| Invite CTAs | Story frames users can screenshot and send to their group | Weekly |

**Profile setup checklist:**
- Bio: "🏆 Predice el Mundial 2026 con tu familia y amigos · Link para crear tu grupo ↓"
- Link in bio → landing page (quinielazo.link)
- Pinned Reel: 30-second product walkthrough (create group → invite friends → predict → leaderboard)
- Story Highlights: "¿Cómo funciona?", "Premios", "Grupos activos"

### TikTok — Discovery & Virality
TikTok is where **new audiences find you**. The algorithm rewards relevance over follower count, making it the best channel for zero-budget organic reach at launch. Use it to seed viral moments tied to World Cup results.

**Content pillars:**
| Pillar | Format | Cadence |
|---|---|---|
| Reaction content | "Así quedó la quiniela de mi familia tras [resultado]" | After every major match |
| Prediction challenges | Challenge viewers to guess exact scores, reveal your Quinielazo pick | 2x/week |
| "¿Quién sabe más?" | Friendly rivalry framing — boss vs employee, dad vs son, etc. | 1–2x/week |
| Tutorial | Screen-recorded walkthrough of creating a group | Pinned |

**TikTok tactics:**
- Post within 1–2 hours of major match results while the conversation is hot
- Use trending World Cup audio (stitch/duet reactions from big accounts)
- Hashtags per post (mix reach + niche): `#Mundial2026 #Quiniela #FutbolMexico #WorldCup2026 #Quinielazo`
- Comment on high-engagement football posts to drive profile visits

---

## 3. Paid Media Budget — £200/month

Split the budget 70/30 between Instagram and TikTok, biased toward Instagram where conversion intent is higher.

### Instagram Ads — £140/month

**Campaign objective:** Website traffic → sign-ups (use the "Traffic" objective initially; switch to "Conversions" once you have 20+ conversion events tracked via Meta Pixel).

| Ad set | Audience | Daily budget | Duration |
|---|---|---|---|
| **Retargeting** | Website visitors + IG profile engagers (last 30 days) | £2/day | Always-on |
| **Cold — Mexico core** | Mexico, 22–45, interests: fútbol, Liga MX, FIFA, World Cup | £2/day | Always-on |
| **Cold — diaspora** | USA + Spain, Spanish language, football interests | £1/day | Always-on |

**Creative approach:**
- Always use vertical video (9:16 Reels placement) — static images underperform
- Lead with the social hook, not the product: *"¿Tu familia cree que sabe de fútbol? Ponlos a prueba"*
- Show the leaderboard and group invite flow — the competitive element is the hook
- Test 2 creative variants per ad set; kill the lower performer at day 7

**Targeting notes:**
- Exclude existing users (upload customer list or use Pixel data)
- Lookalike audiences become available once you have ~100 conversions — plan for this in month 2

### TikTok Ads — £60/month

Use TikTok's **"Reach & Frequency"** or **"Traffic"** objective at this budget level. Full-funnel conversion campaigns require higher minimums.

| Campaign | Audience | Daily budget |
|---|---|---|
| Spark Ads — boost top organic posts | Same as organic content followers + interests | £1.50/day |
| In-Feed Ad | Mexico + USA, 18–40, football interests | £0.50/day |

**TikTok creative rules:**
- Only promote posts that already have some organic traction (>500 views) — the algorithm pre-validates them
- Never use landscape video
- Hook must land in the first 1.5 seconds: start with the leaderboard or a rivalry moment, not the logo

---

## 4. Organic Amplification (Free)

Paid media alone at £200/month won't scale. These free tactics multiply the paid spend:

**Group seed strategy:** Create 3–5 seeded groups in different categories (family, workmates, amigos del barrio) and share their leaderboards publicly. Real group activity is your best creative asset.

**WhatsApp Groups:** Mexico's primary messaging app. Create shareable invite image cards (already supported by the product) optimised for WhatsApp forwarding. Each card = a group invite link. When one person shares it to a WhatsApp group of 20, that's 20 potential new users for £0.

**Influencer micro-strategy:** Don't pay macro influencers. Instead, identify 10–15 micro-accounts (5k–50k followers) in the Mexican football / lifestyle space. Offer them a free Grande group (value: $99 MXN) in exchange for one authentic story post. Cost: £0 cash.

**Creator UGC:** When users post their group leaderboards, repost them immediately to Stories and ask permission to use in ads. User-generated content consistently outperforms produced creative.

---

## 5. Content Calendar — Pre-Tournament Launch Phase

| Week | Key moment | Instagram | TikTok | Paid |
|---|---|---|---|---|
| Now (May) | Pre-launch hype | Countdown Reels, "¿Listo para el Mundial?" | Tutorial + challenge content | None yet |
| Week of tournament draw | Groups announced | "¿En qué grupo quedó México?" content | Reaction content | Turn on cold campaigns |
| Tournament week 1 | First matches | Match prediction posts, result reactions | Daily reaction videos | Full budget active |
| Tournament week 2+ | Group stage drama | Leaderboard screenshots, rivalry content | "¿Quién va ganando en tu familia?" | Retargeting heavy |

---

## 6. Conversion Funnel

```
TikTok/Instagram content
        ↓
Profile visit or ad click
        ↓
quinielazo.link (landing page)
        ↓
Register (free)
        ↓
Create or join a group
        ↓
Invite friends (viral loop)
        ↓
Upgrade to Familiar/Grande if group > 8
```

The key metric to optimise is **"group created"** events, not just registrations. A user who registers but never creates or joins a group has zero LTV and won't refer others. Track this event in Supabase and pass it to Meta Pixel and TikTok Pixel as your primary conversion.

---

## 7. Metrics & Budget Review Gates

Review performance at these thresholds — not by calendar:

| Gate | Metric to check | Action |
|---|---|---|
| £30 spent | CPC < £0.50, CTR > 1.5% | If not met, rebuild creative |
| £75 spent | Cost per registration < £3 | If not met, test new audience |
| End of month 1 | Cost per group created < £8 | If met, scale budget; if not, review funnel |

**Key metrics by channel:**

- Instagram: CPM target < £8, CPC < £0.50, CTR > 1.5%
- TikTok: CPM target < £5, VTR (video through rate) > 20%
- Organic: Saves + Shares > Likes (saves/shares signal intent, likes signal entertainment)

---

## 8. Budget Summary

| Item | Monthly cost |
|---|---|
| Instagram Ads | £140 |
| TikTok Ads | £60 |
| Influencer gifting (group credits, not cash) | £0 |
| Creative production | £0 (screen recording + phone camera) |
| **Total** | **£200** |

---

## 9. Month 2 Unlocks (If Month 1 Works)

Once you have conversion data and a pixel with 100+ events:

- Switch Meta campaigns to Conversion objective (lower CPA)
- Build Lookalike Audiences from registered users and group creators
- Test a £20–30 boosted post on a genuine viral leaderboard moment
- Explore WhatsApp Ads (Meta Business Suite) for Mexico — very low CPM for Spanish-speaking audiences

---

## Quick Wins to Do This Week

1. Install Meta Pixel on quinielazo.link and define "group_created" as the conversion event
2. Install TikTok Pixel with the same event
3. Film a 30-second screen recording of the create-group → invite → predict flow (no voiceover needed — use on-screen text)
4. Post the tutorial as a pinned Reel and a pinned TikTok
5. Create your first seeded group and start sharing the leaderboard publicly
6. Set up the Meta Ads Manager campaign structure above before the tournament starts
