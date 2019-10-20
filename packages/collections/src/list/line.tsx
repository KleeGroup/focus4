import {motion} from "framer-motion";
import {action, computed, IObservableArray, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {ConnectDragPreview, ConnectDragSource} from "react-dnd";
import {getEmptyImage} from "react-dnd-html5-backend";

import {EntityField, FieldEntry, ListStoreBase, stringFor} from "@focus4/stores";
import {CSSProp, getIcon, springTransition, themr} from "@focus4/styling";
import {IconButton} from "@focus4/toolbox";

import {ContextualActions, OperationListItem} from "./contextual-actions";

import lineCss, {LineCss} from "./__style__/line.css";
export {lineCss, LineCss};
const Theme = themr("line", lineCss);

/** Props de base d'un composant de lingne. */
export interface LineProps<T> {
    /** Elément de la liste. */
    data: T;
    /** Handler pour ouvrir et fermer le détail. */
    toggleDetail?: (callbacks?: {onOpen?: () => Promise<void> | void; onClose?: () => Promise<void> | void}) => void;
}

/** Props du wrapper autour des lignes de liste. */
export interface LineWrapperProps<T> {
    /** Connecteur vers la source de DnD. */
    connectDragSource?: ConnectDragSource;
    /** Connecteur vers la preview de DnD. */
    connectDragPreview?: ConnectDragPreview;
    /** L'élément de liste. */
    data: T;
    /** Le sélecteur pour le champ date, pour une ligne timeline. */
    dateSelector?: (data: T) => EntityField<FieldEntry<string>>;
    /** Ref vers l'élement DOM racine de la ligne. */
    domRef?: (element: HTMLElement | null) => void;
    /** Désactive l'animation de drag and drop. */
    disableDragAnimation?: boolean;
    /** Les items en cours de drag dans la liste. */
    draggedItems?: IObservableArray<T>;
    /** Affiche ou non la checkbox de sélection. */
    hasSelection?: boolean;
    /** Préfixe i18n. Par défaut: "focus". */
    i18nPrefix?: string;
    /** Composant de ligne (ligne, mosaïque, row ou timeline à priori). */
    LineComponent: React.ComponentType<LineProps<T> & {ref?: React.Ref<any>}>;
    /** Configuration de la mosaïque (si applicable). */
    mosaic?: {width: number; height: number};
    /** Actions de ligne. */
    operationList?: (data: T) => OperationListItem<T>[];
    /** Store de liste associé à la ligne. */
    store?: ListStoreBase<T>;
    /** Handler pour ouvrir et fermer le détail. */
    toggleDetail?: (callbacks?: {onOpen?: () => Promise<void> | void; onClose?: () => Promise<void> | void}) => void;
    /** CSS. */
    theme?: CSSProp<LineCss>;
    /** Type spécial de ligne. */
    type?: "timeline";
}

/** Wrapper de ligne dans une liste. */
@observer
export class LineWrapper<T> extends React.Component<LineWrapperProps<T>> {
    /** Force l'affichage des actions. */
    @observable protected forceActionDisplay = false;

    componentDidMount() {
        // Permet de masquer la preview par défaut de drag and drop HTML5.
        if (this.props.connectDragPreview) {
            this.props.connectDragPreview(getEmptyImage() as any);
        }
    }

    /** Précise si la ligne est sélectionnable. */
    @computed
    get isSelectable() {
        const {data, hasSelection, store} = this.props;
        return (hasSelection && store && store.isItemSelectionnable(data)) || false;
    }

    /** Précise si la checkbox doit être affichée. */
    @computed
    get isCheckboxDisplayed() {
        const {store} = this.props;
        return (store && !!store.selectedItems.size) || false;
    }

    /** Précise si la ligne est sélectionnée.. */
    @computed
    get isSelected() {
        const {data, store} = this.props;
        return (store && store.selectedItems.has(data)) || false;
    }

    /** Précise si la ligne est en train d'être "draggée". */
    @computed
    get isDragged() {
        const {data, draggedItems} = this.props;
        return (draggedItems && draggedItems.find(i => i === data)) || false;
    }

    /** Actions sur la ligne. */
    @computed.struct
    get operationList() {
        const {data, operationList} = this.props;
        const opList = operationList && operationList(data);
        return opList && opList.length ? opList : undefined;
    }

    /** Handler de clic sur la case de sélection. */
    @action.bound
    onSelection() {
        const {store} = this.props;
        if (store) {
            store.toggle(this.props.data);
        }
    }

    @action.bound
    setForceActionDisplay() {
        this.forceActionDisplay = true;
    }

    @action.bound
    unsetForceActionDisplay() {
        this.forceActionDisplay = false;
    }

    setRef = (li: HTMLLIElement) => {
        const {connectDragSource, domRef} = this.props;
        if (domRef) {
            domRef(li);
        }
        if (connectDragSource) {
            connectDragSource(li);
        }
    };

    render() {
        const {
            data,
            dateSelector,
            disableDragAnimation,
            i18nPrefix = "focus",
            LineComponent,
            mosaic,
            toggleDetail,
            type
        } = this.props;

        switch (type) {
            case "timeline":
                // Pour une timeline, on wrappe simplement la ligne dans le conteneur de timeline qui affiche la date et la décoration de timeline.
                return (
                    <Theme theme={this.props.theme}>
                        {theme => (
                            <li ref={this.setRef}>
                                <div className={theme.timelineDate()}>{stringFor(dateSelector!(data))}</div>
                                <div className={theme.timelineBadge()} />
                                <div className={theme.timelinePanel()}>
                                    <LineComponent data={data} />
                                </div>
                            </li>
                        )}
                    </Theme>
                );
            default:
                // Pour une liste, on ajoute la case de sélection et les actions de ligne, si demandées.
                return (
                    <Theme theme={this.props.theme}>
                        {theme => (
                            <motion.li
                                className={(mosaic ? theme.mosaic : theme.line)({selected: this.isSelected})}
                                ref={this.setRef}
                                initial={false}
                                animate={this.isDragged && !disableDragAnimation ? "dragging" : "idle"}
                                exit={{}}
                                variants={{
                                    dragging: {
                                        width: mosaic && mosaic.width ? 0 : undefined,
                                        height: 0
                                    },
                                    idle: {
                                        width: (mosaic && mosaic.width) || "100%",
                                        height: (mosaic && mosaic.height) || "auto"
                                    }
                                }}
                                transition={springTransition}
                                style={{opacity: this.isDragged && !disableDragAnimation ? 0 : 1}}
                            >
                                <LineComponent data={data} toggleDetail={toggleDetail} />
                                {this.isSelectable ? (
                                    <IconButton
                                        className={theme.checkbox({forceDisplay: this.isCheckboxDisplayed})}
                                        icon={getIcon(
                                            `${i18nPrefix}.icons.line.${this.isSelected ? "" : "un"}selected`
                                        )}
                                        onClick={this.onSelection}
                                        primary={this.isSelected}
                                        theme={{toggle: theme.toggle(), icon: theme.checkboxIcon()}}
                                    />
                                ) : null}
                                {this.operationList ? (
                                    <div
                                        className={theme.actions({forceDisplay: this.forceActionDisplay})}
                                        style={mosaic ? {width: mosaic.width, height: mosaic.height} : {}}
                                    >
                                        <ContextualActions
                                            isMosaic={!!mosaic}
                                            operationList={this.operationList}
                                            data={data}
                                            onClickMenu={this.setForceActionDisplay}
                                            onHideMenu={this.unsetForceActionDisplay}
                                        />
                                    </div>
                                ) : null}
                            </motion.li>
                        )}
                    </Theme>
                );
        }
    }
}
