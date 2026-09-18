import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/**
 * Single source of truth for GSAP setup in ZenUniverse.
 *
 * Call this once at app start. It:
 *  - registers the ScrollTrigger plugin (lazy so it only loads on demand)
 *  - registers the useGSAP React hook helper
 *  - exposes a helper that respects prefers-reduced-motion
 *
 * Importing gsap from this module instead of the bare "gsap" package
 * guarantees that plugins are registered before any animation runs.
 */

let registered = false;

export function ensureGsapRegistered(): void {
    if (registered) return;
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(useGSAP, ScrollTrigger);
    registered = true;
}

/**
 * Returns true when the user has asked the OS to reduce motion.
 * Use this to gate animations and fall back to static rendering.
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export { gsap, ScrollTrigger, useGSAP };
