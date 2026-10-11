import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useId, useRef } from 'react';
import type { CSSProperties } from 'react';
import './motion-asset.css';

gsap.registerPlugin(useGSAP);

export type MotionAssetKind =
    | 'heart'
    | 'unlimited-heart'
    | 'mascot'
    | 'star'
    | 'streak';

type MotionAssetProps = {
    kind: MotionAssetKind;
    filled?: boolean;
    active?: boolean;
    value?: number;
    replay?: number;
    playOnMount?: boolean;
    motion?: boolean;
    size?: number;
    className?: string;
    label?: string;
};

const heartPath =
    'M32 55C26 50 6 38 6 23C6 9 23 5 32 17C41 5 58 9 58 23C58 38 38 50 32 55Z';

export function MotionAsset({
    kind,
    filled = true,
    active = true,
    value = 0,
    replay = 0,
    playOnMount = false,
    motion = true,
    size = 32,
    className = '',
    label,
}: MotionAssetProps) {
    const root = useRef<HTMLSpanElement>(null);
    const previous = useRef({ filled, value, replay, kind });
    const id = useId().replace(/:/g, '');
    const isHeart = kind === 'heart' || kind === 'unlimited-heart';

    useGSAP(
        () => {
            const before = previous.current;
            previous.current = { filled, value, replay, kind };
            const shouldPlay =
                playOnMount ||
                before.filled !== filled ||
                value > before.value ||
                replay !== before.replay ||
                kind !== before.kind;
            const element = root.current;
            if (!element) return;
            element.dataset.motionState = 'idle';
            if (!motion || !active || !shouldPlay) return;

            const media = gsap.matchMedia();
            media.add(
                '(prefers-reduced-motion: no-preference)',
                () => {
                    const body = element.querySelector('.motion-asset__body');
                    const fill = element.querySelector('.motion-asset__fill');
                    const ring = element.querySelector('.motion-asset__ring');
                    const particles = element.querySelectorAll(
                        '.motion-asset__particle',
                    );
                    const timeline = gsap.timeline({
                        paused: true,
                        defaults: { ease: 'power2.out' },
                        onStart: () => {
                            element.dataset.motionState = 'playing';
                        },
                        onComplete: () => {
                            element.dataset.motionState = 'done';
                        },
                    });

                    if (kind === 'heart' && !filled) {
                        timeline
                            .fromTo(
                                fill,
                                { clipPath: 'inset(0% 0 0)' },
                                {
                                    clipPath: 'inset(100% 0 0)',
                                    duration: 0.24,
                                    ease: 'power2.in',
                                },
                                0,
                            )
                            .to(
                                body,
                                {
                                    yPercent: 5,
                                    rotation: -5,
                                    scale: 0.94,
                                    duration: 0.12,
                                },
                                0,
                            )
                            .to(
                                body,
                                {
                                    yPercent: 0,
                                    rotation: 0,
                                    scale: 1,
                                    duration: 0.2,
                                },
                                0.12,
                            );
                    } else if (kind === 'mascot') {
                        timeline
                            .fromTo(
                                body,
                                { xPercent: -3, yPercent: 4, rotation: -3 },
                                {
                                    xPercent: 2,
                                    yPercent: -3,
                                    rotation: 2,
                                    duration: 0.6,
                                    ease: 'power2.inOut',
                                },
                            )
                            .to(body, {
                                xPercent: 0,
                                yPercent: 0,
                                rotation: 0,
                                duration: 0.8,
                                ease: 'sine.inOut',
                            });
                    } else if (kind === 'streak') {
                        timeline
                            .to(body, {
                                scaleX: 1.08,
                                scaleY: 0.88,
                                duration: 0.08,
                            })
                            .to(body, {
                                scaleX: 0.94,
                                scaleY: 1.14,
                                rotation: -3,
                                duration: 0.16,
                            })
                            .to(body, {
                                scaleX: 1,
                                scaleY: 1,
                                rotation: 0,
                                duration: 0.24,
                            });
                    } else {
                        if (kind === 'heart') {
                            timeline.fromTo(
                                fill,
                                { clipPath: 'inset(100% 0 0)' },
                                {
                                    clipPath: 'inset(0% 0 0)',
                                    duration: 0.22,
                                },
                                0,
                            );
                        }
                        timeline
                            .fromTo(
                                body,
                                {
                                    scale: 0.88,
                                    rotation: kind === 'star' ? -14 : -3,
                                },
                                {
                                    scale: 1.12,
                                    rotation: kind === 'star' ? 5 : 2,
                                    duration: 0.16,
                                },
                                0,
                            )
                            .to(body, {
                                scale: 1,
                                rotation: 0,
                                duration: 0.22,
                            });
                        if (kind === 'unlimited-heart') {
                            timeline.fromTo(
                                '.motion-asset__infinity',
                                { scale: 0.7, opacity: 0 },
                                {
                                    scale: 1,
                                    opacity: 1,
                                    duration: 0.3,
                                    ease: 'back.out(1.4)',
                                },
                                0.12,
                            );
                        }
                    }

                    if (kind !== 'heart' || filled) {
                        timeline.fromTo(
                            ring,
                            { scale: 0.65, opacity: 0.45 },
                            {
                                scale: 1.22,
                                opacity: 0,
                                duration: 0.42,
                            },
                            0.06,
                        );
                        timeline
                            .fromTo(
                                particles,
                                { yPercent: 30, scale: 0.4, opacity: 0 },
                                {
                                    yPercent: -35,
                                    scale: 1,
                                    opacity: 1,
                                    duration: 0.16,
                                    stagger: 0.04,
                                },
                                0.12,
                            )
                            .to(
                                particles,
                                {
                                    yPercent: -80,
                                    scale: 0.5,
                                    opacity: 0,
                                    duration: 0.22,
                                    stagger: 0.04,
                                },
                                0.36,
                            );
                    }

                    let visible = false;
                    const syncPlayback = () => {
                        if (visible && !document.hidden) timeline.play();
                        else timeline.pause();
                    };
                    const observer = new IntersectionObserver(([entry]) => {
                        visible = entry.isIntersecting;
                        syncPlayback();
                    });
                    observer.observe(element);
                    document.addEventListener('visibilitychange', syncPlayback);
                    return () => {
                        observer.disconnect();
                        document.removeEventListener(
                            'visibilitychange',
                            syncPlayback,
                        );
                        element.dataset.motionState = 'idle';
                    };
                },
                root,
            );
            return () => media.revert();
        },
        {
            scope: root,
            dependencies: [
                kind,
                filled,
                active,
                value,
                replay,
                playOnMount,
                motion,
            ],
            revertOnUpdate: true,
        },
    );

    return (
        <span
            ref={root}
            className={`motion-asset motion-asset--${kind} ${className}`}
            style={{ '--motion-size': `${size}px` } as CSSProperties}
            role={label ? 'img' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            data-kind={kind}
            data-filled={isHeart ? filled : undefined}
            data-active={active}
        >
            <span className="motion-asset__ring" />
            <span className="motion-asset__body">
                {kind === 'mascot' ? (
                    <img
                        src="/images/mascot-motion.png"
                        alt=""
                        width={1330}
                        height={1182}
                        draggable={false}
                    />
                ) : (
                    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                        <defs>
                            <linearGradient
                                id={`${id}-heart`}
                                x1="16"
                                y1="10"
                                x2="46"
                                y2="56"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#ff6578" />
                                <stop offset="0.5" stopColor="#fa3261" />
                                <stop offset="1" stopColor="#d71b57" />
                            </linearGradient>
                            <linearGradient
                                id={`${id}-gold`}
                                x1="20"
                                y1="8"
                                x2="42"
                                y2="56"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#fff3a0" />
                                <stop offset="0.5" stopColor="#ffd052" />
                                <stop offset="1" stopColor="#f2a31d" />
                            </linearGradient>
                            <linearGradient
                                id={`${id}-fire`}
                                x1="26"
                                y1="4"
                                x2="40"
                                y2="58"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="#ff7140" />
                                <stop offset="1" stopColor="#ffad29" />
                            </linearGradient>
                        </defs>
                        {isHeart && (
                            <>
                                <path
                                    d={heartPath}
                                    className="motion-asset__empty"
                                    strokeWidth="2.5"
                                />
                                <g
                                    className="motion-asset__fill"
                                    style={{
                                        clipPath: filled
                                            ? 'inset(0% 0 0)'
                                            : 'inset(100% 0 0)',
                                    }}
                                >
                                    <path
                                        d={heartPath}
                                        fill={`url(#${id}-heart)`}
                                        stroke="#d32a53"
                                        strokeWidth="2"
                                    />
                                    <path
                                        d="M13 23C13 15 22 13 26 19"
                                        stroke="#ffb4bf"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                </g>
                                {kind === 'unlimited-heart' && (
                                    <g className="motion-asset__infinity">
                                        <path
                                            d="M32 32C28 26 25 25 22 27C15 31 20 40 25 36L39 28C45 24 49 33 44 36C40 39 36 36 32 32Z"
                                            stroke="#fff"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </g>
                                )}
                            </>
                        )}
                        {kind === 'star' && (
                            <>
                                <path
                                    d="M28 8Q32 1 36 8L42 20L56 22Q63 23 58 29L48 39L50 53Q51 61 44 57L32 51L20 57Q13 61 14 53L16 39L6 29Q1 23 8 22L22 20Z"
                                    fill={`url(#${id}-gold)`}
                                    stroke="#b77912"
                                    strokeWidth="2.5"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M29 12L24 25L12 27"
                                    stroke="#fff9cf"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </>
                        )}
                        {kind === 'streak' && (
                            <>
                                <path
                                    d="M34 4C39 17 51 21 53 34C56 48 47 59 33 59C19 59 10 51 11 39C11 30 16 21 23 15C22 25 27 28 29 25C34 19 35 13 34 4Z"
                                    fill={`url(#${id}-fire)`}
                                    stroke="#df6427"
                                    strokeWidth="2"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M33 29C33 39 43 40 43 48C43 54 39 58 33 58C26 58 21 54 22 47C22 41 28 36 33 29Z"
                                    fill="#ffdf65"
                                />
                                <path
                                    d="M18 36L21 30"
                                    stroke="#ffb488"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </>
                        )}
                    </svg>
                )}
            </span>
            <span className="motion-asset__particle motion-asset__particle--one" />
            <span className="motion-asset__particle motion-asset__particle--two" />
        </span>
    );
}

export function HeartMeter({
    hearts,
    capacity,
    unlimited,
    size = 25,
    motion = true,
}: {
    hearts: number;
    capacity: number;
    unlimited: boolean;
    size?: number;
    motion?: boolean;
}) {
    if (unlimited)
        return (
            <MotionAsset
                kind="unlimited-heart"
                size={size}
                motion={motion}
                playOnMount
            />
        );
    return (
        <span className="motion-heart-meter">
            {Array.from({ length: Math.max(0, capacity) }, (_, index) => (
                <MotionAsset
                    key={index}
                    kind="heart"
                    filled={index < hearts}
                    size={size}
                    motion={motion}
                />
            ))}
        </span>
    );
}
