import React from "react";

import {PanelDescriptor} from "./panel";

/** Contexte d'un Scrollable, expose les méthodes associées. */
export const ScrollableContext = React.createContext<{
    /**
     * Enregistre le header dans le Scrollable
     * @param stickyNode Le noeud React représentant le header sticky.
     * @param nonStickyElement Le noeud DOM représentant le header non sticky.
     * @param canDeploy Précise si le header est toujours sticky ou non.
     * @returns Le disposer.
     */
    registerHeader(stickyNode: JSX.Element, nonStickyElement: Element, canDeploy?: boolean): () => void;
    /**
     * Enregistre un observateur d'intersection avec le viewport du Scrollable.
     * @param node Le noeud DOM à observer.
     * @param onIntersect Le callback à appeler lors d'une intersection.
     * @returns Le disposer.
     */
    registerIntersect(node: HTMLElement, onIntersect: (ratio: number, isIntersecting: boolean) => void): () => void;
    /**
     * Enregistre un listener sur le scroll du Scrollable.
     * @param onScroll Le listener
     * @returns Le disposer.
     */
    registerScroll(onScroll: (top: number, height: number) => void): () => void;
    /**
     * Scrolle vers la position demandée.
     * @param options Options.
     */
    scrollTo(options?: ScrollToOptions): void;
    /**
     * Affiche un élement dans la zone sticky du Scrollable.
     * @param node Le noeud React.
     * @returns Le Portal associé.
     */
    sticky(node: JSX.Element): React.ReactPortal;
}>({} as any);

/** Contexte d'un ScrollspyContainer, expose les méthodes associées. */
export const ScrollspyContext = React.createContext({
    /**
     * Enregistre un panel dans le container et retourne son id.
     * @param panel La description d'un panel
     * @param sscId L'id du panel souhaité.
     * @returns L'id du panel.
     */
    registerPanel: (() => "") as (panel: PanelDescriptor, sscId?: string) => string,
    /**
     * Retire un panel du container.
     * @param id L'id du panel.
     */
    removePanel: (() => null) as (id: string) => void,
    /**
     * Met à jour un panel.
     * @param id L'id du panel.
     * @param desc La description du panel.
     */
    updatePanel: (() => null) as (id: string, desc: PanelDescriptor) => void
});
