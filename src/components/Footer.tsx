import Image from 'next/image';

export function Footer() {
  return (
    <footer className="mt-20 px-6 py-10 bg-slate-900 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex items-center gap-4">
          <Image 
            src="/icon-512x512.png" 
            alt="Logo KRIKA'5" 
            width={100}  
            height={100} 
            className="rounded-3xl" // Nettoyé: mb-8 et drop-shadow-2xl retirés
            priority 
          />
          <p className="text-slate-500 font-medium">© Krika5. Tous droits réservés.</p>
        </div>
        
        {/* Signature webappci - Cadre réduit */}
        {/* Modifié: md:items-end retiré pour centrer, gap-3 à gap-2, p-4 à p-2 */}
        <div className="flex flex-col items-center gap-2 border border-blue/10 p-2 rounded-xl">
          <p className="text-slate-500 font-medium text-sm">Une création</p>
          <a href="https://www.webappci.com" target="_blank" rel="noopener noreferrer" className="block">
            <Image 
            src="/logo-webappci.png" 
            alt="Logo WebAppCI" 
            width={64}  
            height={64} 
            
            className="rounded-3xl shadow-xl shadow-cyan-500/50" 
            priority 
          />
          </a>
          <a href="https://www.webappci.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-bold transition-colors">
            www.webappci.com
          </a>
        </div>
      </div>
    </footer>
  );
}
