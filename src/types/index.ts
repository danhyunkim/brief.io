// src/types/index.ts

export type RiskFlag = {
    title: string;
    clause: string;
    page: number;
    citations: string[];
    blindSpot: string;
  };
  
  export type DocumentRow = {
    id: string;
    user_id: string;
    filename: string;
    uploaded_at: string;
    summary: string;
    risks: RiskFlag[];
  };
  