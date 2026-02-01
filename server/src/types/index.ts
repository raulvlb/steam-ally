export interface User {
  id: string;
  steam_id: string;
  username: string;
  avatar: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Guide {
  id: string;
  author_id: string;
  steam_app_id: number;
  title: string;
  content: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GuideWithDetails extends Guide {
  author_username: string;
  author_avatar: string | null;
  author_steam_id: string;
  total_likes: number;
  liked_by_user: boolean;
  saved_by_user: boolean;
}

export interface SavedGuide {
  user_id: string;
  guide_id: string;
  created_at: Date;
}

export interface GuideLike {
  user_id: string;
  guide_id: string;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  steamId: string;
  username: string;
}

export interface SteamProfile {
  steamid: string;
  personaname: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  profileurl: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
