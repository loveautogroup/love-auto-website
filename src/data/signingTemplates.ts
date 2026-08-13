/**
 * IL-specific document templates for e-signature sessions.
 *
 * Each template gives Jeremiah a pre-filled title + body so creating a
 * signing session takes seconds instead of minutes. The body text is
 * what the customer actually reads on-screen before signing.
 *
 * Diane's notes:
 *   - These are general starting points. For every specific deal
 *     involving specific figures (sale price, trade value, total
 *     finance charge, APR, etc.), edit the body to include those
 *     numbers before sending the session.
 *   - Pure electronic signing does NOT substitute for required
 *     paper filings like IL ST-556 (must be filed with IL Secretary
 *     of State) or federal Odometer Disclosure (49 CFR 580, which as
 *     of 2023 allows e-sig if the dealer is registered with the state
 *     as an authorized e-sig dealer — Illinois has approved this).
 *   - Any dollar figures in [brackets] are placeholders — REPLACE
 *     before sending.
 *   - One template ("porter-authorization") is NOT a customer document.
 *     It is issued by the dealership and signed by the porter, so the
 *     session's "customer" fields hold the porter's name and phone. It
 *     grants authority to move a vehicle and nothing else — do not use
 *     it to stand in for a Power of Attorney.
 */

export type DocumentKind =
  | "buyers-order"
  | "odometer-disclosure"
  | "title-application"
  | "power-of-attorney"
  | "as-is-disclosure"
  | "arbitration-agreement"
  | "porter-authorization"
  | "other";

export interface DocumentTemplate {
  kind: DocumentKind;
  title: string;
  body: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    kind: "buyers-order",
    title: "Buyer's Order — Vehicle Purchase Agreement",
    body: `BUYER'S ORDER

Seller: Love Auto Group Inc., 735 N Yale Ave, Unit A, Villa Park, IL 60181
Dealer License: [IL Dealer #]
Phone: (630) 359-3643

Buyer: [Buyer Name]
Address: [Buyer Address]

Vehicle:
  [Year Make Model Trim]
  VIN: [VIN]
  Mileage at sale: [Mileage]
  Exterior color: [Color]

Purchase Summary:
  Vehicle sale price:          $[Sale Price]
  Trade-in allowance (if any):  $[Trade Value]
  Documentary fee:              $[Doc Fee]
  Title and registration fees:  $[Title/Reg]
  Illinois sales tax:           $[Tax]
  Total due from buyer:         $[Total]

Payment:
  Cash down payment:            $[Down]
  Amount financed:              $[Financed]
  Payoff on trade (if any):     $[Trade Payoff]

By signing below, Buyer agrees to purchase the above-described vehicle
under the terms shown. Buyer acknowledges they have inspected the
vehicle, reviewed a free Carfax vehicle history report, and accept the
vehicle subject to the condition disclosures set forth in the As-Is
Disclosure signed separately. This purchase is final upon the Buyer
taking delivery of the vehicle and all funds clearing.`,
  },

  {
    kind: "odometer-disclosure",
    title: "Federal Odometer Disclosure Statement",
    body: `FEDERAL ODOMETER DISCLOSURE STATEMENT
(required by federal law — 49 CFR Part 580)

Seller: Love Auto Group Inc.
Buyer: [Buyer Name]

Vehicle:
  [Year Make Model]
  VIN: [VIN]

Odometer reading at time of sale: [Mileage] miles

Check ONE of the following (Buyer initials; default is 1 unless otherwise
indicated by Seller at signing):

  [X] 1. The reading reflects ACTUAL MILEAGE of the vehicle.
  [ ] 2. The reading is in EXCESS of its mechanical limits.
  [ ] 3. The reading is NOT the actual mileage. WARNING — ODOMETER
         DISCREPANCY.

Federal law (and IL state law) requires that you state the mileage
upon transfer of ownership. Failure to complete or providing a false
statement may result in fines and/or imprisonment.

By signing below, I certify to the best of my knowledge that the
odometer reading is as stated above and reflects the ACTUAL MILEAGE of
the vehicle described, unless the box "NOT actual mileage" is checked
above.`,
  },

  {
    kind: "title-application",
    title: "Application for Illinois Vehicle Title & Registration (ST-556)",
    body: `APPLICATION FOR ILLINOIS CERTIFICATE OF TITLE
(Form ST-556 — filed with IL Secretary of State)

Applicant (buyer): [Buyer Name]
Mailing address: [Buyer Address]

Vehicle:
  [Year Make Model]
  VIN: [VIN]
  Odometer: [Mileage] miles

Selling dealer: Love Auto Group Inc.
Dealer address: 735 N Yale Ave, Unit A, Villa Park, IL 60181

By signing below, I (Buyer) authorize Love Auto Group to submit this
application for title and registration to the Illinois Secretary of
State on my behalf, and I certify that the information provided is
true and correct to the best of my knowledge. I understand that the
dealer will file the required Form ST-556 (Sales Tax Transaction
Return) and remit Illinois sales and use tax on my behalf, and that
title and registration will be mailed to the address above once the
Secretary of State has processed the filing (typically 4-6 weeks).`,
  },

  {
    kind: "power-of-attorney",
    title: "Limited Power of Attorney — Title & Registration",
    body: `LIMITED POWER OF ATTORNEY
(for the sole purpose of transferring title and registration)

Principal (buyer): [Buyer Name]
Agent: Love Auto Group Inc., 735 N Yale Ave, Unit A, Villa Park, IL 60181

Vehicle:
  [Year Make Model]
  VIN: [VIN]

I, the Principal named above, do hereby appoint Love Auto Group Inc. as
my lawful Agent, with full power and authority to do the following on my
behalf, and for the sole purpose of transferring title and registration
of the above-described vehicle:

  1. Sign, file, and submit any and all documents required by the
     Illinois Secretary of State, including but not limited to
     Form ST-556, odometer disclosure, application for title, and any
     lienholder filings.
  2. Receive, endorse, and deposit any refund checks issued by the
     Illinois Department of Revenue in connection with this transaction.
  3. Correct any errors or omissions in prior filings related to this
     vehicle.

This Power of Attorney is LIMITED to the transactions above and
automatically terminates upon successful issuance of a certificate of
title in my name or 180 days from the date of signing, whichever is
earlier. I may revoke this Power of Attorney at any time by written
notice delivered to Love Auto Group.`,
  },

  {
    kind: "as-is-disclosure",
    title: "As-Is Sale Disclosure (no warranty)",
    body: `AS-IS SALE DISCLOSURE

Vehicle:
  [Year Make Model]
  VIN: [VIN]

THIS VEHICLE IS BEING SOLD "AS-IS, WHERE-IS" WITH NO EXPRESS WARRANTY
AND NO IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR
PURPOSE. The Buyer assumes all risk of any defects in the vehicle that
may appear after the sale.

The vehicle has been inspected and, to the best of our
knowledge, the vehicle is being delivered in the condition the Buyer
inspected on [Date of Inspection]. The Buyer has been provided a free
Carfax vehicle history report showing ownership, title, accident, and
service history.

The Buyer acknowledges the following:

  1. The Buyer is not relying on any oral representation from Love
     Auto Group or any of its representatives; any representation not
     contained in writing in the Buyer's Order is void.
  2. After delivery, the Buyer accepts full responsibility for any
     repairs, maintenance, or mechanical issues that may arise.

By signing below, the Buyer confirms they have read and understood this
disclosure and are purchasing the vehicle on an "AS-IS" basis.`,
  },

  {
    kind: "arbitration-agreement",
    title: "Arbitration Agreement",
    body: `ARBITRATION AGREEMENT

Buyer: [Buyer Name]
Seller: Love Auto Group Inc.

By signing below, both parties agree that any dispute, claim, or
controversy arising out of or relating to the sale of the vehicle
described in the Buyer's Order — including but not limited to disputes
about the condition of the vehicle, the accuracy of representations
made during the sale, financing, warranty (or lack thereof), and any
alleged violation of state or federal consumer protection statutes —
shall be resolved by binding arbitration administered by the American
Arbitration Association under its Consumer Arbitration Rules, rather
than in court, EXCEPT that either party may bring an individual action
in small-claims court for claims within that court's jurisdiction.

THE BUYER AND SELLER EACH WAIVE THE RIGHT TO A JURY TRIAL and to
participate in any class action related to this purchase. The arbitrator
shall have the same authority to award relief as a court would, including
statutory damages, attorney's fees, and equitable relief, subject to
the AAA Consumer Rules and applicable law.

This Agreement is governed by the Federal Arbitration Act. If any
provision of this Agreement is found to be unenforceable, the remaining
provisions shall remain in full force and effect.

By signing below, the Buyer acknowledges they have read and understood
this Arbitration Agreement and are knowingly and voluntarily agreeing
to arbitrate any future disputes.`,
  },

  {
    kind: "porter-authorization",
    title: "Porter Vehicle Movement Authorization",
    body: `PORTER VEHICLE MOVEMENT AUTHORIZATION

Issued by: Love Auto Group Inc.
           735 N Yale Ave, Unit A, Villa Park, IL 60181
           Dealer License: [IL Dealer #]
           Phone: (630) 359-3643

Authorized porter: [Porter Full Name]
Driver's license:  [DL Number / State]
Valid: [Start Date] through [End Date]

Vehicle:
  [Year Make Model]
  VIN: [VIN]
  Plate in use: [Dealer Plate # or Vehicle Plate #]

Movement authorized:
  Pick up from: [Origin — seller, auction, service shop, or lot]
  Deliver to:   [Destination]

TO WHOM IT MAY CONCERN: the individual named above is acting as a porter
for Love Auto Group Inc. and is authorized to take custody of, operate on
public roads, and transport the single vehicle described above, for the
single movement described above, within the dates shown. The vehicle
remains the property of Love Auto Group Inc. at all times. This letter is
not a bill of sale and transfers no ownership interest in the vehicle.

THIS AUTHORIZATION IS STRICTLY LIMITED. The porter named above has NO
authority to:

  1. Sign, execute, or accept ANY document on behalf of Love Auto Group —
     including titles, odometer disclosures, bills of sale, condition
     reports, repair orders, or any gate pass that transfers ownership.
  2. Pay, receive, negotiate, or promise ANY funds, deposit, or payment
     of any kind.
  3. Negotiate price, terms, or condition, or make any representation
     about the vehicle to any party.
  4. Take possession of the certificate of title or any lien release.
  5. Permit any other person to drive the vehicle, or to sublet or
     reassign this authorization.
  6. Bind Love Auto Group Inc. to any obligation whatsoever.

Anything outside the movement described above requires prior authorization
from Love Auto Group at (630) 359-3643. Anyone releasing a vehicle to this
porter may — and should — call that number to verify this letter before
handing over keys.

The porter must hold a valid driver's license. While operating the vehicle
the porter is covered under the dealership's garage liability policy for
the authorized movement above only; operation outside that scope, or after
the expiration date, is both unauthorized and uninsured.

This authorization expires on [End Date] or upon completion of the movement
described above, whichever is earlier, and may be revoked by Love Auto
Group Inc. at any time without notice.

Issued by: [Dealer Representative Name], [Title], Love Auto Group Inc.
Date issued: [Date]

By signing below, the porter acknowledges they have read this
authorization, understand the limits placed on it, and agree to operate
strictly within them.`,
  },
];

export function getTemplate(kind: DocumentKind): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.kind === kind);
}
