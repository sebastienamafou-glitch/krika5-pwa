// src/app/~offline/page.tsx
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Mode Hors-Ligne - KRIKA&apos;5",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
        R&eacute;seau Perdu
      </h1>
      <p className="text-slate-400 font-medium max-w-md mb-8 leading-relaxed">
        Vous &ecirc;tes actuellement hors-ligne. Les commandes en attente dans votre panier seront automatiquement synchronis&eacute;es d&egrave;s le retour de la connexion.
      </p>
      <Link href="/hub" passHref>
        <Button className="h-14 px-8 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl text-lg transition-colors">
          R&eacute;essayer
        </Button>
      </Link>
    </div>
  );
}
