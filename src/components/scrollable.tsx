import {action, observable} from "mobx";
import React from "react";

import {scrollable} from "./__style__/scrollable.css";

export const ScrollableContext = React.createContext<{
    /** Enregistre un évènement de scroll dans le contexte et retourne son disposer. */
    registerScroll(onScroll: (top: number, height: number) => void): () => void;
}>({
    registerScroll() {
        return () => null;
    }
});

export class Scrollable extends React.Component<{className?: string}> {
    node!: HTMLDivElement | null;
    readonly onScrolls = observable<(top: number, height: number) => void>([]);

    @action.bound
    registerScroll(onScroll: (top: number, height: number) => void) {
        this.onScrolls.push(onScroll);

        if (this.node) {
            onScroll(this.node.scrollTop, this.node.clientHeight);
        }

        return () => this.onScrolls.remove(onScroll);
    }

    componentDidMount() {
        this.node!.addEventListener("scroll", this.onScroll);
        this.node!.addEventListener("resize", this.onScroll);
        this.onScroll();
    }

    componentWillUnmount() {
        this.node!.removeEventListener("scroll", this.onScroll);
        this.node!.removeEventListener("resize", this.onScroll);
    }

    @action.bound
    onScroll() {
        this.onScrolls.forEach(onScroll => onScroll(this.node!.scrollTop, this.node!.clientHeight));
    }

    render() {
        return (
            <ScrollableContext.Provider value={{registerScroll: this.registerScroll}}>
                <div className={`${this.props.className || ""} ${scrollable}`} ref={div => (this.node = div)}>
                    {this.props.children}
                </div>
            </ScrollableContext.Provider>
        );
    }
}
