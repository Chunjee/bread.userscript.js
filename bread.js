// ==UserScript==
// @name         Bread
// @description  Bread - Read text faster & easier
// @version      0.1.0
// @match        *://*/*
// @author       Chunjee
// @namespace    http://github.com/Chunjee
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

GM_config.init(
	{
		'id': 'BreadConfig',
		'title': 'Bread Configuration',
		'fields':
		{
			'MinWordLength':
			{
				'label': 'Minimum word length',
				'type': 'int',
				'min': 1,
				'max': 20,
				'default': 4,
			},
			'MinTextLength':
			{
				'label': 'Minimum text length',
				'type': 'int',
				'min': 1,
				'max': 500,
				'default': 50,
			},
			'BoldRatio':
			{
				'label': 'Bold ratio',
				'type': 'float',
				'min': 0.1,
				'max': 1,
				'default': 0.47,
			},
		}
	});

GM_registerMenuCommand('Configuration', () => {
	GM_config.open();
});

var minWordLength = GM_config.get('MinWordLength');
var minTextLength = GM_config.get('MinTextLength');
var boldRatio = GM_config.get('BoldRatio');

function insertTextBefore(text, node, bold) {
	if (bold) {
		var span = document.createElement("span");
		span.style.fontWeight = "bolder";
		span.appendChild(document.createTextNode(text));

		node.parentNode.insertBefore(span, node);
	} else {
		node.parentNode.insertBefore(document.createTextNode(text), node);
	}
}

function processNode(node) {
	var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
		acceptNode: (node) => {
			return (
				node.parentNode.nodeName !== 'SCRIPT' &&
				node.parentNode.nodeName !== 'NOSCRIPT' &&
				node.parentNode.nodeName !== 'STYLE' &&
				node.nodeValue.length >= minTextLength) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
		}
	});

	while (node = walker.nextNode()) {
		var text = node.nodeValue;
		var wStart = -1, wLen = 0, eng = false;

		// English letters only
		for (var i = 0; i <= text.length; i++) { // We use <= here because we want to include the last character in the loop
			var cEng = i < text.length ? /[\p{Letter}\p{Mark}]/u.test(text[i]) : false;

			if (i == text.length || eng !== cEng) {
				// State flipped or end of string
				if (eng && wLen >= minWordLength) {
					var word = text.substring(wStart, wStart + wLen);
					var numBold = Math.ceil(word.length * boldRatio);
					var bt = word.substring(0, numBold), nt = word.substring(numBold);
					insertTextBefore(bt, node, true);
					insertTextBefore(nt, node, false);
				} else if (wLen > 0) {
					var word2 = text.substring(wStart, wStart + wLen);
					insertTextBefore(word2, node, false);
				}
				wStart = i;
				wLen = 1;
				eng = cEng;
			} else {
				wLen++;
			}
		}
		node.nodeValue = ""; // Can't remove the node (otherwise the tree walker will break) so just set it to empty
	}
}

// This event listener fires when the page loads
window.addEventListener("load", function(event) { processNode(event.target); }, false);

// This event listener fires the script on content that's dynamically loaded in (i.e. expanding pages)
document.body.addEventListener('DOMNodeInserted', function(event) { processNode(event.target); }, false);
