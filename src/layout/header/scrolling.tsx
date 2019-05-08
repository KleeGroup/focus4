import * as React from "react";
import posed from "react-pose";

import {ScrollableContext} from "../../components";
import {useTheme} from "../../theme";

import * as styles from "./__style__/header.css";
export type HeaderStyle = Partial<typeof styles>;

/** Props du conteneur de header. */
export interface HeaderScrollingProps {
    /** Précise si le header peut se déployer ou non. */
    canDeploy?: boolean;
    style?: React.CSSProperties;
    /** Classes CSS. */
    theme?: {
        deployed?: string;
        scrolling?: string;
        undeployed?: string;
        sticky?: string;
    };
}

/** Conteneur du header, gérant en particulier le dépliement et le repliement. */
export function HeaderScrolling(props: React.PropsWithChildren<HeaderScrollingProps>) {
    const context = React.useContext(ScrollableContext);
    const theme = useTheme("header", styles, props.theme);
    const ref = React.useRef<Element>(null);

    function children(className: string, headerRef?: React.Ref<Element>) {
        return (
            <Header ref={headerRef} className={`${theme.scrolling} ${className}`} style={props.style}>
                {props.children}
            </Header>
        );
    }

    React.useEffect(() => context.registerHeader(children(theme.sticky), ref.current!, props.canDeploy), [
        props.canDeploy
    ]);

    return children(props.canDeploy ? theme.deployed : theme.undeployed, ref);
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
