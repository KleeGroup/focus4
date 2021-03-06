import {IObservableArray} from "mobx";
import {useAsObservableSource, useLocalStore, useObserver} from "mobx-react";
import {getEmptyImage} from "react-dnd-html5-backend";
import posed from "react-pose";
import {ComponentType, Ref, useCallback, useEffect, useLayoutEffect} from "react";

import {CollectionStore} from "@focus4/stores";
import {getIcon, springPose, ToBem} from "@focus4/styling";
import {IconButton} from "@focus4/toolbox";

import {ContextualActions, OperationListItem} from "../contextual-actions";
import {useDragSource} from "../dnd-utils";

import {ListCss} from "../__style__/list.css";

/** Props de base d'un composant de ligne. */
export interface LineProps<T> {
    /** Elément de la liste. */
    data: T;
    /** Handler pour ouvrir et fermer le détail. */
    toggleDetail?: (callbacks?: {onOpen?: () => Promise<void> | void; onClose?: () => Promise<void> | void}) => void;
}

/** Props du wrapper autour des lignes de liste. */
export interface LineWrapperProps<T> {
    /** L'élément de liste. */
    data: T;
    /** Ref vers l'élement DOM racine de la ligne. */
    domRef?: (element: HTMLLIElement | null) => void;
    /** Désactive l'animation de drag and drop. */
    disableDragAnimation?: boolean;
    /** Les items en cours de drag dans la liste. */
    draggedItems?: IObservableArray<T>;
    /** Type de l'item de liste pour le drag and drop. Par défaut : "item". */
    dragItemType?: string;
    /** Affiche ou non la checkbox de sélection. */
    hasSelection?: boolean;
    /** Préfixe i18n. Par défaut: "focus". */
    i18nPrefix?: string;
    /** Composant de ligne (ligne, mosaïque, row ou timeline à priori). */
    LineComponent: ComponentType<LineProps<T> & {ref?: Ref<any>}>;
    /** Configuration de la mosaïque (si applicable). */
    mosaic?: {width: number; height: number};
    /** Fonction passée par react-pose qu'il faudra appeler au willUnmount pour qu'il retire l'élément du DOM. */
    onPoseComplete?: (pose: string) => void;
    /** Actions de ligne. */
    operationList?: (data: T) => OperationListItem<T>[];
    /** Store de liste associé à la ligne. */
    store?: CollectionStore<T>;
    /** Handler pour ouvrir et fermer le détail. */
    toggleDetail?: (callbacks?: {onOpen?: () => Promise<void> | void; onClose?: () => Promise<void> | void}) => void;
    /** CSS. */
    theme: ToBem<ListCss>;
}

/** Wrapper de ligne dans une liste. */
export function LineWrapper<T>({
    disableDragAnimation,
    domRef,
    draggedItems,
    dragItemType = "item",
    i18nPrefix,
    LineComponent,
    mosaic,
    onPoseComplete,
    operationList,
    toggleDetail,
    theme,
    ...oProps
}: LineWrapperProps<T>) {
    const props = useAsObservableSource({
        data: oProps.data,
        hasSelection: oProps.hasSelection,
        store: oProps.store
    });
    const state = useLocalStore(() => ({
        /** Force l'affichage des actions. */
        forceActionDisplay: false,

        /** Précise si la checkbox doit être affichée. */
        get isCheckboxDisplayed() {
            return !!props.store?.selectedItems.size || false;
        },

        /** Précise si la ligne est en train d'être "draggée". */
        get isDragged() {
            return draggedItems?.find(i => i === props.data) || false;
        },

        /** Précise si la ligne est sélectionnable. */
        get isSelectable() {
            return (props.hasSelection && props.store?.isItemSelectionnable(props.data)) || false;
        },

        /** Précise si la ligne est sélectionnée.. */
        get isSelected() {
            return props.store?.selectedItems.has(props.data) || false;
        },

        /** Handler de clic sur la case de sélection. */
        onSelection() {
            props.store?.toggle(props.data);
        },

        setForceActionDisplay() {
            state.forceActionDisplay = true;
        },

        unsetForceActionDisplay() {
            state.forceActionDisplay = false;
        }
    }));

    // Si on n'appelle pas ça, vu que la ligne est posée dans un contexte de transition react-pose à cause du détail,
    // la ligne ne sera jamais retirée du DOM.
    useEffect(() => {
        if (onPoseComplete) {
            onPoseComplete("exit");
        }
    }, [onPoseComplete]);

    let setRef = domRef;

    // Gestion du drag and drop
    if (draggedItems) {
        const [, dragSource, dragPreview] = useDragSource({
            data: props.data,
            draggedItems,
            store: props.store,
            type: dragItemType
        });

        // Permet de masquer la preview par défaut de drag and drop HTML5.
        useLayoutEffect(() => {
            if (dragPreview) {
                dragPreview(getEmptyImage());
            }
        }, []);

        setRef = useCallback((li: HTMLLIElement | null) => {
            if (domRef) {
                domRef(li);
            }
            if (dragSource) {
                dragSource(li);
            }
        }, []);
    }

    return useObserver(() => (
        <DraggableLi
            className={(mosaic ? theme.mosaic : theme.line)({selected: state.isSelected})}
            key={mosaic ? "mosaic" : "list"}
            ref={setRef}
            pose={state.isDragged && !disableDragAnimation ? "dragging" : "idle"}
            width={mosaic && mosaic.width}
            height={mosaic && mosaic.height}
        >
            <LineComponent data={props.data} toggleDetail={toggleDetail} />
            {state.isSelectable ? (
                <IconButton
                    className={theme.checkbox({forceDisplay: state.isCheckboxDisplayed})}
                    icon={getIcon(`${i18nPrefix}.icons.line.${state.isSelected ? "" : "un"}selected`)}
                    onClick={state.onSelection}
                    primary={state.isSelected}
                    theme={{toggle: theme.toggle(), icon: theme.checkboxIcon()}}
                />
            ) : null}
            {operationList?.(props.data)?.length ? (
                <div
                    className={theme.actions({forceDisplay: state.forceActionDisplay})}
                    style={mosaic ? {width: mosaic.width, height: mosaic.height} : {}}
                >
                    <ContextualActions
                        isMosaic={!!mosaic}
                        operationList={operationList(props.data)}
                        data={props.data}
                        onClickMenu={state.setForceActionDisplay}
                        onHideMenu={state.unsetForceActionDisplay}
                    />
                </div>
            ) : null}
        </DraggableLi>
    ));
}

/** On construit un <li> "draggable". */
const DraggableLi = posed.li({
    props: {width: undefined, height: undefined},
    dragging: {
        applyAtStart: {opacity: 0},
        width: ({width}: {width?: number}) => (width ? 0 : undefined),
        height: 0,
        ...springPose
    },
    idle: {
        applyAtStart: {opacity: 1},
        width: ({width}: {width?: number}) => width || "100%",
        height: ({height}: {height?: number}) => height || "auto",
        ...springPose
    }
});
