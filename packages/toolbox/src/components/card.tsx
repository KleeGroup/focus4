import {forwardRef, ForwardRefExoticComponent, RefAttributes} from "react";
import {Card as RTCard, CardProps as RTCardProps, CardTheme} from "react-toolbox/lib/card/Card";
import {
    CardActions as RTCardActions,
    CardActionsProps as RTCardActionsProps,
    CardActionsTheme
} from "react-toolbox/lib/card/CardActions";
import {
    CardMedia as RTCardMedia,
    CardMediaProps as RTCardMediaProps,
    CardMediaTheme
} from "react-toolbox/lib/card/CardMedia";
import {CardText as RTCardText, CardTextProps as RTCardTextProps, CardTextTheme} from "react-toolbox/lib/card/CardText";
import {
    CardTitle as CardTitleType,
    cardTitleFactory,
    CardTitleProps as RTCardTitleProps,
    CardTitleTheme
} from "react-toolbox/lib/card/CardTitle";
import {CARD} from "react-toolbox/lib/identifiers";

import {CSSProp, fromBem, useTheme} from "@focus4/styling";
import rtCardTheme from "react-toolbox/components/card/theme.css";
const cardTheme: CardTheme = rtCardTheme;
export {cardTheme};

import {Avatar} from "./avatar";

type CardProps = Omit<RTCardProps, "theme"> & {theme?: CSSProp<CardTheme>};
export const Card: ForwardRefExoticComponent<CardProps & RefAttributes<RTCard>> = forwardRef((props, ref) => {
    const theme = useTheme(CARD, cardTheme, props.theme);
    return <RTCard ref={ref} {...props} theme={fromBem(theme)} />;
});

type CardActionsProps = Omit<RTCardActionsProps, "theme"> & {theme?: CSSProp<CardActionsTheme>};
export const CardActions: ForwardRefExoticComponent<CardActionsProps & RefAttributes<RTCardActions>> = forwardRef(
    (props, ref) => {
        const theme = useTheme(CARD, cardTheme as CardActionsTheme, props.theme);
        return <RTCardActions ref={ref} {...props} theme={fromBem(theme)} />;
    }
);

type CardMediaProps = Omit<RTCardMediaProps, "theme"> & {theme?: CSSProp<CardMediaTheme>};
export const CardMedia: ForwardRefExoticComponent<CardMediaProps & RefAttributes<RTCardMedia>> = forwardRef(
    (props, ref) => {
        const theme = useTheme(CARD, cardTheme as CardMediaTheme, props.theme);
        return <RTCardMedia ref={ref} {...props} theme={fromBem(theme)} />;
    }
);

type CardTextProps = Omit<RTCardTextProps, "theme"> & {theme?: CSSProp<CardTextTheme>};
export const CardText: ForwardRefExoticComponent<CardTextProps & RefAttributes<RTCardText>> = forwardRef(
    (props, ref) => {
        const theme = useTheme(CARD, cardTheme as CardTextTheme, props.theme);
        return <RTCardText ref={ref} {...props} theme={fromBem(theme)} />;
    }
);

const RTCardTitle = cardTitleFactory(Avatar as any);
type CardTitleProps = Omit<RTCardTitleProps, "theme"> & {theme?: CSSProp<CardTitleTheme>};
export const CardTitle = forwardRef<CardTitleType, CardTitleProps>((props, ref) => {
    const theme = useTheme(CARD, cardTheme as CardTitleTheme, props.theme);
    return <RTCardTitle ref={ref} {...props} theme={fromBem(theme)} />;
});

export {
    CardProps,
    CardTheme,
    CardActionsProps,
    CardActionsTheme,
    CardMediaProps,
    CardMediaTheme,
    CardTextProps,
    CardTextTheme,
    CardTitleProps,
    CardTitleTheme
};
