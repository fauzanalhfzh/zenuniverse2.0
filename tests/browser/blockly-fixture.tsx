import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as Blockly from 'blockly';
import { BlocklyStepView } from '../../resources/js/components/lesson/blockly-step';
import '../../resources/css/app.css';

Object.assign(window, { Blockly });
function Fixture() {
    const [stepId, setStepId] = useState('mobile-layout');
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    useEffect(() => {
        const change = (event: Event) => setFeedbackOpen((event as CustomEvent<boolean>).detail);
        window.addEventListener('fixture:feedback', change);
        return () => window.removeEventListener('fixture:feedback', change);
    }, []);
    useEffect(() => {
        const change = (event: Event) => setStepId((event as CustomEvent<string>).detail);
        window.addEventListener('fixture:challenge', change);
        return () => window.removeEventListener('fixture:challenge', change);
    }, []);
    return <div className="lesson-player">
        <header className="lesson-player__header">
            <div className="lesson-player__header-inner">
                <div className="lesson-player__brand">
                    <div className="lesson-player__identity">
                        <span>Code block</span>
                        <strong>Coding untuk pemula</strong>
                    </div>
                </div>
                <div className="lesson-player__header-progress">
                    <div
                        className="lesson-player__header-progress-value"
                        style={{ width: '50%' }}
                    />
                </div>
                <div className="lesson-player__stats">♥ ♥ ♥</div>
            </div>
        </header>
        <div className="lesson-player__body">
            <main className="lesson-player__main">
                <div className="lesson-player__step-card">
                    <BlocklyStepView
                        pending={false}
                        feedbackOpen={feedbackOpen}
                        step={{
                            id: stepId,
                            type: 'blockly',
                            reward: { xp: 10 },
                            content: {
                                objective:
                                    'Gerakkan robot tiga petak ke arah bintang.',
                                availableBlocks: [
                                    'move_forward',
                                    'turn_right',
                                    'repeat',
                                ],
                            },
                            challenge: {
                                board: { width: 5, height: 5 },
                                start: { x: 2, y: 4, direction: 'north' },
                                goal: { x: 2, y: 1 },
                                maxBlocks: 3,
                                maxExecutionSteps: 20,
                                hint: 'Ulangi gerakan maju tiga kali.',
                            },
                        }}
                        onSubmit={(commands) => {
                            document.getElementById('submitted')!.textContent =
                                JSON.stringify(commands);
                        }}
                    />
                </div>
            </main>
        </div>
        <footer className="lesson-player__footer">
            <div className="lesson-player__footer-inner">
                <div className="lesson-player__footer-actions">
                    <button className="lesson-player__continue" disabled>
                        Lanjutkan
                    </button>
                </div>
            </div>
        </footer>
        <output id="submitted" className="sr-only" />
    </div>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
