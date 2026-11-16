// Génère les visuels de la fiche Play Store dans `store/graphics/` à partir du logo :
//   - icône 512×512 (exigée par Google Play),
//   - image de présentation 1024×500, en français et en anglais.
import sharp from 'sharp';

const OUT = 'store/graphics';

await sharp('resources/icon-only.png').resize(512, 512).png().toFile(`${OUT}/icon-512.png`);

const TAGLINES = {
  fr: ['Tes médicaments, à l’heure.', 'Et des rappels qui ne lâchent rien.'],
  en: ['Your meds, right on time.', 'With reminders that never let go.'],
};

const logo = await sharp('resources/icon-only.png').resize(300, 300).png().toBuffer();
const mask = Buffer.from('<svg width="300" height="300"><rect width="300" height="300" rx="66" ry="66"/></svg>');
const roundedLogo = await sharp(logo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

for (const [lang, [line1, line2]] of Object.entries(TAGLINES)) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
      <rect width="1024" height="500" fill="#f3e9d7"/>
      <rect y="470" width="1024" height="30" fill="#e8dbc2"/>
      <text x="420" y="205" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="68" font-weight="700" fill="#3b3022">Levo Reminder</text>
      <text x="422" y="275" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="34" fill="#8a6f47">${line1}</text>
      <text x="422" y="322" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="34" fill="#8a6f47">${line2}</text>
    </svg>`;
  await sharp(Buffer.from(svg))
    .composite([{ input: roundedLogo, left: 80, top: 100 }])
    .png()
    .toFile(`${OUT}/feature-graphic-${lang}.png`);
}
console.log(`Visuels générés dans ${OUT}/`);
