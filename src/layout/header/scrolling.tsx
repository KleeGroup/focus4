import * as React from "react";
import posed from "react-pose";
import {PoseElementProps} from "react-pose/lib/components/PoseElement/types";

import {ScrollableContext} from "../../components";
import {useTheme} from "../../theme";

import * as styles from "./__style__/header.css";
export type HeaderStyle = Partial<typeof styles>;

/** Props du conteneur de header. */
export interface HeaderScrollingProps {
    /** Précise si le header peut se déployer ou non. */
    canDeploy?: boolean;
    children?: React.ReactNode;
    /** Classes CSS. */
    theme?: {
        deployed?: string;
        scrolling?: string;
        undeployed?: string;
        sticky?: string;
    };
}

/** Conteneur du header, gérant en particulier le dépliement et le repliement. */
export function HeaderScrolling({canDeploy, children, theme: pTheme}: HeaderScrollingProps) {
    const context = React.useContext(ScrollableContext);
    const theme = useTheme("header", styles, pTheme);
    const ref = React.useRef<HTMLElement>(null);

    React.useEffect(
        () =>
            context.registerHeader(
                canDeploy ? Header : FixedHeader,
                {className: `${theme.scrolling} ${theme.sticky}`, children},
                ref.current!,
                canDeploy
            ),
        [canDeploy, children]
    );

    return (
        <header className={`${theme.scrolling} ${canDeploy ? theme.deployed : theme.undeployed}`} ref={ref}>
            {children}
        </header>
    );
}

const Header = posed.header({
    enter: {
        transform: "translateY(0%)",
        transition: {type: "spring", stiffness: 170, damping: 26}
    },
    exit: {
        transform: "translateY(-105%)",
        transition: {type: "spring", stiffness: 170, damping: 26}
    }
});

const FixedHeader = React.forwardRef<HTMLHeadingElement, PoseElementProps>(
    ({onPoseComplete, initialPose, popFromFlow, ...props}, ref) => {
        React.useLayoutEffect(() => onPoseComplete && onPoseComplete("exit"));
        return <header ref={ref} {...props} />;
    }
);
