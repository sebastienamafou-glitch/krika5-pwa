// /src/hooks/useOfflineSync.ts
import { useEffect, useState, useCallback, useRef } from "react";
import { usePosStore } from "../store/usePosStore";
import { createPosOrder } from "@/actions/pos";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  const syncQueue = usePosStore((state) => state.syncQueue);
  const dequeueOrder = usePosStore((state) => state.dequeueOrder);
  
  // Utilisation d'une ref pour éviter que isSyncing ne bloque la fermeture des closures
  const isSyncingRef = useRef(isSyncing);
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  // 1. Initialisation de l'état réseau (SSR Safe)
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
  }, []);

  // 2. Le moteur de synchronisation (Batch Processing)
  const processQueue = useCallback(async () => {
    // Si la file est vide, si on est hors-ligne, ou si une synchro est déjà en cours, on coupe.
    if (usePosStore.getState().syncQueue.length === 0 || !navigator.onLine || isSyncingRef.current) {
      return;
    }

    setIsSyncing(true);

    // On utilise une boucle while pour traiter séquentiellement le premier élément (index 0).
    // On relit le state à chaque itération pour avoir la donnée fraîche.
    while (usePosStore.getState().syncQueue.length > 0 && navigator.onLine) {
      const currentQueue = usePosStore.getState().syncQueue;
      const orderToSync = currentQueue[0];
      
      try {
        const response = await createPosOrder(orderToSync);
        
        if (response.success) {
          // Succès de la transaction Prisma : on dépile l'index 0
          dequeueOrder(0); 
        } else {
          // Erreur métier (ex: stock insuffisant, shift fermé côté serveur).
          // On casse la boucle pour éviter un flood d'erreurs et on garde la transaction en mémoire.
          console.error("Erreur métier lors de la synchro :", response.error);
          break; 
        }
      } catch {
        // Erreur réseau inattendue pendant le fetch
        break;
      }
    }

    setIsSyncing(false);
  }, [dequeueOrder]);

  // 3. Listeners d'événements réseau du navigateur
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue(); // Déclenchement automatique au retour de la connexion
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [processQueue]);

  // 4. Déclencheur passif : si une commande est ajoutée au store alors qu'on est en ligne
  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && !isSyncing) {
      processQueue();
    }
  }, [isOnline, syncQueue.length, isSyncing, processQueue]);

  // On retourne ces données pour pouvoir animer une icône "Cloud" dans l'UI du POS
  return { 
    isOnline, 
    isSyncing, 
    pendingCount: syncQueue.length 
  };
}
