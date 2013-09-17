Popup = JAK.ClassMaker.makeClass({
	NAME : "Popup",
	VERSION : "2.2"
});

/**
 * @constructor
 * @overview Vyrábí popup okno s předaným vnitřním elementem nebo tento element
 * vytvoří. Lze definovat vlastní buttony a navěšovat callBack funkce na jejich
 * kliknutí. Závisí na frameworku JAK a knihovnách JAK.Interpolator a JAK.Window.
 * Šířeno pod MIT licencí.
 * @author Jan Elznic, http://www.janelznic.cz
 * @param {object} opt Konfigurační objekt
 * @param {string} opt.width Šířka okna zapsaná pomocí CSS hodnoty
 * @param {string} opt.height Výška okna zapsaná pomocí CSS hodnoty
 * @param {string} opt.top Horní odsazení popupy od kraje dokumentu pomocí CSS hodnoty
 * @param {string} opt.left Levé odsazení popupy od kraje dokumentu pomocí CSS hodnoty
 * @param {boolean} opt.center Vycentrovat popupu doprostřed okna prohlížeče?
 * @param {string|null} opt.callElm Id elementu, který vyvolá otevření okna
 * @param {object} opt.popUpContent Konfigurační objekt pro obsah okna
 * @param {object} opt.popUpContent.title {string} Titulek okna
 * @param {object} opt.popUpContent.text {string} Text v okně
 * @param {object} opt.popUpContent.buttons {object} Objekt s tlačítky
 * @param {object} opt.popUpContent.buttons.title {string} Text uvnitř tlačítka
 * @param {object} opt.popUpContent.buttons.callback {object} Callback funkce, která se vykoná po kliknutí na tlačítko
 * @param {object} opt.popUpContent.buttons.closeOnClick {boolean} Má se po kliknutí na tlačítko zavřít popupa?
 * @param {boolean} opt.openOnRefresh Má se na refresh stránky otevřít popupa?
 * @param {string} opt.imgPath Cesta k obrázkům
 * @param {array[int,int,int,int]} opt.imgPath Pole čtyř velikostí okrajů, dle hodinových ručiček
 * @param {string} opt.contId ID kontejneru, do kterého se okno připne
 */
Popup.prototype.$constructor = function(opt) {
	/* Výchozí hodnoty */
	this.opt = {
		width: "auto",
		height: "auto",
		top: null,
		left: null,
		center: true,
		callElm: null,
		popUpContent: null,
		openOnRefresh: false,
		imgPath: "img/window/",
		imgBorderSizes: [14,14,14,14],
		contId: "container"
	};

	/* Načtení předané konfigurace */
	for(var p in opt) {
		this.opt[p] = opt[p];
	}

	this.isOpen = false;

	/* Elementy */
	this.dom = {};

	/* Jestliže jsou callElementy pole, bude this.dom.callElm pole */
	switch (typeof(this.opt.callElm)) {
		case "string":
			var callElm = this.opt.callElm;
			this.dom.callElm = (typeof(callElm) == "string" ? JAK.gel(callElm) : callElm);
			break;
		case "object":
			this.dom.callElm = [];
			for (var i=0, j=this.opt.callElm.length; i<j; i++) {
				this.dom.callElm.push(JAK.gel(this.opt.callElm[i]));
			}
			break;
		default:
			this.dom.callElm = [];
	}

	this.ec = [];
	this.dom.popUpContent = this._getContent();
	this._build();
};

/**
 * Vytvoří obsah okna
 **/
Popup.prototype._getContent = function() {
	var content = this.opt.popUpContent;
	switch (typeof(content)) {
		case ("object"):
			var winCont = JAK.mel("div", { className: "popup" }, { display: "none" });
			JAK.gel(this.opt.contId).appendChild(winCont);
			winCont.appendChild(JAK.mel("h4", { innerHTML: this.opt.popUpContent.title }));
			winCont.appendChild(JAK.mel("p", { innerHTML: this.opt.popUpContent.text }));

			var buttons = this.opt.popUpContent.buttons;
			for (var i=0, j=buttons.length, button, callback, className, type; i < j; i++) {
				button = JAK.mel("button");

				className = buttons[i].className;
				if (className) JAK.DOM.addClass(button, className);

				if (buttons[i].closeOnClick) {
					this.ec.push(JAK.Events.addListener(button, "click", this, "close"));
				}

				button.innerHTML = buttons[i].title;
				winCont.appendChild(button);

				callback = buttons[i].callback;
				type = typeof(callback);
				if (callback) {
					if (type == "function") {
						this.ec.push(JAK.Events.addListener(button, "click", this, callback));
					} else if (type == "string") {
						this._callback = callback;
						this.ec.push(JAK.Events.addListener(button, "click", this,
							function(e, elm) {
								window.location.href = this._callback;
							}.bind(this)
						));
					}
				}
			}
			return winCont;
			break;
		case ("string"):
			return JAK.gel(content);
			break;
	}
};

/**
 * Vybuildění okna
 **/
Popup.prototype._build = function() {
	this.dom.popUpContent.style.display = "block";
	var windowParams = {
		imagePath: this.opt.imgPath,
		sizes: this.opt.imgBorderSizes
	};
	this.window = new JAK.Window(windowParams);

	/* Pozadí */
	this.dom.bg = JAK.mel("div", { className: "PopUpBg" });
	document.body.appendChild(this.dom.bg);

	/* Okno */
	this.dom.main = this.window.container;

	this.dom.mainTable = this.dom.main.getElementsByTagName("table")[0];
	this.dom.main.className = "PopUpMain";
	document.body.appendChild(this.dom.main);

	/* Vnitřek */
	this.dom.content = this.window.content;
	this.dom.content.style.width = this.opt.width + "px";
	this.dom.content.style.height = this.opt.height + "px";
	this.dom.content.appendChild(this.dom.popUpContent);

	/* Zvírací křížek */
	this.dom.close = JAK.mel("span", { className : "PopUpClose", innerHTML : "<span>x</span>" }, { cursor:"pointer" });
	this.dom.content.appendChild(this.dom.close);

	this._addListeners();
};
/**
 * Vycentrování
 **/
Popup.prototype._center = function() {
	var scroll = JAK.DOM.getScrollPos();
	var docSize = JAK.DOM.getDocSize();
	var mainSize = { width : this.dom.main.offsetWidth, height: this.dom.main.offsetHeight };
	this.dom.main.style.left = (((docSize.width-mainSize.width)/2)+scroll.x) + "px";
	this.dom.main.style.top = (((docSize.height-mainSize.height)/2)+scroll.y) + "px";
};

/**
 * Otevření okna
 **/
Popup.prototype.open = function(e, elm) {
	this.isOpen = true;
	JAK.Events.cancelDef(e);
	this.dom.bg.style.display = "block";
	this.dom.bg.style.visibility = "visible";
	JAK.DOM.clear(this.dom.content);
	this.dom.content.appendChild(this.dom.popUpContent);
	this.dom.content.appendChild(this.dom.close);
	if (this.dom.generatorElm) { JAK.DOM.clear(this.dom.generatorElm); }
	this.dom.main.style.display = "block";
	this.dom.main.style.visibility = "visible";
	this._posMain();
};

/**
 * Napozicování a animace
 **/
Popup.prototype._posMain = function() {
	if (!this.opt.center) {
		this.dom.main.style.top = this.opt.top + "px";
		this.dom.main.style.left = this.opt.left + "px";
	} else {
		this._center();
	}
	var docSize = JAK.DOM.getDocSize();
	this.dom.bg.style.height = docSize.height + "px";
	if (JAK.Browser.client == "ie" && JAK.Browser.version == 6) {
		this.ec.push(JAK.Events.addListener(window, "scroll", this, "_moveBg"));
	}
	var interpolator = new JAK.CSSInterpolator(this.dom.bg, 150, { endCallback: this._visibleMain.bind(this) });
	interpolator.addProperty("opacity", 0, 0.6, "");
	interpolator.start();
	interpolator = null;
};

Popup.prototype._moveBg = function(e, elm) {
	var scroll = JAK.DOM.getScrollPos();
	this.dom.bg.style.top = scroll.y + "px";
}

/**
 * Zavření a animace
 **/
Popup.prototype.close = function(e, elm) {
	this.isOpen = false;
	var interpolator = new JAK.CSSInterpolator(this.dom.bg, 150, { endCallback: this._closeBg.bind(this) });
	interpolator.addProperty("opacity", 0.6, 0, "");
	interpolator.start();
	interpolator = null;
};

/**
 * Nastavení opacity
 **/
Popup.prototype._visibleMain = function() {
	this.dom.main.style.opacity = 1;
};

/**
 * Skrýt pozadí popupu
 **/
Popup.prototype._closeBg = function() {
	this.dom.bg.style.display = "none";
	this.dom.bg.style.visibility = "hidden";
	this.dom.main.style.display = "none";
	this.dom.main.style.visibility = "hidden";
};

/**
 * Zavření na escape
 **/
Popup.prototype._keyClose = function(e, elm) {
	if (this.isOpen) {
		if (e.keyCode == 27) { this.close(); }
	}
};

/**
 * Navěšení událostí
 **/
Popup.prototype._addListeners = function() {
	/* Otevření při klik na ovladač */
	if (this.dom.callElm.length > 0) {
		for (var i=0, j=this.dom.callElm.length, callElm; i<j; i++) {
			callElm = this.dom.callElm[i];
			if (callElm) this.ec.push(JAK.Events.addListener(callElm, "click", this, "open"));
		}
	} else {
		this.ec.push(JAK.Events.addListener(this.dom.callElm, "click", this, "open"));
	}

	/* Otevření bubliny na onload stránky */
	if (this.opt.openOnRefresh == 1) {
		this.ec.push(JAK.Events.addListener(window, "load", this, "open"));
	}

	/* Zavření okna */
	this.ec.push(JAK.Events.addListener(this.dom.bg, "click", this, "close"));
	this.ec.push(JAK.Events.addListener(window, "keydown", this, "_keyClose"));
	this.ec.push(JAK.Events.addListener(this.dom.close, "click", this, "close"));
};
