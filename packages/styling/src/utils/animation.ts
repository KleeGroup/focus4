const {animationDelay, animationDuration, animationTimingFunction} = window.getComputedStyle(document.body);

export const delay = toMs(animationDelay);
export const duration = toMs(animationDuration);
export const ease = animationTimingFunction.startsWith("cubic-bezier")
    ? animationTimingFunction
          .substring(13)
          .split(",")
          .map(parseFloat)
    : undefined;

export const defaultTransition = {
    delay: delay / 1000,
    type: "tween",
    duration: duration / 1000,
    ease
} as const;

export const springTransition = {
    type: "spring",
    stiffness: 170,
    damping: 26,
    restDelta: 1,
    restSpeed: 1000
} as const;

export function cssTransitionProps({
    enter,
    enterActive,
    exit,
    exitActive
}: {
    enter: string;
    enterActive: string;
    exit: string;
    exitActive: string;
}) {
    return {
        timeout: delay + duration,
        classNames: {
            enter,
            enterActive,
            exit,
            exitActive
        }
    };
}

function toMs(d: string) {
    if (d.endsWith("s")) {
        return +d.substring(0, d.length - 1) * 1000;
    } else {
        return +d.substring(0, d.length - 2);
    }
}
