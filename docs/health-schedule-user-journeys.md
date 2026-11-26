# HealthSchedule user journeys

**Status:** agreed direction, first slice built. **Date:** 21 November 2026.

HealthSchedule was first built one page per API area, so a first-time user,
or anyone outside medicine, could not tell what to do. This note sets out
what each person comes to do, so screens follow their work rather than the
API. The roles are the Platform API's preset roles; custom roles follow the
permissions they hold.

## Principles

- **Start with today's work.** The overview shows what needs doing now, with
  one link per job. A new organisation sees what to set up first.
- **Plain words.** Name things the way a receptionist or a new administrator
  would. Where a clinical term is needed, explain it beside the term.
- **One patient, one path.** A visit runs check-in, vital signs, doctor, then
  any department. Every list of patients in the building shows where each
  one is on that path.
- **Every empty page has a next step,** or says plainly that nothing is
  needed.
- **Show only what someone's job needs.** Pages follow permissions; owners,
  administrators and managers see everything, grouped by job.

## Journeys

| Person                                                             | Comes to                                                              | Starts at                 | Steps                                                                                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **New owner or administrator**                                     | Get the hospital ready to see patients                                | Overview, setup checklist | Choose a branch → set doctors' and rooms' weekly hours → set what patients can book and its price → invite the team (hub) |
| **Receptionist** (front desk)                                      | Check patients in and know who is still here                          | Check-in                  | Find the patient or register them → check in → see everyone in the building and where they are                            |
| **Nurse** (triage nurse)                                           | Take each new arrival's vital signs and decide how urgent they are    | Vital signs               | Take the next patient → record temperature, blood pressure and pulse → choose how urgent → send to a doctor               |
| **Doctor**                                                         | See patients one after another and write the visit down               | Consultations             | Call the next patient → read vital signs and allergies → write and sign the note → order tests → send on or finish        |
| **Department staff** (lab, radiology, pharmacy, cashier, HMO desk) | Serve the patients sent to their department                           | Queues, their department  | Call the next patient → serve them → send on or finish                                                                    |
| **Manager**                                                        | Keep the day running and check restricted records were opened rightly | Overview                  | See waits and patients in the building → review emergency openings of restricted records                                  |

## What changed in the first slice

- **Overview:** "Your work today", one card per job the person's permissions
  allow, each with a live count and a link; and, for people who manage the
  schedule, a setup checklist that ticks itself off from real data.
- **Navigation:** grouped by job (Patient visits, Patients, Setup), with
  plain names, and the person's role in the account menu.
- **Visit tracker:** each patient in the building shows checked in, vital
  signs, then where they are now.
- **Plain language:** clinical terms explained where they appear; long
  explanations cut down.
- **Consistency:** one empty state per section, grouped queue list, missing
  details in grey, a patient search at the top of Patients.

## Booking (phase 2)

- **One booking screen, opened where the work is:** "Book an appointment"
  on the front desk, on the Appointments page and on a patient's record.
  Choose what it is for, then a free time from a week of days grouped by
  doctor or room. The time is kept for five minutes, with a countdown,
  so no other desk takes it while the booking is confirmed.
- **Appointments page:** a table of everyone booked at the branch on a
  day, in time order, with who or which room each is with. "With" narrows
  the day to one doctor or room and shows their hours. A booking that leave
  or changed hours no longer fits is highlighted as "Needs moving". Each
  row's menu moves, cancels or records that the patient did not come.
- **On the patient record:** their coming appointments, with move, cancel
  and "did not come", and recent ones. A past booking that was never
  checked in or recorded as missed says "Not checked in".
- **Waitlist:** when no time suits, the patient goes on the waitlist with
  the dates and time of day they could come. Waiting patients are listed
  on the Appointments page to book when a time comes free.

## Tests and results (phase 3)

- **Ordering, in the consultation:** search the facility's tests and scans
  by name or code, or tap a common one (full blood count, malaria tests,
  glucose, urinalysis, chest X-ray). Chosen tests collect in one order with
  a priority (routine, urgent or STAT) and the clinical question for the lab
  or radiologist. The same panel is on the patient record's "Tests and
  results" tab.
- **No accidental repeats:** a chosen test that was resulted in the last 7
  days, or is already ordered and not finished, says so beside it, with the
  earlier result one click away. Nothing is blocked.
- **Results come back to the doctor:** "Results to review" lists released
  results of their orders, critical first; patients with results waiting
  are marked "Results ready" in the consultation queue; the overview has a
  "Review results" card. Opening a result shows each value with its flag
  and reference range; "Mark as seen" takes it off the list. A result
  amended after release comes back, with its earlier versions.
- **Never called normal without ranges:** the starter tests have no
  reference ranges until the laboratory sets them, so an unflagged result
  reads "Nothing flagged", not "Normal".
- **Setup, Tests and scans:** administrators add the starter list and switch
  off tests the facility does not offer.

## Billing (phase 4)

- **Cashier page:** every bill with something still owed, and what the
  cashier took today by cash and by card or transfer. Opening a bill shows
  its charges, who pays (the insurer's part and the patient's), payments
  with receipt numbers, and what is still owed. The cashier takes full or
  part payments by cash, card (POS) or bank transfer, and adds charges that
  are not ordered elsewhere, such as a dressing.
- **With the waive permission:** waive part of a bill within the person's
  limit, remove a charge made by mistake, reverse a payment, and let one
  bill be paid at the end or before each service. Each needs a reason.
- **Bills tab on the patient record:** one bill per visit, with what is
  still owed across all of them.
- **Prices under Setup:** the price list, each insurer's price and patient
  share, and whether the facility's patients pay at the end of the visit or
  before each service.

## Still to do

- **Booking above capacity or outside hours** (`appointment:override`) is
  not offered yet.
- **Offering a freed time to waiting patients** straight after a
  cancellation (`GET /v1/waitlist/matches`) is not shown yet.
- **Lab and radiology worklists** (phase 4): collecting samples, entering
  and releasing results, and editing a test's result fields and reference
  ranges. Until then results are entered through the API.
