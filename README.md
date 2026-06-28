MCC Digital Data Management System
Proof of Concept — Conceptual Outline Specification
Version: 0.1 (Draft for Committee Review) Prepared by: Data Committee / Peter Thairu Date: March 2026 Status: Conceptual — Pre-Development

 
1. Purpose & Scope
1.1 What This Document Is
This is a conceptual specification for a Proof of Concept (POC) digital data management system for Makindu Children's Center (MCC) and the Makindu Children's Program (MCP). It defines the system's purpose, data model, features, technical architecture, and constraints clearly enough that a volunteer developer can evaluate feasibility and begin building.

This is not a full technical specification. It is an intentionally scoped blueprint for a lean POC designed to validate the approach before committing to a full production system.
1.2 POC Goal
Demonstrate that a simple, secure, cloud-hosted system can:

1.	Store digitized child records structured around the MCC Monitoring Matrix
2.	Allow authorized staff to view and update individual child records
3.	Produce basic aggregate dashboards useful for both MCC program management and MCP grant/donor reporting
4.	Work reliably given the connectivity constraints present in Makindu, Kenya
1.3 What Is In Scope (POC Only)
-	Data model for the 6 monitoring domains
-	Web-based data entry interface for entering records from scanned physical files
-	Individual child record view (MCC operational view)
-	Program-level summary dashboard (MCP reporting view)
-	Basic role-based access (MCC staff vs. MCP staff)
-	Cloud-hosted, secure data storage
-	Pilot cohort: ~20 children selected to represent program diversity
1.4 What Is Out of Scope for POC
-	Mobile field data entry (Phase 3)
-	Offline-first mobile app (Phase 3)
-	Integration with Little Green Light or other external systems (Phase 3)
-	Automated form data extraction from scanned documents (future enhancement)
-	Full 550-child enrollment (Phase 1 production)
-	Real-time data workflows (Phase 3)
-	Historical data migration beyond the pilot cohort (Phase 1 production)

 
2. User Roles & Use Cases
2.1 User Roles
Role	Who	Access Level
MCC Staff	Social workers, Tom, Kenya program staff	Enter/edit child records, view individual records
MCP Staff	Committee members, grant writers	Read-only access to aggregate dashboards and reports
Admin	Committee technical lead	Manage users, system configuration
2.2 Primary Use Cases
UC-1: Enter a child record from scanned file
Actor: MCC Staff Flow:

1.	Staff logs into the web application
2.	Navigates to the child's record (or creates a new record)
3.	Enters data domain by domain (Health → Nutrition → Education → Psychosocial → Capacity → Shelter)
4.	Saves record; system timestamps the entry
5.	Record is now searchable and appears in aggregate counts
UC-2: View an individual child's record
Actor: MCC Staff Flow:

1.	Staff searches for a child by name or ID
2.	Views a summary page showing current status across all 6 domains
3.	Can see history of updates for any field (e.g., when HIV status was last verified)
4.	Can identify which indicators are missing or overdue
UC-3: View program-level dashboard
Actor: MCP Staff Flow:

1.	Staff logs in and navigates to the Dashboard
2.	Sees aggregate metrics across the pilot cohort (e.g., "15/20 children have verified HIV status", "12/20 children enrolled in school")
3.	Can filter by domain, date range, or cohort
4.	Can export a summary report as PDF or CSV
UC-4: Flag a child for follow-up
Actor: MCC Staff Flow:

1.	During a record review, staff notices a data gap or concern (e.g., no malnutrition screening in 12 months)
2.	Marks the child as needing follow-up with a note
3.	Flag is visible on the child's record and on a staff task view

 
3. Data Model
The data model is organized around the MCC Monitoring Matrix with a Child record as the central entity.
3.1 Core Entities
Child

  ├── Demographics

  ├── Enrollment

  ├── Domain: Health

  ├── Domain: Nutrition

  ├── Domain: Education

  ├── Domain: Psychosocial & Protection

  ├── Domain: Capacity Development

  ├── Domain: Safety & Shelter

  └── Flags / Follow-up Notes
3.2 Child — Demographics
Field	Type	Notes
child_id	UUID	System-generated, primary key
first_name	String	
last_name	String	
date_of_birth	Date	
gender	Enum	Male / Female / Other
village	String	
guardian_name	String	Primary caregiver
guardian_relationship	Enum	Parent / Grandparent / Sibling / Other
household_id	UUID	Links to household record
photo	File reference	Optional — scanned ID photo
3.3 Enrollment
Field	Type	Notes
enrollment_date	Date	
enrollment_status	Enum	Active / Graduated / Transferred / Deceased
mcc_id	String	MCC's existing identifier if applicable
program_year	Integer	Year enrolled
3.4 Domain 1: Health
Field	Type	Notes
hiv_status	Enum	Positive / Negative / Unknown / Not Tested
hiv_test_date	Date	
hiv_test_location	String	
accessing_ccc	Boolean	Comprehensive Care Clinic (if HIV+)
art_start_date	Date	Antiretroviral therapy start (if HIV+)
last_ccc_visit_date	Date	
viral_load_suppressed	Boolean	
viral_load_test_date	Date	
fully_immunized	Boolean	Age-appropriate
last_immunization_date	Date	
last_deworming_date	Date	
sanitation_counseled	Boolean	
itn_in_use	Boolean	Insecticide-treated net
health_notes	Text	Free text for clinician notes
3.5 Domain 2: Nutrition
Field	Type	Notes
meals_per_day	Integer	At MCC + home combined
last_malnutrition_screen_date	Date	
malnutrition_status	Enum	Normal / Moderate / Severe / Not Screened
referred_for_treatment	Boolean	If severely malnourished
supplemental_food	Boolean	Receiving food to take home
multivitamins	Boolean	Currently receiving
nutrition_notes	Text	
3.6 Domain 3: Education
Field	Type	Notes
school_name	String	
current_grade	String	
enrolled_in_school	Boolean	
attendance_rate	Decimal	0–100% (most recent term)
uniform_provided_date	Date	
shoes_provided_date	Date	
supplies_provided_date	Date	
education_notes	Text	
3.7 Domain 4: Psychosocial & Protection
Field	Type	Notes
pss_attendance_dates	Date[]	Psychosocial support session attendance
guardian_mtg_attendance_dates	Date[]	Guardian meeting attendance
abuse_concern_flag	Boolean	Current concern on record
abuse_report_filed	Boolean	Report filed with CPS/police
birth_certificate_status	Enum	Has / Pending / None
national_id_status	Enum	Has / Pending / Not Applicable
psychosocial_notes	Text	
3.8 Domain 5: Capacity Development
Field	Type	Notes
guardian_trainings	Object[]	{date, topic, attendee_name}
goats_received	Integer	Total goats received by household
chickens_received	Integer	Total chickens received
current_goats	Integer	Current livestock count
current_chickens	Integer	Current livestock count
income_sources	String[]	List of household income sources
capacity_notes	Text	
3.9 Domain 6: Safety & Shelter
Field	Type	Notes
house_type	Enum	Permanent / Semi-permanent / Temporary
house_built_date	Date	If MCC-assisted
house_build_cost	Decimal	If MCC-assisted
repairs_needed	Boolean	
repair_history	Object[]	{date, description, cost}
solar_lanterns	Integer	Number in household
solar_lantern_date	Date	Date last provided
shelter_notes	Text	
3.10 Flags & Follow-up
Field	Type	Notes
flag_active	Boolean	
flag_reason	Text	
flag_date	Date	
flag_created_by	User reference	
flag_resolved_date	Date	

 
4. Key Screens / UI Concepts
4.1 Child Search & List View
-	Search bar (name or MCC ID)
-	Filterable list: by village, enrollment status, domain completeness
-	At-a-glance indicators: color-coded completion per domain (green = complete, yellow = partial, red = missing/overdue)
4.2 Child Detail Record
-	Header: photo, name, age, enrollment status, guardian
-	Tabbed view by domain (Health | Nutrition | Education | Psychosocial | Capacity | Shelter)
-	Last updated timestamp per domain
-	Edit button per domain (MCC staff only)
-	Flag button with note entry
-	History/audit trail per field (who changed what and when)
4.3 Data Entry Form
-	One form per domain
-	Simple field types: yes/no toggles, date pickers, dropdowns, short text
-	Auto-save as draft; explicit "Submit" to finalize
-	Designed to be completable in under 10 minutes per child per domain
-	Required vs. optional field distinction visible
4.4 MCC Dashboard (Program Operations)
-	Enrolled children count, active vs. graduated
-	Domain-by-domain completion rates across the pilot cohort
-	"Needs attention" list — children with flags or overdue data
-	Quick filter by domain or village
4.5 MCP Dashboard (Reporting View)
-	Program summary statistics (% HIV status known, % in school, % malnutrition-free, etc.)
-	Period comparison (current quarter vs. prior quarter — once enough data)
-	Exportable summary report (PDF / CSV)
-	Designed for non-technical users

 
5. Technical Architecture
5.1 Architecture Principles
1.	Cloud-first — Hosted in the cloud, accessible from any browser; no local server to maintain
2.	Low-bandwidth tolerant — Designed to function on slow/intermittent connections; minimal page weights, no video/heavy media
3.	Security by design — Sensitive child health data requires encryption at rest and in transit, role-based access control, and audit logging
4.	Minimal operational burden — System must be maintainable by volunteers; avoid complex infrastructure
5.	Exportable data — Data should never be locked in; all records exportable as standard formats (CSV, JSON)
5.2 Recommended Stack
Layer	Technology	Rationale
Cloud provider	AWS (Nonprofit credits)	Free tier + nonprofit program; strong security; S3 + RDS well-understood
Database	PostgreSQL (AWS RDS)	Relational; handles the matrix structure well; free tier available
Backend API	Node.js + Express OR Python + FastAPI	Simple REST API; volunteer-friendly; deployable on AWS Lambda or EC2
Frontend	React (or plain HTML/CSS/JS for simplest POC)	Widely known; accessible; works well on slow connections
Authentication	AWS Cognito or Auth0	Managed auth; handles role-based access without building from scratch
File storage	AWS S3	Scanned document storage; low cost; access-controlled
Hosting	AWS Amplify or Heroku	Simple deployment; free tiers available

Alternative (lowest friction for POC): Airtable or Notion database with a custom frontend — significantly faster to stand up but less portable and less secure for sensitive data. Not recommended for production; acceptable as a throwaway POC if developer resources are very limited.
5.3 Security Requirements
Requirement	Implementation
Encryption in transit	HTTPS / TLS everywhere (mandatory)
Encryption at rest	AWS RDS encryption enabled
Authentication	Email/password with MFA option; no anonymous access
Authorization	Role-based: MCC Staff / MCP Staff / Admin
Audit logging	All record changes logged: user, timestamp, field changed
Data access	MCC staff see individual records; MCP staff see only aggregates
PII handling	Child names and HIV status treated as most sensitive; limit export options
Data residency	Cloud region selection should consider Kenya Data Protection Act 2019 compliance
5.4 Connectivity Considerations
Because MCC staff in Kenya operate in an environment with unreliable internet:

-	All pages should load in under 5 seconds on a 3G connection
-	Forms should auto-save drafts locally (browser localStorage) to prevent data loss if connection drops mid-entry
-	Offline-first architecture (service workers, IndexedDB sync) is a Phase 3 consideration; POC can require active connection but should degrade gracefully
-	Scanned documents can be uploaded asynchronously — a queued upload that completes when connection allows

 
6. POC Implementation Plan
6.1 Pilot Cohort Selection
-	~20 children from the enrolled population
-	Criteria: Represent diversity of ages, HIV status, village, guardian type
-	Selection by: Winnie / Tom during next Kenya visit or from existing scanned files
6.2 Development Phases
Sprint 0 — Setup (Week 1–2)
-	Cloud infrastructure provisioned (AWS account, database, auth)
-	Repository created; developer environment documented
-	Data model implemented as database schema
-	Basic user authentication working
Sprint 1 — Data Entry (Week 3–5)
-	Child record creation form (demographics + enrollment)
-	Domain data entry forms (all 6 domains)
-	Individual child record view
-	Basic navigation and search
Sprint 2 — Dashboards (Week 6–8)
-	MCC program operations dashboard
-	MCP reporting summary view
-	Flag/follow-up workflow
-	Data export (CSV)
Sprint 3 — Pilot Load & Validation (Week 9–10)
-	Enter all 20 pilot children from scanned files
-	Committee review and feedback
-	Bug fixes and usability improvements
-	Document lessons learned for Phase 1 production spec
6.3 Success Criteria for POC
The POC is considered successful if, at the end of Sprint 3:

	20 pilot children have complete records entered in the system
	An MCC staff member can find a child's record and identify missing data in under 2 minutes
	An MCP staff member can view a program summary dashboard and export it in under 5 minutes
	All HIV-status data is correctly access-controlled (not visible in MCP aggregate views)
	The system loads acceptably on a simulated 3G connection
	The committee agrees the approach is worth expanding to full 550-child enrollment

 
7. Open Questions for the Committee
The following questions need resolution before development begins:

1.	Cloud provider: AWS preferred? Or does someone on the board have an existing relationship or recommendation?

2.	Developer resourcing: Who will build the POC? Options include: volunteer from the committee's network, a pro-bono tech partner, or a student/intern project.

3.	Data entry responsibility: Who will enter the 20 pilot records? Committee member volunteer + scanned files, or MCC staff in Kenya?

4.	Kenya Data Protection Act compliance: Do we need legal review before storing child health data in a cloud system? This affects our choice of cloud region and data governance policies.

5.	Airtable shortcut: Should we accept a less-robust but faster-to-build Airtable POC as a throwaway prototype, with the understanding that production will use a proper tech stack? This could compress the POC timeline to 2–3 weeks.

6.	MCC staff buy-in: Has Tom been briefed on the POC plan? His input on field usability requirements is essential before finalizing the UI design.

 
8. Glossary
Term	Definition
MCC	Makindu Children's Center — the on-the-ground operations in Makindu, Kenya
MCP	Makindu Children's Program — the US-based nonprofit supporting MCC
OVC	Orphans and Vulnerable Children — the population served by MCC
PSS	Psychosocial Support — group sessions for children and guardians
CCC	Comprehensive Care Clinic — HIV care facility
ART	Antiretroviral Therapy — HIV medication
ITN	Insecticide-Treated Net — malaria prevention
Monitoring Matrix	The MCC-defined framework of 6 domains and associated indicators
Data Committee	The MCP volunteer committee leading this initiative
POC	Proof of Concept — the pilot system described in this document
LGL	Little Green Light — MCP's existing donor CRM
