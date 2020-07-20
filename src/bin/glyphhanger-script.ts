// Adapted from glyphhanger https://github.com/filamentgroup/glyphhanger
// @ts-nocheck
(function(root, factory) {
	if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
		// CommonJS
		module.exports = factory(require('characterset'));
	} else {
		// Browser
		root.GlyphHanger = factory(root.CharacterSet);
	}
})(this, function(CharacterSet) {
	const GH = function() {
		this.globalSet = new CharacterSet();
		this.fontFamilySets = {};
		this.displayFontFamilyNames = {};
		this.displayFontStyles = {};
		this.displayFontWeights = {};
		this.defaultFontFamily = 'serif';

		if (typeof window !== 'undefined') {
			this.win = window;
		}
	};

	GH.prototype.setEnv = function(win) {
		this.win = win;
	};

	GH.prototype.init = function(contextNode, options) {
		options = options || {};
		if (contextNode) {
			const nodes = Array.from(contextNode.querySelectorAll('*'));
			nodes.push(contextNode);
			nodes.forEach(
				function(node) {
					if (node.tagName) {
						const tagName = node.tagName.toLowerCase();
						if (tagName === 'script') {
							return;
						}
					}

					if (
						options.onlyVisible &&
						!(
							node.offsetWidth ||
							node.offsetHeight ||
							node.getClientRects().length
						)
					) {
						return;
					}

					if (options.cssSelector && !node.matches(options.cssSelector)) {
						return;
					}

					this.getTextNodeChildren(node)
						.filter(
							function(textNode) {
								// Only non-empty values
								return this.hasValue(textNode);
							}.bind(this)
						)
						.forEach(
							function(textNode) {
								const fontFamily = this.getFontFamilyNameFromNode(
									textNode,
									null
								);
								const text = this.getNodeValue(textNode);
								const extra = this.getExtraInfo(textNode, null);
								// Console.log( "font-family `" + fontFamily + "` has text: ", text );

								this.saveGlyphs(text, fontFamily, extra);
							}.bind(this)
						);

					const beforeContent = this.getPseudoContent(node, ':before');
					if (beforeContent) {
						const beforeFamily = this.getFontFamilyNameFromNode(
							node,
							':before'
						);
						const extra = this.getExtraInfo(node, ':before');
						// Console.log( "(:before) font-family `" + beforeFamily + "` has text: ", beforeContent );
						this.saveGlyphs(beforeContent, beforeFamily, extra);
					}

					const afterContent = this.getPseudoContent(node, ':after');
					if (afterContent) {
						const afterFamily = this.getFontFamilyNameFromNode(node, ':after');
						const extra = this.getExtraInfo(node, ':after');
						// Console.log( "(:after) font-family `" + afterFamily + "` has text: ", afterContent );
						this.saveGlyphs(afterContent, afterFamily, extra);
					}
				}.bind(this)
			);
		}
	};

	GH.prototype.getPseudoContent = function(node, pseudo) {
		if (!pseudo) {
			return;
		}

		return this.removeQuotes(
			this.win.getComputedStyle(node, pseudo).getPropertyValue('content'),
			true
		);
	};

	// TODO resolve keywords when not string content
	GH.prototype.removeQuotes = function(text, requireQuotes) {
		if (text.indexOf('’') === 0) {
			// Using single quotes
			return text.replace(/'/g, '');
		}

		if (text.indexOf('"') === 0) {
			// Using double quotes
			return text.replace(/"/g, '');
		}

		if (!requireQuotes) {
			return text;
		}
	};

	GH.prototype.getFontFamilyName = function(fontFamilyList) {
		if (!fontFamilyList) {
			return '';
		}

		const split = fontFamilyList
			.split(',')
			.map(function(family) {
				// Remove whitespace
				return family.trim();
			})
			.map(
				function(family) {
					// Remove quotes
					return this.removeQuotes(family);
				}.bind(this)
			);

		return split.length ? split[0] : '';
	};

	GH.prototype.getFontFamilyNameFromNode = function(node, pseudo) {
		let context = node;
		if (node.nodeType === 3) {
			context = node.parentNode;
		}

		let fontFamilyList;
		if (context) {
			const fontFamily = this.win
				.getComputedStyle(context, pseudo)
				.getPropertyValue('font-family');
			// Console.log( "node font-family:", fontFamisuly, "fallback to", this.defaultFontFamily );
			fontFamilyList = fontFamily || this.defaultFontFamily;
		}

		return this.getFontFamilyName(fontFamilyList);
	};

	GH.prototype.getExtraInfo = function(node, pseudo) {
		let context = node;
		if (node.nodeType === 3) {
			context = node.parentNode;
		}

		let fontStyle;
		let fontWeight;
		if (context) {
			const style = this.win
				.getComputedStyle(context, pseudo)
				.getPropertyValue('font-style');
			fontStyle = style || 'normal';
			const weight = this.win
				.getComputedStyle(context, pseudo)
				.getPropertyValue('font-weight');
			fontWeight = weight || '400';
		}

		return {fontStyle, fontWeight};
	};

	GH.prototype.fakeInnerText = function(node) {
		const value = node.nodeValue.trim();

		if (node.nodeType !== 3) {
			return '';
		}

		if (node.parentNode) {
			const style = this.win.getComputedStyle(node.parentNode);
			const textTransform = style.getPropertyValue('text-transform');
			// More information on small-caps at issue #51
			const fontVariant = style.getPropertyValue('font-variant');

			if (fontVariant === 'small-caps' || textTransform === 'capitalize') {
				// Workaround language specific rules with text-transform
				// "ß".toUpperCase() => "SS" in german, for example
				return value.toUpperCase() + value.toLowerCase();
			}

			if (textTransform === 'uppercase') {
				return value.toUpperCase();
			}

			if (textTransform === 'lowercase') {
				return value.toLowerCase();
			}
		}

		// Console.log( "returning nodeValue", value );

		return value;
	};

	GH.prototype.getNodeValue = function(node) {
		const innerText = this.fakeInnerText(node);
		// Console.log( "innerText:", node.innerText );
		// console.log( "fakeInnerText:", innerText );
		return node.textContent || innerText || '';
	};

	GH.prototype.getFontStyle = function(node) {};

	GH.prototype.hasValue = function(node) {
		return (node.textContent || node.nodeValue).trim().length > 0;
	};

	GH.prototype.getTextNodeChildren = function(node) {
		// Modified from http://stackoverflow.com/questions/10730309/find-all-text-nodes-in-html-page
		const all = [];
		var node;
		for (node = node.firstChild; node; node = node.nextSibling) {
			if (node.nodeType === 3) {
				all.push(node);
			}
		}

		return all;
	};

	GH.prototype.saveGlyphs = function(text, fontFamily, extra) {
		const set = new CharacterSet(text);
		const {fontStyle, fontWeight} = extra;
		this.globalSet = this.globalSet.union(set);

		if (fontFamily) {
			const key = fontFamily.toLowerCase();
			this.displayFontFamilyNames[key] = fontFamily;

			if (key) {
				this.fontFamilySets[key] = this.getFamilySet(key).union(set);
				if (fontStyle) {
					this.displayFontStyles[key] = this.displayFontStyles[key]
						? [...this.displayFontStyles[key], fontStyle]
						: [fontStyle];
				}

				if (fontWeight) {
					this.displayFontWeights[key] = this.displayFontWeights[key]
						? [...this.displayFontWeights[key], fontWeight]
						: [fontWeight];
				}
			}
		}
	};

	GH.prototype.getFamilySet = function(fontFamily) {
		return fontFamily in this.fontFamilySets
			? this.fontFamilySets[fontFamily]
			: new CharacterSet();
	};

	GH.prototype.getGlyphs = function() {
		return this.globalSet.toHexRangeString();
	};

	GH.prototype.toString = function() {
		return this.globalSet.toString();
	};

	GH.prototype.toJSONString = function() {
		return JSON.stringify(this.toJSON());
	};

	GH.prototype.toJSON = function() {
		const object = {};
		for (const family in this.fontFamilySets) {
			object[this.displayFontFamilyNames[family]] = {
				glyphs: this.fontFamilySets[family].toHexRangeString(),
				styles: [...new Set(this.displayFontStyles[family])],
				weights: [...new Set(this.displayFontWeights[family])]
			};
		}

		// Object['*'] = this.getGlyphs();

		return object;
	};

	return GH;
});
