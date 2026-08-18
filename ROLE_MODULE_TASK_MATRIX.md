# Comprehensive Role-Module-Task-Subtask Matrix

> **System**: Velvet Venue Platform  
> **Document Purpose**: Complete Functional Breakdown of System Roles, Modules, Core Tasks, and Granular Sub-Tasks.

---

## Executive Summary & Structure Overview

This document defines the Role-Based Task Architecture for the **Velvet Venue** management platform. The hierarchy is organized as follows:
$$\text{Role} \longrightarrow \text{Module} \longrightarrow \text{Task} \longrightarrow \text{Granular Sub-Tasks}$$

### Primary Roles Covered:
1. **Admin (System Administrator)**
2. **Vendor / Venue Owner**
3. **Customer (End User / Client)**
4. **Staff / Operations Manager**

---

# 1. Role: Admin (System Administrator)

The Admin role possesses platform-wide governance permissions across all users, venues, bookings, financial transactions, and system settings.

```
Admin
 ├── 1. Customer Management
 ├── 2. Venue Owner (Vendor) Management
 ├── 3. Venue Catalog & Approval Management
 ├── 4. Booking Oversight & Operations
 ├── 5. Invoicing, Payments & Refunds
 ├── 6. Master Data (Categories, Amenities, Locations)
 ├── 7. Review & Content Moderation
 └── 8. Security & RBAC (Role-Based Access Control)
```

---

## 1.1 Module: Customer Management

### Task 1.1.1: Customer CRUD Operations
- **Sub-task 1.1.1.1: Create Customer Profile**
  - Manually register customer details (First Name, Last Name, Email, Phone, Preferred Currency).
  - Assign default system tags (e.g., VIP, Corporate, Individual).
  - Trigger automated welcome email with account activation link.
- **Sub-task 1.1.1.2: Read / View Customer Details**
  - Search customer directory by Name, Email, Phone Number, or Account ID.
  - Filter list by Account Status (Active, Blocked, Pending Verification), Date Created, and Total Spend.
  - View detailed profile card including booking history, active quotes, total lifetime value (LTV), and IP logs.
- **Sub-task 1.1.1.3: Update Customer Profile**
  - Modify contact info, address details, and marketing communication preferences.
  - Update account status and assign custom internal admin notes.
  - Re-send email verification link if requested.
- **Sub-task 1.1.1.4: Delete / Soft-Delete Customer**
  - Perform soft delete (mark account as archived, retain transactional audit records).
  - Execute permanent GDPR/CCPA data purge (anonymize PII upon explicit request).

### Task 1.1.2: Customer Import & Export
- **Sub-task 1.1.2.1: Bulk Import Customers**
  - Download standard CSV / XLSX import schema template.
  - Upload batch customer file.
  - Validate field syntax, duplicate email checks, and mandatory field integrity before database write.
  - Preview record parsing with error highlighting for invalid rows.
  - Execute import job and generate summary report (Success count vs Error log download).
- **Sub-task 1.1.2.2: Export Customer Data**
  - Select export format (`CSV`, `XLSX`, `JSON`).
  - Apply filter criteria (Registration Date Range, Booking Count > N, City/Region).
  - Choose columns to export (Select specific fields or full data dump).
  - Apply PII masking option for security/compliance compliance.
  - Trigger asynchronous background generation for datasets larger than 10,000 records.

### Task 1.1.3: Customer Account Control & Blocking
- **Sub-task 1.1.3.1: Block / Suspend Account**
  - Flag customer account as `BLOCKED` or `SUSPENDED`.
  - Input mandatory suspension reason code and internal description.
  - Revoke all active JSON Web Tokens (JWT) and force session termination across all devices.
  - Auto-cancel or place on hold any unconfirmed pending booking requests.
- **Sub-task 1.1.3.2: Unblock / Reinstate Account**
  - Change customer account status back to `ACTIVE`.
  - Log administrator unlock action with timestamp and audit note.
  - Send account restoration notification email to customer.
- **Sub-task 1.1.3.3: Credential & Security Overrides**
  - Trigger mandatory admin-initiated password reset link.
  - Force multi-factor authentication (MFA) reset.

---

## 1.2 Module: Venue Owner (Vendor) Management

### Task 1.2.1: Vendor Onboarding & Verification Workflow
- **Sub-task 1.2.1.1: Review Vendor Application**
  - View newly registered venue owner application queue.
  - Inspect legal business details, government ID / Tax ID documentation, and business address.
- **Sub-task 1.2.1.2: Approve Vendor Application**
  - Change status from `PENDING_VERIFICATION` to `APPROVED`.
  - Provision vendor portal dashboard access.
  - Assign default payout commission tier (e.g., 10% platform fee).
- **Sub-task 1.2.1.3: Reject Vendor Application**
  - Change status to `REJECTED`.
  - Provide structured rejection reason (e.g., Invalid Tax ID, Incomplete Documentation).
  - Send email notification allowing vendor to re-submit corrected details.

### Task 1.2.2: Vendor CRUD & Maintenance
- **Sub-task 1.2.2.1: Create Vendor Profile**
  - Manually onboard corporate vendor account with primary contact and billing details.
- **Sub-task 1.2.2.2: Read / View Vendor Directory**
  - Filter vendors by Verification Status, Linked Venue Count, Revenue Generated, and Rating.
  - View full dashboard of vendor performance metrics and linked properties.
- **Sub-task 1.2.2.3: Update Vendor Profile & Commission**
  - Edit legal entity details, commission percentage, payout schedules (Weekly, Bi-weekly, Monthly).
- **Sub-task 1.2.2.4: Deactivate / Delete Vendor**
  - Deactivate vendor account and automatically unpublish all linked venue listings.

### Task 1.2.3: Vendor Import & Export
- **Sub-task 1.2.3.1: Bulk Import Vendors**
  - Upload vendor dataset via CSV with automated error validation.
- **Sub-task 1.2.3.2: Export Vendor Financial & Performance Reports**
  - Export CSV of vendor earnings, commission collected, and payout history.

### Task 1.2.4: Vendor Account Control & Blocking
- **Sub-task 1.2.4.1: Block / Suspend Vendor Account**
  - Suspend vendor access due to policy violation or payout dispute.
  - Unpublish vendor properties from public search index immediately.
- **Sub-task 1.2.4.2: Hold Vendor Payouts**
  - Freeze financial payout disbursements pending dispute resolution.

---

## 1.3 Module: Venue Catalog & Approval Management

### Task 1.3.1: Venue Listing Review & Approval
- **Sub-task 1.3.1.1: Audit Pending Venue Submission**
  - Inspect property details (Title, Description, Capacity, Floor Area, Pricing, Photos, Safety Compliance).
- **Sub-task 1.3.1.2: Approve Venue Listing**
  - Change listing status to `PUBLISHED`.
  - Index venue in public search engine and location maps.
- **Sub-task 1.3.1.3: Reject / Request Changes for Venue**
  - Send feedback comments to vendor highlighting items needing correction (e.g., low resolution photos, unclear pricing).

### Task 1.3.2: Venue CRUD Operations
- **Sub-task 1.3.2.1: Create Venue**
  - Admin-assisted listing creation with full attribute assignments.
- **Sub-task 1.3.2.2: View Venue Records**
  - View full listing inventory with status toggles, rating, pricing range, and location filters.
- **Sub-task 1.3.2.3: Update Venue Specifications**
  - Edit pricing rules, amenities, blackout dates, and media uploads.
- **Sub-task 1.3.2.4: Delete / Archive Venue Listing**
  - Remove listing from platform while maintaining historical booking associations.

### Task 1.3.3: Featured & Block Listing Controls
- **Sub-task 1.3.3.1: Feature Venue on Homepage**
  - Toggle "Featured Venue" flag, set promotion start and end dates.
- **Sub-task 1.3.3.2: Block / Delist Venue**
  - Delist venue due to safety non-compliance, owner suspension, or active legal investigation.

### Task 1.3.4: Venue Import & Export
- **Sub-task 1.3.4.1: Bulk Import Venues**
  - Import multi-property catalogs via batch spreadsheet upload.
- **Sub-task 1.3.4.2: Export Venue Data**
  - Export complete venue metadata, location coordinates, and booking metrics.

---

## 1.4 Module: Booking Oversight & Operations

### Task 1.4.1: Booking Management & CRUD
- **Sub-task 1.4.1.1: Create Admin Override Booking**
  - Reserve venue slot directly for offline or custom client contracts.
- **Sub-task 1.4.1.2: View All Platform Bookings**
  - Comprehensive view of all bookings filtered by Status (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`), Venue, Date, and Payment Status.
- **Sub-task 1.4.1.3: Update Booking Details**
  - Modify event date/time slot, guest headcount, or special requests.
- **Sub-task 1.4.1.4: Cancel Booking**
  - Administrative cancellation with configurable cancellation fee and refund calculation.

### Task 1.4.2: Booking Export & Analytics
- **Sub-task 1.4.2.1: Export Bookings Register**
  - Export detailed CSV/Excel reports for accounting and logistics planning.

---

## 1.5 Module: Invoicing, Payments & Refunds

### Task 1.5.1: Invoice Management
- **Sub-task 1.5.1.1: View & Generate Invoices**
  - View all tax invoices generated across platform transactions.
  - Re-generate PDF invoice document with updated billing details.
- **Sub-task 1.5.1.2: Export Invoices**
  - Bulk export PDF invoice zip package or export financial summary CSV.

### Task 1.5.2: Payments & Refund Processing
- **Sub-task 1.5.2.1: View Payment Transactions**
  - Monitor payment gateway logs, authorization tokens, transaction fees, and status.
- **Sub-task 1.5.2.2: Process Refund (Full / Partial)**
  - Issue refund to original payment method or platform credit.
  - Record refund audit trail and update booking financial state.

---

## 1.6 Module: Master Data Management

### Task 1.6.1: Categories, Amenities & Cities CRUD
- **Sub-task 1.6.1.1: Category Management** (Create, Read, Edit, Delete, Re-order venue categories).
- **Sub-task 1.6.1.2: Amenity Management** (Create, Edit, Delete amenities, Assign icon assets).
- **Sub-task 1.6.1.3: City / Location Management** (Create, Edit, Delete serviceable cities and geofence coordinates).

---

## 1.7 Module: Security & RBAC (Role-Based Access Control)

### Task 1.7.1: Roles & Permissions Administration
- **Sub-task 1.7.1.1: Create & Edit Custom Roles** (Define sub-roles like `FINANCE_ADMIN`, `SUPPORT_AGENT`).
- **Sub-task 1.7.1.2: Permission Matrix Assignment** (Check/uncheck granular module-level permissions).
- **Sub-task 1.7.1.3: System Audit Logging** (Inspect administrative action trace logs and login history).

---

# 2. Role: Vendor / Venue Owner

The Vendor role enables business owners to showcase properties, manage schedules, respond to customer requests, track revenue, and maintain payout settings.

```
Vendor / Venue Owner
 ├── 1. Business Profile & Verification
 ├── 2. Venue Listings & Availability Management
 ├── 3. Booking Request & Schedule Management
 ├── 4. Customer Communication & Guest Control
 ├── 5. Invoicing & Financial Payouts
 └── 6. Ratings & Review Management
```

---

## 2.1 Module: Business Profile & Verification

### Task 2.1.1: Profile Setup & Compliance
- **Sub-task 2.1.1.1: Create / Edit Business Details**
  - Register company trading name, registration number, primary contact details, logo, and story.
- **Sub-task 2.1.1.2: Submit Verification Documents**
  - Upload business registration license, utility bills, and bank account proof for KYC.
- **Sub-task 2.1.1.3: Configure Payout Bank Account**
  - Input IBAN / Account Number, SWIFT / Routing details for automated payout disbursement.

---

## 2.2 Module: Venue Listings & Availability Management

### Task 2.2.1: My Venues CRUD
- **Sub-task 2.2.1.1: Create Venue Listing**
  - Multi-step creation wizard: Property Specs, Address/Map Pin, Capacity, Event Types allowed, Amenities, High-res Photo Gallery, Pricing Rules.
- **Sub-task 2.2.1.2: Read / View My Listings**
  - View list of owned venues with status (`DRAFT`, `PENDING_APPROVAL`, `PUBLISHED`, `UNPUBLISHED`).
- **Sub-task 2.2.1.3: Update Venue Listing**
  - Edit images, modify pricing tiers (Hourly, Daily, Event-based), add seasonal surcharges.
- **Sub-task 2.2.1.4: Delete / Unpublish Listing**
  - Temporarily pause listing visibility or request listing deletion.

### Task 2.2.2: Availability Calendar & Slot Blocking
- **Sub-task 2.2.2.1: Manage Slot Availability**
  - Define standard operating hours per day of the week.
  - Set custom slot intervals and buffer times between events for cleaning/setup.
- **Sub-task 2.2.2.2: Block Dates / Custom Blackouts**
  - Mark specific dates as unavailable for private maintenance, personal use, or offline bookings.
- **Sub-task 2.2.2.3: iCal Calendar Sync**
  - Import external iCal feeds (Google Calendar, Outlook) and export venue iCal feed to prevent double bookings.

---

## 2.3 Module: Booking Request & Schedule Management

### Task 2.3.1: Booking Operations
- **Sub-task 2.3.1.1: View Incoming Booking Enquiries**
  - Filter incoming requests by Date, Status, and Guest Count.
- **Sub-task 2.3.1.2: Approve / Accept Booking**
  - Accept customer request and auto-trigger payment authorization link.
- **Sub-task 2.3.1.3: Decline / Reject Booking**
  - Reject request with an optional polite note or alternative date suggestion.
- **Sub-task 2.3.1.4: Mark Booking Status (Completed / No-Show)**
  - Update booking status post-event to unlock payout disbursement.

### Task 2.3.2: Export Calendar & Guest List
- **Sub-task 2.3.2.1: Export Guest Register**
  - Export CSV of upcoming event attendees for security control at venue gates.

---

## 2.4 Module: Customer Communication & Guest Control

### Task 2.4.1: Guest Management
- **Sub-task 2.4.1.1: View Customer Booking History**
  - Inspect previous event history and notes for the booking customer.
- **Sub-task 2.4.1.2: Block / Restrict Customer**
  - Block troublesome customers from placing future booking requests at owner's venues.

---

## 2.5 Module: Invoicing & Financial Payouts

### Task 2.5.1: Financial Management
- **Sub-task 2.5.1.1: View Invoices & Receipts**
  - Access customer payment invoices and platform fee deduction breakdown.
- **Sub-task 2.5.1.2: Track Payouts & Earnings**
  - View ledger of settled payouts, pending balances, and downloadable monthly financial statements.

---

# 3. Role: Customer (End User / Client)

The Customer role provides self-service features for discovering venues, checking availability, placing reservations, making secure payments, managing wishlists, and leaving reviews.

```
Customer
 ├── 1. Account & Profile Security
 ├── 2. Venue Discovery & Search
 ├── 3. Reservations & Booking Lifecycle
 ├── 4. Wishlist & Saved Venues
 ├── 5. Payments, Receipts & Invoices
 └── 6. Reviews & Ratings
```

---

## 3.1 Module: Account & Profile Security

### Task 3.1.1: Customer Self-Service CRUD
- **Sub-task 3.1.1.1: Register / Create Account**
  - Sign up via Email/Password or Social Single Sign-On (Google/Apple).
- **Sub-task 3.1.1.2: View & Update Profile**
  - Edit personal details, profile picture, contact phone number, emergency contacts.
- **Sub-task 3.1.1.3: Manage Security Settings**
  - Update password, enable Two-Factor Authentication (2FA), view active login sessions.
- **Sub-task 3.1.1.4: Delete Account**
  - Request self-service account closure and data deletion.

---

## 3.2 Module: Venue Discovery & Search

### Task 3.2.1: Search & Filter Venues
- **Sub-task 3.2.1.1: Search Venues**
  - Search by location city, keyword, event date, guest capacity, and budget range.
- **Sub-task 3.2.1.2: Filter & Sort Results**
  - Filter by specific amenities (e.g., Swimming Pool, Parking, DJ Booth, Catering), Rating, Price low-to-high.
- **Sub-task 3.2.1.3: View Venue Detail Page**
  - Interactive photo viewer, virtual tour video, map view, transparent price breakdown, owner bio.

---

## 3.3 Module: Reservations & Booking Lifecycle

### Task 3.3.1: Place & Manage Bookings
- **Sub-task 3.3.1.1: Create Booking Request**
  - Select event dates/time slot, guest headcount, optional add-on packages, add special requests notes.
- **Sub-task 3.3.1.2: View My Bookings**
  - View list of upcoming, past, and cancelled reservations.
- **Sub-task 3.3.1.3: Cancel Booking**
  - Self-service booking cancellation with real-time refund policy breakdown viewer.
- **Sub-task 3.3.1.4: Reschedule Request**
  - Submit request to change booking date/time slot.

---

## 3.4 Module: Wishlist & Saved Venues

### Task 3.4.1: Wishlist Operations
- **Sub-task 3.4.1.1: Add / Remove Favorite Venue**
  - Bookmark favorite venues to custom named lists (e.g., "Wedding 2027", "Corporate Retreat").
- **Sub-task 3.4.1.2: Export / Share Wishlist**
  - Generate shareable public link or export PDF of selected venues for collaborators.

---

## 3.5 Module: Payments, Receipts & Invoices

### Task 3.5.1: Payment & Billing
- **Sub-task 3.5.1.1: Complete Payment**
  - Pay via Credit/Debit Card, Stripe, PayPal, or net banking with coupon discount code application.
- **Sub-task 3.5.1.2: View & Download Invoices**
  - Access and download PDF tax receipts for tax filing or corporate reimbursement.

---

## 3.6 Module: Reviews & Ratings

### Task 3.6.1: Feedback Management
- **Sub-task 3.6.1.1: Create Review**
  - Rate venue on overall experience, cleanliness, communication, value. Upload post-event photos.
- **Sub-task 3.6.1.2: Edit / Delete Review**
  - Modify rating or text within 14 days of posting.

---

# 4. Role: Staff / Operations Manager

The Staff role represents operational team members who coordinate day-of event logistics, guest check-ins, and on-site support.

```
Staff / Operations Manager
 ├── 1. Daily Operations & Event Calendar
 ├── 2. Guest Check-In & Entry Verification
 └── 3. Incident Reporting & Dispute Escalation
```

---

## 4.1 Module: Daily Operations & Event Calendar

### Task 4.1.1: Schedule Monitoring
- **Sub-task 4.1.1.1: View Daily Operations Board**
  - Interactive schedule board showing active, upcoming, and ending events for assigned venues.
- **Sub-task 4.1.1.2: View Setup Requirements**
  - Inspect add-on requirements, seating arrangement notes, and equipment requests.

---

## 4.2 Module: Guest Check-In & Entry Verification

### Task 4.2.1: Attendance Management
- **Sub-task 4.2.1.1: Scan Entry QR Pass**
  - Scan customer booking QR code at venue entryway to confirm valid reservation.
- **Sub-task 4.2.1.2: Manual Guest Check-In**
  - Verify customer photo ID against guest manifest and log entry timestamp.

---

## 4.3 Module: Incident Reporting & Dispute Escalation

### Task 4.3.1: Incident Logging
- **Sub-task 4.3.1.1: Create Incident Report**
  - Log property damage, noise complaint, overtime violation, or safety issue with photo evidence.
- **Sub-task 4.3.1.2: Escalate to Admin / Owner**
  - Flag incident for admin dispute resolution and security deposit processing.

---

# 5. Role-Permission Summary Matrix

Below is a master matrix summarizing action permissions across roles:

| Module | Core Task | Sub-Task | Admin | Vendor | Customer | Staff |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Customer** | CRUD | Create Profile | ✅ | ❌ | ✅ | ❌ |
| **Customer** | CRUD | View Profile | ✅ | ⚠️ (Guests) | ✅ (Own) | ❌ |
| **Customer** | Import/Export | Import CSV | ✅ | ❌ | ❌ | ❌ |
| **Customer** | Import/Export | Export Data | ✅ | ❌ | ❌ | ❌ |
| **Customer** | Control | Block / Suspend Account | ✅ | ❌ | ❌ | ❌ |
| **Vendor** | Onboarding | Approve / Reject KYC | ✅ | ❌ | ❌ | ❌ |
| **Venue Catalog**| CRUD | Create Listing | ✅ | ✅ | ❌ | ❌ |
| **Venue Catalog**| Approval | Publish Listing | ✅ | ❌ | ❌ | ❌ |
| **Venue Catalog**| Import/Export | Bulk Catalog Import | ✅ | ⚠️ (Own) | ❌ | ❌ |
| **Venue Catalog**| Control | Feature / Delist Venue | ✅ | ❌ | ❌ | ❌ |
| **Bookings** | Operations | Accept / Decline Request | ✅ | ✅ | ❌ | ❌ |
| **Bookings** | Operations | Cancel Booking | ✅ | ✅ | ✅ (Own) | ❌ |
| **Bookings** | Check-In | Scan QR Pass | ✅ | ✅ | ❌ | ✅ |
| **Payments** | Invoicing | View / Download Invoice | ✅ | ✅ | ✅ | ❌ |
| **Payments** | Refunds | Process Refund | ✅ | ❌ | ❌ | ❌ |
| **Security** | RBAC | Role & Permission Setup | ✅ | ❌ | ❌ | ❌ |

*(Legend: ✅ Full Access | ⚠️ Restricted/Scoped Access | ❌ No Access)*
