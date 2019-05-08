import "intersection-observer";

import {range} from "lodash";
import {action, observable} from "mobx";
import {disposeOnUnmount, observer} from "mobx-react";
import React from "react";
import {createPortal} from "react-dom";
import {Transition} from "react-pose";

import {ButtonBackToTop} from "./button-back-to-top";

import {container, scrollable, sticky} from "./__style__/scrollable.css";

export const ScrollableContext = React.createContext<{
    /** Enregistre le header. */
    registerHeader(node: JSX.Element, element: Element, canDeploy?: boolean): () => void;
    /** Enregistre une intersection avec la partie visible. */
    registerIntersect(node: HTMLElement, onIntersect: (ratio: number) => void): () => void;
    /** Enregistre un évènement de scroll dans le contexte et retourne son disposer. */
    registerScroll(onScroll: (top: number, height: number) => void): () => void;
    /** Scrolle vers la position demandée. */
    scrollTo(options?: ScrollToOptions): void;
    /** Affiche un élement en sticky */
    sticky(node: JSX.Element): React.ReactPortal;
}>({} as any);

@observer
export class Scrollable extends React.Component<{
    /** Offset avant l'apparition du bouton de retour en haut. Par défaut : 200. */
    backToTopOffset?: number;
    /** Classe CSS. */
    className?: string;
    /** Cache le bouton de retour en haut. */
    hideBackToTop?: boolean;
    /** Comportement du scroll. Par défaut : "smooth" */
    scrollBehaviour?: ScrollBehavior;
}> {
    header?: [JSX.Element, Element];
    stickyHeader?: HTMLElement | null;
    @observable isHeaderSticky = false;

    @observable.ref observer!: IntersectionObserver;
    node!: HTMLDivElement | null;
    stickyNode!: HTMLDivElement | null;

    readonly onScrolls = observable<(top: number, height: number) => void>([], {deep: false});
    readonly onIntersects = observable.map<Element, (ratio: number) => void>([], {deep: false});

    @observable hasBtt = false;
    @observable width = 0;
    @observable headerHeight = 0;

    @action.bound
    registerHeader(node: JSX.Element, element: Element, canDeploy = true) {
        if (canDeploy) {
            this.observer.observe(element);
        }
        this.isHeaderSticky = !canDeploy;
        this.header = [node, element];
        return () => {
            if (canDeploy) {
                this.observer.unobserve(element);
            }
            this.isHeaderSticky = false;
            this.header = undefined;
        };
    }

    @action.bound
    registerScroll(onScroll: (top: number, height: number) => void) {
        this.onScrolls.push(onScroll);

        if (this.node) {
            onScroll(this.node.scrollTop + this.headerHeight, this.node.clientHeight);
        }

        return () => this.onScrolls.remove(onScroll);
    }

    @action.bound
    registerIntersect(node: HTMLElement, onIntersect: (ratio: number) => void) {
        this.onIntersects.set(node, onIntersect);
        this.observer.observe(node);

        return () => {
            this.onIntersects.delete(node);
            this.observer.unobserve(node);
        };
    }

    @action.bound
    scrollTo(options?: ScrollToOptions) {
        const {scrollBehaviour = "smooth"} = this.props;
        this.node!.scrollTo({behavior: scrollBehaviour, ...options});
    }

    @action.bound
    sticky(node: JSX.Element) {
        return createPortal(node, this.stickyNode!);
    }

    /** Permet de n'afficher le bouton que si le scroll a dépassé l'offset. */
    @disposeOnUnmount
    bttScroll = this.registerScroll(top => (this.hasBtt = top > (this.props.backToTopOffset || 200)));

    componentDidMount() {
        this.node!.addEventListener("scroll", this.onScroll);
        window.addEventListener("resize", this.onScroll);
        this.onScroll();

        this.observer = new IntersectionObserver(
            entries =>
                entries.forEach(e => {
                    if (this.header && e.target === this.header[1]) {
                        this.isHeaderSticky = !e.isIntersecting;
                    }
                    const onIntersect = this.onIntersects.get(e.target);
                    if (onIntersect) {
                        onIntersect(e.intersectionRatio);
                    }
                }),
            {root: this.node, threshold: range(0, 105, 5).map(t => t / 100)}
        );
    }

    componentDidUpdate() {
        this.width = this.node!.clientWidth;
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.onScroll);
        if (this.node) {
            this.node.removeEventListener("scroll", this.onScroll);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    @action.bound
    onScroll() {
        this.width = this.node!.clientWidth;
        this.headerHeight = (this.stickyHeader && this.stickyHeader.clientHeight) || 0;
        this.onScrolls.forEach(onScroll => onScroll(this.node!.scrollTop + this.headerHeight, this.node!.clientHeight));
    }

    render() {
        const {children, className, hideBackToTop} = this.props;
        return (
            <ScrollableContext.Provider
                value={{
                    registerHeader: this.registerHeader,
                    registerIntersect: this.registerIntersect,
                    registerScroll: this.registerScroll,
                    scrollTo: this.scrollTo,
                    sticky: this.sticky
                }}
            >
                <div className={`${className || ""} ${container}`}>
                    <Transition>
                        {this.isHeaderSticky && this.header
                            ? React.cloneElement(this.header[0], {
                                  ref: (stickyHeader: any) => (this.stickyHeader = stickyHeader),
                                  key: "header",
                                  style: {width: this.width}
                              })
                            : undefined}
                        <div
                            key="sticky"
                            className={sticky}
                            ref={div => (this.stickyNode = div)}
                            style={{width: this.width, top: this.headerHeight}}
                        />
                        <div key="scrollable" className={scrollable} ref={div => (this.node = div)}>
                            {this.observer ? children : null}
                        </div>
                        {!hideBackToTop && this.hasBtt ? <ButtonBackToTop key="backtotop" /> : undefined}
                    </Transition>
                </div>
            </ScrollableContext.Provider>
        );
    }
}
export function Sticky({
    parentNode: node,
    children,
    placeholder
}: {
    parentNode: HTMLElement | null;
    children: JSX.Element;
    placeholder?: JSX.Element;
}) {
    const context = React.useContext(ScrollableContext);
    const [condition, setCondition] = React.useState(false);
    React.useLayoutEffect(() => context.registerScroll(top => node && setCondition(top >= node.offsetTop)), [node]);
    return condition ? (
        <>
            {context.sticky(children)}
            {placeholder}
        </>
    ) : (
        children
    );
}
