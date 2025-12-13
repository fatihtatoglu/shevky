import _cfg from "./config.js";

function getRss() {
    return {
        key: "rss",
        tone: "rss",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 32 32"><g class="nc-icon-wrapper" fill="currentColor"><circle cx="6.566" cy="25.434" r="3.566"></circle><path d="M20.234,29h-5.051c0-6.728-5.454-12.183-12.183-12.183h0v-5.051c9.518,0,17.234,7.716,17.234,17.234Z"></path><path d="M23.8,29c0-11.488-9.312-20.8-20.8-20.8V3c14.359,0,26,11.641,26,26h-5.2Z"></path></g></svg>`,
        url: "/feed.xml",
        external: false
    };
}

function getGitHub() {
    if (!_cfg.identity.social.github) {
        return;
    }

    return {
        key: "github",
        tone: "github",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 32 32"><g class="nc-icon-wrapper" fill="currentColor"><path d="M16,2.345c7.735,0,14,6.265,14,14-.002,6.015-3.839,11.359-9.537,13.282-.7,.14-.963-.298-.963-.665,0-.473,.018-1.978,.018-3.85,0-1.312-.437-2.152-.945-2.59,3.115-.35,6.388-1.54,6.388-6.912,0-1.54-.543-2.783-1.435-3.762,.14-.35,.63-1.785-.14-3.71,0,0-1.173-.385-3.85,1.435-1.12-.315-2.31-.472-3.5-.472s-2.38,.157-3.5,.472c-2.677-1.802-3.85-1.435-3.85-1.435-.77,1.925-.28,3.36-.14,3.71-.892,.98-1.435,2.24-1.435,3.762,0,5.355,3.255,6.563,6.37,6.913-.403,.35-.77,.963-.893,1.872-.805,.368-2.818,.963-4.077-1.155-.263-.42-1.05-1.452-2.152-1.435-1.173,.018-.472,.665,.017,.927,.595,.332,1.277,1.575,1.435,1.978,.28,.787,1.19,2.293,4.707,1.645,0,1.173,.018,2.275,.018,2.607,0,.368-.263,.787-.963,.665-5.719-1.904-9.576-7.255-9.573-13.283,0-7.735,6.265-14,14-14Z"></path></g></svg>`,
        url: _cfg.identity.social.github,
        external: true
    };
}

function getLinkedin() {
    if (!_cfg.identity.social.linkedin) {
        return;
    }

    return {
        key: "linkedin",
        tone: "linkedin",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 32 32"><g class="nc-icon-wrapper" fill="currentColor"><path d="M26.111,3H5.889c-1.595,0-2.889,1.293-2.889,2.889V26.111c0,1.595,1.293,2.889,2.889,2.889H26.111c1.595,0,2.889-1.293,2.889-2.889V5.889c0-1.595-1.293-2.889-2.889-2.889ZM10.861,25.389h-3.877V12.87h3.877v12.519Zm-1.957-14.158c-1.267,0-2.293-1.034-2.293-2.31s1.026-2.31,2.293-2.31,2.292,1.034,2.292,2.31-1.026,2.31-2.292,2.31Zm16.485,14.158h-3.858v-6.571c0-1.802-.685-2.809-2.111-2.809-1.551,0-2.362,1.048-2.362,2.809v6.571h-3.718V12.87h3.718v1.686s1.118-2.069,3.775-2.069,4.556,1.621,4.556,4.975v7.926Z" fill-rule="evenodd"></path></g></svg>`,
        url: _cfg.identity.social.linkedin,
        external: true
    };
}

const API = {
    get: function () {
        return [
            getRss(),
            getGitHub(),
            getLinkedin()
        ].filter((item) => {
            if (item) {
                return item;
            }
        });
    }
};

export default API;