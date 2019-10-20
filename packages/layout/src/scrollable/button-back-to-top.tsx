import scroll from "smoothscroll-polyfill";
scroll.polyfill();

import {motion} from "framer-motion";
import * as React from "react";

import {CSSProp, ScrollableContext, useTheme} from "@focus4/styling";
import {Button, ButtonTheme} from "@focus4/toolbox";

import buttonBttCss, {ButtonBttCss as BTTCss} from "./__style__/button-btt.css";
export type ButtonBttCss = BTTCss & ButtonTheme;
export {buttonBttCss};

/** Props du bouton de retour en haut de page. */
export interface ButtonBackToTopProps {
    /** CSS. */
    theme?: CSSProp<ButtonBttCss>;
}

/** Bouton de retour en haut de page. */
export function ButtonBackToTop({theme: pTheme}: ButtonBackToTopProps) {
    const {backToTop, ...theme} = useTheme<ButtonBttCss>("buttonBTT", buttonBttCss, pTheme);
    const scrollable = React.useContext(ScrollableContext);

    return (
        <motion.div className={backToTop()} initial={{scale: 0}} animate={{scale: 1}} exit={{scale: 0}}>
            <Button
                accent
                onClick={() =>
                    scrollable.scrollTo({
                        top: 0
                    })
                }
                icon="expand_less"
                floating
                theme={theme}
            />
        </motion.div>
    );
}
