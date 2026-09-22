/**
 * CSInterface - Simplified for ATUL X SFX
 * Original from Adobe CEP Samples
 */
function CSInterface() {
  this.hostEnvironment = window.__adobe_cep__ ? JSON.parse(window.__adobe_cep__.getHostEnvironment()) : { appName: "UNKNOWN", appVersion: "0" };
}
CSInterface.prototype.getHostEnvironment = function() {
  return this.hostEnvironment;
};
CSInterface.prototype.evalScript = function(script, callback) {
  if (window.__adobe_cep__) {
    window.__adobe_cep__.evalScript(script, callback);
  } else if (callback) {
    callback("CEP not available");
  }
};
CSInterface.prototype.getSystemPath = function(pathType) {
  if (window.__adobe_cep__) {
    return window.__adobe_cep__.getSystemPath(pathType);
  }
  return "";
};
CSInterface.prototype.closeExtension = function() {
  if (window.__adobe_cep__) window.__adobe_cep__.closeExtension();
};
CSInterface.prototype.getExtensionID = function() {
  return window.__adobe_cep__ ? window.__adobe_cep__.getExtensionId() : "com.atulxsfx.plugin.panel";
};
CSInterface.prototype.getApplicationID = function() {
  return this.hostEnvironment.appId || "UNKNOWN";
};
CSInterface.prototype.getHostCapabilities = function() {
  return JSON.parse(window.__adobe_cep__.getHostCapabilities());
};
CSInterface.prototype.dispatchEvent = function(event) {
  if (window.__adobe_cep__) window.__adobe_cep__.dispatchEvent(event);
};
CSInterface.prototype.addEventListener = function(type, listener) {
  if (window.__adobe_cep__) window.__adobe_cep__.addEventListener(type, listener);
};
CSInterface.prototype.removeEventListener = function(type, listener) {
  if (window.__adobe_cep__) window.__adobe_cep__.removeEventListener(type, listener);
};
CSInterface.prototype.requestOpenExtension = function(extensionId, params) {
  if (window.__adobe_cep__) window.__adobe_cep__.requestOpenExtension(extensionId, params);
};
CSInterface.SystemPath = {
  USER_DATA: "userData",
  COMMON_FILES: "commonFiles",
  MY_DOCUMENTS: "myDocuments",
  APPLICATION: "application",
  EXTENSION: "extension",
  HOST_APPLICATION: "hostApplication"
};
CSInterface.THEME_COLOR_CHANGED_EVENT = "com.adobe.csxs.events.ThemeColorChanged";
