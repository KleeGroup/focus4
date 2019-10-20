import {AnimatePresence, motion} from "framer-motion";
import i18next from "i18next";
import {reduce} from "lodash";
import {action, IReactionDisposer, observable, reaction} from "mobx";
import {disposeOnUnmount, observer} from "mobx-react";
import * as React from "react";

import {isList, isSearch, ListStoreBase} from "@focus4/stores";
import {CSSProp, defaultTransition, getIcon, themr, ToBem} from "@focus4/styling";
import {Button, ButtonMenu, ChipTheme, IconButton, Input, MenuItem} from "@focus4/toolbox";

import {ChipType, FacetBox, shouldDisplayFacet} from "../search";
import {ContextualActions, OperationListItem} from "./contextual-actions";

import actionBarCss, {ActionBarCss} from "./__style__/action-bar.css";
export {actionBarCss, ActionBarCss};
const Theme = themr("actionBar", actionBarCss);

/** Props de l'ActionBar. */
export interface ActionBarProps<T> {
    /**
     * Affiche le résultat (si non vide) de cette fonction à la place de la valeur ou de son libellé existant dans les chips.
     * @param type Le type du chip affiché (`filter` ou `facet`)
     * @param code Le code du champ affiché (filtre : `field.$field.label`, facet : `facetOutput.code`)
     * @param value La valeur du champ affiché (filtre: `field.value`, facet : `facetItem.code`)
     * @returns Le libellé à utiliser, ou `undefined` s'il faut garder le libellé existant.
     */
    chipKeyResolver?: (type: "filter" | "facet", code: string, value: string) => Promise<string | undefined>;
    /**
     * Passe le style retourné par cette fonction aux chips.
     * @param type Le type du chip affiché (`filter`, `facet`, `sort` ou `group`)
     * @param code Le code du champ affiché (filtre : `field.$field.label`, facet : `facetOutput.code`, sort : `store.sortBy`, group : `store.groupingKey`)
     * @param value La valeur du champ affiché (filtre: `field.value`, facet : `facetItem.code`, inexistant pour sort en group)
     * @returns L'objet de theme, qui sera fusionné avec le theme existant.
     */
    chipThemer?: (type: ChipType, code: string, value?: string) => ChipTheme;
    /** Constitution de l'éventuel groupe auquel est lié l'ActionBar */
    group?: {code: string; label: string; totalCount: number};
    /** Si renseignée, seules les facettes de cette liste pourront être sélectionnées comme groupingKey. */
    groupableFacets?: string[];
    /** Contient une FacetBox. */
    hasFacetBox?: boolean;
    /** Affiche le bouton de groupe. */
    hasGrouping?: boolean;
    /** Affiche la barre de recherche. */
    hasSearchBar?: boolean;
    /** Affiche la case pour la sélection. */
    hasSelection?: boolean;
    /** Préfixe i18n pour les libellés. Par défaut : "focus". */
    i18nPrefix?: string;
    /** Nombre de valeurs de facettes affichées. Par défaut : 6 */
    nbDefaultDataListFacet?: number;
    /** Liste des colonnes sur lesquels on peut trier. */
    orderableColumnList?: {key: string; label: string; order: boolean}[];
    /** Actions sur les éléments sélectionnés. */
    operationList?: OperationListItem<T[]>[];
    /** Placeholder pour la barre de recherche. */
    searchBarPlaceholder?: string;
    /** Affiche les facettes qui n'ont qu'une seule valeur. */
    showSingleValuedFacets?: boolean;
    /** Store associé. */
    store: ListStoreBase<T>;
    /** CSS. */
    theme?: CSSProp<ActionBarCss>;
}

/** Barre d'actions pour une liste ou un groupe de recherche. Permet le tri, le grouping, la recherche et la sélection + actions en masse. */
@observer
export class ActionBar<T> extends React.Component<ActionBarProps<T>> {
    /** Affiche la FacetBox. */
    @observable displayFacetBox = false;

    /** Bouton de sélection (case à cocher). */
    protected selectionButton(theme: ToBem<ActionBarCss>) {
        const {hasSelection, i18nPrefix = "focus", store} = this.props;
        if (hasSelection) {
            return (
                <IconButton
                    icon={getIcon(`${i18nPrefix}.icons.actionBar.${store.selectionStatus}`)}
                    onClick={store.toggleAll}
                    theme={{toggle: theme.selectionToggle(), icon: theme.selectionIcon()}}
                />
            );
        } else {
            return null;
        }
    }

    /** Bouton permettant d'afficher le panneau dépliant contenant la FacetBox (si demandé). */
    protected filterButton(theme: ToBem<ActionBarCss>) {
        const {hasFacetBox, showSingleValuedFacets, i18nPrefix = "focus", store} = this.props;
        if (
            hasFacetBox &&
            isSearch(store) &&
            store.facets.some(facet =>
                shouldDisplayFacet(facet, store.selectedFacets, showSingleValuedFacets, store.totalCount)
            )
        ) {
            return (
                <div style={{position: "relative"}}>
                    <Button
                        onClick={() => (this.displayFacetBox = !this.displayFacetBox)}
                        icon={getIcon(`${i18nPrefix}.icons.actionBar.drop${this.displayFacetBox ? "up" : "down"}`)}
                        theme={{icon: theme.dropdown()}}
                        label={i18next.t(`${i18nPrefix}.search.action.filter`)}
                    />
                    {this.displayFacetBox ? <div className={theme.triangle()} /> : null}
                </div>
            );
        } else {
            return null;
        }
    }

    /** Bouton de tri. */
    protected sortButton(theme: ToBem<ActionBarCss>) {
        const {i18nPrefix = "focus", orderableColumnList, store} = this.props;

        if (
            store.totalCount > 1 &&
            !store.selectedItems.size &&
            ((isSearch(store) && !store.groupingKey) || isList(store)) &&
            orderableColumnList
        ) {
            return (
                <ButtonMenu
                    button={{
                        label: i18next.t(`${i18nPrefix}.search.action.sort`),
                        icon: getIcon(`${i18nPrefix}.icons.actionBar.dropdown`),
                        openedIcon: getIcon(`${i18nPrefix}.icons.actionBar.dropup`),
                        theme: {icon: theme.dropdown} as any
                    }}
                    onClick={() => (this.displayFacetBox = false)}
                >
                    {orderableColumnList.map((description, idx) => (
                        <MenuItem
                            key={idx}
                            onClick={action("sort", () => {
                                store.sortBy = description.key;
                                store.sortAsc = description.order;
                            })}
                            caption={i18next.t(description.label)}
                        />
                    ))}
                </ButtonMenu>
            );
        }

        return null;
    }

    /** Bouton de groupe. */
    protected groupButton(theme: ToBem<ActionBarCss>) {
        const {groupableFacets, hasGrouping, i18nPrefix = "focus", store} = this.props;

        if (hasGrouping && isSearch(store) && !store.selectedItems.size && !store.groupingKey) {
            const groupableColumnList = store.facets
                ? store.facets.reduce((result, facet) => {
                      if (
                          // On ne peut pas grouper sur des facettes avec une seule valeur (qui sont d'ailleurs masquées par défaut).
                          facet.values.length > 1 &&
                          // Et on ne garde que les facettes demandées dans la liste.
                          (!groupableFacets || groupableFacets.find(code => code === facet.code))
                      ) {
                          return {...result, [facet.code]: facet.label};
                      }
                      return result;
                  }, {})
                : {};

            const menuItems = reduce(
                groupableColumnList,
                (operationList, label, key) => [
                    ...operationList,
                    <MenuItem key={key} onClick={() => (store.groupingKey = key)} caption={i18next.t(label)} />
                ],
                [] as JSX.Element[]
            );

            if (menuItems.length) {
                return (
                    <ButtonMenu
                        button={{
                            label: i18next.t(`${i18nPrefix}.search.action.group`),
                            icon: getIcon(`${i18nPrefix}.icons.actionBar.dropdown`),
                            openedIcon: getIcon(`${i18nPrefix}.icons.actionBar.dropup`),
                            theme: {icon: theme.dropdown} as any
                        }}
                        onClick={() => (this.displayFacetBox = false)}
                    >
                        {menuItems}
                    </ButtonMenu>
                );
            }
        }

        return null;
    }

    /** Barre de recherche. */
    protected searchBar(theme: ToBem<ActionBarCss>) {
        const {i18nPrefix = "focus", hasSearchBar, searchBarPlaceholder, store} = this.props;

        if (!store.selectedItems.size && hasSearchBar && (isList(store) || isSearch(store))) {
            return (
                <div className={theme.searchBar()}>
                    <Input
                        icon={getIcon(`${i18nPrefix}.icons.actionBar.search`)}
                        value={store.query}
                        onChange={(text: string) => (store.query = text)}
                        hint={searchBarPlaceholder}
                        theme={{
                            input: theme.searchBarField(),
                            icon: theme.searchBarIcon(),
                            hint: theme.searchBarHint()
                        }}
                    />
                    {store.query ? (
                        <IconButton
                            icon={getIcon(`${i18nPrefix}.icons.actionBar.close`)}
                            onClick={() => (store.query = "")}
                        />
                    ) : null}
                </div>
            );
        }

        return null;
    }

    /** Réaction permettant de fermer la FacetBox et de mettre à jour sa hauteur à chaque fois que c'est nécessaire (changement de son contenu).  */
    @disposeOnUnmount
    protected facetBoxCloser: IReactionDisposer = reaction(
        () => {
            const {hasFacetBox, store} = this.props;
            return (hasFacetBox && isSearch(store) && store.facets.length && store.facets[0]) || false;
        },
        () => {
            const {store, showSingleValuedFacets} = this.props;

            // On ferme la FacetBox si on se rend compte qu'on va afficher une FacetBox vide.
            if (
                this.displayFacetBox &&
                isSearch(store) &&
                store.facets.every(
                    facet => !shouldDisplayFacet(facet, store.selectedFacets, showSingleValuedFacets, store.totalCount)
                )
            ) {
                this.displayFacetBox = false;
            }
        }
    );

    render() {
        const {
            chipKeyResolver,
            chipThemer,
            group,
            hasFacetBox,
            i18nPrefix = "focus",
            nbDefaultDataListFacet = 6,
            operationList,
            showSingleValuedFacets,
            store
        } = this.props;
        return (
            <Theme theme={this.props.theme}>
                {theme => (
                    <div className={theme.container()}>
                        {/* ActionBar en tant que telle. */}
                        <div className={theme.bar({selection: !!store.selectedItems.size})}>
                            <div className={theme.buttons()}>
                                {this.selectionButton(theme)}
                                {group ? <strong>{`${i18next.t(group.label)} (${group.totalCount})`}</strong> : null}
                                {store.selectedItems.size ? (
                                    <strong>{`${store.selectedItems.size} ${i18next.t(
                                        `${i18nPrefix}.search.action.selectedItem${
                                            store.selectedItems.size > 1 ? "s" : ""
                                        }`
                                    )}`}</strong>
                                ) : null}
                                {this.filterButton(theme)}
                                {this.sortButton(theme)}
                                {this.groupButton(theme)}
                                {this.searchBar(theme)}
                            </div>
                            {store.selectedItems.size && operationList && operationList.length ? (
                                <ContextualActions
                                    operationList={operationList}
                                    data={Array.from(store.selectedItems)}
                                />
                            ) : null}
                        </div>
                        {/* FacetBox */}
                        {hasFacetBox && isSearch(store) ? (
                            <div className={theme.facetBoxContainer()}>
                                <AnimatePresence>
                                    {this.displayFacetBox && (
                                        <motion.div
                                            key="facet-box"
                                            initial={{height: 0}}
                                            animate={{height: "auto"}}
                                            exit={{height: 0}}
                                            transition={defaultTransition}
                                        >
                                            <IconButton
                                                icon={getIcon(`${i18nPrefix}.icons.actionBar.close`)}
                                                onClick={() => (this.displayFacetBox = false)}
                                            />
                                            <FacetBox
                                                chipKeyResolver={chipKeyResolver}
                                                chipThemer={chipThemer}
                                                nbDefaultDataList={nbDefaultDataListFacet}
                                                showSingleValuedFacets={showSingleValuedFacets}
                                                store={store}
                                                theme={{facetBox: theme.facetBox()}}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : null}
                    </div>
                )}
            </Theme>
        );
    }
}

/**
 * Crée une ActionBar.
 * @param props Les props de l'ActionBar.
 */
export function actionBarFor<T>(props: ActionBarProps<T>) {
    return <ActionBar {...props} />;
}
