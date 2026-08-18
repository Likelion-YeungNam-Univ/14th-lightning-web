export type EconCardItem = {
  id: number;
  title: string;
};

export type EconCardListResponse = {
  items: EconCardItem[];
  rotated_at: string | null;
};

export type EconCardSource = {
  number: number;
  org: string;
  doc_title: string;
  url: string;
};

export type EconCardDetailResponse = {
  id: number;
  title: string;
  body: string;
  sources: EconCardSource[];
};
