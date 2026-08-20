/** 공시 카드에 표시 */
export type CardDetail = {
  label: string;
  value: string;
};

/**
 * GET /cards의 공통 카드 목록 조회
 * 다섯 출처 탭이 같은 컴포넌트를 사용하며, 해당하지 않는 필드는 null
 */
export type Card = {
  card_id: number;
  label: string | null;
  label_reason: string | null;
  title: string;
  doc_type: string | null;
  doc_type_name: string | null;
  summary_short: string | null;
  summary_full: string | null;
  hard_terms: string[] | null;
  source_name: string;
  published_at: string | null;
  origin_url: string | null;
  is_saved: boolean;
  thumbnail_url: string | null;
  channel_name: string | null;
  view_count: number | null;
  indicator_value: string | null;
  details: CardDetail[] | null;
};

/** GET /cards?tab=&stock_code= 응답. + 상세 모달 필드 */
export type CardListResponse = {
  tab: string;
  market: string;
  stock_code: string;
  link_sentence: string | null;
  disclaimer: boolean;
  reason: string | null;
  items: Card[];
};

/** POST /terms/explain 요청. 선택 용어+문맥 전달  */
export type TermExplainRequest = {
  term: string;
  tab: string;
  context: string | null;
};

/** 용어 설명을 생성할 때 사용한 RAG 근거 한 건입니다. */
export type TermSource = {
  term: string;
  source: string;
  similarity: number;
};

/** POST /terms/explain 응답입니다. 설명 생성 실패 시 explanation은 null일 수 있습니다. */
export type TermExplainResponse = {
  term: string;
  tab: string;
  explanation: string | null;
  sources: TermSource[];
  cached: boolean;
};

/**
 * GET /me/saved-cards : 스냅샷 기능
 */
export type SavedCardItem = {
  card_id: number | null;
  tab: string;
  stock_code: string;
  stock_name: string | null;
  saved_at: string;
  snapshot: Record<string, unknown>;
};

export type SavedCardListResponse = {
  items: SavedCardItem[];
};

/** POST /me/saved-cards 요청입니다. */
export type SavedCardAddRequest = {
  card_id: number;
  stock_code: string;
};

/** 중복 저장은 오류가 아니라 already_saved로 구분됩니다. */
export type SavedCardAddResponse = {
  item: SavedCardItem;
  already_saved: boolean;
};

/** DELETE /me/saved-cards/{card_id} 응답입니다. */
export type SavedCardDeleteResponse = {
  removed: boolean;
};
