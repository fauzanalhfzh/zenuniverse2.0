import { createRoot } from 'react-dom/client';
import * as Blockly from 'blockly';
import { BlocklyStepView } from '../../resources/js/components/lesson/blockly-step';
import '../../resources/css/app.css';

Object.assign(window, { Blockly });
createRoot(document.getElementById('root')!).render(
    <div className="lesson-player">
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
                        step={{
                            id: 'mobile-layout',
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
        <output id="submitted" />
    </div>,
);
