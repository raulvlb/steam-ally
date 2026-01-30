import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage, ProfilePage, GamesPage, GamesExplorePage, GameDetailPage, AchievementsPage, GuideEditorPage, GuideViewPage, GuidesLibraryPage } from '@/pages';
import { ProtectedRoute } from '@/components';

/**
 * App Routes
 * Defines all application routes with authentication protection
 */

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route 
        path="/games" 
        element={
          <ProtectedRoute>
            <GamesExplorePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/games/:steamId" 
        element={
          <ProtectedRoute>
            <GamesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/game/:appId" 
        element={
          <ProtectedRoute>
            <GameDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile/:steamId" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      <Route path="/profile" element={<Navigate to="/" replace />} />
      <Route 
        path="/guides" 
        element={
          <ProtectedRoute>
            <GuidesLibraryPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/achievements/:steamId/:appId" 
        element={
          <ProtectedRoute>
            <AchievementsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/guide/:steamId/:appId" 
        element={
          <ProtectedRoute>
            <GuideEditorPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/guide/new/:appId" 
        element={
          <ProtectedRoute>
            <GuideEditorPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/guide/view/:steamId/:appId" 
        element={
          <ProtectedRoute>
            <GuideViewPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
