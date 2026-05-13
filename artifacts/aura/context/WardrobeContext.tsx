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
const STORAGE_KEY_LAUNDRY = "@aura_laundry_items";

interface WardrobeContextValue {
  items: ClothingItem[];
  laundryItems: ClothingItem[];
  savedOutfits: SavedOutfit[];
  isLoading: boolean;
  addItem: (item: ClothingItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  saveOutfit: (outfit: SavedOutfit) => Promise<void>;
  removeOutfit: (id: string) => Promise<void>;
  sendToLaundry: (id: string) => Promise<void>;
  returnFromLaundry: (id: string) => Promise<void>;
  resetLaundry: () => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [laundryItems, setLaundryItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemsJson, outfitsJson, laundryJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_ITEMS),
          AsyncStorage.getItem(STORAGE_KEY_OUTFITS),
          AsyncStorage.getItem(STORAGE_KEY_LAUNDRY),
        ]);
        if (itemsJson) setItems(JSON.parse(itemsJson));
        if (outfitsJson) setSavedOutfits(JSON.parse(outfitsJson));
        if (laundryJson) setLaundryItems(JSON.parse(laundryJson));
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

  const sendToLaundry = useCallback(async (id: string) => {
    setItems((prevItems) => {
      const item = prevItems.find((i) => i.id === id);
      if (!item) return prevItems;
      const nextItems = prevItems.filter((i) => i.id !== id);
      setLaundryItems((prevLaundry) => {
        const nextLaundry = [item, ...prevLaundry];
        AsyncStorage.setItem(STORAGE_KEY_LAUNDRY, JSON.stringify(nextLaundry));
        return nextLaundry;
      });
      AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(nextItems));
      return nextItems;
    });
  }, []);

  const returnFromLaundry = useCallback(async (id: string) => {
    setLaundryItems((prevLaundry) => {
      const item = prevLaundry.find((i) => i.id === id);
      if (!item) return prevLaundry;
      const nextLaundry = prevLaundry.filter((i) => i.id !== id);
      setItems((prevItems) => {
        const nextItems = [item, ...prevItems];
        AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(nextItems));
        return nextItems;
      });
      AsyncStorage.setItem(STORAGE_KEY_LAUNDRY, JSON.stringify(nextLaundry));
      return nextLaundry;
    });
  }, []);

  const resetLaundry = useCallback(async () => {
    setLaundryItems((prevLaundry) => {
      if (prevLaundry.length === 0) return prevLaundry;
      setItems((prevItems) => {
        const nextItems = [...prevLaundry, ...prevItems];
        AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(nextItems));
        return nextItems;
      });
      AsyncStorage.setItem(STORAGE_KEY_LAUNDRY, JSON.stringify([]));
      return [];
    });
  }, []);

  return (
    <WardrobeContext.Provider
      value={{
        items,
        laundryItems,
        savedOutfits,
        isLoading,
        addItem,
        removeItem,
        updateItem,
        saveOutfit,
        removeOutfit,
        sendToLaundry,
        returnFromLaundry,
        resetLaundry,
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
