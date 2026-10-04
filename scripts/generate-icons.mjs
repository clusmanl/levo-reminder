// Génère les icônes de l'app à partir des SVG de `resources/` :
//   - PNG sources + favicon,
//   - icônes Android (launcher classique + adaptatif) via @capacitor/assets,
//   - icône monochrome des notifications.
// Le dossier `android/` n'est pas versionné : relancer `npm run icons` après `npx cap add android`.
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SIZE = 1024;
const render = (svg, out, size = SIZE) => sharp(svg, { density: 300 }).resize(size, size).png().toFile(out);

await render('resources/icon-foreground.svg', 'resources/icon-foreground.png');
await render('resources/icon-background.svg', 'resources/icon-background.png');

// Icône complète (fond + premier plan), utilisée pour les anciens Android et le favicon.
await sharp('resources/icon-background.png')
  .composite([{ input: 'resources/icon-foreground.png' }])
  .png()
  .toFile('resources/icon-only.png');
await sharp('resources/icon-only.png').resize(192, 192).png().toFile('public/favicon.png');

execSync('npx capacitor-assets generate --android --assetPath resources', { stdio: 'inherit' });

if (existsSync('android/app/src/main/res')) {
  const drawable = 'android/app/src/main/res/drawable';
  mkdirSync(drawable, { recursive: true });
  copyFileSync('resources/android/ic_stat_notification.xml', `${drawable}/ic_stat_notification.xml`);
}
