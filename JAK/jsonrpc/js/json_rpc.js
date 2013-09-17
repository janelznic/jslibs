JSONRPC = JAK.ClassMaker.makeClass({
	NAME: "JSONRPC",
	VERSION: "1.3"
});

/**
 * @constructor
 * @overview JSON-RPC komunikátor. Závisí na frameworku JAK. Šířeno pod MIT licencí.
 * @author Jan Elznic, http://www.janelznic.cz
 * @param {string} serverUrl URL pro spojení s JSON-RPC serverem
 **/
JSONRPC.prototype.$constructor = function(serverUrl) {
	this._serverUrl = serverUrl;

	/* Aktuální sešna */
	this.cursession = null;

	/* UserID aktuálně přihlášeného uživatele */
	this.userId = null;

	this.freeForReq;

	this._idcounter = 1;
	this._wget = this._getXmlHttpRequestObject();
};

JSONRPC.prototype.doJSONRPCRequest = function(method, data, callback) {
	this._doJSONRPCRequest(method, data, callback);
};

/**
 * Veřejná metoda pro odeslání dotazu na server
 * @param {string} method Název volané metody
 * @param {string} data Objekt s argumenty, které se předají serveru
 * @param {object} callback Callback funkce, která se má vykonat po odpovědi od serveru
 */
JSONRPC.prototype.request = function(method, data, callback) {
	this._doJSONRPCRequest(method, data, callback);
};

JSONRPC.prototype._doJSONRPCRequest = function(method, data, callback) {
	var session = this.cursession == null? '':', "context":{"session":"' + this.cursession + '"}';
	var params = JSON.stringify(data);

	var body = '{"method":"' + method + '", "params":' + params + ', "id":"' + this._idcounter + '"' + session + '}';
	this._idcounter++;

	this._wget.abort();
	this._wget.open("POST", this._serverUrl);
	this._wget.setRequestHeader("Content-Type", "application/json");
	var onReadyStateChange = function() {
		//if (this._wget.readyState != 4) return;
		if (this._wget.readyState == 4) {
			if (this._wget.status != 200) {
				 callback(null, "Http request failed. Code: " + this._wget.status);
			} else {
				var res = this._wget.responseText;
				var objres;
				var error;
				try {
					eval("objres = "+res);
					if (objres.error != null) error = objres.error; 
				} catch (e) {
					error = res;
				}
				if (error != null) callback(null,error);
				else callback(objres.result,null);
			}
		}
	};
	this._wget.onreadystatechange = onReadyStateChange.bind(this);
	this._wget.send(body);
};

JSONRPC.prototype._getXmlHttpRequestObject = function() {
	if (window.XMLHttpRequest) {
		/* Not IE */
		return new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		/* IE */
		return new ActiveXObject("Microsoft.XMLHTTP");
	} else {
		alert("Your browser doesn't support the XmlHttpRequest object. Better upgrade to Firefox.");
	}
};
