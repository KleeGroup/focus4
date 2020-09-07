import {makeRouter, param, Router, RouterConstraintBuilder} from ".";

const echeance = param("echId", p => p.number(), {reglement: param("regId", p => p.number())});

/*
    Le routeur se définit par un "arbre" qui décrit l'ensemble des routes possibles.

    Chaque clé définit une route possible statique, qui peut avoir comme valeur soit un object vide
    (dans ce cas c'est route "feuille"), soit un paramètre (p.param).

    Un paramètre se définit par son nom, son type (number ou string, et son caractère obligatoire),
    ainsi que le reste des routes qui existent derrière, ou bien un autre paramètre.

    Le caractère obligatoire du paramètre autorise ou non la route "précédente" a matcher. Si pas de
    paramètre, alors elle est forcément autorisée (dans l'exemple, /projet et /projet/detail).

    On peut également avoir un paramètre pour racine.

    On peut décomposer la définition des routes si on veut (comme pour "echeance" dans l'exemple).
*/
const router = makeRouter({
    projet: {
        detail: {}
    },
    operation: param("ofaId", p => p.number(), {
        garantie: param("gfaId", p => p.number(true)),
        pret: param("pnfId", p => p.number(true)),
        tam: param(
            "ttaCode",
            p => p.string<"COURANT" | "THEORIQUE">(true),
            param("mprId", p => p.number())
        ),
        echeance
    })
});

router.start();

/*
    La liste des routes possibles pour cette définition est donc :
    '/'
    '/projet'
    '/projet/detail'
    '/operation'
    '/operation/:ofaId'
    '/operation/:ofaId/garantie/:gfaId'
    '/operation/:ofaId/pret/:pnfId'
    '/operation/:ofaId/tam/:ttaCode'
    '/operation/:ofaId/tam/:ttaCode/:mprId'
    '/operation/:ofaId/echeance'
    '/operation/:ofaId/echeance/:echId'
    '/operation/:ofaId/echeance/:echId/reglement'
    '/operation/:ofaId/echeance/:echId/reglement/:regId'

    Le routeur ainsi créé est constitué d'un objet ayant la forme de la configuration et contenant
    toutes les valeurs des différents paramètres qui ont été définis.
*/

router.state.operation.ofaId = 2;
router.state.operation.garantie.gfaId = 1;
router.state.operation.echeance.echId = 1;
router.state.operation.echeance.reglement.regId = 1;
router.state.operation.tam.ttaCode = "COURANT";
router.state.operation.tam.mprId = 3;

/*
    Contrairement au routeur actuel, modifier les valeurs NE NAVIGUE PAS. Et de par sa construction,
    il est impossible de déduire la route courante depuis les valeurs seules.

    Le routeur contient donc un état supplémentaire qui garde la dernière route demandée, qui est donc
    celle qui est active. C'est donc l'une des routes qu'on a définit statiquement tout à l'heure.

    Modifier une valeur d'un paramètre qui est dans la route active mettra simplement à jour l'URL.
    Toute valeur qui n'est pas dans la route actuelle est "undefined" et il ne sera pas possible
    de la renseigner.

    Lorsqu'un navigue vers une URL, la route active est mise à jour ainsi que les valeurs des
    paramètres qui sont contenus dedans.

    Pour déterminer la route active, le routeur publie une méthode "is" qui prend une fonction
    permettant de décrire de façon statiquement typée l'url, élément par élément :
*/

router.is(a => a("operation")("ofaId")("tam")("ttaCode")("mprId"));
router.is(a => a("operation")("ofaId")("echeance")("echId")("reglement")("regId"));

/*
    "is" vérifie que l'URL construite est contenue dans l'URL courante, elle ne vérifie pas une match
    exacte. Par exemple "is(a => a("operation")("ofaId"))" renvoie true pour "/operation/1/echeance/4"

    Cela permet de vérifier qu'on est sur la bonne route et ne dépend pas du tout des valeurs de paramètres.
    Si je veux distinguer entre /operation et /operation/1, je utilise is(a => a("operation")("ofaId"))
    au lieu de vérifier si router.operation.ofaId est undefined.

    Le routeur publie également une méthode "switch" qui permet de retourner une valeur différente par section
    de route qui matche :
*/

// @ts-ignore
const value = router.switch(
    a => a("operation")("ofaId"),
    route => {
        switch (route) {
            case "garantie":
                return 1;
            case "echeance":
                return 3;
            case "pret":
                return 5;
            case "tam":
                return 7;
            case undefined:
                return 0;
        }
    }
);

/*
    Le cas "undefined" est retourné si ni "/operation/:ofaId/garantie" ni "/operation/:ofaId/echeance" ne
    matche, et également si du coup /operation/:ofaId ne matche pas du tout.
    ("switch" ne propose pas de version avec callback).

    Pour naviguer, le routeur dispose d'une méthode "to", qui fonctionne un peu sur le même principe que
    "is" :
*/

router.to(a => a("operation")(1)("tam")("COURANT")(4));
router.to(a => a("operation")(1)("echeance")(4)("reglement")(3));

/*
    "to" remplace le nom des paramètres par leurs valeurs, et bien entendu c'est statiquement typé.
    C'est tout à fait équivalent à faire une navigation vers /operation/1/tam/COURANT/4 et
    /operation/1/echeance/4/reglement/3, et il faut donc nécessairement spécifier les valeurs
    de tous les paramètres.

    Pour éviter d'avoir à utiliser le routeur global dans tous les recoins de l'application, le routeur
    dispose d'une méthode "sub" qui permet de récupérer un sous-routeur qui permet d'accéder à une section
    de la table de routage.
*/

router.sub(a => a("operation")("ofaId")).to(a => a("garantie")(4));

/*
    Ce sous-routeur dispose de la même API que le routeur principal (is/to/sub), mais il n'expose que
    les URLs qui à partir de sa racine dans son objet de valeur et dans "is", "switch" et "to".

    Les méthodes fonctionnent de la même façon, en complétant les URLs construite avec la partie commune
    définie dans le "sub".

    Pour les paramètres précédants le sous-routeur, "to" utilisera les valeurs actuelles. "to" plantera
    si l'un des paramètres de l'URL est null/undefined (ce qui vaut aussi dans le cas général).
*/

const tamRouter = router.sub(a => a("operation")("ofaId")("tam"));
tamRouter.to(a => a("COURANT")(4));
tamRouter.state.ttaCode = "THEORIQUE";
tamRouter.state.mprId = 5;

const echRouter: Router<typeof echeance> = router.sub(a => a("operation")("ofaId")("echeance"));
echRouter.to(a => a(3)("reglement")(4));
echRouter.state.echId = 8;
echRouter.state.reglement.regId = 1;

/*
    Comme vu dans l'exemple précédant, on peut facilement typer un routeur avec "Router<typeof config>",
    et donc ça marche aussi pour les sous routeurs.

    On peut donc imaginer que les différents composants de l'application prendront en props (ou en contexte)
    le sous-routeur qui leur correspond et il pourra même être définit à côté, pour être remonté au fur
    et à mesure, de la même façon que les composants.

    On peut du coup utiliser un composant qui route à plusieurs endroits dans l'application sans que le
    composant n'ait besoin de le savoir. Par exemple je pourrais donc avoir un composant "EcheanceList"
    qui prend en props un "Router<typeof echeance>" pour naviguer et utiliser son état dans son implémentation
    (pour afficher des pages de détail...), tout en étant capable de le réutiliser à plusieurs endroits.
    Dans mon exemple j'ai /operation/ofaId/echeance/...., mais je pourrais très bien avoir avec aussi
    /projet/echeance/... ou n'importe quoi d'autre.

    (Remarque : je l'ai pas dit avant mais évidemment les paramètres doivent tous avoir un
    nom unique, sinon le matching des paramètres via l'URL ne pourra pas marcher)

    "makeRouter" prend également un deuxième paramètre optionnel qui permet d'ajouter des règles de blocage
    ou de redirection sur certaines routes si une condition n'est pas respectée :
*/

makeRouter(
    {
        projet: {
            detail: {}
        },
        operation: param("ofaId", p => p.number(), {
            garantie: param("gfaId", p => p.number(true)),
            pret: param("pnfId", p => p.number(true)),
            tam: param(
                "ttaCode",
                p => p.string<"COURANT" | "THEORIQUE">(true),
                param("mprId", p => p.number())
            ),
            echeance
        })
    },
    b => {
        b.block(
            a => a("operation")("ofaId")("echeance"),
            () => "lol".length !== 3
        ).redirect(
            a => a("projet"),
            () => "deso".length !== 4,
            a => a
        );

        const subBuilder: RouterConstraintBuilder<typeof echeance> = b.sub(a => a("operation")("ofaId")("echeance"));
        subBuilder.block(
            a => a("echId")("reglement"),
            () => "yolo".length !== 4
        );
    }
);

/*
    "block" matche une route avec "is" et interdira cette route si la condition du callback est remplie.
    Une route bloquée équivaut à une route inexistante et bloquera la navigation. Une mise à jour forcée
    de l'URL sur une route inexistante (sans utiliser "to" qui interdira) restaurera l'ancienne URL (et ne
    fera donc rien). Initialement, la route "/" est active donc si la première route est une route inexistante
    alors la "redirection" ira à la racine.

    "redirect" fonctionne comme "block", sauf qu'il permet de choisir une route vers laquelle rediriger. Cela
    peut être une page d'erreur quelconque ou bien simplement la route parente.

    Il est possible de spécifier plusieurs fois la même route, de préférence avec des conditions différentes
    (pour rediriger vers des endroits différents par exemple). Le routeur exécutera les conditions dans l'ordre
    dans lequel elle ont été définies et c'est donc la première qui matche qui "l'emportera".

    Enfin, comme pour le routeur en lui même, il est possible de définir des sous-builder pour appliquer des
    règles sur des sous-sections du routeur (pour les partager pour pour les décrire à côté du routeur s'il est
    dans un module par exemple).
*/
