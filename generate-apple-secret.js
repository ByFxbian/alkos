const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration (extracted from your existing configuration)
const TEAM_ID = "DW239Z4DYF";
const KEY_ID = "367W6WD9GC";
const CLIENT_ID = "at.alkosbarber.signin";

const keyFileName = "apple-private-key.p8";
const keyFilePath = path.join(__dirname, keyFileName);

console.log("==========================================");
console.log("🍎 APPLE CLIENT SECRET JWT GENERATOR 🍎");
console.log("==========================================\n");

if (!fs.existsSync(keyFilePath)) {
  console.error(`❌ Fehler: Datei "${keyFileName}" nicht gefunden!`);
  console.log(`\nBitte lade deine private Schlüsseldatei (.p8) aus dem Apple Developer Portal herunter.`);
  console.log(`Speichere sie als "${keyFileName}" im Hauptordner deines Projekts:`);
  console.log(`👉 ${__dirname}\n`);
  console.log("Sobald die Datei dort liegt, starte dieses Skript erneut.");
  process.exit(1);
}

try {
  const privateKey = fs.readFileSync(keyFilePath, 'utf8');

  // Verify private key format
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    console.error("❌ Fehler: Die Datei scheint kein gültiger privater Schlüssel im PEM-Format zu sein.");
    console.log("Ein gültiger Schlüssel beginnt mit '-----BEGIN PRIVATE KEY-----'.");
    process.exit(1);
  }

  function base64url(buf) {
    return buf.toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  const header = {
    alg: 'ES256',
    kid: KEY_ID
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (180 * 24 * 60 * 60); // 180 days (maximum duration allowed by Apple)

  const payload = {
    iss: TEAM_ID,
    iat: now,
    exp: exp,
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID
  };

  const tokenInput = base64url(Buffer.from(JSON.stringify(header))) + '.' + base64url(Buffer.from(JSON.stringify(payload)));

  // Sign using ECDSA ES256
  const signature = crypto.sign(
    'SHA256',
    Buffer.from(tokenInput),
    {
      key: privateKey,
      dsaEncoding: 'ieee-p1363'
    }
  );

  const clientSecret = tokenInput + '.' + base64url(signature);

  console.log("✅ Erfolg! Dein neues Apple Client Secret wurde generiert.");
  console.log("\n--------------------------------------------------");
  console.log("Gültig bis:", new Date(exp * 1000).toLocaleString('de-DE'));
  console.log("--------------------------------------------------\n");
  console.log("Kopiere den folgenden Token:");
  console.log("\n" + clientSecret + "\n");
  console.log("--------------------------------------------------");
  console.log("👉 Trage diesen Wert bei deiner Vercel-Umgebungsvariable 'APPLE_SECRET' ein.");
  console.log("👉 (Optional) Aktualisiere auch deinen lokalen '.env' oder '.env.local' File.");
  console.log("--------------------------------------------------\n");

} catch (err) {
  console.error("❌ Fehler beim Generieren des Tokens:", err.message);
}
