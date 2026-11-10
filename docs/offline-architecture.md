# Offline and installable apps

Status: accepted for phase 1 (installable apps). Phases 2 to 4 are planned.

HealthAlyst products are used in clinics where the connection drops, is slow
or is shared by many devices. Working offline is part of the product, not an
extra. This record says what works offline, how, and how it scales across
products.

## Principles

1. **Capture offline, decide online.** What one person records at the
   bedside or front desk can be saved on the device and sent later. Shared,
   real-time state, such as calendars and queues, stays on the server.
2. **Never lose, never overwrite.** Every queued action carries an identifier
   chosen by the device and the record version it was based on. A conflict
   goes to a person to resolve; it never overwrites newer data silently.
3. **Always say where data is.** A record saved only on this device looks
   different from one the server has. For clinical data, such as allergies,
   this must be impossible to miss.
4. **Adapt to the device by capability, not by brand.** Storage, persistence
   and background sync differ by browser and device; the app measures them.
5. **Patient data never enters the service worker's cache.** Cache Storage is
   unencrypted and outlives sign-out. Offline data belongs in the encrypted,
   per-person store described in phase 2.

## What works offline

| Tier                      | Behaviour                                                                 | HealthSchedule examples                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Works offline             | Saved on the device, sent automatically later                             | Register a patient, record vital signs and triage, draft and sign notes, check in a walk-in, read today's day board and recently seen patients                                   |
| Queued, checked when sent | Sent with the version the device saw; a refusal goes to "Needs attention" | Edit patient details, record allergies and consents, reschedule                                                                                                                  |
| Online only               | Disabled offline, with the reason shown                                   | Booking against shared calendars, calling the next patient, break-the-glass access, eligibility checks, step-up verification, everything in Super Admin and the organisation hub |

Clinical products, HealthSchedule first and LabConnect later, get full
offline support. The organisation hub and Super Admin are installable and
show an offline page, but keep no data, because they handle administration
and security.

## Architecture

### Service worker (phase 1, `@healthalyst/pwa`)

- Built with [Serwist](https://serwist.pages.dev/docs/next/turbo), which the
  Next.js 16 guide recommends for full offline loading. Each app serves its
  worker from `src/app/serwist/[path]/route.ts` and starts it from
  `src/app/sw.ts`.
- `caching-rules.ts` decides per request:
  - Cross-origin requests, writes and any path containing `/v1/` (the
    Platform API and product APIs, directly or through an app's proxy) always
    go to the network and are never stored.
  - Hashed build files are stored until they expire; images and fonts are
    served from storage and refreshed in the background.
  - Pages and their React Server Component payloads are stored only for
    products built to work offline (`keepPagesForOffline`). No server
    component reads cookies or headers, so pages carry no personal data.
  - Moving between screens fetches only their payloads, and the very first
    page loads before the worker is in control. So, as each screen opens, the
    app asks the worker to store its full page (`storeVisitedPages`), and a
    reload works offline.
- Every app stores an `/offline` page at install and shows it for any page
  that cannot load. It is plain HTML with inline styles and no JavaScript
  (`createOfflineDocument`). The worker serves it at the address that failed,
  so a Next.js page there would start its router, try to load that address
  and crash; the plain page cannot.
- A new version waits. The app shows "A new version is ready" and reloads
  only when the person chooses, so a form is never lost to an update.
- The worker is registered in production builds only, so development never
  serves stale files.

### Device storage and sync (phase 2, `@healthalyst/offline`)

- **Store:** IndexedDB, separate per person, organisation and branch,
  encrypted with a non-extractable Web Crypto key, wiped on sign-out. This
  protects a lost or shared device, not a compromised page; short retention
  and wiping are the main safeguards.
- **Outbox:** each action keeps its own identifier, payload, the version it
  was based on and what it depends on. Actions replay in order per record.
  Conflicts (`409`, `412 VERSION_CONFLICT`) go to a "Needs attention" list.
- **Sync engine:** runs when the app opens, when the connection returns and
  when the tab becomes visible. One tab sends at a time (Web Locks). Background
  Sync is used where available; iOS does not support it, so nothing depends
  on it.
- **Read cache:** only queries a feature lists are kept, each with an age
  limit and scope. This amends the current rule against persisting the query
  cache: persistence is allowed only through `@healthalyst/offline`,
  allowlisted, scoped and encrypted.
- **Signing in offline:** access tokens stay in memory. Offline, the app keeps
  working from the last confirmed identity for a limited window, behind a
  quick-unlock PIN on shared devices. Queued actions are sent only once the
  same person has a valid session again.
- **Payload versions:** queued actions carry a schema version, so actions
  queued by an older release still replay after a deploy.

### Device profiles (phase 2)

| Profile     | When                                                | Kept offline                                                                     |
| ----------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| Full        | Installed, or a desktop with plenty of storage      | Branch day boards, upcoming appointments, an index of recent patients, templates |
| Lite        | Low storage or memory                               | Today's work and anything waiting to send                                        |
| Online only | Private browsing, no persistent storage, kiosk mode | Nothing; the person is told why                                                  |

The app requests persistent storage, checks `navigator.storage.estimate()`,
and evicts the oldest cached reads first. Anything waiting to send is never
evicted. iPhones clear site data after about seven days without use unless
the app is on the home screen, so installing on iOS is part of onboarding.

### Interface (`@healthalyst/ui`)

Product-neutral components: the connection notice and the update prompt
(phase 1), then the sync indicator ("3 waiting to send"), the "Saved on this
device" label and the "Needs attention" list (phase 3).

## Scaling across products

- Each feature declares its offline setup beside its owner: the queries it
  keeps (with age limit and profile) and the actions it can queue (with how
  they replay and resolve). Products switch on offline one feature at a time.
- Each app has its own manifest, icons, service worker scope and cache
  policy; the rules and tooling are shared.
- Monitoring without patient data: queue length, age of the oldest waiting
  action and conflict rate.
- Testing: browser tests with the network switched off, interrupted sends,
  and a device matrix of a low-end Android phone (Chrome), iOS Safari
  installed to the home screen, and desktop Chrome and Edge.

## Backend requests

The HealthSchedule API already accepts identifiers chosen by the device for
patient registration, slot holds, bookings, notes and patient imports, and
checks `If-Match` versions on edits. Still needed:

1. Device-chosen identifiers for check-in, triage, allergies, consents,
   coverage and relationships.
2. The time an action actually happened (vital signs taken at 10:02 and sent
   at 14:00 are recorded as 10:02).
3. "Changes since" reads, so stored data refreshes cheaply.
4. The current version in conflict responses, to show both side by side.
5. A refresh-token lifetime that matches a shift.

## Phases

1. **Installable apps:** manifests, icons, service workers, offline page,
   connection notice and update prompt in all three apps.
2. **`@healthalyst/offline`:** store, outbox, sync engine and device profiles,
   with thorough tests and no product features.
3. **HealthSchedule offline features:** patient registration and notes first,
   since their API already supports replays.
4. **Hardening:** conflict review, monitoring and the device matrix.
