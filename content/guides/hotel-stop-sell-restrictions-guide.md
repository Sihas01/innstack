---
title: "Hotel Stop-Sell Explained: When to Close OTA Room Sales"
description: "Learn what stop-sell means in hotel distribution, how it differs from closing room inventory, and how to prevent accidental lost bookings on OTAs."
slug: hotel-stop-sell-restrictions-guide
category: "Distribution"
author: InnStack Editorial Team
publishedAt: '2026-11-23'
updatedAt: '2026-11-23'
readingTime: 5
featuredImage: "/studio-media/2026-11-23/c554258c-cfbb-4dfa-b8e4-f35eef9fb345.webp"
featuredImageAlt: "Hotel availability calendar on a laptop showing restricted and available booking dates at a boutique hotel reception"
metaTitle: "Hotel Stop-Sell: How to Close OTA Room Sales"
metaDescription: "Understand hotel stop-sell restrictions, when to use them, how they differ from zero availability, and how to avoid accidentally blocking bookings."
keywords: ["hotel stop sell", "stop sell channel manager", "OTA stop sell restriction", "Booking.com stop sell", "hotel room availability", "hotel inventory restrictions", "close hotel room sales"]
publishId: "680e811d-62dc-44ba-a2c2-343b1646caa2"
featured: false
tags: ["hotel stop sell", "stop sell channel manager", "OTA stop sell restriction", "Booking.com stop sell", "hotel room availability", "hotel inventory restrictions", "close hotel room sales"]
affiliate: false
softwareMentioned: []
---

Your hotel has available rooms, but guests cannot book them on Booking.com or another OTA. Why?

One possible explanation is an active **stop-sell restriction**.

Stop-sell controls help hotels manage when rooms or rate plans can be booked. However, incorrect settings can prevent new reservations even when physical rooms remain available.

## What Is Stop-Sell in Hotel Management?

A stop-sell restriction prevents new reservations for selected dates, rooms, rate plans or distribution channels, depending on the software configuration.

For example, a boutique hotel might temporarily close its Deluxe Room rate on Agoda while continuing to sell other room categories.

Stop-sell does not normally cancel existing reservations. It affects new booking requests.

Hotels may use stop-sell restrictions when:

- Rooms are temporarily unavailable for sale.
- A particular rate plan should be paused.
- A booking channel needs to be closed temporarily.
- Operational problems require sales to stop.
- Inventory or rate configuration needs correction.

The exact scope depends on the PMS, channel manager and OTA integration.

## Stop-Sell vs Zero Availability

These controls can produce similar booking results but operate differently.

**Stop-sell** restricts whether a room or rate can be sold.

**Zero availability** indicates that no sellable inventory remains for the selected room category and date.

| Feature | Stop-Sell | Zero Availability |
|---|---|---|
| Main purpose | Restrict new sales | Indicate no inventory |
| Room count | Usually unchanged | Sellable count becomes zero |
| Scope | May target specific rates or channels | Usually affects shared room inventory |
| Typical use | Pause a rate or channel | Sold-out or unavailable rooms |

Consider a guesthouse with five Standard Rooms.

Three rooms are reserved, leaving two available.

If the owner applies stop-sell to every Standard Room rate, the remaining two rooms may become unbookable online despite still being physically available.

This is why restrictions should be reviewed carefully.

## Why Stop-Sell Sometimes Fails

An important complication involves **derived rate plans and OTA promotions**.

A derived rate might offer a discount based on another rate plan. Some OTA promotions can have their own restriction settings.

According to Channex documentation published in August 2026, closing a parent rate plan does not always close associated derived rates or promotions.

For example:

1. A hotel closes its standard refundable rate.
2. A promotional rate remains active.
3. The OTA continues accepting eligible reservations.
4. Staff incorrectly assume the property was fully closed.

The opposite problem also occurs: a forgotten stop-sell setting can prevent bookings after the original reason for closure has passed.

**Do not assume a restriction has worked simply because your channel manager displays it as enabled.**

Verify the result in the connected OTA extranet or another supported availability view.

## How to Apply Stop-Sell Safely

Follow this practical process before closing room sales.

### Step 1: Identify the Exact Dates

Choose the dates that genuinely require restrictions.

Avoid closing an entire month when only a few nights are affected.

### Step 2: Select the Correct Inventory

Determine whether the restriction applies to one room category, a specific rate plan or the entire property.

Check how your software handles shared inventory.

### Step 3: Review Connected Channels

Confirm which OTAs receive the restriction.

Some systems support channel-specific controls, while others apply restrictions more broadly.

### Step 4: Check Promotions

Review active promotional and derived rate plans.

Some restrictions may need to be configured directly within the OTA extranet.

### Step 5: Verify and Reopen

Check whether affected dates are genuinely unbookable.

Record why the restriction was applied and when it should be reviewed.

Once the issue is resolved, remove unnecessary restrictions and verify that bookings are possible again.

For broader inventory management, read InnStack's [guide to preventing double bookings between Airbnb and Booking.com](https://innstack.online/guides/prevent-double-bookings-airbnb-booking-com/).

## A Simple Stop-Sell Audit Checklist

Review these items whenever availability seems incorrect.

| Check | Question |
|---|---|
| Dates | Are restrictions active on the intended nights? |
| Room types | Is the correct category affected? |
| Rate plans | Are promotional rates still bookable? |
| Channels | Did connected OTAs receive the update? |
| Inventory | Are rooms genuinely unavailable? |
| Reopening | Have expired restrictions been removed? |

A weekly review can help smaller properties detect forgotten restrictions before they affect future bookings.

## Frequently Asked Questions

### Does stop-sell cancel existing hotel bookings?

No. Stop-sell generally prevents new reservations. Existing confirmed bookings remain valid unless separately changed through the appropriate reservation process.

### Is stop-sell the same as closed to arrival?

No. Closed to arrival prevents check-ins on a selected date but may allow guests arriving earlier to stay through it. Stop-sell restricts new sales for the affected dates and rates.

### Can a channel manager apply stop-sell automatically?

Many channel managers can distribute supported restrictions to connected OTAs. However, capabilities vary, and some OTA promotions or derived rates may require separate verification.

## Final Thoughts

Stop-sell is a useful hotel distribution control, but incorrect configuration can create two costly problems: accepting reservations when sales should be closed or blocking reservations when rooms are available.

Independent hotels should apply restrictions carefully, verify OTA behaviour and review temporary closures regularly.

**Accurate inventory and correctly configured restrictions are both essential for reliable online distribution.**

## Sources and Methodology

- [Channex – Stop-Sell and Derived Rates](https://help.channex.io/en/articles/16439719-stop-sell-and-derived-rates-why-a-closed-property-can-still-take-bookings) — Published August 17, 2026; explains why promotions and derived rates may remain bookable.
- [Travelgate – Restrictions Documentation](https://docs.travelgate.com/docs/apis/for-sellers/sellers-cache-files/rules-files/pricing-files/restrictions/) — Describes stop-sales, booking limits and stay restrictions.
- [Adrasis – Stop-Sale and Restrictions](https://docs.adrasis.com/pricing-and-availability/stop-sale-restrictions) — Explains the difference between inventory, rate plans and booking restrictions.

Examples are illustrative. Exact stop-sell behaviour depends on the connected OTA, rate-plan structure and software provider. Verify restrictions using your property's current configuration.
