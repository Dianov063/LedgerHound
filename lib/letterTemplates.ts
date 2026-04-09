import type { ExchangeInfo } from './exchangeDatabase';

export type LetterType = 'preservation' | 'freeze' | 'information' | 'followup';

export interface LetterData {
  letterType: LetterType;
  exchange: ExchangeInfo;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  incidentDate: string;
  amountLost: string;
  walletAddress: string;
  transactionHashes: string;
  network: string;
  description: string;
  caseId: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function hashList(raw: string): string {
  return raw
    .split(/[\n,;]+/)
    .map((h) => h.trim())
    .filter(Boolean)
    .map((h) => `  - ${h}`)
    .join('\n');
}

export function generateCaseId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `ER-${id}`;
}

/* ════════════════════════════════════════════════════════════════════
   LETTER TEMPLATES
   ════════════════════════════════════════════════════════════════════ */

export function generatePreservationLetter(d: LetterData): string {
  const hashes = hashList(d.transactionHashes);
  return `PRESERVATION REQUEST
${'='.repeat(60)}

Date: ${todayFormatted()}
Case Reference: ${d.caseId}

TO: ${d.exchange.name} Compliance Department
    ${d.exchange.complianceEmail}${d.exchange.legalEmail ? `\n    ${d.exchange.legalEmail}` : ''}

FROM: ${d.senderName}
      ${d.senderEmail}${d.senderPhone ? `\n      ${d.senderPhone}` : ''}

RE: Request for Preservation of Records and Account Data
    Related to Fraudulent Cryptocurrency Transaction(s)

${'─'.repeat(60)}

Dear ${d.exchange.name} Compliance Team,

I am writing to formally request the immediate preservation of all records, account data, and transaction logs associated with the cryptocurrency addresses and transactions described below. I am the victim of a cryptocurrency fraud that resulted in the loss of approximately $${d.amountLost} USD.

INCIDENT DETAILS:
- Date of Incident: ${formatDate(d.incidentDate)}
- Approximate Loss: $${d.amountLost} USD
- Blockchain Network: ${d.network}
- Suspect Wallet Address: ${d.walletAddress}

TRANSACTION HASH(ES):
${hashes}

DESCRIPTION OF INCIDENT:
${d.description}

PRESERVATION REQUEST:
Pursuant to applicable regulations and your exchange's obligations under anti-money laundering (AML) laws, I respectfully request that ${d.exchange.name} immediately preserve the following information related to the above wallet address(es) and transaction(s):

1. All account registration information (name, email, phone, address, government ID)
2. All KYC/identity verification documents
3. Complete transaction history and ledger records
4. IP addresses and device information used to access the account
5. Any linked bank accounts or payment methods
6. Internal communications or flags related to the account
7. Current balance and withdrawal history

This preservation request is time-sensitive. I request that all potentially relevant records be preserved and not destroyed, altered, or overwritten pending the issuance of formal legal process (subpoena or court order).

I am concurrently filing a report with law enforcement and will provide the police report reference number as soon as it is available. I am prepared to cooperate fully with ${d.exchange.name}'s compliance team and law enforcement in this matter.

Please confirm receipt of this preservation request and advise on any additional steps required.

Sincerely,

${d.senderName}
${d.senderEmail}${d.senderPhone ? `\n${d.senderPhone}` : ''}
Case Reference: ${d.caseId}

${'─'.repeat(60)}
CONFIDENTIAL: This letter contains information related to an
ongoing fraud investigation. Please handle accordingly.
`;
}

export function generateFreezeLetter(d: LetterData): string {
  const hashes = hashList(d.transactionHashes);
  return `URGENT: ACCOUNT FREEZE REQUEST
${'='.repeat(60)}

Date: ${todayFormatted()}
Case Reference: ${d.caseId}
PRIORITY: URGENT

TO: ${d.exchange.name} Compliance Department
    ${d.exchange.complianceEmail}${d.exchange.legalEmail ? `\n    ${d.exchange.legalEmail}` : ''}

FROM: ${d.senderName}
      ${d.senderEmail}${d.senderPhone ? `\n      ${d.senderPhone}` : ''}

RE: URGENT Request to Freeze Account and Funds
    Associated with Cryptocurrency Fraud

${'─'.repeat(60)}

Dear ${d.exchange.name} Compliance Team,

I am writing to urgently request the immediate freeze of any account(s) associated with the wallet address and transactions described below. These funds are the direct proceeds of fraud, and any delay in action may result in their irreversible withdrawal or transfer.

INCIDENT DETAILS:
- Date of Incident: ${formatDate(d.incidentDate)}
- Approximate Loss: $${d.amountLost} USD
- Blockchain Network: ${d.network}
- Suspect Wallet Address: ${d.walletAddress}

TRANSACTION HASH(ES):
${hashes}

DESCRIPTION OF INCIDENT:
${d.description}

URGENT FREEZE REQUEST:
I request that ${d.exchange.name} take the following immediate actions:

1. FREEZE all account(s) associated with the above wallet address to prevent any withdrawals or transfers of funds
2. FLAG the account(s) for review by your compliance and AML teams
3. PRESERVE all records and data associated with the account(s)
4. NOTIFY me of any attempted withdrawals from the flagged account(s)

Under your obligations as a regulated financial services provider, ${d.exchange.name} has a duty to prevent the facilitation of money laundering and fraud. The transactions referenced above constitute suspected fraud, and your prompt action is critical to preserving the possibility of fund recovery.

LEGAL BASIS:
This request is made pursuant to:
- Anti-Money Laundering (AML) regulations applicable to your jurisdiction
- Your exchange's Terms of Service regarding fraudulent activity
- The duty to file Suspicious Activity Reports (SARs) when fraud is suspected

I am concurrently filing reports with law enforcement and regulatory authorities. Formal legal process (subpoena/court order) will follow.

TIME IS OF THE ESSENCE. I request immediate confirmation of receipt and action taken.

Sincerely,

${d.senderName}
${d.senderEmail}${d.senderPhone ? `\n${d.senderPhone}` : ''}
Case Reference: ${d.caseId}

${'─'.repeat(60)}
URGENT & CONFIDENTIAL: This letter relates to an active fraud
investigation. Immediate action is requested.
`;
}

export function generateInformationLetter(d: LetterData): string {
  const hashes = hashList(d.transactionHashes);
  return `INFORMATION REQUEST
${'='.repeat(60)}

Date: ${todayFormatted()}
Case Reference: ${d.caseId}

TO: ${d.exchange.name} Compliance Department
    ${d.exchange.complianceEmail}${d.exchange.legalEmail ? `\n    ${d.exchange.legalEmail}` : ''}

FROM: ${d.senderName}
      ${d.senderEmail}${d.senderPhone ? `\n      ${d.senderPhone}` : ''}

RE: Request for Account Holder Information
    Related to Fraudulent Cryptocurrency Transaction(s)

${'─'.repeat(60)}

Dear ${d.exchange.name} Compliance Team,

I am writing to request information regarding the account holder associated with the cryptocurrency transactions described below. I am the victim of cryptocurrency fraud and am seeking to identify the perpetrator(s) for purposes of law enforcement reporting and civil recovery.

INCIDENT DETAILS:
- Date of Incident: ${formatDate(d.incidentDate)}
- Approximate Loss: $${d.amountLost} USD
- Blockchain Network: ${d.network}
- Suspect Wallet Address: ${d.walletAddress}

TRANSACTION HASH(ES):
${hashes}

DESCRIPTION OF INCIDENT:
${d.description}

INFORMATION REQUESTED:
Subject to applicable legal requirements, I request the following information regarding the account holder associated with the above wallet address:

1. Whether an account exists that is associated with the specified wallet address
2. The registration date of the account
3. Any information that can be disclosed regarding the account holder's identity
4. Transaction history between the account and the specified wallet address
5. Whether the account has been flagged for suspicious activity

I understand that ${d.exchange.name} may require formal legal process (such as a subpoena or court order) before disclosing certain account holder information. If that is the case, please advise on:

- The specific legal process required
- The jurisdiction and court to which the process should be directed
- Your designated agent for service of legal process
- Any expedited procedures available for fraud cases

I am actively working with law enforcement and legal counsel on this matter. A formal legal request will be issued if required.

Please confirm receipt and advise on next steps.

Sincerely,

${d.senderName}
${d.senderEmail}${d.senderPhone ? `\n${d.senderPhone}` : ''}
Case Reference: ${d.caseId}

${'─'.repeat(60)}
NOTE: ${d.exchange.requiresSubpoena
  ? `${d.exchange.name} typically requires a subpoena or court order for account holder identity disclosure. This letter initiates the process and requests guidance on the specific legal mechanism needed.`
  : `This is a formal information request. Please advise on any additional requirements.`}
`;
}

export function generateFollowupLetter(d: LetterData): string {
  return `FOLLOW-UP: PRESERVATION/FREEZE REQUEST
${'='.repeat(60)}

Date: ${todayFormatted()}
Case Reference: ${d.caseId}
FOLLOW-UP TO: Original request sent on ${formatDate(d.incidentDate)}

TO: ${d.exchange.name} Compliance Department
    ${d.exchange.complianceEmail}${d.exchange.legalEmail ? `\n    ${d.exchange.legalEmail}` : ''}

FROM: ${d.senderName}
      ${d.senderEmail}${d.senderPhone ? `\n      ${d.senderPhone}` : ''}

RE: FOLLOW-UP — No Response to Preservation/Freeze Request
    Case Reference: ${d.caseId}

${'─'.repeat(60)}

Dear ${d.exchange.name} Compliance Team,

I am writing to follow up on my previous correspondence regarding a cryptocurrency fraud case (Reference: ${d.caseId}). I sent my initial request on ${formatDate(d.incidentDate)} and have not yet received a response or confirmation.

ORIGINAL REQUEST SUMMARY:
- Suspect Wallet Address: ${d.walletAddress}
- Blockchain Network: ${d.network}
- Approximate Loss: $${d.amountLost} USD

I respectfully request:

1. Confirmation that my original request was received and is being processed
2. A status update on any actions taken (account freeze, record preservation)
3. An estimated timeline for a full response
4. The name and direct contact information of the compliance officer handling this case

Please note that:
- I have filed a law enforcement report regarding this fraud
- Every day of delay increases the risk that the suspect will withdraw or move the fraudulent funds
- Failure to act on a credible fraud report may expose ${d.exchange.name} to regulatory liability
- I am prepared to escalate this matter to the relevant financial regulator if no response is received within 7 business days

I remain available to provide any additional information or documentation needed to process this request.

Sincerely,

${d.senderName}
${d.senderEmail}${d.senderPhone ? `\n${d.senderPhone}` : ''}
Case Reference: ${d.caseId}

${'─'.repeat(60)}
CC: This follow-up may be shared with law enforcement and
regulatory authorities if no response is received.
`;
}

/* ════════════════════════════════════════════════════════════════════
   MAIN GENERATOR
   ════════════════════════════════════════════════════════════════════ */

export function generateLetter(d: LetterData): string {
  switch (d.letterType) {
    case 'preservation': return generatePreservationLetter(d);
    case 'freeze': return generateFreezeLetter(d);
    case 'information': return generateInformationLetter(d);
    case 'followup': return generateFollowupLetter(d);
    default: return generatePreservationLetter(d);
  }
}

export function getLetterSubject(d: LetterData): string {
  const base = `[${d.caseId}] `;
  switch (d.letterType) {
    case 'preservation': return `${base}Preservation Request — Fraud-Related Account Records`;
    case 'freeze': return `${base}URGENT: Account Freeze Request — Cryptocurrency Fraud`;
    case 'information': return `${base}Information Request — Fraud-Related Account`;
    case 'followup': return `${base}FOLLOW-UP: No Response to Preservation/Freeze Request`;
    default: return `${base}Fraud-Related Account Request`;
  }
}

export const LETTER_TYPE_INFO: Record<LetterType, { label: string; description: string }> = {
  preservation: {
    label: 'Preservation Request',
    description: 'Request to preserve all account records and data. Best first step — establishes a paper trail.',
  },
  freeze: {
    label: 'Freeze Request',
    description: 'Urgent request to freeze the suspect account and prevent withdrawals. Use when funds may still be on the exchange.',
  },
  information: {
    label: 'Information Request',
    description: 'Request for account holder identity and transaction details. Most exchanges require a subpoena for full disclosure.',
  },
  followup: {
    label: 'Follow-up Letter',
    description: 'Follow-up if no response received after 14 days. References original request and escalation timeline.',
  },
};
