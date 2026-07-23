/**
 * Seed 6 published blog posts into MongoDB.
 * Run:  npx tsx scripts/seed-blogs.ts
 * Safe to re-run — upserts by slug.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { Blog } from "../src/models/blog.model";

function loadEnv() {
  try {
    const txt = readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* .env optional */ }
}

function img(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;
}

// Sentinel ObjectId used as placeholder author (matches admin blog API)
const ADMIN_AUTHOR = new mongoose.Types.ObjectId("000000000000000000000001");

const BLOGS = [
  {
    title: "5 Ayurvedic Herbs to Boost Your Immunity Naturally",
    slug:  "ayurvedic-herbs-for-immunity",
    excerpt:
      "Tulsi, Giloy, Ashwagandha and more — the time-tested herbs that help your body defend itself, and how to use them every day.",
    coverImage: img("1615485500704-8e990f9900f7"), // loose herbs
    categories: ["Immunity"],
    tags: ["tulsi", "giloy", "ashwagandha", "immunity", "ayurveda"],
    readingTime: 6,
    content: `<h2>Why Immunity Matters in Ayurveda</h2>
<p>In Ayurvedic philosophy, <em>Ojas</em> is the essence of vitality and immunity. When Ojas is strong, the body resists disease naturally. The good news: everyday herbs can help you build and protect it.</p>

<h2>1. Tulsi (Holy Basil)</h2>
<p>Tulsi is revered as the Queen of Herbs in India. Its powerful adaptogenic properties help the body manage stress while its antimicrobial compounds fight infections. Brew 5–6 fresh leaves in hot water every morning for best results.</p>

<h2>2. Giloy (Guduchi)</h2>
<p>Giloy is nature's own immunomodulator. Clinical studies have shown it increases white blood cell count and reduces chronic inflammation. Take it as a juice or supplement daily during seasonal changes.</p>

<h2>3. Ashwagandha</h2>
<p>This root adaptogen lowers cortisol, the stress hormone that suppresses immunity. A nightly dose of ashwagandha powder in warm milk (called <em>golden milk</em>) is a traditional remedy that modern research strongly supports.</p>

<h2>4. Amla (Indian Gooseberry)</h2>
<p>Amla contains 20× the vitamin C of an orange in a form that withstands heat without degrading. It rejuvenates all seven dhatus (body tissues) and is the primary ingredient in Chyawanprash.</p>

<h2>5. Neem</h2>
<p>Neem's bitter compounds are powerful antifungal, antibacterial, and antiviral agents. A teaspoon of neem juice on an empty stomach clears toxins (ama) that weaken the immune response.</p>

<h2>Building a Daily Routine</h2>
<p>Consistency is key. Choose one or two of these herbs to start, incorporate them into a daily ritual, and give your body 4–6 weeks to respond. The cumulative effect of Ayurvedic herbs is what sets them apart from quick-fix supplements.</p>`,
  },
  {
    title: "The Ancient Science of Detox: How Herbal Teas Cleanse the Body",
    slug:  "science-of-herbal-detox",
    excerpt:
      "Detox isn't a fad — Ayurveda has used gentle herbal cleansing for centuries. Here's how a daily detox tea works and which herbs to choose.",
    coverImage: img("1564890369478-c89ca6d9cde9"), // teapot + herbal cup
    categories: ["Detox"],
    tags: ["detox", "herbal-tea", "cleanse", "ama", "digestion"],
    readingTime: 5,
    content: `<h2>What is Ama?</h2>
<p>Ayurveda describes <em>Ama</em> as undigested metabolic waste that accumulates in the channels of the body, blocking energy flow and causing disease. A coated tongue, low energy, and sluggish digestion are classic signs.</p>

<h2>How Herbal Teas Clear Ama</h2>
<p>Warm liquid is the most efficient vehicle for Ayurvedic herbs because it penetrates the tissues quickly and carries active compounds deep into the digestive tract. Specific herbs enhance this by stimulating <em>Agni</em> (digestive fire).</p>

<h2>Key Herbs in a Detox Blend</h2>
<ul>
  <li><strong>Triphala</strong> — The classic three-fruit formula (Amalaki, Bibhitaki, Haritaki) is the cornerstone of Ayurvedic detox. It gently clears waste from all body channels.</li>
  <li><strong>Ginger</strong> — Kindles Agni and promotes circulation, moving toxins toward elimination pathways.</li>
  <li><strong>Cumin, Coriander, Fennel</strong> — The CCF tea is a gentle daily cleanser safe for all body types.</li>
  <li><strong>Turmeric</strong> — A powerful liver protector that binds and neutralises environmental toxins.</li>
</ul>

<h2>When and How to Drink</h2>
<p>Morning, before food, is the optimal time. The digestive channels are empty and the body is naturally in a cleansing state. Drink slowly and warm — cold or iced herbal teas actually dampen Agni and are counterproductive.</p>

<h2>One Week Gentle Detox Plan</h2>
<p>Start each morning with CCF tea. Replace one meal with a warm moong dal khichdi. Avoid raw foods, heavy meats and processed sugar. By day 4 most people notice lighter energy, clearer skin and improved digestion.</p>`,
  },
  {
    title: "The Ayurvedic Approach to Healthy Weight Management",
    slug:  "ayurvedic-weight-management",
    excerpt:
      "Sustainable weight balance is about digestion and metabolism, not crash diets. How Ayurvedic herbs and lifestyle habits help you find your natural weight.",
    coverImage: img("1610725664285-7c57e6eeac3f"), // herbal powder in pouch
    categories: ["Wellness"],
    tags: ["weight-management", "triphala", "metabolism", "kapha", "slim"],
    readingTime: 7,
    content: `<h2>Your Prakriti Determines Your Weight</h2>
<p>Ayurveda doesn't believe in a universal ideal weight. Your natural body type (<em>Prakriti</em>) — Vata, Pitta, or Kapha — determines your baseline metabolism and the way your body stores energy. Kapha-dominant types tend toward weight gain; Vata types toward being underweight. The goal is <em>balance</em>, not a number on a scale.</p>

<h2>Strengthening Agni is Step One</h2>
<p>Poor digestion (<em>Mandagni</em>) is the primary cause of unhealthy weight gain in Ayurveda. When food is not fully digested, it converts to Ama rather than nourishing the tissues. Herbs that kindle Agni are therefore the foundation of any weight management protocol.</p>

<h2>Top Herbs for Healthy Weight</h2>
<ul>
  <li><strong>Triphala</strong> — Regulates bowel function, improves nutrient absorption, and reduces Ama accumulation. Take 1 tsp in warm water at bedtime.</li>
  <li><strong>Guggul</strong> — Clinically shown to reduce LDL cholesterol and triglycerides. Supports the lymphatic system in removing fatty deposits.</li>
  <li><strong>Medohar Guggul (Slim Fit)</strong> — A classical compound formulation combining Guggul with Triphala, Trikatu and other herbs, specifically formulated for weight management.</li>
  <li><strong>Vijaysar</strong> — The wood of the Pterocarpus marsupium tree has potent anti-obesity and blood-sugar-regulating properties.</li>
</ul>

<h2>Lifestyle Over Supplements</h2>
<p>No herb works in isolation. Ayurveda prescribes eating your largest meal at midday (when Agni is strongest), avoiding eating after sunset, doing dry massage (<em>Garshana</em>) with raw silk or a dry brush to stimulate lymph flow, and including warming spices like black pepper, ginger and mustard seeds in every meal.</p>

<h2>The Long View</h2>
<p>Ayurvedic weight management takes 3–6 months to show its full effect. But unlike crash diets, the changes are lasting because they address root cause — not just symptoms.</p>`,
  },
  {
    title: "Digestive Health: Simple Churna Remedies for Gut Comfort",
    slug:  "churna-for-digestion",
    excerpt:
      "Bloating, gas and acidity have gentle Ayurvedic answers. A practical guide to churnas, when to take them, and how to use them safely.",
    coverImage: img("1593095948071-474c5cc2989d"), // powder with scoop
    categories: ["Digestive Care"],
    tags: ["churna", "digestion", "bloating", "gas", "gut-health", "ayurveda"],
    readingTime: 5,
    content: `<h2>What is a Churna?</h2>
<p>A <em>churna</em> is a fine herbal powder — one of the oldest and most direct Ayurvedic preparations. Powders enter the digestive tract immediately, without needing to break down a capsule shell or tablet binder, making them faster-acting for digestive complaints.</p>

<h2>Hingvastak Churna — For Gas and Bloating</h2>
<p>Hingvastak (meaning "eight herbs with Hing") is the first-choice remedy for Vata-type digestive disturbance: gas, bloating, gurgling, and cramping. Take ½ tsp with warm water 15 minutes before meals. Hing (asafoetida) is the star ingredient — it relaxes intestinal spasms almost immediately.</p>

<h2>Avipattikar Churna — For Acidity</h2>
<p>Avipattikar neutralises excess Pitta in the stomach. It contains Amla, which buffers stomach acid, along with Haritaki and other cooling herbs. Unlike antacids, it doesn't suppress digestive enzymes — it calms the excess heat while keeping Agni functional. Take 1 tsp in warm water after meals.</p>

<h2>Triphala Churna — The All-Rounder</h2>
<p>Triphala is the Swiss army knife of Ayurvedic digestive care. It is simultaneously a mild laxative, a prebiotic (feeds good gut bacteria), and a gut-wall tonic. Taken at bedtime in warm water, it regulates bowel timing gently — without dependency, unlike pharmaceutical laxatives.</p>

<h2>Trikatu Churna — For Sluggish Digestion</h2>
<p>Trikatu ("three pungents" — ginger, black pepper, long pepper) is a powerful digestive stimulant for people with heavy, slow digestion after rich meals. Take a pinch before meals to pre-kindle Agni. Not recommended for people with ulcers or active acidity.</p>

<h2>Tips for Safe Use</h2>
<ul>
  <li>Start with small doses (¼ tsp) and increase gradually.</li>
  <li>Always take churnas with warm (not cold) water.</li>
  <li>Stop if you notice any burning or increased discomfort.</li>
  <li>Pregnant women should consult a vaidya before use.</li>
</ul>`,
  },
  {
    title: "Women's Wellness: Balancing Health the Ayurvedic Way",
    slug:  "womens-wellness-ayurveda",
    excerpt:
      "From sustained energy to hormonal balance, classical Ayurvedic herbs like Shatavari and Ashoka have supported women's health for generations.",
    coverImage: img("1600334129128-685c5582fd35"), // spa / wellness
    categories: ["Women's Care"],
    tags: ["shatavari", "ashoka", "womens-health", "hormonal-balance", "ayurveda"],
    readingTime: 6,
    content: `<h2>A Holistic View of Women's Health</h2>
<p>Ayurveda has dedicated an entire branch of medicine — <em>Stri Roga</em> (women's science) — to the unique physiological and energetic needs of women across every life stage: from menarche through pregnancy to menopause. The approach is not symptom-suppression but cycle-synchronisation.</p>

<h2>Shatavari — The Queen of Women's Herbs</h2>
<p>Shatavari (<em>Asparagus racemosus</em>) is Ayurveda's most celebrated women's tonic. Its phytoestrogenic compounds support estrogen regulation, improve uterine tone, and enhance lactation. Research also confirms it reduces PMS symptoms and eases perimenopausal hot flashes. Take 1 tsp of Shatavari powder in warm milk with a little ghee and honey daily.</p>

<h2>Ashoka — For Menstrual Harmony</h2>
<p>The Ashoka tree bark is a uterine tonic and anti-spasmodic that specifically addresses heavy bleeding, painful periods, and irregular cycles. It works by toning the uterine muscle and reducing inflammatory prostaglandins. Traditionally taken as a decoction during the menstrual phase.</p>

<h2>Lodhra — Hormonal Balance</h2>
<p>Lodhra bark contains phytochemicals that influence pituitary hormones, making it particularly useful in conditions like PCOS where LH/FSH ratios are disturbed. It also has a gentle astringent action that reduces excess Pitta bleeding.</p>

<h2>Energy and Vitality</h2>
<p>Iron-deficiency anaemia is extremely common in Indian women. Ayurveda addresses this with <em>Lauh Bhasma</em> (calcined iron) combined with Amla to maximise absorption, and <em>Punarnava</em> to clear the tissue channels that allow iron to be utilised.</p>

<h2>A Daily Ritual for Women</h2>
<p>Morning: warm water with Shatavari. Midday: include iron-rich foods (sesame seeds, jaggery, spinach). Evening: Ashwagandha in warm milk to calm the nervous system and support restful sleep. Consistency over 3 months transforms wellbeing far beyond what any single remedy can achieve.</p>`,
  },
  {
    title: "Styling Ethnic Wear: Kurtis & Suits for Every Occasion",
    slug:  "styling-ethnic-wear",
    excerpt:
      "From breezy cotton kurtis for the office to silk-blend suit sets for festivities — a simple guide to building a versatile ethnic wardrobe.",
    coverImage: img("1583391733956-3750e0ff4e8b"), // woman in anarkali kurti
    categories: ["Lifestyle"],
    tags: ["kurti", "ethnic-wear", "fashion", "suit-sets", "styling"],
    readingTime: 4,
    content: `<h2>Why Ethnic Wear Works Year-Round</h2>
<p>Unlike Western workwear that becomes uncomfortable in Indian summers, a well-chosen cotton kurti breathes naturally and moves with you. Ethnic wear is not reserved for festivals — when styled right it works from morning meetings to evening dinners.</p>

<h2>The Cotton Kurti: Your Everyday Workhorse</h2>
<p>A straight-cut or A-line cotton kurti in a neutral — ivory, sage green, dusty rose — pairs with palazzos, cigarette pants or even tailored jeans. Look for natural dyes and hand-block prints for pieces that stay beautiful after dozens of washes. Roll up the sleeves for a relaxed feel or add a statement necklace to elevate it instantly.</p>

<h2>Straight-Cut Kurta Sets</h2>
<p>A matching kurta-palazzo or kurta-pant set eliminates the decision fatigue of pairing separates. The dupatta adds the layering that makes the outfit feel complete for semi-formal occasions. Choose sets in chanderi or cotton silk for events that fall between casual and formal.</p>

<h2>Anarkali and Flared Suits for Celebrations</h2>
<p>Nothing commands attention at a wedding or festival like a well-fitted Anarkali. Opt for heavier fabrics — georgette, net, or silk — with mirror work or embroidery at the neckline and hem. Keep accessories minimal; the suit is the statement.</p>

<h2>Building a Versatile Ethnic Wardrobe</h2>
<ul>
  <li><strong>2 casual cotton kurtis</strong> — for daily wear, mix with Western bottoms</li>
  <li><strong>1 straight kurta set</strong> — for office and lunch events</li>
  <li><strong>1 silk-blend Anarkali</strong> — for weddings and celebrations</li>
  <li><strong>1 printed suit set with dupatta</strong> — the all-rounder</li>
</ul>

<h2>Care Tips</h2>
<p>Hand-wash or gentle machine cycle in cold water. Dry in shade — direct sun fades natural dyes fast. Steam rather than iron embroidered or printed fabrics to preserve texture and colour.</p>`,
  },
];

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  let created = 0;
  let updated = 0;

  for (const blog of BLOGS) {
    const words = blog.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(words / 200));

    const result = await Blog.findOneAndUpdate(
      { slug: blog.slug },
      {
        $set: {
          ...blog,
          author:      ADMIN_AUTHOR,
          status:      "published",
          readingTime,
          publishedAt: new Date(),
          deletedAt:   null,
        },
      },
      { upsert: true, new: true }
    );

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
      console.log(`  ✓ Created: ${blog.title}`);
    } else {
      updated++;
      console.log(`  ↺ Updated: ${blog.title}`);
    }
  }

  console.log(`\nDone — ${created} created, ${updated} updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
