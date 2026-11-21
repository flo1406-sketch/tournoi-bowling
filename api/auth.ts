// api/auth.ts
// @ts-ignore - On ignore l'erreur car Node.js est disponible côté serveur Vercel
declare const process: any;

export default function handler(req: any, res: any) {
  // On n'accepte que les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  
  // On lit la variable d'environnement SECRÈTE (sans VITE_)
  const correctPassword = process.env.APP_PASSWORD;

  if (password === correctPassword) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false });
  }
}