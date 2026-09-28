const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'i18n', 'translations.js');
let content = fs.readFileSync(filePath, 'utf8');

const newEnKeys = `
      "newHero": {
        "badge": "Blockchain-Verified Agri Ledger · Polygon Amoy",
        "title1": "Fair Harvest Prices.",
        "title2": "Zero-Trust Provenance.",
        "subtitle": "India's premier agricultural marketplace connecting farmers, traders, retailers, and consumers with AI-driven MSP floors, smart escrow contracts, and cryptographic QR traceability.",
        "primaryBtn": "Launch Marketplace →",
        "secondaryBtn": "AI Price Engine",
        "videoBtn": "▶ Watch Video",
        "trust1": "★ 4.9/5 Farmer Satisfaction",
        "trust2": "100% Escrow Protected",
        "trust3": "0.4s Gasless Finality",
        "cardTitle": "ON-CHAIN VERIFIED ESCROW",
        "network": "Polygon Amoy",
        "product": "Alphonso Mangoes · Batch #FC-9482",
        "status": "Grade A+ Certified",
        "location": "Ratnagiri Organic Co-op, Maharashtra",
        "aiPriceLabel": "AI FAIR PRICE (MSP PROTECTED)",
        "aiPriceValue": "₹58.50/kg",
        "escrowLabel": "SMART ESCROW LOCKED",
        "escrowValue": "₹58,500.00",
        "autoRelease": "Auto-Release on QC Delivery",
        "hash": "Hash: 0x82a...419",
        "verifyBtn": "✓ Verify Provenance",
        "stat1Value": "31",
        "stat1Label": "BATCHES SEALED ON LEDGER",
        "stat2Value": "₹4.20 Cr",
        "stat2Label": "ESCROW PROTECTED",
        "stat3Value": "16",
        "stat3Label": "ACTIVE FARM PRODUCE",
        "stat4Value": "9",
        "stat4Label": "REGISTERED STAKEHOLDERS",
        "howBadge": "TRANSPARENT PHYSICAL LEDGER",
        "howTitle": "How FarmChain Works",
        "howSubtitle": "From seed sowing to supermarket shelf — every physical handoff is cryptographically sealed on-chain.",
        "step1Title": "1. Harvest & AI Pricing",
        "step1Desc": "Farmer logs produce batch. AI forecast rates and locks an guaranteed MSP floor price directly into a smart escrow contract.",
        "step2Title": "2. Mandi Inspection",
        "step2Desc": "APMC intermediary verifies produce grade & QR link. Every contract records batch custody and funds the escrow pool.",
        "step3Title": "3. Retail Cold Chain",
        "step3Desc": "Retail supermarket receives authenticated lots. Temperature and transit checkpoints are anchored to immutable Polygon blocks.",
        "step4Title": "4. Consumer QR Trace",
        "step4Desc": "Consumer scans the unique on-package QR code to view the complete immutable farm journey, certificates, and farmer payouts."
      },`;

const newTaKeys = `
      "newHero": {
        "badge": "பிளாக்செயின் சான்றளிக்கப்பட்ட விவசாய பேரேடு · Polygon Amoy",
        "title1": "நியாயமான அறுவடை விலைகள்.",
        "title2": "பூஜ்ஜிய-நம்பிக்கை ஆதாரம்.",
        "subtitle": "AI-உந்துதல் MSP தளங்கள், ஸ்மார்ட் எஸ்க்ரோ ஒப்பந்தங்கள் மற்றும் குறியாக்க QR தடமறிதல் ஆகியவற்றுடன் விவசாயிகள், வர்த்தகர்கள், சில்லறை விற்பனையாளர்கள் மற்றும் நுகர்வோரை இணைக்கும் இந்தியாவின் முதன்மை விவசாய சந்தை.",
        "primaryBtn": "சந்தையைத் திறக்கவும் →",
        "secondaryBtn": "AI விலை இயந்திரம்",
        "videoBtn": "▶ வீடியோவைப் பார்க்க",
        "trust1": "★ 4.9/5 விவசாயி திருப்தி",
        "trust2": "100% எஸ்க்ரோ பாதுகாக்கப்பட்டது",
        "trust3": "0.4s காஸ்லெஸ் இறுதி",
        "cardTitle": "ஆன்-செயின் சரிபார்க்கப்பட்ட எஸ்க்ரோ",
        "network": "Polygon Amoy",
        "product": "அல்போன்சோ மாம்பழங்கள் · Batch #FC-9482",
        "status": "தரம் A+ சான்றளிக்கப்பட்டது",
        "location": "ரத்னகிரி ஆர்கானிக் கோ-ஆப், மகாராஷ்டிரா",
        "aiPriceLabel": "AI நியாயமான விலை (MSP பாதுகாக்கப்பட்டது)",
        "aiPriceValue": "₹58.50/kg",
        "escrowLabel": "ஸ்மார்ட் எஸ்க்ரோ பூட்டப்பட்டுள்ளது",
        "escrowValue": "₹58,500.00",
        "autoRelease": "QC டெலிவரியில் ஆட்டோ-ரிலீஸ்",
        "hash": "Hash: 0x82a...419",
        "verifyBtn": "✓ ஆதாரத்தை சரிபார்க்கவும்",
        "stat1Value": "31",
        "stat1Label": "பேரேட்டில் முத்திரையிடப்பட்ட தொகுதிகள்",
        "stat2Value": "₹4.20 Cr",
        "stat2Label": "எஸ்க்ரோ பாதுகாக்கப்பட்டது",
        "stat3Value": "16",
        "stat3Label": "செயலில் உள்ள விவசாய விளைபொருட்கள்",
        "stat4Value": "9",
        "stat4Label": "பதிவு செய்யப்பட்ட பங்குதாரர்கள்",
        "howBadge": "வெளிப்படையான இயற்பியல் பேரேடு",
        "howTitle": "ஃபார்ம்சின் எவ்வாறு செயல்படுகிறது",
        "howSubtitle": "விதை விதைப்பது முதல் பல்பொருள் அங்காடி அலமாரி வரை — ஒவ்வொரு உடல் ஒப்படைப்பும் சங்கிலியில் கிரிப்டோகிராஃபிக் முறையில் முத்திரையிடப்பட்டுள்ளது.",
        "step1Title": "1. அறுவடை & AI விலை நிர்ணயம்",
        "step1Desc": "விவசாயி விளைபொருள் தொகுதியை பதிவு செய்கிறார். AI முன்னறிவிப்பு விகிதங்கள் மற்றும் உத்தரவாதமான MSP தரை விலையை நேரடியாக ஸ்மார்ட் எஸ்க்ரோ ஒப்பந்தத்தில் பூட்டுகிறது.",
        "step2Title": "2. மண்டி ஆய்வு",
        "step2Desc": "APMC இடைத்தரகர் விளைபொருள் தரம் மற்றும் QR இணைப்பை சரிபார்க்கிறார். ஒவ்வொரு ஒப்பந்தமும் தொகுதி காவலில் பதிவு செய்து எஸ்க்ரோ குளத்திற்கு நிதியளிக்கிறது.",
        "step3Title": "3. சில்லறை குளிர் சங்கிலி",
        "step3Desc": "சில்லறை பல்பொருள் அங்காடி அங்கீகரிக்கப்பட்ட தொகுதிகளைப் பெறுகிறது. வெப்பநிலை மற்றும் போக்குவரத்து சோதனைச் சாவடிகள் மாறாத பாலிகான் தொகுதிகளில் தொகுக்கப்பட்டுள்ளன.",
        "step4Title": "4. நுகர்வோர் QR சுவடு",
        "step4Desc": "முழுமையான மாறாத பண்ணை பயணம், சான்றிதழ்கள் மற்றும் விவசாயிகளின் செலுத்துதல்களைக் காண பேக்கேஜ் QR குறியீட்டை நுகர்வோர் ஸ்கேன் செய்கிறார்."
      },`;

// Inject right before "nav": { under "landing": {
content = content.replace(
  /"en": \{\s*(.*?)\s*"landing":\s*\{\s*"nav":/s,
  (match, p1) => `"en": {\n${p1}  "landing": {\n${newEnKeys}\n      "nav":`
);

content = content.replace(
  /"ta": \{\s*(.*?)\s*"landing":\s*\{\s*"nav":/s,
  (match, p1) => `"ta": {\n${p1}  "landing": {\n${newTaKeys}\n      "nav":`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added translations.');
