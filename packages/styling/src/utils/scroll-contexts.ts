import {HTMLMotionProps} from "framer-motion";
import * as React from "react";

export interface PanelDescriptor {
    node: HTMLDivElement;
    title?: string;
}

/** Contexte d'un Scrollable, expose les méthodes associées. */
export const ScrollableContext = React.createContext<{
    /**
     * Enregistre le header dans le Scrollable
     * @param Header Le composant de header.
     * @param nonStickyElement Le noeud DOM représentant le header non sticky.
     * @param canDeploy Précise si le header est toujours sticky ou non.
     * @returns Le disposer.
     */
    registerHeader(Header: React.ElementType, nonStickyElement: HTMLElement, canDeploy?: boolean): () => void;
    /**
     * Met à jour les props du header dans le Scrollable
     * @param headerProps Les props du composant de header.
     */
    setHeaderProps(headerProps: HTMLMotionProps<"header">): void;
    /**
     * Enregistre un observateur d'intersection avec le viewport du Scrollable.
     * @param node Le noeud DOM à observer.
     * @param onIntersect Le callback à appeler lors d'une intersection.
     * @returns Le disposer.
     */
    registerIntersect(node: HTMLElement, onIntersect: (ratio: number, isIntersecting: boolean) => void): () => void;
    /**
     * Scrolle vers la position demandée.
     * @param options Options.
     */
    scrollTo(options?: ScrollToOptions): void;
    /**
     * Affiche un élement dans le Scrollable.
     * @param node Le noeud React.
     * @param parentNode SI renseigné, le noeud sera placé en zone sticky et suivra la position de ce noeud.
     * @returns Le Portal associé.
     */
    portal(node: JSX.Element, parentNode?: HTMLElement | null): React.ReactPortal;
}>({} as any);

/** Contexte d'un ScrollspyContainer, expose les méthodes associées. */
export const ScrollspyContext = React.createContext({
    /**
     * Enregistre un panel dans le Scrollspu
     * @param name L'id du panel souhaité.
     * @param panel La description d'un panel
     */
    registerPanel(name: string, panel: PanelDescriptor): (() => void) | undefined {
        return () => {
            // tslint:disable-next-line: no-unused-expression
            name;
            // tslint:disable-next-line: no-unused-expression
            panel;
        };
    }
});
