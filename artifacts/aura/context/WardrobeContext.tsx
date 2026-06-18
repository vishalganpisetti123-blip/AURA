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
const STORAGE_KEY_PLANNED = "@aura_planned_dates";

interface WardrobeContextValue {
  items: ClothingItem[];
  laundryItems: ClothingItem[];
  savedOutfits: SavedOutfit[];
  plannedDates: Record<string, string>;
  isLoading: boolean;
  addItem: (item: ClothingItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  saveOutfit: (outfit: SavedOutfit) => Promise<void>;
  removeOutfit: (id: string) => Promise<void>;
  sendToLaundry: (id: string) => Promise<void>;
  returnFromLaundry: (id: string) => Promise<void>;
  resetLaundry: () => Promise<void>;
  markAsWorn: (id: string) => Promise<void>;
  markOutfitAsWorn: (outfitId: string) => Promise<void>;
  planOutfitForDate: (date: string, outfitId: string | null) => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [laundryItems, setLaundryItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [plannedDates, setPlannedDates] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemsJson, outfitsJson, laundryJson, plannedJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_ITEMS),
          AsyncStorage.getItem(STORAGE_KEY_OUTFITS),
          AsyncStorage.getItem(STORAGE_KEY_LAUNDRY),
          AsyncStorage.getItem(STORAGE_KEY_PLANNED),
        ]);
        if (itemsJson) setItems(JSON.parse(itemsJson));
        if (outfitsJson) setSavedOutfits(JSON.parse(outfitsJson));
        if (laundryJson) setLaundryItems(JSON.parse(laundryJson));
        if (plannedJson) setPlannedDates(JSON.parse(plannedJson));
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

  const markAsWorn = useCallback(async (id: string) => {
    setItems((prevItems) => {
      const item = prevItems.find((i) => i.id === id);
      if (!item) return prevItems;
      const updatedItem: ClothingItem = {
        ...item,
        wornCount: (item.wornCount ?? 0) + 1,
        lastWornAt: new Date().toISOString(),
      };
      const nextItems = prevItems.filter((i) => i.id !== id);
      setLaundryItems((prevLaundry) => {
        const nextLaundry = [updatedItem, ...prevLaundry];
        AsyncStorage.setItem(STORAGE_KEY_LAUNDRY, JSON.stringify(nextLaundry));
        return nextLaundry;
      });
      AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(nextItems));
      return nextItems;
    });
  }, []);

  const markOutfitAsWorn = useCallback(
    async (outfitId: string) => {
      const outfit = savedOutfits.find((o) => o.id === outfitId);
      if (!outfit) return;
      setItems((prevItems) => {
        const outfitItemIds = new Set(outfit.itemIds);
        const toMark = prevItems.filter((i) => outfitItemIds.has(i.id));
        if (toMark.length === 0) return prevItems;
        const now = new Date().toISOString();
        const updated = toMark.map((item) => ({
          ...item,
          wornCount: (item.wornCount ?? 0) + 1,
          lastWornAt: now,
        }));
        const nextItems = prevItems.filter((i) => !outfitItemIds.has(i.id));
        setLaundryItems((prevLaundry) => {
          const nextLaundry = [...updated, ...prevLaundry];
          AsyncStorage.setItem(STORAGE_KEY_LAUNDRY, JSON.stringify(nextLaundry));
          return nextLaundry;
        });
        AsyncStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(nextItems));
        return nextItems;
      });
    },
    [savedOutfits]
  );

  const planOutfitForDate = useCallback(
    async (date: string, outfitId: string | null) => {
      setPlannedDates((prev) => {
        const next = { ...prev };
        if (outfitId) {
          next[date] = outfitId;
        } else {
          delete next[date];
        }
        AsyncStorage.setItem(STORAGE_KEY_PLANNED, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  return (
    <WardrobeContext.Provider
      value={{
        items,
        laundryItems,
        savedOutfits,
        plannedDates,
        isLoading,
        addItem,
        removeItem,
        updateItem,
        saveOutfit,
        removeOutfit,
        sendToLaundry,
        returnFromLaundry,
        resetLaundry,
        markAsWorn,
        markOutfitAsWorn,
        planOutfitForDate,
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
