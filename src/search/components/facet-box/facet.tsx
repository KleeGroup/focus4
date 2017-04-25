import {autobind} from "core-decorators";
import i18n from "i18next";
import {uniqueId} from "lodash";
import {observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import Chips from "focus-components/chips";

import {injectStyle} from "../../../theming";

import {FacetOutput} from "../../types";

import * as styles from "./__style__/facet.css";
export type FacetStyle = Partial<typeof styles>;

export interface FacetProps {
    classNames?: FacetStyle;
    facet: FacetOutput;
    /** Par défaut : "focus" */
    i18nPrefix?: string;
    nbDefaultDataList: number;
    selectedDataKey: string | undefined;
    selectHandler: (facetKey: string, dataKey: string | undefined) => void;
}

@injectStyle("facet")
@autobind
@observer
export class Facet extends React.Component<FacetProps, void> {

    @observable private isShowAll = false;

    private renderFacetDataList() {
        const {classNames, selectedDataKey, facet, nbDefaultDataList, selectHandler} = this.props;

        if (selectedDataKey) {
            const selectedFacet = facet.values.filter(value => value.code === selectedDataKey);
            const facetLabel = selectedFacet.length ? selectedFacet[0].label : "";
            return (
                <Chips
                    label={facetLabel}
                    onDeleteClick={() => selectHandler(this.props.facet.code, undefined)}
                />
            );
        }

        const facetValues = this.isShowAll ? facet.values : facet.values.slice(0, nbDefaultDataList);
        return (
            <ul>
                {facetValues.map(facetValue => (
                    <li key={uniqueId("facet-item")} onClick={() => this.props.selectHandler(this.props.facet.code, facetValue.code)}>
                        <div>{facetValue.label}</div>
                        <div className={`${styles.count} ${classNames!.count || ""}`}>{facetValue.count}</div>
                    </li>
                ))}
            </ul>
        );
    }

    private renderShowAllDataList() {
        const {classNames, facet, i18nPrefix = "focus", nbDefaultDataList} = this.props;
        if (facet.values.length > nbDefaultDataList) {
            return (
                <div className={`${styles.show} ${classNames!.show || ""}`} onClick={() => this.isShowAll = !this.isShowAll}>
                    {i18n.t(this.isShowAll ? `${i18nPrefix}.list.show.less` : `${i18nPrefix}.list.show.all`)}
                </div>
            );
        } else {
            return null;
        }
    }

    render() {
        const {classNames, facet} = this.props;
        return (
            <div className={`${styles.facet} ${classNames!.facet || ""}`}>
                <h4>{i18n.t(facet.label)}</h4>
                {this.renderFacetDataList()}
                {this.renderShowAllDataList()}
            </div>
        );
    }
}