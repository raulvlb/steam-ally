import { Link } from 'react-router-dom';
import { Clock, Gamepad2 } from 'lucide-react';
import { GameDetails } from '@/types';
import { formatPlaytime } from '@/utils';
import { Card } from './Card';
import { useState } from 'react';

/**
 * GameCard Component
 * Displays game information in a card
 */

interface GameCardProps {
  game: GameDetails;
  steamId?: string;
  showPlaytime?: boolean;
}

export function GameCard({ game, steamId, showPlaytime = true }: GameCardProps) {
  const playtimeHours = Math.floor(game.playtime / 60);
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      to={steamId ? `/achievements/${steamId}/${game.appId}` : `/game/${game.appId}`}
      className="block"
    >
      <Card hoverable className="overflow-hidden h-full">
        {/* Game Image */}
        <div className="relative h-40 bg-gradient-to-br from-steam-light to-steam-dark overflow-hidden">
          {game.logoUrl && !imageError ? (
            <img
              src={game.logoUrl}
              alt={game.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 className="w-12 h-12 text-gray-500 dark:text-gray-400 opacity-50" />
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3rem]">
            {game.name}
          </h3>

          {showPlaytime && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatPlaytime(game.playtime)}</span>
              {game.playtimeRecent && (
                <span className="ml-2 text-steam-accent">
                  (+{formatPlaytime(game.playtimeRecent)} recently)
                </span>
              )}
            </div>
          )}

          {playtimeHours > 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {playtimeHours} hours played
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
