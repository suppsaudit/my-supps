export interface UserSupplementWithSupplement {
  user_id: string;
  supplement_id: string;
  is_owned: boolean;
  is_selected: boolean;
  daily_intake: number;
  notes: string | null;
  added_at: string;
  supplement: {
    id: string;
    iherb_id: string | null;
    name_ja: string;
    name_en: string | null;
    brand: string;
    images: Record<string, unknown>;
  };
}