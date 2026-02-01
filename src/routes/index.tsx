import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  HomePage, 
  ProfilePage, 
  GamesPage, 
  GamesExplorePage, 
  GameDetailPage, 
  AchievementsPage, 
  GuideEditorPage, 
  GuideViewPage, 
  GuidesLibraryPage,
  CommunityGuidesPage,
  CommunityGuideDetailPage
} from '@/pages';
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
      
      {/* Legacy guides routes (local storage) */}
      <Route 
        path="/guides" 
        element={
          <ProtectedRoute>
            <GuidesLibraryPage />
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
      
      {/* Community guides routes (API-based) */}
      <Route path="/community-guides" element={<CommunityGuidesPage />} />
      <Route path="/community-guide/:id" element={<CommunityGuideDetailPage />} />
      <Route 
        path="/guide/create" 
        element={
          <ProtectedRoute>
            <GuideEditorPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/guide/create/:appId" 
        element={
          <ProtectedRoute>
            <GuideEditorPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/guide/edit/:id" 
        element={
          <ProtectedRoute>
            <GuideEditorPage />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
