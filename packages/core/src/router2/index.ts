import {action, extendObservable, intercept} from "mobx";
import {RouteConfig, Router as YesterRouter} from "yester";

import {Param, ParamDef} from "./param";
export {param} from "./param";

/** Callback permettant de décrire une définition de route. */
export type UrlRouteDescriptor<C> = (C extends ParamDef<infer K0, infer _0, infer V>
    ? (param: K0) => UrlRouteDescriptor<V>
    : <K extends keyof C>(
          x: K
      ) => C[K] extends ParamDef<infer _1, infer _2, infer _3>
          ? UrlRouteDescriptor<C[K]>
          : C[K] extends ParamDef<infer _4, infer _5>
          ? void
          : UrlRouteDescriptor<C[K]>) & {spec: C};

/** Callback permettant de décrire une URL. */
export type UrlPathDescriptor<C> = C extends ParamDef<infer _0, Param<infer T>, infer V>
    ? (param: T) => UrlPathDescriptor<V>
    : <K extends keyof C>(
          x: K
      ) => C[K] extends ParamDef<infer _1, infer _2, infer _3>
          ? UrlPathDescriptor<C[K]>
          : C[K] extends ParamDef<infer _4, infer _5>
          ? void
          : UrlPathDescriptor<C[K]>;

/** Router correspondant à la config donnée. */
export interface Router<C> {
    /** Etat du routeur. */
    state: ParamObject<C>;
    /**
     * Vérifie si la section de route demandée est active dans le routeur.
     * @param predicate Callback décrivant la route.
     */
    is(predicate: (x: UrlRouteDescriptor<C>) => void): boolean;
    /**
     * Navigue vers l'URL demandée.
     * @param predicate Callback décrivant l'URL.
     */
    to(predicate: (x: UrlPathDescriptor<C>) => void): void;
    /**
     * Construit une vue du routeur à partir d'une route donnée, permettant de manipuler une
     * sous section du routeur.
     * @param predicate Callback décrivant la route de base de la vue.
     */
    sub<C2>(predicate: (x: UrlRouteDescriptor<C>) => UrlRouteDescriptor<C2>): Router<C2>;
    /**
     * Effectue une action à partir de la valeur d'un paramètre du routeur.
     * @param predicate Callback décrivant la route.
     * @param switcher Callback qui sera appelé avec le paramètre suivant de la route du prédicat.
     */
    switch<C2, T>(
        predicate: (x: UrlRouteDescriptor<C>) => UrlRouteDescriptor<C2>,
        switcher: (x: keyof C2 | undefined) => T
    ): T;
    /** Lance le routeur. */
    start(): Promise<void>;
}

/** Builder pour construire des contraintes sur les routes d'un routeur. */
export interface RouterConstraintBuilder<C> {
    /**
     * Bloque l'accès à une route si une condition est remplie.
     * @param predicate Callback décrivant la route.
     * @param condition Condition.
     */
    block(predicate: (x: UrlRouteDescriptor<C>) => void, condition: () => boolean): RouterConstraintBuilder<C>;
    /**
     * Redirige une route vers une autre si une condition est remplie.
     * @param predicate Callback décrivant la route.
     * @param condition Condition.
     * @param to Callback décrivant l'URL cible.
     */
    redirect(
        predicate: (x: UrlRouteDescriptor<C>) => void,
        condition: () => boolean,
        to: (x: UrlPathDescriptor<C>) => void
    ): RouterConstraintBuilder<C>;
    /**
     * Construit une vue du ConstraintBuilder à partir d'une route donnée, permettant de manipuler une
     * sous section du ConstraintBuilder.
     * @param predicate Callback décrivant la route de base de la vue.
     */
    sub<C2>(predicate: (x: UrlRouteDescriptor<C>) => UrlRouteDescriptor<C2>): RouterConstraintBuilder<C2>;
}

/** Type décrivant l'objet de valeurs de paramètre d'un routeur de configuration quelconque. */
export type ParamObject<C = any> = C extends ParamDef<infer K1, Param<infer T1>, ParamDef<infer K2, Param<infer T2>>>
    ? Record<K1, T1> & Record<K2, T2>
    : C extends ParamDef<infer A3, Param<infer N3>, infer U>
    ? Record<A3, N3> & {readonly [P in keyof U]: ParamObject<U[P]>}
    : {
          readonly [P in keyof C]: ParamObject<C[P]>;
      };

/**
 * Construit un routeur.
 * @param config Configufration du routeur.
 * @param _builder Constraintes du routeur.
 */
export function makeRouter<C>(config: C, _builder?: (b: RouterConstraintBuilder<C>) => void): Router<C> {
    /**
     * Construit l'objet de valeurs.
     * @param cIn La config du routeur.
     * @param object L'objet en cours de construction (pour appel récursif).
     */
    function buildObject<Cin>(cIn: Cin, object: ParamObject<C> = {} as any): ParamObject<C> {
        if (Array.isArray(cIn)) {
            extendObservable(object, {[cIn[0]]: undefined});
            intercept(object, cIn[0], change => {
                // Impossible de sauvegarder NaN en toute circonstance.
                if (Number.isNaN(change.newValue)) {
                    return null;
                }

                const isActive = Object.keys(store._activeParams).includes(cIn[0]);
                const isUndefined = change.newValue === undefined;

                /*
                    On s'assure que l'URL et les paramètres enregistrés sont corrects.
                    Ceci n'aura aucun effet si on met à jour la valeur après une navigation.
                    En revanche, si on modifie un paramètre à la main, la mise à jour sera effectuée.
                    Il se s'agit pas d'une navigation, donc ce ne sera pas enregistré dans l'historique.
                */
                if (isActive && !isUndefined) {
                    store._activeParams[cIn[0]] = `${change.newValue}`;
                    let route = store._activeRoute;
                    for (const param in store._activeParams) {
                        route = route.replace(`:${param}`, store._activeParams[param]);
                    }
                    window.location.hash = route;
                }

                // Seuls les paramètres dans la route active peuvent être modifiés.
                if ((isActive && !isUndefined) || (!isActive && isUndefined)) {
                    return change;
                }

                return null;
            });
            if (cIn[2]) {
                buildObject(cIn[2], object);
            }
        } else {
            for (const key in cIn) {
                (object as any)[key] = buildObject(cIn[key]);
            }
        }

        return object;
    }

    const store = (extendObservable(
        {state: buildObject(config)},
        {_activeRoute: "/", _activeParams: []}
    ) as any) as Router<C> & {
        _activeRoute: string;
        _activeParams: Record<string, string>;
    };
    const paramsMap = buildParamsMap(config, store.state);
    const router = new YesterRouter(
        [
            // Spécifie tous les endpoints dans le routeur.
            ...buildEndpoints(config).map(
                $ =>
                    ({
                        $,
                        beforeEnter: action(({params, oldPath}) => {
                            store._activeRoute = $;
                            store._activeParams = params;

                            // Chaque paramètre de l'objet de valeur est réinitialisé à partir de sa valeur dans la route courante.
                            for (const key in paramsMap) {
                                if (key in params) {
                                    const newValue = paramsMap[key](params[key]);

                                    // Si valeur invalide (que pour les nombres, et ça sera toujours NaN), on refuse la navigation.
                                    if (Number.isNaN(newValue)) {
                                        return {redirect: oldPath || "/"};
                                    }
                                } else {
                                    paramsMap[key](undefined);
                                }
                            }
                        })
                    } as RouteConfig)
            ),
            {
                // Route non matchée => on revient là où on était avant (ou à la racine si premier appel).
                $: "*",
                beforeEnter: ({oldPath}) => ({redirect: oldPath || "/"})
            }
        ],
        {type: "hash"}
    );

    function is(route: string, predicate: (x: UrlRouteDescriptor<C>) => void) {
        const builder = (path: string) => {
            route += `/${Object.keys(paramsMap).includes(path) ? `:${path}` : path}`;
            return builder;
        };
        predicate(builder as any);
        return store._activeRoute.startsWith(route);
    }

    function to(route: string, predicate: (x: UrlPathDescriptor<C>) => void) {
        const builder = (path: string) => {
            route += `/${path}`;
            return builder;
        };
        predicate(builder as any);
        router.navigate(route);
    }

    function sw(route: string, predicate: (x: UrlRouteDescriptor<C>) => void, switcher: (x: any) => any) {
        const builder = (path: string) => {
            route += `/${Object.keys(paramsMap).includes(path) ? `:${path}` : path}`;
            return builder;
        };
        predicate(builder as any);
        if (!store._activeRoute.startsWith(route)) {
            return switcher(undefined);
        } else {
            return switcher(store._activeRoute.replace(route, "").split("/")[1]?.replace(":", "") as any);
        }
    }

    function sub(route: string, predicate: (x: UrlRouteDescriptor<C>) => void): any {
        let state = store.state;
        const builder = (path: string) => {
            const isParam = Object.keys(paramsMap).includes(path);
            route += `/${isParam ? `:${path}` : path}`;
            if (!isParam) {
                state = (state as any)[path];
            }
            return builder;
        };
        predicate(builder as any);

        return {
            state,
            is: (p: any) => is(route, p),
            to: (p: any) => {
                let baseRoute = route;
                for (const param in store._activeParams) {
                    baseRoute = baseRoute.replace(`:${param}`, store._activeParams[param]);
                }
                to(baseRoute, p);
            },
            switch: (p: any, s: any) => sw(route, p, s),
            sub: (p: any) => sub(route, p),
            start: () => {
                /** */
            }
        };
    }

    store.is = p => is("", p);
    store.to = p => to("", p);
    store.switch = (p, s) => sw("", p, s);
    store.sub = p => sub("", p);
    store.start = router.init.bind(router) as () => Promise<void>;

    return store;
}

/**
 * Construit la liste des endpoints du routeur.
 * @param config Config du routeur.
 */
function buildEndpoints<C>(config: C) {
    const endpoints: string[] = [];

    function addEndpoints(c: any, root: string) {
        if (Array.isArray(c)) {
            if (!c[1].required) {
                endpoints.push(root);
            }

            root = `${root}/:${c[0]}`;

            if (!Array.isArray(c[2])) {
                endpoints.push(root);
            }

            if (c[2]) {
                addEndpoints(c[2], root);
            }
        } else {
            if (Object.keys(c).length === 0 || Object.values(c).every(i => !Array.isArray(i))) {
                endpoints.push(root);
            }
            for (const key in c) {
                addEndpoints(c[key], `${root}/${key}`);
            }
        }
    }

    endpoints.push("/");
    addEndpoints(config, "");

    return endpoints;
}

/**
 * Construit la map de setters des paramètres du routeur.
 * @param config Config du routeur.
 * @param object Object de paramètres pré-construit.
 */
function buildParamsMap<C>(config: C, object: ParamObject<C>) {
    const params: Record<string, (value: string | undefined) => string | number | undefined> = {};

    if (Array.isArray(config)) {
        params[config[0]] = value => {
            const newValue = config[1].type === "number" && value !== undefined ? parseFloat(value) : value;
            (object as any)[config[0]] = newValue;
            return newValue;
        };
        if (config[2]) {
            Object.assign(params, buildParamsMap(config[2], object));
        }
    } else {
        for (const key in config) {
            Object.assign(params, buildParamsMap(config[key], (object as any)[key]));
        }
    }

    return params;
}
