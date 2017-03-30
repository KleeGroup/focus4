import {autobind} from "core-decorators";
import i18n from "i18next";
import {observer} from "mobx-react";
import * as React from "react";
import {findDOMNode} from "react-dom";

import {OperationListItem} from "../../../list";

import {SearchStore} from "../../store";
import {GroupResult} from "../../types";
import {Group, GroupStyle} from "./group";
export {GroupStyle};

const FCT_SCOPE = "FCT_SCOPE";

export interface ResultsProps {
    emptyComponent?: () => React.ReactElement<any>;
    /** Par défaut: 3 */
    initialRowsCount?: number;
    hasSelection: boolean;
    onLineClick?: (item: any) => void;
    lineComponentMapper: (groupKey?: string) => ReactComponent<any>;
    operationList?: OperationListItem[];
    /** Par défaut : 250 */
    offset?: number;
    /** Par défaut : FCT_SCOPE */
    scopeFacetKey?: string;
    store: SearchStore;
}

@autobind
@observer
export class Results extends React.Component<ResultsProps, void> {

    private get key() {
        const {store, scopeFacetKey = FCT_SCOPE} = this.props;
        return store.groupingKey || scopeFacetKey;
    }

    componentDidMount() {
        window.addEventListener("scroll", this.scrollListener);
        window.addEventListener("resize", this.scrollListener);
    }

    componentWillUnmount() {
        window.removeEventListener("scroll", this.scrollListener);
        window.removeEventListener("resize", this.scrollListener);
    }

    private scrollListener() {
        const {store: {currentCount, totalCount, groupingKey, isLoading, search}, offset = 250} = this.props;
        if (currentCount < totalCount && !groupingKey) {
            const el = findDOMNode(this) as HTMLElement;
            const scrollTop = window.pageYOffset;
            if (el && topOfElement(el) + el.offsetHeight - scrollTop - (window.innerHeight) < offset) {
                if (!isLoading) {
                    search(true);
                }
            }
        }
    }

    private renderSingleGroup(group: GroupResult<{}>) {
        const {initialRowsCount = 3, hasSelection, onLineClick, lineComponentMapper, operationList, store} = this.props;
        return (
            <Group
                key={group.code}
                hasSelection={hasSelection}
                group={group}
                initialRowsCount={initialRowsCount}
                LineComponent={lineComponentMapper(group.code || store.scope)}
                onLineClick={onLineClick}
                operationList={operationList}
                showAllHandler={this.showAllHandler}
                store={store}
            />
        );
    }

    private showAllHandler(key: string) {
        const {store, scopeFacetKey = FCT_SCOPE} = this.props;
        if (store.facets.find(facet => facet.code === scopeFacetKey)) {
            this.scopeSelectionHandler(key);
        } else {
            this.facetSelectionHandler(store.groupingKey!, key);
        }
    }

    private scopeSelectionHandler(scope: string) {
        this.props.store.setProperties({scope});
    }

    private facetSelectionHandler(key: string, value: string) {
        const {selectedFacets = {}, setProperties} = this.props.store;
        setProperties({
            groupingKey: undefined,
            selectedFacets: {...selectedFacets, [key]: value}
        });
    }

    render() {
        const {results, totalCount} = this.props.store;

        if (0 === totalCount) {
            const Empty = this.props.emptyComponent || (() => <div>{i18n.t("search.empty")}</div>);
            return <Empty />;
        }

        const filteredResults = results.filter(result => result.totalCount !== 0);
        if (!filteredResults.length) {
            return null;
        } else if (filteredResults.length === 1) {
            return this.renderSingleGroup(filteredResults[0]);
        } else {
            return <div>{filteredResults.map(this.renderSingleGroup)}</div>;
        }
    }
}

function topOfElement(element: HTMLElement): number {
    if (!element) {
        return 0;
    }
    return element.offsetTop + topOfElement((element.offsetParent as HTMLElement));
};