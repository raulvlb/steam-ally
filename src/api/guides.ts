const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface GuideAuthor {
  id: string;
  username: string;
  avatar: string | null;
  steamId: string;
}

export interface Guide {
  id: string;
  steamAppId: number;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author: GuideAuthor;
  totalLikes: number;
  likedByUser: boolean;
  savedByUser: boolean;
}

export interface PaginatedGuides {
  data: Guide[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateGuideData {
  steamAppId: number;
  title: string;
  content: string;
  isPublic?: boolean;
}

export interface UpdateGuideData {
  title?: string;
  content?: string;
  isPublic?: boolean;
}

class GuidesApi {
  private baseUrl = `${API_BASE_URL}`;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // List public guides
  async getPublicGuides(
    page: number = 1,
    pageSize: number = 20,
    appId?: number
  ): Promise<PaginatedGuides> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (appId) {
      params.append('appId', appId.toString());
    }

    const result = await this.request<{ success: boolean; data: Guide[]; pagination: any }>(
      `/guides?${params}`
    );
    
    return {
      data: result.data,
      pagination: result.pagination,
    };
  }

  // Get user's own guides
  async getMyGuides(page: number = 1, pageSize: number = 20): Promise<PaginatedGuides> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const result = await this.request<{ success: boolean; data: Guide[]; pagination: any }>(
      `/guides/my?${params}`
    );
    
    return {
      data: result.data,
      pagination: result.pagination,
    };
  }

  // Get single guide
  async getGuide(id: string): Promise<Guide> {
    const result = await this.request<{ success: boolean; data: Guide }>(
      `/guides/${id}`
    );
    return result.data;
  }

  // Create guide
  async createGuide(data: CreateGuideData): Promise<Guide> {
    const result = await this.request<{ success: boolean; data: Guide }>(
      '/guides',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  // Update guide
  async updateGuide(id: string, data: UpdateGuideData): Promise<Guide> {
    const result = await this.request<{ success: boolean; data: Guide }>(
      `/guides/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return result.data;
  }

  // Delete guide
  async deleteGuide(id: string): Promise<void> {
    await this.request(`/guides/${id}`, {
      method: 'DELETE',
    });
  }

  // Save/unsave guide
  async saveGuide(id: string): Promise<void> {
    await this.request(`/guides/${id}/save`, {
      method: 'POST',
    });
  }

  async unsaveGuide(id: string): Promise<void> {
    await this.request(`/guides/${id}/save`, {
      method: 'DELETE',
    });
  }

  // Get saved guides
  async getSavedGuides(page: number = 1, pageSize: number = 20): Promise<PaginatedGuides> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const result = await this.request<{ success: boolean; data: Guide[]; pagination: any }>(
      `/users/me/saved-guides?${params}`
    );
    
    return {
      data: result.data,
      pagination: result.pagination,
    };
  }

  // Like/unlike guide
  async likeGuide(id: string): Promise<{ totalLikes: number }> {
    const result = await this.request<{ success: boolean; totalLikes: number }>(
      `/guides/${id}/like`,
      {
        method: 'POST',
      }
    );
    return { totalLikes: result.totalLikes };
  }

  async unlikeGuide(id: string): Promise<{ totalLikes: number }> {
    const result = await this.request<{ success: boolean; totalLikes: number }>(
      `/guides/${id}/like`,
      {
        method: 'DELETE',
      }
    );
    return { totalLikes: result.totalLikes };
  }
}

export const guidesApi = new GuidesApi();
