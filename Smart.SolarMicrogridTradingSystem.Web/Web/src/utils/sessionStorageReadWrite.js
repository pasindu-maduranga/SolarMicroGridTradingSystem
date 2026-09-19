export default {
    getLastSelectedParentMenuIDFromSession,
    getLastSelectedMainMenuIDFromSession,
    getLastSelectedScreenIDFromSession,
    setLastSelectedParentMenuIDFromSession,
    setLastSelectedMainMenuIDFromSession,
    setLastSelectedScreenIDFromSession,
    removeLastSelectedParentMenuIDFromSession,
    removeLastSelectedMainMenuIDFromSession,
    removeLastSelectedScreenIDFromSession,
    removeTokenFromSession
}

function getLastSelectedParentMenuIDFromSession() {
    let resultID = sessionStorage.getItem("web-last-land-ref-parent-menu-ref-id")
    return resultID;
}

function getLastSelectedMainMenuIDFromSession() {
    let resultID = sessionStorage.getItem("web-last-land-ref-main-menu-ref-id")
    return resultID;
}

function getLastSelectedScreenIDFromSession() {
    let resultID = sessionStorage.getItem("web-last-land-ref-screen-ref-id")
    return resultID;
}

function setLastSelectedParentMenuIDFromSession(value) {
    sessionStorage.setItem("web-last-land-ref-parent-menu-ref-id", value)
}

function setLastSelectedMainMenuIDFromSession(value) {
    sessionStorage.setItem("web-last-land-ref-main-menu-ref-id", value)
}

function setLastSelectedScreenIDFromSession(value) {
    sessionStorage.setItem("web-last-land-ref-screen-ref-id", value)
}

function removeLastSelectedParentMenuIDFromSession() {
    sessionStorage.removeItem("web-last-land-ref-parent-menu-ref-id")
}

function removeLastSelectedMainMenuIDFromSession() {
    sessionStorage.removeItem("web-last-land-ref-main-menu-ref-id")
}

function removeLastSelectedScreenIDFromSession() {
    sessionStorage.removeItem("web-last-land-ref-screen-ref-id")
}

function removeTokenFromSession() {
    sessionStorage.removeItem('token');
}