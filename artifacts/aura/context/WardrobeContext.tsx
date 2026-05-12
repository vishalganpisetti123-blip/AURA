import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ClothingItem, SavedOutfit } from "@/types/wardrobe";

const STORAGE_KEY_ITEMS = "@aura_wardrobe_items";
const STORAGE_KEY_OUTFITS = "@aura_saved_outfits";

interface WardrobeContextValue {
  items: ClothingItem[];
  savedOutfits: SavedOutfit[];
  isLoading: boolean;
  addItem: (item: ClothingItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  saveOutfit: (outfit: SavedOutfit) => Promise<void>;
  removeOutfit: (id: string) => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemsJson, outfitsJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_ITEMS),
          AsyncStorage.getItem(STORAGE_KEY_OUTFITS),
        ]);
        if (itemsJson) setItems(JSON.parse(itemsJson));
        if (outfitsJson) setSavedOutfits(JSON.parse(outfitsJson));
      } catch (_) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addItem = useCallback(async (item: ClothingItem) => {
    setItems((prev) => {
      const next = [item, ...prev];
      AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateItem = useCallback(
    async (id: string, updates: Partial<ClothingItem>) => {
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
        AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const saveOutfit = useCallback(async (outfit: SavedOutfit) => {
    setSavedOutfits((prev) => {
      const next = [outfit, ...prev];
      AsyncStorage.setItem(STORAGE_KEY_OUTFITS, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeOutfit = useCallback(async (id: string) => {
    setSavedOutfits((prev) => {
      const next = prev.filter((o) => o.id !== id);
      AsyncStorage.setItem(STORAGE_KEY_OUTFITS, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <WardrobeContext.Provider
      value={{
        items,
        savedOutfits,
        isLoading,
        addItem,
        removeItem,
        updateItem,
        saveOutfit,
        removeOutfit,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error("useWardrobe must be used within WardrobeProvider");
  return ctx;
}
