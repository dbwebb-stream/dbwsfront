import { fromEvent, mergeArray } from "most";
import io from "socket.io-client";
import * as R from "ramda";

import {
    escape,
    messageTemplate,
    insertTop,
    serviceStatusTemplate
    // gitterMessageTemplate,
    // ircMessageTemplate
} from "./views";

(() => {
    "use strict";
    //////////////////////////////////////////////////////
    // Settings
    //
    const dbsfunnelServer = window.funnelServer;

    //////////////////////////////////////////////////////
    // Helpers
    //

    const gitterHtml = R.path(["original", "html"]);
    const gitterOriginalHtmlToMessage = m =>
        Object.assign({}, m, { message: gitterHtml(m) || escape(m.message) });

    // ircService :: Object -> Bool
    const ircService = R.propEq("service", "irc");
    // gitterService :: Object -> Bool
    const gitterService = R.propEq("service", "gitter");
    // ircOrGitterService :: Object -> Bool
    const ircOrGitterService = R.anyPass([ircService, gitterService]);
    // unknownService :: Object -> Bool
    const unknownService = R.complement(ircOrGitterService);

    //////////////////////////////////////////////////////
    // Message stream

    const dbsfunnelSocket = io(dbsfunnelServer);

    const message$ = fromEvent("message", dbsfunnelSocket);
    const gitter$ = message$.filter(gitterService).map(gitterOriginalHtmlToMessage);
    const irc$ = message$.filter(ircService).map(R.evolve({ message: escape }));
    const unknown$ = message$.filter(unknownService).map(R.evolve({ message: escape }));

    //////////////////////////////////////////////////////
    // Run stuff
    //

    let serviceStatus = {};

    const streamEl = document.getElementById("stream");
    const funnelStatusEl = document.getElementById("funnel-status");
    const serviceStatusEl = document.getElementById("service-status");

    const insertMess = insertTop(streamEl);

    dbsfunnelSocket.on("connect", () => {
        console.log("\n< connected to funnel >");
        funnelStatusEl.innerHTML = "Uppkopplad";
    });
    dbsfunnelSocket.on("disconnect", () => {
        console.log("\n< disconnected from funnel >");
        funnelStatusEl.innerHTML = "Nere";
    });
    dbsfunnelSocket.on("currentConnectionStatus", statusObj => {
        console.log("Current service connection status:\n", statusObj);
        serviceStatus = R.merge(serviceStatus, statusObj);

        serviceStatusEl.innerHTML = R.join(
            ", ",
            R.values(R.mapObjIndexed(serviceStatusTemplate, serviceStatus))
        );
    });
    dbsfunnelSocket.on("connectionStatusChange", statusObj => {
        console.log("Service status changed: ", statusObj);
        serviceStatus = R.merge(serviceStatus, statusObj);

        serviceStatusEl.innerHTML = R.join(
            ", ",
            R.values(R.mapObjIndexed(serviceStatusTemplate, serviceStatus))
        );
    });

    mergeArray([gitter$, irc$, unknown$])
        .map(messageTemplate)
        .observe(insertMess)
        .catch(console.error);

    console.log("Listening to: ", dbsfunnelServer);
})();
