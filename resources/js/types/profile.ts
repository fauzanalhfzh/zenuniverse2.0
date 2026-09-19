export interface ProfileBadge {
    id: string;
    title: string;
    description: string;
    emoji: string;
    iconPath: string;
    unlocked: boolean;
}

export interface ProfileLevel {
    current: { level: number; name: string; minXp: number; nextXp: number };
    currentXp: number;
    xpIntoLevel: number;
    xpToNextLevel: number;
    percent: number;
}

export interface ProfileProps {
    displayName: string;
    avatarUrl: string | null;
    joinedAt: string | null;
    gamification: {
        totalXp: number;
        currentStreak: number;
        longestStreak: number;
    };
    level: ProfileLevel;
    completedLessonCount: number;
    totalLessonCount: number;
    badges: ProfileBadge[];
    unlockedBadgeIds: string[];
    unlockedBadgeCount: number;
}

export interface LeaderboardEntry {
    rank: number;
    userId: number;
    displayName: string;
    avatarUrl: string | null;
    totalXp: number;
    isViewer: boolean;
}

export interface LeaderboardProps {
    entries: LeaderboardEntry[];
    page: number;
    pageSize: number;
    totalParticipants: number;
    totalPages: number;
    viewerRank: number | null;
}
