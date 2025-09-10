1. Overview
Problem Statement

Kin clubs across Canada host a wide variety of events (service projects, socials, fundraisers). Currently, there is no central calendar where events can be shared across clubs, zones, and districts. Club websites and Facebook pages show some events, but they are fragmented. Members and the public often miss opportunities to attend or collaborate.

Goals

Provide a centralized events calendar for Kin clubs.

Enable clubs to create and manage events easily.

Allow users to filter events by club, zone, district, or all clubs.

Provide an iframe embeddable widget so clubs can showcase their own events on their websites.

Support public events (open visibility) and private events (restricted to members).

Use lightweight authentication (magic links) for event creation/editing.

Non-Goals

Full membership management (handled by iKin).

Ticket sales or payment processing (may be future).

Notifications/RSVPs (future scope).

2. Users & Use Cases
Primary Users

Club Officers/Admins: Create and manage events for their club.

Club Members: View upcoming events for their club, district, or zone.

Public Visitors: Discover public-facing Kin events near them.

Club Webmasters: Embed the calendar in their club website.

Example User Stories

As a club officer with permissions for my club, I can create an event on behalf of my club using a magic link.

As a zone representative with permissions for my zone, I can post an announcement about a zone-wide event.

As a district officer with permissions for multiple entities, I can select which entity (club, zone, or district) I want to post on behalf of.

As a Kin member, I can filter content to show all events in my zone.

As a Kin member, I can view recent announcements from my district.

As a public visitor, I can view all public events and announcements without logging in.

As a club webmaster, I can embed a calendar widget on our site that shows just our club's events.

As a club webmaster, I can embed an announcements widget on our site that shows recent club announcements.

As a user with multiple entity permissions, I can see a list of all entities I can post for and select the appropriate one for each post.

3. Functional Requirements
Event Creation & Management

Fields: Title, Description, Start Date/Time, End Date/Time, Location, Club, Zone, District, Visibility (public/private).

Optional fields: Tags (fundraiser, service, social), Event URL, Image.

Ability to edit/delete events.

Authentication & Entity Management

Content creators authenticate via magic link to email.

Users are assigned permissions to post on behalf of specific entities (clubs, zones, districts).

Each user can have permissions for multiple entities (e.g., a user might be able to post for both their club and their zone).

When creating content, users select which entity they are posting on behalf of from their authorized list.

Content is always associated with a specific entity (club, zone, or district) as the publishing entity.

[Open Question] Should there be persistent accounts (to update/delete content later)?

[Open Question] For private content, how do we authenticate members?

Option A: iKin login integration

Option B: club-maintained invite list

Option C: unlisted link access (less secure)

[Open Question] How are entity permissions managed and assigned to users?

Event Visibility

Public: visible to everyone.

Private: visible only to authenticated members.

[Open Question] Define the standard for “member authentication.”

Calendar Views & Filtering

Filter by: Club, Zone, District, All Clubs.

Calendar and List views.

Search by keyword.

[Open Question] Should there be a map view (events plotted geographically)?

Embedding

Clubs can generate iframe embed codes.

Customization options: default filter (club-only), color theme, calendar/list toggle.

[Open Question] Should district/zone embeds also be allowed?

4. Non-Functional Requirements

Performance: Calendar loads within 1 second in iframe.

Security: Magic link tokens expire after X minutes.

Usability: Fully responsive, mobile-first design.

Moderation:

Self-serve event posting, but flagged events go to Kin Canada admin for review.

[Open Question] Should there be central moderation before events are published?

5. Dependencies

Kin Canada club/zone/district data (structure and IDs).

Hosting (likely SaaS setup).

Possible integration with iKin authentication if permitted.

6. Risks & Open Questions

Private event access control: how to validate membership?

Risk of spam or malicious event submissions.

Who owns and maintains this service — Kin Canada national office, districts, or independent?

Does iKin already plan to add this feature (avoid duplication)?

7. MVP vs Future

MVP:

Event creation with magic links.

Public/private visibility (private may be crude in MVP).

Club/zone/district/all filters.

Embeddable iframe widget.

Basic moderation.

Future:

RSVP and ticketing.

Reminders/notifications.

Google Calendar/Outlook integration.

API for third-party tools.