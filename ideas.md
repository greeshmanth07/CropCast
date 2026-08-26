# AgriMarket — Design Directions

## Three possible directions

### Field Ledger
**Very Brief Intro:** A warm, trustworthy agricultural information service inspired by handwritten mandi records, cotton paper, and the clear order of a field notebook. It makes decisions easy to scan on a phone.

**Probability:** 0.07

### Seed Packet Modernism
**Very Brief Intro:** A graphic, utilitarian direction that borrows the friendly geometry and direct labels of Indian seed packaging. It is cheerful without being playful or ornamental.

**Probability:** 0.03

### Monsoon Bulletin
**Very Brief Intro:** An editorial market bulletin with calm white space, strong price numerals, and weather-informed visual cues. It feels like a useful local notice, not a dashboard.

**Probability:** 0.09

## Selected direction: Field Ledger

### Design Movement
**Field Ledger** applies restrained editorial utility to agricultural market information. It draws from a regional farm register and a dependable public-service notice rather than fintech or AI-product aesthetics.

### Core Principles
1. **Answer before explain:** the recommended selling day and expected return always appear before any supporting detail.
2. **Large, calm information:** prices, quantities, and actions are high contrast, generously spaced, and legible at arm’s length.
3. **One clear path:** the page uses a crop picker and a focused crop-detail view rather than parallel dashboards.
4. **Human reassurance:** plain language, familiar crop symbols, and friendly technical restraint make every action feel understandable.

### Color Philosophy
White is the working surface, like a clean market register. Deep ink green carries trust and action, while leaf green marks a positive movement or a recommendation. Charcoal anchors all text and price figures. Pale green is only a quiet field-tint behind contextual zones; no gradients, blue, purple, or decorative color noise are used.

### Layout Paradigm
The experience is organized as a **vertical market slip**. On the home view, a left-aligned editorial masthead flows into a wide crop-search slab and a horizontally scrollable crop row. The crop detail is a stacked decision path: price → recommendation → earnings → price curve → local markets. Desktop gets a quiet summary rail only where it improves scanning; mobile keeps each decision in a single uninterrupted column.

### Signature Elements
1. A cropped **field-line motif**—thin, parallel green contours that appear at section edges and never compete with content.
2. The **market slip**—a narrow, inked recommendation card with a corner price tag and strong numeric hierarchy.
3. **Crop stamps**—large, tactile circular crop illustrations used as tap targets rather than data tiles.

### Interaction Philosophy
Interaction should feel like handling a printed guide. Crop stamps press inward slightly; selections receive a simple green ink fill. Details expand only when requested. Search and language controls are familiar, finger-sized, and explicit. Voice search is represented as a clear available action, with a simple local confirmation when selected.

### Animation
Motion is limited to functional feedback. Buttons scale to 0.97 on press and recover over 160ms. Selecting a crop transitions to the crop-detail view with a 220ms opacity-and-translate entry. Accordion sections open with a modest 180ms fade/slide. No looping decorative movement, parallax, floating elements, or chart animation is used. All nonessential motion is disabled under reduced-motion preferences.

### Typography System
**Fraunces** provides the measured, human headline voice, used only for the brand, hero statement, crop name, and the recommended weekday. **Noto Sans** gives the interface its high-legibility multilingual foundation for body text, controls, prices, and labels. Important rupee amounts use a tabular numeric treatment with semibold weight. Headings are left-aligned and never all caps beyond compact category labels.

### Brand Essence
**AgriMarket is a clear, local crop-price guide that helps Indian farmers choose the better day and market to sell.**

Personality: **grounded, reassuring, practical**.

### Brand Voice
Headlines are direct and decisive; CTAs are plain spoken and action-oriented. Microcopy replaces technical vocabulary with a short reason or next step.

> “Tomato prices may rise. Thursday looks better.”

> “Tell us your quantity. We’ll show the difference.”

### Wordmark & Logo
The wordmark uses a compact crop-row symbol: three upright seed heads cut by two horizontal field lines, contained in a softly squared green stamp. The accompanying logotype is a calm serif wordmark; the symbol itself is still clear at favicon size.

### Signature Brand Color
**Mandi Green — #1F6B45**

## Style Decisions

- Every principal screen includes a visible **market slip** with a weekday, ₹/quintal figure, and a plain supporting reason before explanatory information.
- Field-ledger cues recur as ruled dividers, inked corner tags, nested paper slips, and restrained field-line contours.
- Crop choices use a unified tactile **ink-stamp illustration system** rather than generic emoji or clip-art.
- Supporting photography remains local and documentary in feeling—fields, produce, crates, and mandi activity—and always serves the price guidance.
