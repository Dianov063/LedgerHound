import OpenAI from 'openai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { COUNTRIES } from '../../lib/legal-packs/countries';
import type { CountryResearch } from '../../lib/legal-packs/types';

// Load env from .env.local if running locally
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

export async function researchCountry(countryCode: string): Promise<CountryResearch> {
  const country = COUNTRIES.find(c => c.code === countryCode.toUpperCase());
  if (!country) throw new Error(`Unknown country: ${countryCode}`);

  console.log(`\nResearching ${country.flag} ${country.name}...`);
  console.log('Using DeepSeek API...\n');

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 8192,
    messages: [
      {
        role: 'system',
        content: 'You are a legal research assistant specializing in cryptocurrency fraud reporting procedures worldwide. Return only valid JSON with no markdown fences or additional text.',
      },
      {
        role: 'user',
        content: `Research the current cryptocurrency fraud reporting procedures for ${country.name}.

Return ACCURATE information based on your knowledge. Only include real URLs and information you are confident about.

Research these topics:

1. PRIMARY POLICE/CYBERCRIME AGENCY for reporting crypto fraud
   - Official name in local language and English
   - Official website URL
   - Direct URL to online complaint/report form (if exists)
   - Required fields when filing a complaint
   - Typical response time
   - Jurisdiction level (federal/national/state)

2. FINANCIAL REGULATOR that handles investment/crypto fraud
   - Official name (e.g., SEC, FCA, BaFin, AMF)
   - Website URL
   - Complaint/tip submission URL
   - What types of crypto fraud they handle

3. ADDITIONAL AGENCIES worth contacting
   - Consumer protection agencies
   - Cybercrime-specific units
   - Any crypto-specific task forces

4. LEGAL BASIS for crypto fraud prosecution in ${country.name}
   - Relevant criminal code sections
   - Statute of limitations for fraud
   - Civil recovery options available

5. PRESERVATION LETTER requirements
   - Legal basis for requesting asset freeze at exchanges
   - What exchanges typically require to freeze assets
   - Expected response time from exchanges

6. PRACTICAL CONTACTS
   - Emergency cyber crime hotline (if exists)
   - Email address for cybercrime reports
   - Consumer protection contact info

7. LOCALIZED LEGAL TERMS in ${country.lang !== 'en' ? country.lang + ' language' : 'English'}
   - Word for "police"
   - Word for "complaint/report"
   - Word for "fraud"
   - Word for "cryptocurrency fraud"

Return your findings as a single JSON object matching this exact structure:
{
  "code": "${countryCode}",
  "name": "${country.name}",
  "language": "${country.lang}",
  "lastUpdated": "ISO date string",
  "policeAgency": {
    "name": "full name",
    "shortName": "abbreviation",
    "url": "https://...",
    "complaintUrl": "https://...",
    "requiredFields": ["field1", "field2"],
    "responseTime": "e.g. 24-48 hours",
    "jurisdiction": "federal/national/state"
  },
  "financialRegulator": {
    "name": "full name",
    "shortName": "abbreviation",
    "url": "https://...",
    "tipUrl": "https://...",
    "scope": "what they handle"
  },
  "additionalAgencies": [
    { "name": "...", "type": "consumer_protection|cybercrime|crypto_taskforce", "url": "https://...", "when": "when to contact" }
  ],
  "legalBasis": {
    "criminalCode": "relevant sections",
    "civilRemedies": ["remedy1", "remedy2"],
    "statuteOfLimitations": "e.g. 5 years for fraud"
  },
  "preservationLetter": {
    "legalBasis": "legal citation",
    "typicalResponse": "e.g. 24-48 hours",
    "requiredElements": ["element1", "element2"]
  },
  "localizedTerms": {
    "police": "local word",
    "complaint": "local word",
    "fraud": "local word",
    "cryptoFraud": "local phrase"
  },
  "contacts": {
    "emergencyPhone": "phone number",
    "cybercrimeEmail": "email@...",
    "consumerProtection": "contact info"
  },
  "notes": ["any important caveats or special instructions"]
}

IMPORTANT: Return ONLY the JSON object, no markdown fences, no additional text.`,
      },
    ],
  });

  const fullText = response.choices[0]?.message?.content || '';

  // Extract JSON from response
  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Response text:', fullText);
    throw new Error('No JSON found in API response');
  }

  let research: CountryResearch;
  try {
    research = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error('Failed to parse JSON:', jsonMatch[0].slice(0, 200));
    throw new Error(`JSON parse error: ${parseErr}`);
  }

  // Ensure required fields
  research.code = countryCode.toUpperCase();
  research.name = country.name;
  research.language = country.lang;
  research.lastUpdated = new Date().toISOString();

  // Save to S3
  await getS3().send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: `legal-packs/research/${countryCode.toUpperCase()}.json`,
    Body: JSON.stringify(research, null, 2),
    ContentType: 'application/json',
  }));

  console.log(`✅ ${country.flag} ${country.name} research saved to S3`);
  console.log(`   Police: ${research.policeAgency?.shortName || 'unknown'}`);
  console.log(`   Regulator: ${research.financialRegulator?.shortName || 'unknown'}`);
  console.log(`   Agencies: ${research.additionalAgencies?.length || 0} additional`);

  return research;
}

// CLI entry point — only run when executed directly
if (require.main === module) {
  const countryArg = process.argv[2];
  if (!countryArg) {
    console.error('Usage: npx tsx scripts/legal-packs/research-agent.ts <COUNTRY_CODE>');
    console.error('Example: npx tsx scripts/legal-packs/research-agent.ts US');
    console.error('\nAvailable countries:');
    COUNTRIES.forEach(c => console.error(`  ${c.flag} ${c.code} - ${c.name}`));
    process.exit(1);
  }

  researchCountry(countryArg)
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error:', err.message || err);
      process.exit(1);
    });
}
