"use strict";
// import showdown from "showdown";
import replace from "ramda/src/replace";
import compose from "ramda/src/compose";

// const converter = new showdown.Converter();

// converter.setFlavor("github");

// unixTimeToLocale :: Int -> String
const unixTimeToLocale = unixTime => new Date(unixTime).toLocaleString("sv");

// export const markdown = converter.makeHtml.bind(converter);

export const escape = compose(
    replace(/'/g, "&#039;"),
    replace(/"/g, "&quot;"),
    replace(/>/g, "&gt;"),
    replace(/</g, "&lt;"),
    replace(/&/g, "&amp;")
);

export const simpleMessageTemplate = ({ time, to, from, message }) => `
    <h3>${from} => ${to} @ ${unixTimeToLocale(time)}</h3>
    <p>${message}</p>
`;

const messageHeader = ({ time, to, from }) => `
    <div class="message-header">
        <span class="message-to">${to}</span>
        <span class="message-from">${from}</span>
        <span class="message-time">${unixTimeToLocale(time)}</span>
    </div>
`;

export const messageTemplate = ({ service, time, to, from, fromImageUrl, message }) => `
    <div class="message-wrap ${service}">
        ${messageHeader({ time, to, from })}
        <div class="message-body">
            ${fromImageUrl ? `<img src="${fromImageUrl}" class="message-image" />` : ``}
            <p class="message-message">${message}</p>
        </div>
    </div>
`;

export const insertTop = el => template => el.insertAdjacentHTML("afterBegin", template);

export const serviceStatusTemplate = (status, name) => `${name}: ${status}`;
