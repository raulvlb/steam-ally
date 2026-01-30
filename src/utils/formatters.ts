/**
 * Utility functions for formatting data
 */

/**
 * Format currency based on locale
 * Maps language codes to currency codes and formats
 */
export function formatCurrency(amount: number, locale: string = 'en'): string {
  // amount is in cents, convert to dollars/reais
  const value = amount / 100;
  
  // Map locale to currency configuration
  const currencyMap: Record<string, { code: string; locale: string }> = {
    'en': { code: 'USD', locale: 'en-US' },
    'pt-BR': { code: 'BRL', locale: 'pt-BR' },
    'pt': { code: 'BRL', locale: 'pt-BR' },
    'es': { code: 'EUR', locale: 'es-ES' },
    'fr': { code: 'EUR', locale: 'fr-FR' },
    'it': { code: 'EUR', locale: 'it-IT' },
    'de': { code: 'EUR', locale: 'de-DE' },
  };

  const config = currencyMap[locale] || currencyMap['en'];

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    // Fallback if Intl fails
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Format playtime from minutes to human-readable format
 */
export function formatPlaytime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    return `${days}d`;
  }

  return `${days}d ${remainingHours}h`;
}

/**
 * Format large numbers with K, M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format date from timestamp
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(timestamp);
  }
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

/**
 * Get persona state label
 */
export function getPersonaStateLabel(state: number): string {
  const states: Record<number, string> = {
    0: 'Offline',
    1: 'Online',
    2: 'Busy',
    3: 'Away',
    4: 'Snooze',
    5: 'Looking to Trade',
    6: 'Looking to Play',
  };
  return states[state] || 'Unknown';
}

/**
 * Get persona state color
 */
export function getPersonaStateColor(state: number): string {
  const colors: Record<number, string> = {
    0: 'text-gray-500',
    1: 'text-green-500',
    2: 'text-red-500',
    3: 'text-yellow-500',
    4: 'text-blue-500',
    5: 'text-purple-500',
    6: 'text-cyan-500',
  };
  return colors[state] || 'text-gray-500';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate Steam CDN image URL
 */
export function getSteamImageUrl(appId: number, hash: string, _size: 'icon' | 'logo' = 'icon'): string {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${hash}.jpg`;
}

/**
 * Validate Steam ID format
 */
export function isValidSteamId(input: string): boolean {
  // Steam ID64 is 17 digits
  return /^\d{17}$/.test(input);
}

/**
 * Extract Steam ID from profile URL
 */
export function extractSteamId(url: string): string | null {
  // Match Steam ID64
  const id64Match = url.match(/\d{17}/);
  if (id64Match) {
    return id64Match[0];
  }

  // Match vanity URL
  const vanityMatch = url.match(/steamcommunity\.com\/id\/([^/]+)/);
  if (vanityMatch) {
    return vanityMatch[1];
  }

  // Match profiles URL
  const profileMatch = url.match(/steamcommunity\.com\/profiles\/([^/]+)/);
  if (profileMatch) {
    return profileMatch[1];
  }

  return null;
}
