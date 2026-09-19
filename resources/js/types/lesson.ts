export type LessonStepType =
    | 'concept'
    | 'quiz'
    | 'blockly'
    | 'code-arrange'
    | 'code-fill'
    | 'code';

export interface QuizOption {
    id: string;
    label: string;
}

export interface ArrangeToken {
    id: string;
    text: string;
}

export interface FillBlank {
    id: string;
    mode: 'choice' | 'text';
    options?: string[];
}

export interface StepReward {
    xp: number;
}

export interface ConceptStep {
    id: string;
    type: 'concept';
    reward: StepReward;
    content: {
        eyebrow?: string;
        title?: string;
        body?: string;
        illustration?: { src: string; alt: string; caption?: string };
        code?: string;
    };
}

export interface QuizStep {
    id: string;
    type: 'quiz';
    reward: StepReward;
    content: {
        question?: string;
        options: QuizOption[];
    };
}

export type BlocklyCommand =
    | { type: 'move_forward' }
    | { type: 'turn_right' }
    | { type: 'repeat'; count: number; children: BlocklyCommand[] };

export interface GridPosition {
    x: number;
    y: number;
}

export type RobotDirection = 'north' | 'east' | 'south' | 'west';

export interface BlocklyChallengeConfig {
    board: { width: number; height: number };
    start: GridPosition & { direction: RobotDirection };
    goal: GridPosition;
    obstacles?: GridPosition[];
    maxExecutionSteps: number;
    maxBlocks?: number;
    starterProgram?: BlocklyCommand[];
    hint: string;
    hints?: string[];
}

export interface BlocklyStep {
    id: string;
    type: 'blockly';
    reward: StepReward;
    content: {
        title?: string;
        objective?: string;
        availableBlocks?: Array<'move_forward' | 'turn_right' | 'repeat'>;
    };
    challenge?: BlocklyChallengeConfig;
}

export interface CodeArrangeStep {
    id: string;
    type: 'code-arrange';
    reward: StepReward;
    content: {
        title?: string;
        instructions?: string;
        language?: string;
        hint?: string;
        tokens: ArrangeToken[];
    };
}

export interface CodeFillStep {
    id: string;
    type: 'code-fill';
    reward: StepReward;
    content: {
        title?: string;
        instructions?: string;
        language?: string;
        hint?: string;
        parts: string[];
        blanks: FillBlank[];
    };
}

export interface CodeStep {
    id: string;
    type: 'code';
    reward: StepReward;
    content: {
        title?: string;
        prompt?: string;
        language?: string;
        starterCode?: string;
        mockOutput?: string;
        sampleInput?: string;
        hint?: string;
    };
}

export type LessonStep =
    | ConceptStep
    | QuizStep
    | BlocklyStep
    | CodeArrangeStep
    | CodeFillStep
    | CodeStep;

export interface LessonPayload {
    id: string;
    title: string;
    description: string;
    completionRewardXp: number;
    contentRevision: number;
    courseId: string;
    courseTitle: string;
    completed: boolean;
    completedStepIds: string[];
    steps: LessonStep[];
}

export interface CourseCatalogItem {
    id: string;
    title: string;
    description: string;
    level: string;
    lessonCount: number;
}

export interface CourseLessonSummary {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    unlocked: boolean;
}

export interface CourseUnitSummary {
    id: string;
    title: string;
    description: string;
    lessons: CourseLessonSummary[];
}

export interface CourseDetail {
    id: string;
    title: string;
    description: string;
    level: string;
    contentRevision: number;
    units: CourseUnitSummary[];
}

export type StepAnswer =
    | { type: 'concept'; acknowledged: true }
    | { type: 'quiz'; optionId: string }
    | { type: 'blockly'; commands: BlocklyCommand[] }
    | { type: 'code-arrange'; tokenIds: string[] }
    | { type: 'code-fill'; answers: Record<string, string> }
    | { type: 'code'; code: string };

export interface StepAttemptInput {
    lesson_id: string;
    step_id: string;
    attempt_id: string;
    content_revision: number;
    answer: StepAnswer;
}

export interface ProgressLevel {
    current: { level: number; name: string; minXp: number; nextXp: number };
    currentXp: number;
    xpIntoLevel: number;
    xpToNextLevel: number;
    percent: number;
}

export interface ProgressSnapshot {
    totalXp: number;
    dailyXp: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    hearts: number;
    heartsCapacity: number;
    heartsRegenMinutes: number;
    nextHeartInMs: number | null;
    badges: string[];
    level: ProgressLevel;
    dailyGoal: {
        progress: number;
        percent: number;
        claimed: boolean;
        remaining: number;
    };
    completedLessonIds: string[];
    completedStepIds: string[];
    courseProgress: Array<{
        courseId: string;
        title: string;
        completed: number;
        total: number;
        percent: number;
    }>;
}

export interface AttemptResult {
    result: { correct: boolean; consumeHeart: boolean; feedback: string };
    xpAwarded: number;
    completed: boolean;
    progress: ProgressSnapshot;
}
