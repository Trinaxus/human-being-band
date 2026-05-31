export interface Sound {
  id: string;
  name: string;
  file: File;
  url: string;
  size: number;
  type: string;
  duration: number;
  schedules: Schedule[];
  isFavorite?: boolean;
  order?: number;
  categoryId?: string | null;
}

export interface Schedule {
  id: string;
  time: string; // format: HH:mm
  active: boolean;
  lastPlayed?: string; // ISO date string
}