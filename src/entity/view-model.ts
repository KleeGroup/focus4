import {merge, omit} from "lodash";
import {autorun, action, observable, toJS} from "mobx";

import {ClearSet, clearEntity, setEntityEntry} from "./store";

export interface ViewModel {
    /** Précise l'état de la synchronisation entre le model et le viewModel. */
    isSubscribed: boolean;

    /** Réinitialise le viewModel à partir du model. */
    reset(): void;

    /** Met à jour le model à partir du viewModel. */
    submit(): void;

    /** Active la synchronisation model -> viewModel. La fonction est appelée à la création. */
    subscribe(): void;

    /** Désactive la synchronisation model -> viewModel. */
    unsubscribe(): void;
}

/**
 * Construit un ViewModel à partir d'une entrée d'entityStore.
 * Le ViewModel est un clone d'un model qui peut être librement modifié sans l'impacter, et propose des méthodes pour se synchroniser.
 * Toute mise à jour du model réinitialise le viewModel.
 */
export function createViewModel<T extends ClearSet<{}>>(model: T) {
    const getModel = () => omit(toJS(model), "set", "clear");
    const viewModel = observable(getModel()) as any as T & ViewModel;

    viewModel.clear = action(() => clearEntity(viewModel as any));
    viewModel.set = action((entityValue: {}) => setEntityEntry(viewModel as any, entityValue, ""));

    viewModel.reset = () => {
        for (const entry in model) {
            if (entry !== "set" && entry !== "clear") {
                (viewModel as any)[entry] = (model as any)[entry];
            }
        }
    };
    viewModel.submit = () => merge(viewModel, getModel());
    viewModel.subscribe = () => {
        if (!viewModel.isSubscribed) {
            const disposer = autorun(viewModel.reset);
            viewModel.unsubscribe = () => {
                disposer();
                viewModel.isSubscribed = false;
            };
            viewModel.isSubscribed = true;
        }
    };

    viewModel.subscribe();
    return viewModel;
}
