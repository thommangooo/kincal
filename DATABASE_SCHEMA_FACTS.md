# DATABASE SCHEMA FACTS - READ THIS FIRST

## ⚠️ CRITICAL: Events Table Schema

**THE EVENTS TABLE DOES NOT HAVE SEPARATE TIME FIELDS**

### What EXISTS in the events table:
- `start_date timestamp with time zone not null`
- `end_date timestamp with time zone not null`

### What DOES NOT EXIST:
- ❌ `start_time` field
- ❌ `end_time` field

## How to Handle Times:

### All-Day Events:
- Store as: `start_date: "2025-09-26T00:00:00.000Z"` and `end_date: "2025-09-26T23:59:59.000Z"`
- Detect by: checking if times are midnight to 11:59 PM

### Timed Events:
- Store as: `start_date: "2025-09-26T14:30:00.000Z"` and `end_date: "2025-09-26T16:00:00.000Z"`
- Display by: extracting time from the datetime fields

## NEVER ASSUME TIME FIELDS EXIST
## ALWAYS CHECK THE ACTUAL DATABASE SCHEMA
## THE USER HAS CORRECTED THIS MISTAKE MULTIPLE TIMES

---

**Last Updated**: January 2025
**Reason**: AI kept making the same mistake despite user corrections
