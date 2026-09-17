/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sans ça, le serveur de dev bloque le hot-reload (HMR) pour toute
  // connexion venant d'ailleurs que localhost — les logs montraient
  // "Blocked cross-origin request to Next.js dev resource /_next/hmr from
  // '192.168.1.213'". Concrètement : un test depuis le téléphone (adresse
  // réseau local) pouvait tourner sur un bundle JS périmé tant que la page
  // n'était pas rechargée manuellement, masquant les correctifs déjà
  // appliqués. Adapter/étendre cette liste si l'IP locale change.
  allowedDevOrigins: ["192.168.1.213"],
};

export default nextConfig;
