# Paid opportunities and milestones

## The journey

1. Choose Find paid work, then Post paid work. Sign in with the existing account.
2. Write a public brief: name/business, outcome, acceptance criteria, location,
   deadline, skills and USD budget. Use one payment or split it into two or three
   milestones. Each amount must be positive; amounts must total the budget.
3. A professional with a published pitch applies with a private response.
4. The buyer selects one professional. The selected professional reviews and
   accepts the scope and milestones. Their published Flash address must resolve
   to a USD receiving account; that destination is frozen for the agreement.
5. For a delivery milestone, the professional submits a note and optional HTTPS
   evidence link. The buyer approves it or requests changes. A booking milestone
   becomes payable when the professional accepts the work.
6. The buyer chooses Pay with Lightning. Taste creates an invoice for the agreed
   amount and recipient. The buyer pays from their own wallet. Flash confirms
   PAID; Taste then marks the milestone paid. All paid milestones close the work.

The same account can hire or earn. My work shows hiring, applications and selected
work. One-milestone opportunities cover small bounties without another product area.

## Privacy and roles

The brief, budget, criteria, proposed milestone descriptions and application count
are public. Proposals are visible to the buyer and their author. Private delivery,
feedback, receiving destination and payment references are visible only to the
buyer and selected professional. Other applicants cannot read those records.

Only the buyer can select, approve delivery or create a payment request. Only the
selected professional can accept or deliver. Either participant can check payment.
Client-supplied prices, recipients and manual paid claims never authorize payment.

## Payment and agreement boundaries

Approval and payment are separate states. Taste never sends money, holds a balance
or calls a payout operation. Clients pay Bitcoin over Lightning; professionals
receive USD in Flash. There is no escrow or automatic release on approval.
Work is not guaranteed to be delivered or paid. Participants should agree details
before acceptance. Existing offer checkout remains available without buyer login.

Scope, deadline, amounts and Flash destination are frozen after agreement. This MVP
has no counteroffer, post-agreement cancellation, dispute or refund flow. A buyer
can close an opportunity before acceptance; a selected professional can decline.

Invoice UUIDs are saved with optimistic D1 version checks before Flash creation.
The existing R2 checkout module reserves one creation per UUID. An expired invoice
can be replaced only after checking its provider status. An uncertain creation is
not blindly repeated. PAID never becomes unpaid. Checks cache briefly; refresh or
Check payment updates a milestone after payment.

## Data and limits

D1 opportunities stores the JSON work record, buyer/seller IDs, timestamps and a
version for compare-and-swap updates. New tables/indexes are created idempotently
by lib/work-schema.mjs. The matching migration is drizzle/0001_wise_daredevil.sql.
The initial portfolio and asset migration still applies to a fresh database.

Pilot limits: 50 opportunities per buyer, 20 applications per opportunity, three
milestones, eight skills, USD 0.01 to 10,000 per amount. HTTPS links must not contain
credentials. Authenticated mutations require an exact same-origin request.

## Verification

Automated Worker tests cover the full two-sided flow, scope acceptance, private
views, role rejection, revisions, invoice amount/recipient binding, pending versus
paid, duplicate payments and completion. Auth and Flash responses are simulated.
A funded production milestone test with consenting buyer/professional remains to
be performed. The owner has separately reported a confirmed USD 1.00 offer payment.
