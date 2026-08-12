# HelloFamily MVP PRD (4-Day Scope)

> Persisted copy for reference by future development sessions. Original
> source: `HelloFamily MVP PRD (4-Day Scope).docx`, one directory above this
> repo (`~/lumos-fellows-app/`, not tracked in git).

## Product Overview

**Product Name:** HelloFamily

**One-Line Positioning:** HelloFamily helps you keep connected with your
loved ones and get assurance of their wellbeing.

**One Job:** Help families know an older loved one is okay every day through
check-ins.

## Target Users

**Older Adults**
- Want to maintain independence while staying connected with loved ones.
- Complete a quick daily check-in.

**Adult Children**
- Want peace of mind about their aging parents.
- Receive reassurance through daily check-ins.

## Platform

- **iOS App** — the primary HelloFamily experience.
- **Website** — a simple landing page that explains HelloFamily, describes
  what the app does, and links to download the iOS app.

## User Roles

**Adult Child**
- Creates an account.
- Invites their older loved one through an invite link sent through SMS or
  email.
- Receives notifications about wellbeing status of their loved ones.
- Views daily check-in status.

**Older Adult**
- Creates an account through the invite link.
- Completes one daily check-in.
- Receives one reminder notification each day for check-in.

## User Flow

**Adult Child**
- Creates an account using email and password.
- Generates an invite link.
- Sends the invite link to their older loved one.
- Once connected, receives:
  - A notification when the daily check-in is completed.
  - A notification if a concern is detected.
  - A notification if the daily check-in is missed by the end of the day.
- Opens the app to view today's check-in status.

The adult child cannot view the older adult's reflection responses.

**Older Adult**
- Opens the invite link.
- Creates an account using email and password.
- Becomes connected with the adult child's account.
- Receives one reminder notification each day.
- Opens HelloFamily.
- Answers three daily reflection questions using simple answer choices (such
  as Yes/No or Good/Okay/Not Good).
- Submits the daily check-in.
- Sees a confirmation message that the daily check-in was completed.

## Daily Reflection Questions

1. **How are you feeling today?** — Good / Okay / Not Good
2. **Are you feeling physically okay today?** — Yes / Mostly / No
3. **Were you able to complete your normal daily activities today?** — Yes /
   Mostly / No

Responses use simple predefined choices rather than free-text responses.

## Notifications

**Older Adult**
- One daily reminder notification to complete the daily check-in.

**Adult Child**
- Daily check-in completed notification.
- Concern detected notification.
- Missed daily check-in notification if no daily check-in has been completed
  by the end of the day.

## Adult Child Dashboard

Displays:
- Older adult's name.
- Today's check-in status: Check-in completed / Pending / Concern detected /
  Missed today.
- Last completed check-in date.

The dashboard does not display the reflection responses.

## Screens

1. **Welcome Screen** — brief introduction, Log In button, Create Account
   button.
2. **Login / Sign Up** — email field, password field, Create Account button,
   Log In button.
3. **Adult Child Dashboard** — today's check-in status, last completed
   check-in date, generate and share invite link.
4. **Older Adult Daily Check-In** — the three daily reflection questions,
   Submit button.
5. **Check-In Complete Screen** — confirmation message after submission.

## MVP Must-Haves

- Email and password account creation.
- Invite link connecting an adult child and an older adult.
- Daily reminder notification for the older adult.
- Three daily reflection questions.
- Daily check-in completion.
- Daily check-in status.
- Daily check-in completed notification.
- Concern detected notification.
- Missed daily check-in notification.

## Design Principles

- Simple and uncluttered interface.
- Easy for older adults to navigate.
- Large, readable text and buttons.
- Minimal steps required to complete the daily check-in.
- Calm and reassuring user experience.

## Out of Scope (Version 1)

- Viewing detailed reflection responses.
- Extra communication or messaging features.
- Advanced tracking.
- Customization.
- Multiple language support.
- Anything beyond the daily check-in purpose.
