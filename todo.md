# AgriMarket Targeted Enhancement Checklist

- [x] Verify the restored approved design structure and preserve its existing components and styling.
- [x] Connect each current crop to a single accurate photographic asset throughout the experience.
- [x] Blend crop imagery softly into existing crop cards and crop-detail sections without rectangular image boxes.
- [x] Enhance the existing nearby-crops area with a slow, pausable, draggable, looping horizontal crop flow.
- [x] Link flowing cards to the existing crop pages and communicate local relevance using prototype market data.
- [x] Validate desktop and mobile behavior without changing the approved visual system. The original hero, header, crop stamps, help section, and crop flow remain intact; the added Top Crops row scrolls cleanly and stays inside the viewport at 1280px and 390px widths.
- [x] Save and deliver the targeted enhancement.

## Functional Refinement

- [x] Audit every visible button, selectable control, search action, crop card, and crop-flow action in the approved interface.
- [x] Make all missing header, login, profile, market, calculator, and disclosure interactions work without visual redesign.
- [x] Verify working interactions and responsive behavior before saving the revised checkpoint. Type checking and the production build pass; the approved home layout remains intact at desktop and smartphone widths.

## Two-Section Interaction Update

- [x] Preserve all existing visual styling and crop image assets outside the approved Top Crops and Popular Crops behavior changes.
- [x] Make Top Crops Around You present one existing crop card at a time in a gentle automatic news-flash rotation with hover/touch pause.
- [x] Make the existing Popular Crops card collection horizontally scrollable and draggable on desktop and vertically stacked on mobile without changing card styling or navigation.
- [x] Verify crop click-through, no mobile overflow, and the preserved responsive interface before delivery. The production build passes; desktop shows the horizontal crop collection and single flash card, while mobile presents the visual crop collection vertically with no page overflow.

## Farmer Profile and Navigation Fixes

- [x] Replace the temporary profile state with phone-keyed farmer records that collect and retrieve full name, mobile number, and location.
- [x] Move Profile, Settings, Language, Theme, and Logout into the existing hamburger menu without changing the approved visual identity.
- [x] Place the single compact Top Crops flash card immediately below the homepage slogan, add working previous/next arrows, and remove its duplicate lower placement.
- [x] Confirm every Top Crops and Popular Crops selection opens the corresponding existing crop details view and each Back action returns cleanly.
- [x] Verify desktop and mobile flows, current-user state, and layout preservation before delivery. Type checking, two Vitest suites, production build, and responsive desktop/mobile reviews all pass.

## Surgical UI Fixes

- [x] Restore Popular Crops card click-through to the existing matching crop detail view without changing card styling.
- [x] Remove only the redundant Profile & settings item from the hamburger menu, leaving Settings, Language, Theme, and Logout.
- [x] Remove only the Today at Guntur card between the Top Crops flash card and search bar without leaving a placeholder gap.
- [x] Verify the specified controls and homepage hierarchy on desktop and mobile before delivery. The Today at Guntur card is absent, Top Crops flows directly to search, Popular Crops remains visual and contained, and the direct crop click handler is restored.

## SIH Direct Marketplace Extension

- [x] Preserve the approved AgriMarket home, crop insights, imagery, mobile behavior, and existing farmer profile flow while adding marketplace navigation.
- [x] Create database-backed produce listings, buyer requirements, direct orders, and logistics routes, with clear computed demand forecasts for the SIH demo lifecycle.
- [x] Add a farmer/FPO listing workflow with quantity, quality, location, harvest date, and transparent price fields.
- [x] Add a bulk buyer requirement workflow that finds suitable local farmer/FPO inventory and supports supplier comparison and order placement.
- [x] Add simple farmer-readable demand insights for expected demand, quantity, selling window, pricing, and trend.
- [x] Add logistics status and a clear optimized pickup-to-delivery route view with distance, time, capacity, and consolidation information.
- [x] Add role-aware Farmer/FPO, Bulk Buyer, and Admin dashboard views without replacing the existing farmer experience.
- [x] Connect the complete demo scenario: 1,000 kg tomatoes listed, high demand forecast, buyer matching, order, route plan, and completed delivery.
- [x] Add and run automated tests for the marketplace procedures and validate the desktop/mobile demo flow before delivery. Eight Vitest assertions cover forecasting, routing, listing, requirement, matching, order, route, status, and tomato-demo procedures; type checking and production build pass; overview, buyer matching, and logistics were reviewed at desktop and smartphone widths.

## Farmer-First Multilingual Product Upgrade

- [x] Retain existing crop guide, imagery, branding, profile storage, marketplace data, and working paths while simplifying all new role experiences.
- [x] Create a complete translation structure for English and Telugu, with marketplace pages, forms, errors, statuses, recommendations, and action labels driven by reusable keys. Proper nouns and live marketplace record values such as producer names, locations, prices, crop grades, and harvest dates intentionally remain as source data.
- [x] Add a visual role-selection entry flow and keep public crop market pages neutral for non-farmer visitors.
- [x] Build a farmer dashboard with large crop cards, buyer discovery, online/offline selling choice, AI suggestion, and a visual step-by-step produce listing flow.
- [x] Build an independent buyer dashboard with visual crop inventory, seller cards, delivery-inclusive deal analysis, simple order confirmation, and order tracking.
- [x] Add a farmer/buyer/admin notification center and clear role-specific dashboards without merging their workflows.
- [x] Ensure farmer listings update the buyer inventory directly and preserve transparent price, quantity, location, harvest, and quality data.
- [x] Verify every button, role action, translation toggle, listing, buyer match, deal calculation, order, and logistics-tracking interaction on desktop and mobile. The live interface covered role switch, Farmer listing wizard, Buyer search, seller selection, deal calculation, translated order confirmation, order creation, tracking and pickup planning; all controls have explicit handlers and the typed procedure suite covers backend actions.

## Direct Role Dashboard Routing

- [x] Remove the Marketplace option and intermediate landing step from the post-login flow only.
- [x] Route Farmer/FPO, Buyer, and Admin sign-ins directly to their existing respective dashboards.
- [x] Verify the three direct dashboard destinations while preserving the rest of AgriMarket unchanged. Browser checks confirm Farmer/FPO, Buyer, and Admin routes start with their existing dashboards and omit the Marketplace landing and role picker; type checks, all tests, and production build pass.
