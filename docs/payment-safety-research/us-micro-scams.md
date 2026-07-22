# United States Micro-Scam Research

Status: phases 1 through 5 implemented

Last checked: 2026-07-21

## Scope

The first US dataset prioritizes consumer losses from USD 1 to USD 100. Larger reports remain valid, but they are not the initial acquisition or SEO focus.

Included situations:

- Goods advertised through social media, classifieds, or a marketplace and never delivered
- Cakes, custom items, repairs, design work, cleaning, and other small services paid in advance but not provided
- Ticket sales where the ticket is fake, reused, invalid, or never transferred
- Small reservation, rental, pet, or appointment deposits followed by disappearance
- Sellers who move a buyer outside a marketplace payment system to a peer-to-peer payment app
- Sellers and service providers operating in local or diaspora Telegram groups, including Russian-speaking US communities

## Research blind spot: private messaging communities

Official US complaint data and mainstream marketplace guidance can underrepresent scams that stay inside private-language communities. Telegram is therefore modeled as a sale and contact channel, not as a payment rail. A report records the Telegram handle, group or channel name, community language, and US state privately, while the transfer is matched separately through Zelle, Cash App, Venmo, Apple Cash, Chime, or another payment method.

Community names and links are moderation context. They are not published from a single report.

Initially excluded from this workflow:

- Cryptocurrency and investment losses, which use the existing crypto workflow
- Unauthorized account takeover transactions, which require a different evidence and legal model
- Ordinary quality disputes where the item or service was delivered
- Chargebacks, debt collection, identity theft, and losses without an identifiable recipient

## Supported payment methods

| Method | Searchable recipient identifiers | Private normalization | Public mask |
| --- | --- | --- | --- |
| Zelle | US phone, email, Zelle tag | lowercase email or phone digits | email prefix or last four phone digits |
| Cash App | $Cashtag, phone, email | lowercase handle without `$`; phone/email support is a later schema extension | partial $Cashtag |
| Venmo | username/profile | lowercase username without `@` | partial username |
| PayPal | email or PayPal identity shown on receipt | lowercase email | partial email |
| Apple Cash | phone or email shown in transaction history | lowercase email or phone digits | email prefix or last four phone digits |
| Chime | $ChimeSign, phone, email | lowercase handle without `$`, lowercase email, or phone digits | partial $ChimeSign, email, or last four phone digits |
| Bank transfer | account identity shown on receipt | private compact value | last four digits only |

Never collect a gift-card redemption code, card security code, bank password, app PIN, Social Security number, or full debit/credit card number. A gift-card case may store the brand, amount, purchase receipt, and only the last four digits when visible.

## US intake fields

The current form already captures the core payment identity, amount, incident date, recipient name, aliases, description, and evidence. The next US form iteration should add:

- Sale channel: Facebook Marketplace, Instagram, TikTok, Craigslist, OfferUp, Nextdoor, Discord, direct website, text message, or other
- Seller profile handle and listing URL as private supporting identifiers
- Short item or service label
- Promised delivery or completion date
- Whether a refund was requested and the date of last response
- Transaction reference from the payment receipt, stored privately and normalized per provider
- Whether the user reported the payment to the provider, marketplace, FTC, or state attorney general
- Optional external report confirmation number, stored privately

## Evidence standard

Minimum useful report:

- Payment method, exact recipient identifier, amount, date, and a factual description

Strong report:

- Payment receipt showing recipient, amount, date, and transaction reference
- Chat showing the agreed item or service and promised delivery or completion
- Listing or seller profile screenshot/URL
- Follow-up or refund request showing non-delivery or disappearance

Evidence uploads must be private. The admin should redact unrelated phone numbers, addresses, children, card data, and account balances before using any excerpt for moderation.

## Publication and moderation

- Pending and rejected reports never count toward a public cluster
- One accepted report: private intake
- Two accepted independent reports: internal watch
- Three accepted independent reports: public masked warning
- Three accepted independent reports with three uploaded payment receipts, or five accepted independent reports: eligible for search-engine indexing
- Staff review may raise confidence but does not change the warning into a criminal finding

Public wording should say: `Multiple independent reports are associated with this payment recipient.` It should not say: `This person is a confirmed scammer.`

Independence checks should consider reporter email hash, IP/rate-limit signal, evidence transaction references, incident dates, writing duplication, and repeated uploads. Matching IP addresses alone must not automatically reject reports because households and public networks are shared.

## User recovery path

After submission, show a provider-specific action list while making clear that recovery is not guaranteed:

1. Contact the payment provider immediately and report the transaction.
2. If a card or bank account funded the payment, contact that institution and ask what dispute options apply.
3. Report the seller to the marketplace or social platform.
4. File a report at ReportFraud.ftc.gov.
5. For marketplace fraud, consider the state attorney general; for serious or repeated internet crime, consider IC3.

## Product phases

Phase 1:

- Add Apple Cash and Chime recipient matching
- Keep US and USD as defaults
- Preserve the current corroboration thresholds and private evidence model

Phase 2:

- Add sale channel, listing URL, item/service label, promised date, refund request, and private transaction reference
- Add provider-specific identifier hints and validation
- Add provider report links to the success screen

Phase 3:

- Require reporter email verification before a report can be accepted or counted
- Keep public warnings behind three independent, verified, moderator-accepted reports
- Add correction/appeal intake with private evidence and an admin review queue
- Detect duplicate private transaction references during moderation

Phase 4:

- Exclude shared network, duplicate transaction, and duplicate evidence submissions from independent corroboration counts
- Pause public visibility while a correction is under active review
- Record moderator decisions in a private audit log

Phase 5:

- Add Telegram, community language, private group/channel context, and US state intake
- Add public payment rail, category, and state filters
- Add privacy-safe aggregate statistics and US scenario pages

## Official sources

- FTC online shopping guidance: https://consumer.ftc.gov/articles/online-shopping
- FTC online marketplace guidance: https://consumer.ftc.gov/articles/buying-online-marketplace
- FTC mobile payment app guidance: https://consumer.ftc.gov/articles/mobile-payment-apps-how-avoid-scam-when-you-use-one
- FTC recovery and reporting guidance: https://consumer.ftc.gov/articles/what-do-if-you-were-scammed
- CFPB Regulation E resource: https://www.consumerfinance.gov/rules-policy/regulations/1005/
- Zelle Safety 101: https://www.zellepay.com/safety-education/zeller-safety-101
- Cash App scam reporting: https://cash.app/outsmart-scams
- Venmo buying and selling FAQ: https://help.venmo.com/cs/articles/buying-and-selling-on-venmo-faq-vhel138
- PayPal Purchase Protection: https://www.paypal.com/us/legalhub/paypal/buyer-protection
- Apple Cash transaction issues: https://support.apple.com/en-us/117946
- Apple Cash scam guidance: https://support.apple.com/en-us/102461
- Chime Pay Anyone disputes: https://help.chime.com/can-i-file-a-dispute-for-a-pay-anyone-transfer-b7e0ebd3
