---
id: trip-management
title: Trips and route planning
description: Plan multi-stop trips, place stops from the map, a point of interest or a geofence, get an ORS route with a deviation corridor and a toll estimate, assign a driver, follow progress, and share a tracking link with your customer.
category: operation
screens: [tripManager]
featureKey: trip-management
related: [public-trip-tracking, geofences, dashboard-trips-replay, public-links, reports]
tags: [trips, dispatch, stops, route, corridor, tolls, proof of delivery, tracking]
order: 25
---

# Trips and route planning

A **trip** is one vehicle's journey through an ordered list of **stops**, from a planned start time to a finish. TrackHub plans the driving route, watches the vehicle against that route while the trip runs, records arrivals and departures, and can give your customer a read-only link to follow along.

Trips are available only when the trip management feature is enabled for your account. If you cannot see **Trips** in the left-hand menu, the feature is off — ask your account administrator, and see [Feature catalog](topic:feature-catalog).

## The dispatch board

Open **Trips** from the left-hand menu. The left column is the dispatch board: one row per trip, showing its **code**, **customer**, **unit**, **planned start**, **stop count** and **status**. A red **Off corridor** badge marks a trip whose vehicle has strayed from its planned route.

The filters across the top — status, unit, driver, date from, date to — and the search box in the top bar are all applied by the server, so the list is a true page of matching trips rather than a filtered view of the first few. Use the arrows below the board to move between pages; the counter tells you which rows you are looking at.

Click a row to open that trip in the workspace on the right.

## Trip statuses

| Status | Meaning |
|---|---|
| Created | Planned but not started. Stops and the route can still be edited. |
| In progress | Running. Positions are being matched against the stops and the corridor. |
| Paused | Temporarily halted. It can be resumed, cancelled or aborted. |
| Completed | Finished normally. |
| Cancelled | Called off. Stops, history and proof of delivery are kept. |
| Aborted | Ended where it stood, with a reason. |

A trip can only move along the paths above — you will not be offered a button for a transition that is not allowed. Completed, cancelled and aborted trips are final.

## Creating a trip

Click **New trip** and fill in the dialog:

- **Trip code** (required) — your own reference. It must be unique within the account; reusing a code is rejected.
- **Customer** — shown to the customer on the tracking page.
- **Unit** (required) and **Driver** — the vehicle doing the work, and who is driving it.
- **Origin**, **origin latitude** and **origin longitude** (required) — where the trip begins.
- **Planned start** (required) and **planned end**.
- **External reference** — the id this trip carries in your own TMS or ERP.
- **Toll vehicle class** — which tariff band this vehicle falls into, used for the toll estimate.
- **Notes** — internal only. Notes are never shown to the customer.

## Adding stops

With a trip selected, use **Add stop** in the stop panel. A stop's position comes from exactly three places:

1. **Click on the map.** Press **Click on the map**, then click the point. The dialog reopens with the coordinates filled in.
2. **Use a point of interest.** Pick one of your saved points of interest.
3. **Use a geofence.** Pick one of your account's geofences. The stop keeps a link to the zone, so arrival is judged against the real shape of the zone rather than a circle around a point — see [Geofences](topic:geofences).

There is deliberately **no address search box**. All three sources already give exact coordinates, and TrackHub fills the **Address** and **City** fields for you by looking up the point you chose. You can edit both freely.

**Address and City are two different disclosure levels, not a duplicate.** The address is the full street label and stays internal to your team. The city is the coarse locality and is the *only* location detail a customer tracking link can ever show — so a link holder learns that a stop is in Bogotá, never the exact door it is delivered to. Keep the city filled in: if it is empty, a shared link shows no locality at all for that stop. It is limited to 200 characters.

Each stop also takes:

- **Name** (required), the resulting **address**, and the **city**.
- **Arrival radius** — how close the vehicle must get for an arrival to be detected automatically. Widen it for large yards, narrow it for street-side deliveries.
- **Planned from** / **planned to** — the window you promised.
- **Proof of delivery required** — flags the stop as one that must be signed for.
- **Priority** and **observations**.

### Changing the visit order

Drag a stop up or down in the list, or use the up and down arrows on the row. The new order is saved immediately and the stop numbers on the map follow it. Re-plan the route afterwards so the driving line matches the new order.

## Planning the route

Set the **corridor width** and press **Plan route**. TrackHub asks the routing service for the driving line through your stops and gets back:

- the **planned route**, drawn as a blue line;
- the **corridor**, a band of the width you set around that line;
- the **planned distance** and **planned duration**;
- the toll stations the route passes.

The corridor is what a deviation is measured against: while the trip runs, three consecutive positions outside the band raise one **route deviation**, and the trip picks up the **Off corridor** badge until the vehicle returns.

If the routing service is unavailable, the plan comes back as **failed** with a reason. The trip stays completely usable — you can still start it, record arrivals and complete it — and stop ETAs fall back to your planned schedule instead of a live estimate.

## Toll estimate

Below the planner, the toll panel shows the estimated cost of the route and a per-station breakdown. Use the **vehicle class** selector to re-price the same route for a different tariff band without changing the trip.

Read the status badge carefully, because it changes what the number means:

- **Complete** — every station on the route has a tariff for this class. The figure is the full estimate.
- **Partial** — at least one station has **no tariff** for this class. Those stations are listed with a *No tariff* badge, and the real cost is **higher** than the figure shown. TrackHub reports the gap rather than quietly treating an unpriced station as free.
- **No stations** — no station in the platform's catalog lies on this route. There is no estimate; this is **not** a cost of zero.
- **Not calculated** — tolls have not been worked out for this route plan yet.

The station and tariff catalog is platform-wide and is maintained by a super administrator — see [System Administration](topic:system-administration).

### Toll classes for your fleet

The estimate can only price a route once TrackHub knows which tariff band the vehicle falls into. **Toll classes**, at the top of the board, is where you tell it:

1. Choose whether the rule applies to a **vehicle type** or to **one vehicle** as an exception.
2. Pick the vehicle type or the vehicle, then the **toll vehicle class**.
3. Save. You can add as many rules as you need without closing the dialog.

New trips pick up their toll class from these rules automatically. Trips that already exist keep the class they were created with, and you can always override a single trip's class in the trip dialog.

Until at least one rule exists, trips are created with no toll class and the estimate has nothing to price against, so it never engages. If the class list is empty, the platform's toll catalog has no vehicle classes yet — a super administrator has to define them first.

## Assigning a driver

The assignment panel shows who is currently assigned, on which unit, when they were assigned, and whether they have acknowledged it. Pick a driver and a unit and press **Assign driver** to change it. Only active drivers are offered.

## Running the trip

Press **Start** when the vehicle sets off. While a trip is in progress:

- Positions arriving from the vehicle are matched against each stop's arrival area, marking arrivals and departures automatically.
- You can also record them by hand from the stop table with **Record arrival**, **Record departure** and **Skip** — useful when GPS is weak, the dock is indoors, or the device is off. A manual entry always wins over automatic detection, and recording the same thing twice never creates a duplicate.
- **Pause** and **Resume** cover planned stand-downs.
- **Complete** finishes the trip. If stops are still pending, tick **Complete even though stops are still pending** to force it.
- **Cancel** and **Abort** both need a reason and both keep everything already recorded.

A trip that has any recorded activity cannot be deleted — cancel it instead. Only a freshly created trip with no history can be deleted.

## Trip detail

Under the planner you get the full picture of the trip:

- **Stops** — the planned window, the ETA with its source, the actual arrival and departure, and the current status of each stop. The ETA label tells you whether it is a **live estimate** from the routing service or a fallback to your **planned schedule**, so you know how much to trust it.
- **Deliveries** — the consignments registered against each stop and how each one turned out. See *Deliveries and proof of delivery* below for how to register and close them.
- **History** — every event on the trip, with when it happened and whether it came from the portal, the driver, automatic detection or a background job.
- **Proof of delivery** — one card per capture, with who received it, when, where, any notes, and buttons to download the attachments.
- **Route replay** — press **Load replay** to draw the positions the vehicle actually recorded over the planned line. If the trip has more history than the replay limit, a warning says so and tells you how many points are shown; use the position history report for the complete track rather than assuming the drawn line is everything. See [Trips and replay](topic:dashboard-trips-replay).

## Deliveries and proof of delivery

Deliveries and proof of delivery are recorded **from this screen**. You do not need the driver app: a dispatcher taking details over the phone or radio can keep the trip's record complete on their own.

Both stay available until the trip is completed, cancelled or aborted.

### Registering what is being delivered

Press **Delivery** on a stop row to add a consignment to it. A delivery carries a **client** (required), an optional **branch**, a **reference**, a **products** summary, free **observations** and an **order** number that controls where it appears in the list.

A delivery belongs to the stop it was created on and cannot be moved to another one — create it on the right stop, or delete it and add it again. **Edit** changes its details; **Delete** removes the line entirely. Deleting a delivery does not touch proof of delivery already captured for the stop.

### Recording the outcome

Press **Outcome** on a delivery row to say how it actually went: **delivered**, **partially delivered**, **rejected**, or back to **pending**. Add observations explaining anything unusual — a rejection especially.

If you press save again after an error, TrackHub updates the same record rather than adding a second outcome, so a retry after a dropped connection is always safe.

### Capturing proof of delivery

Press **Proof of delivery** on a stop row. Record:

- **Received by** (required) and, if you have it, the receiver's **ID**.
- **Captured** — when the handover happened. It defaults to now; change it if you are entering it after the fact.
- **Delivery** — leave it empty to mark **every** delivery on the stop as delivered. Naming one delivery records evidence for that one and leaves the others exactly as they are, which is what you want when a stop is partly rejected.
- **Latitude / longitude** — optional, if you know where the handover took place.
- **Notes**.

**Attachments** — signatures, photos of the goods, stamped receipts — are uploaded with **Attach files**. They become ordinary documents in TrackHub, filed against the trip's vehicle, so they also show up under that unit's documents and can be found later — see [Documents](topic:documents).

Every attachment is virus-scanned before it can be used as evidence. A file shows **Scan pending** for a moment after upload; press **Re-check** until it turns **Clean**. TrackHub will refuse to save the capture while any attachment is not clean, and tells you how many are still waiting — remove them or wait for the scan rather than trying repeatedly.

Saving twice never creates two proofs for the same capture, so if the save fails you can simply press save again.

Captured proofs appear as cards in the trip detail, with buttons to download each attachment.

## Sharing a tracking link with the customer

Press **Share** to create a read-only link your customer can open without an account.

1. Set a **purpose** and, required, an **expiry** date and time.
2. Tick exactly what the customer may see: **stop detail**, **the planned route on the map**, **live position**, **vehicle**, **driver first name**, and **whether each stop has proof of delivery**.
3. Press save. The link appears **once**.

Every box starts **unticked unless it is deliberately safe**, and the **planned route** in particular starts off. Leaving it off is not a mistake — the customer simply gets the stop timeline and, if you shared it, the live marker, with no route line drawn. Tick it when you actually want the customer to see the intended path. The dialog tells you which of the two the link will produce before you save.

Copy it immediately — the token inside the link is shown at creation and can never be retrieved again. If you lose it, revoke the link and create a new one.

Anything you did not tick is never sent to the customer at all. Costs, tolls, internal notes, driver contact details, document files and raw position history are **never** shared, whatever you tick. Live position is only ever visible while the trip is actually in progress.

Existing links are listed in the same dialog with their state — active, expired or revoked. **Revoke** stops a link working immediately. Trip links are ordinary public links and also appear in [Public links](topic:public-links).

The customer's view is described in [Customer trip tracking](topic:public-trip-tracking).

## Reports

Six trip reports are available on the [Reports](topic:reports) screen: trip summary, trip stop detail, on-time performance, stop dwell, toll cost and the proof-of-delivery register. They respect the same group visibility as the board, so you only ever see trips for units in your groups.

## If something looks wrong

- **No Trips entry in the menu** — the feature is not enabled for your account.
- **Plan route does nothing** — the trip needs at least one stop.
- **"Route planning is not configured"** — the platform's routing service has no credentials. This is a platform setting, not an account one; contact your administrator.
- **The estimate says "Partial"** — that is the catalog telling you it does not have a tariff for every station on this route, not an error.
- **Arrivals are not detected** — check the stop's arrival radius, and confirm the unit is actually reporting positions on the [live map](topic:dashboard-live-map).
- **Proof of delivery will not save** — an attachment has not finished its virus scan, or failed it. Press **Re-check**, or remove the file.
- **No delivery or proof-of-delivery buttons** — the trip is already completed, cancelled or aborted; a closed trip's record is not rewritten.
- **The toll estimate never appears on new trips** — no toll class rule exists yet. Open **Toll classes** and map your vehicle types.
- **The customer sees no city on a stop** — that stop has no city filled in. Open the stop and set it; the full address is deliberately never shared.
- **The customer sees no route line** — the link was created without **the planned route on the map** ticked. Revoke it and create a new one with the box ticked.
