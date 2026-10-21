/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LuminoriaProvider, useLuminoria } from './context/LuminoriaContext';
import { HomeScreen } from './screens/HomeScreen';
import { ChannelsScreen } from './screens/ChannelsScreen';
import { SeriesScreen } from './screens/SeriesScreen';
import { CinemaRoomScreen } from './screens/CinemaRoomScreen';
import { PlaylistsScreen } from './screens/PlaylistsScreen';
import { FavoritesScreen } from './screens/FavoritesScreen';
import { ShopAndRankScreen } from './screens/ShopAndRankScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { VideoPlayerModal } from './components/modals/VideoPlayerModal';
import { FriendsDrawer } from './components/modals/FriendsDrawer';
import { RankingDrawer } from './components/modals/RankingDrawer';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';
import { TmdbSyncModal } from './components/modals/TmdbSyncModal';
import { MovieDetailModal } from './components/modals/MovieDetailModal';
import { AuthModal } from './components/modals/AuthModal';
import { BottomAppDock } from './components/layout/BottomAppDock';
import { LuminoriaAnimatedIntro } from './components/intro/LuminoriaAnimatedIntro';
import { AuthGateScreen } from './screens/AuthGateScreen';
import { useTvRemoteNavigation } from './hooks/useTvRemoteNavigation';

const MainWorkspace: React.FC = () => {
  useTvRemoteNavigation();
  const {
    activeNav,
    isTmdbSyncModalOpen,
    setIsTmdbSyncModalOpen,
    selectedTmdbMovie,
    closeTmdbMovieDetail,
    showIntro,
    setShowIntro,
    isLoggedIn,
    activeScheme,
  } = useLuminoria();

  const handleIntroComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('luminoria_intro_played', '1');
    }
    setShowIntro(false);
  };

  if (!isLoggedIn) {
    return <AuthGateScreen />;
  }

  return (
    <div
      id="top"
      className="min-h-screen text-[#F4F4F6] flex flex-col justify-between transition-colors duration-300"
      style={{
        backgroundColor: '#050508',
        backgroundImage: `radial-gradient(circle at 50% 0%, ${activeScheme.primaryHex}18 0%, #050508 50%)`,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 16px))',
      }}
    >
      {showIntro && <LuminoriaAnimatedIntro onComplete={handleIntroComplete} />}

      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 pt-4 flex-1">
        {activeNav === 'home' && <HomeScreen />}
        {activeNav === 'channels' && <ChannelsScreen />}
        {activeNav === 'series' && <SeriesScreen />}
        {activeNav === 'cinema' && <CinemaRoomScreen />}
        {activeNav === 'playlists' && <PlaylistsScreen />}
        {activeNav === 'favorites' && <FavoritesScreen />}
        {activeNav === 'shop' && <ShopAndRankScreen />}
        {activeNav === 'profile' && <ProfileScreen />}
      </main>

      <BottomAppDock />
      <VideoPlayerModal />
      <FriendsDrawer />
      <RankingDrawer />
      <NotificationsDrawer />
      <AuthModal />
      <TmdbSyncModal
        isOpen={isTmdbSyncModalOpen}
        onClose={() => setIsTmdbSyncModalOpen(false)}
      />
      <MovieDetailModal
        movie={selectedTmdbMovie}
        onClose={closeTmdbMovieDetail}
      />
    </div>
  );
};

export default function App() {
  return (
    <LuminoriaProvider>
      <MainWorkspace />
    </LuminoriaProvider>
  );
}
