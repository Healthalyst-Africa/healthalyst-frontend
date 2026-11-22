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
| **Doctor**                                                         | See patients one after another and write the visit down               | Consultations             | Call the next patient → read vital signs and allergies → write and sign the note → send on or finish                      |
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

## Still to do

- **Booking** (phase 2) belongs in the receptionist's journey: book from
  check-in and from a patient's record, not on a separate page.
- **A day view of each calendar,** so "Calendars" shows people's days, not
  only their weekly hours.
- **Today's booking on the patient record,** once the appointments list is
  connected.
