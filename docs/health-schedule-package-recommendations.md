# HealthSchedule package recommendations

**Status:** partly adopted. The schedule setup screens added
`react-hook-form` with `@hookform/resolvers` 5.9, `date-fns` 4 with
`@date-fns/tz`, the shadcn calendar on react-day-picker 10, and `sonner`.
MSW is still to add, with the first mock handlers. The rest is not installed.
**Date:** 9 November 2026.

Adopting the calendar also updated `@radix-ui/react-dialog` to 1.3.1 and
`@radix-ui/react-select` to 2.4.1. Before that, dialogs, popovers and selects
used different versions of Radix's dismissable layer, so Escape in a date
picker or open select also closed the dialog around it.
**Scope:** the HealthSchedule screens built on the HealthSchedule API:
schedule setup, booking, the day board, queues, patients, clinical notes and
patient import.

Before schedule setup, the frontend had no form library, date library, date
picker, toast or API mocking. Forms were built with `DynamicFormFields` and `FormData`
([form system](form-system.md)), and dates used the browser's date input. The
HealthSchedule screens need more than that, so this note records which
packages to add, which to leave until a screen needs them, and which to skip.

Every package added follows the repository rules: shared visual parts go in
`packages/ui` and are used through `@healthalyst/ui`, applications never
render shadcn primitives directly, and validation stays in each app's Zod
schemas.

## Add before the schedule setup screens

| Package                                                    | Where              | Why                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-hook-form` and `@hookform/resolvers` (5.1 or later) | HealthSchedule app | The appointment type form has 13 fields, and weekly hours is a list of rows that people add and remove. A form library handles that, including its field arrays. It uses the app's existing Zod schemas; the resolver supports Zod 4 from 5.1. Existing `DynamicFormFields` forms stay as they are; this is for forms with repeating rows or many related fields. |
| `date-fns` 4 and `@date-fns/tz`                            | HealthSchedule app | The API works in branch-local Lagos time (`HH:MM` hours, date-times with `+01:00`). Screens need week ranges, the 31-day limit on free slots and date-time conversion for time off. Plain `Date` arithmetic gets time zones wrong. The built-in Temporal API is not yet in stable Safari.                                                                         |
| shadcn `calendar` (react-day-picker 10)                    | `packages/ui`      | A shared date picker and date-range picker for time off, holidays and booking dates. Times stay as the browser's own time input, which works well on phones, so no separate time-picker package.                                                                                                                                                                  |
| `msw` (Mock Service Worker)                                | Development only   | Tests and local demos of states the shared dev API rarely shows, such as several branches, "still being set up" or a missing permission, without writing test data to it.                                                                                                                                                                                         |
| `sonner` (the shadcn toast)                                | `packages/ui`      | Short confirmations such as "Calendar saved". Page, step and panel states still use `StateNotice`; inline guidance still uses `NoticeBanner`.                                                                                                                                                                                                                     |

## Add when the screen that needs it arrives

| Package or tool           | Screen                          | Why                                                                                                                                                                                             |
| ------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `libphonenumber-js`       | Patient registration            | Checking and formatting patient phone numbers, using its small Nigeria-only data set.                                                                                                           |
| shadcn `chart` (Recharts) | Visit-times report              | Median waits, the slow tail and the share over target.                                                                                                                                          |
| Playwright                | Booking and front-desk journeys | End-to-end tests of journeys that span several screens.                                                                                                                                         |
| Generated API types       | Every API service               | Types generated from the APIs' OpenAPI files (served beside their Swagger pages), so a changed response fails the build. Needs a short trial first: generated names may break the naming rules. |

## Decide at the day board: the calendar view

A full scheduling calendar is the most expensive part to build, and the free
options each have a catch:

| Library            | Catch                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| FullCalendar       | Free core; resource views, one column per calendar, are paid.            |
| Schedule-X         | Free core; resource scheduling appears to be in the paid tier.           |
| MUI X Scheduler    | Free tier includes resources, but it is in beta and brings MUI styling.  |
| react-big-calendar | Free and mature, with resource columns in its day view; needs restyling. |

`GET /v1/appointments/day-board` already returns each calendar's hours,
closures and appointments for one branch and day. A grid built from the shared
components may therefore be enough. Adopt a library only if dragging
appointments to reschedule them becomes a requirement. Compare both options
when the day board is built.

## Already installed: use these instead of adding more

| Package            | Use                                                            |
| ------------------ | -------------------------------------------------------------- |
| `cmdk`             | Quick patient search.                                          |
| `react-dropzone`   | Patient documents and the patient import CSV upload.           |
| TanStack Query     | Refreshing queues on a timer; the API has no live updates.     |
| Shared `DataTable` | Lists; the API pages results, so TanStack Table is not needed. |

## Not needed

- `papaparse`: the API checks every CSV row itself.
- A separate time-picker package: the browser's time input is enough.
- `react-to-print`: print styles in CSS cover tokens and notes.

## Sources

- [Best open-source React calendar libraries, 2026 (DEV)](https://dev.to/hadil/best-open-source-react-calendar-libraries-for-scheduling-in-2026-4h11)
- [FullCalendar alternatives compared (CoreUI)](https://coreui.io/compare/fullcalendar-alternative/)
- [FullCalendar Premium](https://fullcalendar.io/premium)
- [React scheduler libraries (Cal.com)](https://cal.com/blog/react-scheduler-component-libraries)
- [@schedule-x/react on npm](https://npmjs.com/package/@schedule-x/react)
- [Schedule-X terms](https://schedule-x.dev/terms-and-conditions)
- [MUI X Scheduler](https://mui.com/x/react-scheduler/)
- [shadcn date picker](https://ui.shadcn.com/docs/components/date-picker)
- [react-day-picker 9 with React 19 (Zenn)](https://zenn.dev/is0383kk/articles/f6f07fef5517c0)
- [date-fns 4 time zone support](https://blog.date-fns.org/v40-with-time-zone-support/)
- [Temporal and polyfills in 2026 (OpenReplay)](https://blog.openreplay.com/using-polyfills-2026/)
- [@hookform/resolvers on npm](https://npmjs.com/@hookform/resolvers)
- [react-hook-form resolvers PR #777](https://scriptagc.wasmer.app/https_GitHub_com/react-hook-form/resolvers/pull/777)
