/*\
 * |*|
 * |*|  :: cookies.js ::
 * |*|
 * |*|  A complete cookies reader/writer framework with full unicode support.
 * |*|
 * |*|  Revision #1 - September 4, 2014
 * |*|
 * |*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
 * |*|  https://developer.mozilla.org/User:fusionchess
 * |*|
 * |*|  This framework is released under the GNU Public License, version 3 or later.
 * |*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
 * |*|
 * |*|  Syntaxes:
 * |*|
 * |*|  * cookie.setItem(name, value[, end[, path[, domain[, secure]]]])
 * |*|  * cookie.getItem(name)
 * |*|  * cookie.removeItem(name[, path[, domain]])
 * |*|  * cookie.hasItem(name)
 * |*|  * cookie.keys()
 * |*|
 * \*/

var cookie = {
	getItem: function(sKey) {
		if (!sKey) {
			return null;
		}
		return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
	},
	setItem: function(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
		if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
			return false;
		}
		var sExpires = "";
		if (vEnd) {
			switch (vEnd.constructor) {
				case Number:
					sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
					break;
				case String:
					sExpires = "; expires=" + vEnd;
					break;
				case Date:
					sExpires = "; expires=" + vEnd.toUTCString();
					break;
			}
		}
		document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
		return true;
	},
	removeItem: function(sKey, sPath, sDomain) {
		if (!this.hasItem(sKey)) {
			return false;
		}
		document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
		return true;
	},
	hasItem: function(sKey) {
		if (!sKey) {
			return false;
		}
		return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
	},
	keys: function() {
		var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
		for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
			aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
		}
		return aKeys;
	}
};
;(function (global, factory) { // eslint-disable-line
	"use strict"
	/* eslint-disable no-undef */
	var m = factory(global)
	if (typeof module === "object" && module != null && module.exports) {
		module.exports = m
	} else if (typeof define === "function" && define.amd) {
		define(function () { return m })
	} else {
		global.m = m
	}
	/* eslint-enable no-undef */
})(typeof window !== "undefined" ? window : {}, function (global, undefined) { // eslint-disable-line
	"use strict"

	m.version = function () {
		return "v0.2.3"
	}

	var hasOwn = {}.hasOwnProperty
	var type = {}.toString

	function isFunction(object) {
		return typeof object === "function"
	}

	function isObject(object) {
		return type.call(object) === "[object Object]"
	}

	function isString(object) {
		return type.call(object) === "[object String]"
	}

	var isArray = Array.isArray || function (object) {
		return type.call(object) === "[object Array]"
	}

	function noop() {}

	var voidElements = {
		AREA: 1,
		BASE: 1,
		BR: 1,
		COL: 1,
		COMMAND: 1,
		EMBED: 1,
		HR: 1,
		IMG: 1,
		INPUT: 1,
		KEYGEN: 1,
		LINK: 1,
		META: 1,
		PARAM: 1,
		SOURCE: 1,
		TRACK: 1,
		WBR: 1
	}

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame

	// self invoking function needed because of the way mocks work
	function initialize(mock) {
		$document = mock.document
		$location = mock.location
		$cancelAnimationFrame = mock.cancelAnimationFrame || mock.clearTimeout
		$requestAnimationFrame = mock.requestAnimationFrame || mock.setTimeout
	}

	// testing API
	m.deps = function (mock) {
		initialize(global = mock || window)
		return global
	}

	m.deps(global)

	/**
	 * @typedef {String} Tag
	 * A string that looks like -> div.classname#id[param=one][param2=two]
	 * Which describes a DOM node
	 */

	function parseTagAttrs(cell, tag) {
		var classes = []
		var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g
		var match

		while ((match = parser.exec(tag))) {
			if (match[1] === "" && match[2]) {
				cell.tag = match[2]
			} else if (match[1] === "#") {
				cell.attrs.id = match[2]
			} else if (match[1] === ".") {
				classes.push(match[2])
			} else if (match[3][0] === "[") {
				var pair = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/.exec(match[3])
				cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" : true)
			}
		}

		return classes
	}

	function getVirtualChildren(args, hasAttrs) {
		var children = hasAttrs ? args.slice(1) : args

		if (children.length === 1 && isArray(children[0])) {
			return children[0]
		} else {
			return children
		}
	}

	function assignAttrs(target, attrs, classes) {
		var classAttr = "class" in attrs ? "class" : "className"

		for (var attrName in attrs) {
			if (hasOwn.call(attrs, attrName)) {
				if (attrName === classAttr &&
						attrs[attrName] != null &&
						attrs[attrName] !== "") {
					classes.push(attrs[attrName])
					// create key in correct iteration order
					target[attrName] = ""
				} else {
					target[attrName] = attrs[attrName]
				}
			}
		}

		if (classes.length) target[classAttr] = classes.join(" ")
	}

	/**
	 *
	 * @param {Tag} The DOM node tag
	 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array,
	 *                      or splat (optional)
	 */
	function m(tag, pairs) {
		var args = [].slice.call(arguments, 1)

		if (isObject(tag)) return parameterize(tag, args)

		if (!isString(tag)) {
			throw new Error("selector in m(selector, attrs, children) should " +
				"be a string")
		}

		var hasAttrs = pairs != null && isObject(pairs) &&
			!("tag" in pairs || "view" in pairs || "subtree" in pairs)

		var attrs = hasAttrs ? pairs : {}
		var cell = {
			tag: "div",
			attrs: {},
			children: getVirtualChildren(args, hasAttrs)
		}

		assignAttrs(cell.attrs, attrs, parseTagAttrs(cell, tag))
		return cell
	}

	function forEach(list, f) {
		for (var i = 0; i < list.length && !f(list[i], i++);) {
			// function called in condition
		}
	}

	function forKeys(list, f) {
		forEach(list, function (attrs, i) {
			return (attrs = attrs && attrs.attrs) &&
				attrs.key != null &&
				f(attrs, i)
		})
	}
	// This function was causing deopts in Chrome.
	function dataToString(data) {
		// data.toString() might throw or return null if data is the return
		// value of Console.log in some versions of Firefox (behavior depends on
		// version)
		try {
			if (data != null && data.toString() != null) return data
		} catch (e) {
			// silently ignore errors
		}
		return ""
	}

	// This function was causing deopts in Chrome.
	function injectTextNode(parentElement, first, index, data) {
		try {
			insertNode(parentElement, first, index)
			first.nodeValue = data
		} catch (e) {
			// IE erroneously throws error when appending an empty text node
			// after a null
		}
	}

	function flatten(list) {
		// recursively flatten array
		for (var i = 0; i < list.length; i++) {
			if (isArray(list[i])) {
				list = list.concat.apply([], list)
				// check current index again and flatten until there are no more
				// nested arrays at that index
				i--
			}
		}
		return list
	}

	function insertNode(parentElement, node, index) {
		parentElement.insertBefore(node,
			parentElement.childNodes[index] || null)
	}

	var DELETION = 1
	var INSERTION = 2
	var MOVE = 3

	function handleKeysDiffer(data, existing, cached, parentElement) {
		forKeys(data, function (key, i) {
			existing[key = key.key] = existing[key] ? {
				action: MOVE,
				index: i,
				from: existing[key].index,
				element: cached.nodes[existing[key].index] ||
					$document.createElement("div")
			} : {action: INSERTION, index: i}
		})

		var actions = []
		for (var prop in existing) if (hasOwn.call(existing, prop)) {
			actions.push(existing[prop])
		}

		var changes = actions.sort(sortChanges)
		var newCached = new Array(cached.length)

		newCached.nodes = cached.nodes.slice()

		forEach(changes, function (change) {
			var index = change.index
			if (change.action === DELETION) {
				clear(cached[index].nodes, cached[index])
				newCached.splice(index, 1)
			}
			if (change.action === INSERTION) {
				var dummy = $document.createElement("div")
				dummy.key = data[index].attrs.key
				insertNode(parentElement, dummy, index)
				newCached.splice(index, 0, {
					attrs: {key: data[index].attrs.key},
					nodes: [dummy]
				})
				newCached.nodes[index] = dummy
			}

			if (change.action === MOVE) {
				var changeElement = change.element
				var maybeChanged = parentElement.childNodes[index]
				if (maybeChanged !== changeElement && changeElement !== null) {
					parentElement.insertBefore(changeElement,
						maybeChanged || null)
				}
				newCached[index] = cached[change.from]
				newCached.nodes[index] = changeElement
			}
		})

		return newCached
	}

	function diffKeys(data, cached, existing, parentElement) {
		var keysDiffer = data.length !== cached.length

		if (!keysDiffer) {
			forKeys(data, function (attrs, i) {
				var cachedCell = cached[i]
				return keysDiffer = cachedCell &&
					cachedCell.attrs &&
					cachedCell.attrs.key !== attrs.key
			})
		}

		if (keysDiffer) {
			return handleKeysDiffer(data, existing, cached, parentElement)
		} else {
			return cached
		}
	}

	function diffArray(data, cached, nodes) {
		// diff the array itself

		// update the list of DOM nodes by collecting the nodes from each item
		forEach(data, function (_, i) {
			if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
		})
		// remove items from the end of the array if the new array is shorter
		// than the old one. if errors ever happen here, the issue is most
		// likely a bug in the construction of the `cached` data structure
		// somewhere earlier in the program
		forEach(cached.nodes, function (node, i) {
			if (node.parentNode != null && nodes.indexOf(node) < 0) {
				clear([node], [cached[i]])
			}
		})

		if (data.length < cached.length) cached.length = data.length
		cached.nodes = nodes
	}

	function buildArrayKeys(data) {
		var guid = 0
		forKeys(data, function () {
			forEach(data, function (attrs) {
				if ((attrs = attrs && attrs.attrs) && attrs.key == null) {
					attrs.key = "__mithril__" + guid++
				}
			})
			return 1
		})
	}

	function isDifferentEnough(data, cached, dataAttrKeys) {
		if (data.tag !== cached.tag) return true

		if (dataAttrKeys.sort().join() !==
				Object.keys(cached.attrs).sort().join()) {
			return true
		}

		if (data.attrs.id !== cached.attrs.id) {
			return true
		}

		if (data.attrs.key !== cached.attrs.key) {
			return true
		}

		if (m.redraw.strategy() === "all") {
			return !cached.configContext || cached.configContext.retain !== true
		}

		if (m.redraw.strategy() === "diff") {
			return cached.configContext && cached.configContext.retain === false
		}

		return false
	}

	function maybeRecreateObject(data, cached, dataAttrKeys) {
		// if an element is different enough from the one in cache, recreate it
		if (isDifferentEnough(data, cached, dataAttrKeys)) {
			if (cached.nodes.length) clear(cached.nodes)

			if (cached.configContext &&
					isFunction(cached.configContext.onunload)) {
				cached.configContext.onunload()
			}

			if (cached.controllers) {
				forEach(cached.controllers, function (controller) {
					if (controller.onunload) controller.onunload({preventDefault: noop});
				});
			}
		}
	}

	function getObjectNamespace(data, namespace) {
		if (data.attrs.xmlns) return data.attrs.xmlns
		if (data.tag === "svg") return "http://www.w3.org/2000/svg"
		if (data.tag === "math") return "http://www.w3.org/1998/Math/MathML"
		return namespace
	}

	var pendingRequests = 0
	m.startComputation = function () { pendingRequests++ }
	m.endComputation = function () {
		if (pendingRequests > 1) {
			pendingRequests--
		} else {
			pendingRequests = 0
			m.redraw()
		}
	}

	function unloadCachedControllers(cached, views, controllers) {
		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
			forEach(controllers, function (controller) {
				if (controller.onunload && controller.onunload.$old) {
					controller.onunload = controller.onunload.$old
				}

				if (pendingRequests && controller.onunload) {
					var onunload = controller.onunload
					controller.onunload = noop
					controller.onunload.$old = onunload
				}
			})
		}
	}

	function scheduleConfigsToBeCalled(configs, data, node, isNew, cached) {
		// schedule configs to be called. They are called after `build` finishes
		// running
		if (isFunction(data.attrs.config)) {
			var context = cached.configContext = cached.configContext || {}

			// bind
			configs.push(function () {
				return data.attrs.config.call(data, node, !isNew, context,
					cached)
			})
		}
	}

	function buildUpdatedNode(
		cached,
		data,
		editable,
		hasKeys,
		namespace,
		views,
		configs,
		controllers
	) {
		var node = cached.nodes[0]

		if (hasKeys) {
			setAttributes(node, data.tag, data.attrs, cached.attrs, namespace)
		}

		cached.children = build(
			node,
			data.tag,
			undefined,
			undefined,
			data.children,
			cached.children,
			false,
			0,
			data.attrs.contenteditable ? node : editable,
			namespace,
			configs
		)

		cached.nodes.intact = true

		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
		}

		return node
	}

	function handleNonexistentNodes(data, parentElement, index) {
		var nodes
		if (data.$trusted) {
			nodes = injectHTML(parentElement, index, data)
		} else {
			nodes = [$document.createTextNode(data)]
			if (!(parentElement.nodeName in voidElements)) {
				insertNode(parentElement, nodes[0], index)
			}
		}

		var cached

		if (typeof data === "string" ||
				typeof data === "number" ||
				typeof data === "boolean") {
			cached = new data.constructor(data)
		} else {
			cached = data
		}

		cached.nodes = nodes
		return cached
	}

	function reattachNodes(
		data,
		cached,
		parentElement,
		editable,
		index,
		parentTag
	) {
		var nodes = cached.nodes
		if (!editable || editable !== $document.activeElement) {
			if (data.$trusted) {
				clear(nodes, cached)
				nodes = injectHTML(parentElement, index, data)
			} else if (parentTag === "textarea") {
				// <textarea> uses `value` instead of `nodeValue`.
				parentElement.value = data
			} else if (editable) {
				// contenteditable nodes use `innerHTML` instead of `nodeValue`.
				editable.innerHTML = data
			} else {
				// was a trusted string
				if (nodes[0].nodeType === 1 || nodes.length > 1 ||
						(nodes[0].nodeValue.trim &&
							!nodes[0].nodeValue.trim())) {
					clear(cached.nodes, cached)
					nodes = [$document.createTextNode(data)]
				}

				injectTextNode(parentElement, nodes[0], index, data)
			}
		}
		cached = new data.constructor(data)
		cached.nodes = nodes
		return cached
	}

	function handleTextNode(
		cached,
		data,
		index,
		parentElement,
		shouldReattach,
		editable,
		parentTag
	) {
		if (!cached.nodes.length) {
			return handleNonexistentNodes(data, parentElement, index)
		} else if (cached.valueOf() !== data.valueOf() || shouldReattach) {
			return reattachNodes(data, cached, parentElement, editable, index,
				parentTag)
		} else {
			return (cached.nodes.intact = true, cached)
		}
	}

	function getSubArrayCount(item) {
		if (item.$trusted) {
			// fix offset of next element if item was a trusted string w/ more
			// than one html element
			// the first clause in the regexp matches elements
			// the second clause (after the pipe) matches text nodes
			var match = item.match(/<[^\/]|\>\s*[^<]/g)
			if (match != null) return match.length
		} else if (isArray(item)) {
			return item.length
		}
		return 1
	}

	function buildArray(
		data,
		cached,
		parentElement,
		index,
		parentTag,
		shouldReattach,
		editable,
		namespace,
		configs
	) {
		data = flatten(data)
		var nodes = []
		var intact = cached.length === data.length
		var subArrayCount = 0

		// keys algorithm: sort elements without recreating them if keys are
		// present
		//
		// 1) create a map of all existing keys, and mark all for deletion
		// 2) add new keys to map and mark them for addition
		// 3) if key exists in new list, change action from deletion to a move
		// 4) for each key, handle its corresponding action as marked in
		//    previous steps

		var existing = {}
		var shouldMaintainIdentities = false

		forKeys(cached, function (attrs, i) {
			shouldMaintainIdentities = true
			existing[cached[i].attrs.key] = {action: DELETION, index: i}
		})

		buildArrayKeys(data)
		if (shouldMaintainIdentities) {
			cached = diffKeys(data, cached, existing, parentElement)
		}
		// end key algorithm

		var cacheCount = 0
		// faster explicitly written
		for (var i = 0, len = data.length; i < len; i++) {
			// diff each item in the array
			var item = build(
				parentElement,
				parentTag,
				cached,
				index,
				data[i],
				cached[cacheCount],
				shouldReattach,
				index + subArrayCount || subArrayCount,
				editable,
				namespace,
				configs)

			if (item !== undefined) {
				intact = intact && item.nodes.intact
				subArrayCount += getSubArrayCount(item)
				cached[cacheCount++] = item
			}
		}

		if (!intact) diffArray(data, cached, nodes)
		return cached
	}

	function makeCache(data, cached, index, parentIndex, parentCache) {
		if (cached != null) {
			if (type.call(cached) === type.call(data)) return cached

			if (parentCache && parentCache.nodes) {
				var offset = index - parentIndex
				var end = offset + (isArray(data) ? data : cached.nodes).length
				clear(
					parentCache.nodes.slice(offset, end),
					parentCache.slice(offset, end))
			} else if (cached.nodes) {
				clear(cached.nodes, cached)
			}
		}

		cached = new data.constructor()
		// if constructor creates a virtual dom element, use a blank object as
		// the base cached node instead of copying the virtual el (#277)
		if (cached.tag) cached = {}
		cached.nodes = []
		return cached
	}

	function constructNode(data, namespace) {
		if (data.attrs.is) {
			if (namespace == null) {
				return $document.createElement(data.tag, data.attrs.is)
			} else {
				return $document.createElementNS(namespace, data.tag,
					data.attrs.is)
			}
		} else if (namespace == null) {
			return $document.createElement(data.tag)
		} else {
			return $document.createElementNS(namespace, data.tag)
		}
	}

	function constructAttrs(data, node, namespace, hasKeys) {
		if (hasKeys) {
			return setAttributes(node, data.tag, data.attrs, {}, namespace)
		} else {
			return data.attrs
		}
	}

	function constructChildren(
		data,
		node,
		cached,
		editable,
		namespace,
		configs
	) {
		if (data.children != null && data.children.length > 0) {
			return build(
				node,
				data.tag,
				undefined,
				undefined,
				data.children,
				cached.children,
				true,
				0,
				data.attrs.contenteditable ? node : editable,
				namespace,
				configs)
		} else {
			return data.children
		}
	}

	function reconstructCached(
		data,
		attrs,
		children,
		node,
		namespace,
		views,
		controllers
	) {
		var cached = {
			tag: data.tag,
			attrs: attrs,
			children: children,
			nodes: [node]
		}

		unloadCachedControllers(cached, views, controllers)

		if (cached.children && !cached.children.nodes) {
			cached.children.nodes = []
		}

		// edge case: setting value on <select> doesn't work before children
		// exist, so set it again after children have been created
		if (data.tag === "select" && "value" in data.attrs) {
			setAttributes(node, data.tag, {value: data.attrs.value}, {},
				namespace)
		}

		return cached
	}

	function getController(views, view, cachedControllers, controller) {
		var controllerIndex

		if (m.redraw.strategy() === "diff" && views) {
			controllerIndex = views.indexOf(view)
		} else {
			controllerIndex = -1
		}

		if (controllerIndex > -1) {
			return cachedControllers[controllerIndex]
		} else if (isFunction(controller)) {
			return new controller()
		} else {
			return {}
		}
	}

	var unloaders = []

	function updateLists(views, controllers, view, controller) {
		if (controller.onunload != null && unloaders.map(function(u) {return u.handler}).indexOf(controller.onunload) < 0) {
			unloaders.push({
				controller: controller,
				handler: controller.onunload
			})
		}

		views.push(view)
		controllers.push(controller)
	}

	var forcing = false
	function checkView(data, view, cached, cachedControllers, controllers, views) {
		var controller = getController(cached.views, view, cachedControllers, data.controller)
		var key = data && data.attrs && data.attrs.key
		data = pendingRequests === 0 || forcing || cachedControllers && cachedControllers.indexOf(controller) > -1 ? data.view(controller) : {tag: "placeholder"}
		if (data.subtree === "retain") return data;
		data.attrs = data.attrs || {}
		data.attrs.key = key
		updateLists(views, controllers, view, controller)
		return data
	}

	function markViews(data, cached, views, controllers) {
		var cachedControllers = cached && cached.controllers

		while (data.view != null) {
			data = checkView(
				data,
				data.view.$original || data.view,
				cached,
				cachedControllers,
				controllers,
				views)
		}

		return data
	}

	function buildObject( // eslint-disable-line max-statements
		data,
		cached,
		editable,
		parentElement,
		index,
		shouldReattach,
		namespace,
		configs
	) {
		var views = []
		var controllers = []

		data = markViews(data, cached, views, controllers)

		if (data.subtree === "retain") return cached

		if (!data.tag && controllers.length) {
			throw new Error("Component template must return a virtual " +
				"element, not an array, string, etc.")
		}

		data.attrs = data.attrs || {}
		cached.attrs = cached.attrs || {}

		var dataAttrKeys = Object.keys(data.attrs)
		var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)

		maybeRecreateObject(data, cached, dataAttrKeys)

		if (!isString(data.tag)) return

		var isNew = cached.nodes.length === 0

		namespace = getObjectNamespace(data, namespace)

		var node
		if (isNew) {
			node = constructNode(data, namespace)
			// set attributes first, then create children
			var attrs = constructAttrs(data, node, namespace, hasKeys)

			var children = constructChildren(data, node, cached, editable,
				namespace, configs)

			cached = reconstructCached(
				data,
				attrs,
				children,
				node,
				namespace,
				views,
				controllers)
		} else {
			node = buildUpdatedNode(
				cached,
				data,
				editable,
				hasKeys,
				namespace,
				views,
				configs,
				controllers)
		}

		if (isNew || shouldReattach === true && node != null) {
			insertNode(parentElement, node, index)
		}

		// The configs are called after `build` finishes running
		scheduleConfigsToBeCalled(configs, data, node, isNew, cached)

		return cached
	}

	function build(
		parentElement,
		parentTag,
		parentCache,
		parentIndex,
		data,
		cached,
		shouldReattach,
		index,
		editable,
		namespace,
		configs
	) {
		/*
		 * `build` is a recursive function that manages creation/diffing/removal
		 * of DOM elements based on comparison between `data` and `cached` the
		 * diff algorithm can be summarized as this:
		 *
		 * 1 - compare `data` and `cached`
		 * 2 - if they are different, copy `data` to `cached` and update the DOM
		 *     based on what the difference is
		 * 3 - recursively apply this algorithm for every array and for the
		 *     children of every virtual element
		 *
		 * The `cached` data structure is essentially the same as the previous
		 * redraw's `data` data structure, with a few additions:
		 * - `cached` always has a property called `nodes`, which is a list of
		 *    DOM elements that correspond to the data represented by the
		 *    respective virtual element
		 * - in order to support attaching `nodes` as a property of `cached`,
		 *    `cached` is *always* a non-primitive object, i.e. if the data was
		 *    a string, then cached is a String instance. If data was `null` or
		 *    `undefined`, cached is `new String("")`
		 * - `cached also has a `configContext` property, which is the state
		 *    storage object exposed by config(element, isInitialized, context)
		 * - when `cached` is an Object, it represents a virtual element; when
		 *    it's an Array, it represents a list of elements; when it's a
		 *    String, Number or Boolean, it represents a text node
		 *
		 * `parentElement` is a DOM element used for W3C DOM API calls
		 * `parentTag` is only used for handling a corner case for textarea
		 * values
		 * `parentCache` is used to remove nodes in some multi-node cases
		 * `parentIndex` and `index` are used to figure out the offset of nodes.
		 * They're artifacts from before arrays started being flattened and are
		 * likely refactorable
		 * `data` and `cached` are, respectively, the new and old nodes being
		 * diffed
		 * `shouldReattach` is a flag indicating whether a parent node was
		 * recreated (if so, and if this node is reused, then this node must
		 * reattach itself to the new parent)
		 * `editable` is a flag that indicates whether an ancestor is
		 * contenteditable
		 * `namespace` indicates the closest HTML namespace as it cascades down
		 * from an ancestor
		 * `configs` is a list of config functions to run after the topmost
		 * `build` call finishes running
		 *
		 * there's logic that relies on the assumption that null and undefined
		 * data are equivalent to empty strings
		 * - this prevents lifecycle surprises from procedural helpers that mix
		 *   implicit and explicit return statements (e.g.
		 *   function foo() {if (cond) return m("div")}
		 * - it simplifies diffing code
		 */
		data = dataToString(data)
		if (data.subtree === "retain") return cached
		cached = makeCache(data, cached, index, parentIndex, parentCache)

		if (isArray(data)) {
			return buildArray(
				data,
				cached,
				parentElement,
				index,
				parentTag,
				shouldReattach,
				editable,
				namespace,
				configs)
		} else if (data != null && isObject(data)) {
			return buildObject(
				data,
				cached,
				editable,
				parentElement,
				index,
				shouldReattach,
				namespace,
				configs)
		} else if (!isFunction(data)) {
			return handleTextNode(
				cached,
				data,
				index,
				parentElement,
				shouldReattach,
				editable,
				parentTag)
		} else {
			return cached
		}
	}

	function sortChanges(a, b) {
		return a.action - b.action || a.index - b.index
	}

	function copyStyleAttrs(node, dataAttr, cachedAttr) {
		for (var rule in dataAttr) if (hasOwn.call(dataAttr, rule)) {
			if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) {
				node.style[rule] = dataAttr[rule]
			}
		}

		for (rule in cachedAttr) if (hasOwn.call(cachedAttr, rule)) {
			if (!hasOwn.call(dataAttr, rule)) node.style[rule] = ""
		}
	}

	var shouldUseSetAttribute = {
		list: 1,
		style: 1,
		form: 1,
		type: 1,
		width: 1,
		height: 1
	}

	function setSingleAttr(
		node,
		attrName,
		dataAttr,
		cachedAttr,
		tag,
		namespace
	) {
		if (attrName === "config" || attrName === "key") {
			// `config` isn't a real attribute, so ignore it
			return true
		} else if (isFunction(dataAttr) && attrName.slice(0, 2) === "on") {
			// hook event handlers to the auto-redrawing system
			node[attrName] = autoredraw(dataAttr, node)
		} else if (attrName === "style" && dataAttr != null &&
				isObject(dataAttr)) {
			// handle `style: {...}`
			copyStyleAttrs(node, dataAttr, cachedAttr)
		} else if (namespace != null) {
			// handle SVG
			if (attrName === "href") {
				node.setAttributeNS("http://www.w3.org/1999/xlink",
					"href", dataAttr)
			} else {
				node.setAttribute(
					attrName === "className" ? "class" : attrName,
					dataAttr)
			}
		} else if (attrName in node && !shouldUseSetAttribute[attrName]) {
			// handle cases that are properties (but ignore cases where we
			// should use setAttribute instead)
			//
			// - list and form are typically used as strings, but are DOM
			//   element references in js
			//
			// - when using CSS selectors (e.g. `m("[style='']")`), style is
			//   used as a string, but it's an object in js
			//
			// #348 don't set the value if not needed - otherwise, cursor
			// placement breaks in Chrome
			try {
				if (tag !== "input" || node[attrName] !== dataAttr) {
					node[attrName] = dataAttr
				}
			} catch (e) {
				node.setAttribute(attrName, dataAttr)
			}
		}
		else node.setAttribute(attrName, dataAttr)
	}

	function trySetAttr(
		node,
		attrName,
		dataAttr,
		cachedAttr,
		cachedAttrs,
		tag,
		namespace
	) {
		if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
			cachedAttrs[attrName] = dataAttr
			try {
				return setSingleAttr(
					node,
					attrName,
					dataAttr,
					cachedAttr,
					tag,
					namespace)
			} catch (e) {
				// swallow IE's invalid argument errors to mimic HTML's
				// fallback-to-doing-nothing-on-invalid-attributes behavior
				if (e.message.indexOf("Invalid argument") < 0) throw e
			}
		} else if (attrName === "value" && tag === "input" &&
				node.value !== dataAttr) {
			// #348 dataAttr may not be a string, so use loose comparison
			node.value = dataAttr
		}
	}

	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		for (var attrName in dataAttrs) if (hasOwn.call(dataAttrs, attrName)) {
			if (trySetAttr(
					node,
					attrName,
					dataAttrs[attrName],
					cachedAttrs[attrName],
					cachedAttrs,
					tag,
					namespace)) {
				continue
			}
		}
		return cachedAttrs
	}

	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try {
					nodes[i].parentNode.removeChild(nodes[i])
				} catch (e) {
					/* eslint-disable max-len */
					// ignore if this fails due to order of events (see
					// http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
					/* eslint-enable max-len */
				}
				cached = [].concat(cached)
				if (cached[i]) unload(cached[i])
			}
		}
		// release memory if nodes is an array. This check should fail if nodes
		// is a NodeList (see loop above)
		if (nodes.length) {
			nodes.length = 0
		}
	}

	function unload(cached) {
		if (cached.configContext && isFunction(cached.configContext.onunload)) {
			cached.configContext.onunload()
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			forEach(cached.controllers, function (controller) {
				if (isFunction(controller.onunload)) {
					controller.onunload({preventDefault: noop})
				}
			})
		}
		if (cached.children) {
			if (isArray(cached.children)) forEach(cached.children, unload)
			else if (cached.children.tag) unload(cached.children)
		}
	}

	function appendTextFragment(parentElement, data) {
		try {
			parentElement.appendChild(
				$document.createRange().createContextualFragment(data))
		} catch (e) {
			parentElement.insertAdjacentHTML("beforeend", data)
		}
	}

	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index]
		if (nextSibling) {
			var isElement = nextSibling.nodeType !== 1
			var placeholder = $document.createElement("span")
			if (isElement) {
				parentElement.insertBefore(placeholder, nextSibling || null)
				placeholder.insertAdjacentHTML("beforebegin", data)
				parentElement.removeChild(placeholder)
			} else {
				nextSibling.insertAdjacentHTML("beforebegin", data)
			}
		} else {
			appendTextFragment(parentElement, data)
		}

		var nodes = []

		while (parentElement.childNodes[index] !== nextSibling) {
			nodes.push(parentElement.childNodes[index])
			index++
		}

		return nodes
	}

	function autoredraw(callback, object) {
		return function (e) {
			e = e || event
			m.redraw.strategy("diff")
			m.startComputation()
			try {
				return callback.call(object, e)
			} finally {
				endFirstComputation()
			}
		}
	}

	var html
	var documentNode = {
		appendChild: function (node) {
			if (html === undefined) html = $document.createElement("html")
			if ($document.documentElement &&
					$document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement)
			} else {
				$document.appendChild(node)
			}

			this.childNodes = $document.childNodes
		},

		insertBefore: function (node) {
			this.appendChild(node)
		},

		childNodes: []
	}

	var nodeCache = []
	var cellCache = {}

	m.render = function (root, cell, forceRecreation) {
		if (!root) {
			throw new Error("Ensure the DOM element being passed to " +
				"m.route/m.mount/m.render is not undefined.")
		}
		var configs = []
		var id = getCellCacheKey(root)
		var isDocumentRoot = root === $document
		var node

		if (isDocumentRoot || root === $document.documentElement) {
			node = documentNode
		} else {
			node = root
		}

		if (isDocumentRoot && cell.tag !== "html") {
			cell = {tag: "html", attrs: {}, children: cell}
		}

		if (cellCache[id] === undefined) clear(node.childNodes)
		if (forceRecreation === true) reset(root)

		cellCache[id] = build(
			node,
			null,
			undefined,
			undefined,
			cell,
			cellCache[id],
			false,
			0,
			null,
			undefined,
			configs)

		forEach(configs, function (config) { config() })
	}

	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element)
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function (value) {
		value = new String(value) // eslint-disable-line no-new-wrappers
		value.$trusted = true
		return value
	}

	function gettersetter(store) {
		function prop() {
			if (arguments.length) store = arguments[0]
			return store
		}

		prop.toJSON = function () {
			return store
		}

		return prop
	}

	m.prop = function (store) {
		if ((store != null && isObject(store) || isFunction(store)) &&
				isFunction(store.then)) {
			return propify(store)
		}

		return gettersetter(store)
	}

	var roots = []
	var components = []
	var controllers = []
	var lastRedrawId = null
	var lastRedrawCallTime = 0
	var computePreRedrawHook = null
	var computePostRedrawHook = null
	var topComponent
	var FRAME_BUDGET = 16 // 60 frames per second = 1 call per 16 ms

	function parameterize(component, args) {
		function controller() {
			/* eslint-disable no-invalid-this */
			return (component.controller || noop).apply(this, args) || this
			/* eslint-enable no-invalid-this */
		}

		if (component.controller) {
			controller.prototype = component.controller.prototype
		}

		function view(ctrl) {
			var currentArgs = [ctrl].concat(args)
			for (var i = 1; i < arguments.length; i++) {
				currentArgs.push(arguments[i])
			}

			return component.view.apply(component, currentArgs)
		}

		view.$original = component.view
		var output = {controller: controller, view: view}
		if (args[0] && args[0].key != null) output.attrs = {key: args[0].key}
		return output
	}

	m.component = function (component) {
		var args = [].slice.call(arguments, 1)

		return parameterize(component, args)
	}

	function checkPrevented(component, root, index, isPrevented) {
		if (!isPrevented) {
			m.redraw.strategy("all")
			m.startComputation()
			roots[index] = root
			var currentComponent

			if (component) {
				currentComponent = topComponent = component
			} else {
				currentComponent = topComponent = component = {controller: noop}
			}

			var controller = new (component.controller || noop)()

			// controllers may call m.mount recursively (via m.route redirects,
			// for example)
			// this conditional ensures only the last recursive m.mount call is
			// applied
			if (currentComponent === topComponent) {
				controllers[index] = controller
				components[index] = component
			}
			endFirstComputation()
			if (component === null) {
				removeRootElement(root, index)
			}
			return controllers[index]
		} else if (component == null) {
			removeRootElement(root, index)
		}
	}

	m.mount = m.module = function (root, component) {
		if (!root) {
			throw new Error("Please ensure the DOM element exists before " +
				"rendering a template into it.")
		}

		var index = roots.indexOf(root)
		if (index < 0) index = roots.length

		var isPrevented = false
		var event = {
			preventDefault: function () {
				isPrevented = true
				computePreRedrawHook = computePostRedrawHook = null
			}
		}

		forEach(unloaders, function (unloader) {
			unloader.handler.call(unloader.controller, event)
			unloader.controller.onunload = null
		})

		if (isPrevented) {
			forEach(unloaders, function (unloader) {
				unloader.controller.onunload = unloader.handler
			})
		} else {
			unloaders = []
		}

		if (controllers[index] && isFunction(controllers[index].onunload)) {
			controllers[index].onunload(event)
		}

		return checkPrevented(component, root, index, isPrevented)
	}

	function removeRootElement(root, index) {
		roots.splice(index, 1)
		controllers.splice(index, 1)
		components.splice(index, 1)
		reset(root)
		nodeCache.splice(getCellCacheKey(root), 1)
	}

	var redrawing = false
	m.redraw = function (force) {
		if (redrawing) return
		redrawing = true
		if (force) forcing = true

		try {
			// lastRedrawId is a positive number if a second redraw is requested
			// before the next animation frame
			// lastRedrawID is null if it's the first redraw and not an event
			// handler
			if (lastRedrawId && !force) {
				// when setTimeout: only reschedule redraw if time between now
				// and previous redraw is bigger than a frame, otherwise keep
				// currently scheduled timeout
				// when rAF: always reschedule redraw
				if ($requestAnimationFrame === global.requestAnimationFrame ||
						new Date() - lastRedrawCallTime > FRAME_BUDGET) {
					if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId)
					lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
				}
			} else {
				redraw()
				lastRedrawId = $requestAnimationFrame(function () {
					lastRedrawId = null
				}, FRAME_BUDGET)
			}
		} finally {
			redrawing = forcing = false
		}
	}

	m.redraw.strategy = m.prop()
	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook()
			computePreRedrawHook = null
		}
		forEach(roots, function (root, i) {
			var component = components[i]
			if (controllers[i]) {
				var args = [controllers[i]]
				m.render(root,
					component.view ? component.view(controllers[i], args) : "")
			}
		})
		// after rendering within a routed context, we need to scroll back to
		// the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook()
			computePostRedrawHook = null
		}
		lastRedrawId = null
		lastRedrawCallTime = new Date()
		m.redraw.strategy("diff")
	}

	function endFirstComputation() {
		if (m.redraw.strategy() === "none") {
			pendingRequests--
			m.redraw.strategy("diff")
		} else {
			m.endComputation()
		}
	}

	m.withAttr = function (prop, withAttrCallback, callbackThis) {
		return function (e) {
			e = e || event
			/* eslint-disable no-invalid-this */
			var currentTarget = e.currentTarget || this
			var _this = callbackThis || this
			/* eslint-enable no-invalid-this */
			var target = prop in currentTarget ?
				currentTarget[prop] :
				currentTarget.getAttribute(prop)
			withAttrCallback.call(_this, target)
		}
	}

	// routing
	var modes = {pathname: "", hash: "#", search: "?"}
	var redirect = noop
	var isDefaultRoute = false
	var routeParams, currentRoute

	m.route = function (root, arg1, arg2, vdom) { // eslint-disable-line
		// m.route()
		if (arguments.length === 0) return currentRoute
		// m.route(el, defaultRoute, routes)
		if (arguments.length === 3 && isString(arg1)) {
			redirect = function (source) {
				var path = currentRoute = normalizeRoute(source)
				if (!routeByValue(root, arg2, path)) {
					if (isDefaultRoute) {
						throw new Error("Ensure the default route matches " +
							"one of the routes defined in m.route")
					}

					isDefaultRoute = true
					m.route(arg1, true)
					isDefaultRoute = false
				}
			}

			var listener = m.route.mode === "hash" ?
				"onhashchange" :
				"onpopstate"

			global[listener] = function () {
				var path = $location[m.route.mode]
				if (m.route.mode === "pathname") path += $location.search
				if (currentRoute !== normalizeRoute(path)) redirect(path)
			}

			computePreRedrawHook = setScroll
			global[listener]()

			return
		}

		// config: m.route
		if (root.addEventListener || root.attachEvent) {
			var base = m.route.mode !== "pathname" ? $location.pathname : ""
			root.href = base + modes[m.route.mode] + vdom.attrs.href
			if (root.addEventListener) {
				root.removeEventListener("click", routeUnobtrusive)
				root.addEventListener("click", routeUnobtrusive)
			} else {
				root.detachEvent("onclick", routeUnobtrusive)
				root.attachEvent("onclick", routeUnobtrusive)
			}

			return
		}
		// m.route(route, params, shouldReplaceHistoryEntry)
		if (isString(root)) {
			var oldRoute = currentRoute
			currentRoute = root

			var args = arg1 || {}
			var queryIndex = currentRoute.indexOf("?")
			var params

			if (queryIndex > -1) {
				params = parseQueryString(currentRoute.slice(queryIndex + 1))
			} else {
				params = {}
			}

			for (var i in args) if (hasOwn.call(args, i)) {
				params[i] = args[i]
			}

			var querystring = buildQueryString(params)
			var currentPath

			if (queryIndex > -1) {
				currentPath = currentRoute.slice(0, queryIndex)
			} else {
				currentPath = currentRoute
			}

			if (querystring) {
				currentRoute = currentPath +
					(currentPath.indexOf("?") === -1 ? "?" : "&") +
					querystring
			}

			var replaceHistory =
				(arguments.length === 3 ? arg2 : arg1) === true ||
				oldRoute === root

			if (global.history.pushState) {
				var method = replaceHistory ? "replaceState" : "pushState"
				computePreRedrawHook = setScroll
				computePostRedrawHook = function () {
					global.history[method](null, $document.title,
						modes[m.route.mode] + currentRoute)
				}
				redirect(modes[m.route.mode] + currentRoute)
			} else {
				$location[m.route.mode] = currentRoute
				redirect(modes[m.route.mode] + currentRoute)
			}
		}
	}

	m.route.param = function (key) {
		if (!routeParams) {
			throw new Error("You must call m.route(element, defaultRoute, " +
				"routes) before calling m.route.param()")
		}

		if (!key) {
			return routeParams
		}

		return routeParams[key]
	}

	m.route.mode = "search"

	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length)
	}

	function routeByValue(root, router, path) {
		routeParams = {}

		var queryStart = path.indexOf("?")
		if (queryStart !== -1) {
			routeParams = parseQueryString(
				path.substr(queryStart + 1, path.length))
			path = path.substr(0, queryStart)
		}

		// Get all routes and check if there's
		// an exact match for the current path
		var keys = Object.keys(router)
		var index = keys.indexOf(path)

		if (index !== -1){
			m.mount(root, router[keys [index]])
			return true
		}

		for (var route in router) if (hasOwn.call(router, route)) {
			if (route === path) {
				m.mount(root, router[route])
				return true
			}

			var matcher = new RegExp("^" + route
				.replace(/:[^\/]+?\.{3}/g, "(.*?)")
				.replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

			if (matcher.test(path)) {
				/* eslint-disable no-loop-func */
				path.replace(matcher, function () {
					var keys = route.match(/:[^\/]+/g) || []
					var values = [].slice.call(arguments, 1, -2)
					forEach(keys, function (key, i) {
						routeParams[key.replace(/:|\./g, "")] =
							decodeURIComponent(values[i])
					})
					m.mount(root, router[route])
				})
				/* eslint-enable no-loop-func */
				return true
			}
		}
	}

	function routeUnobtrusive(e) {
		e = e || event
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return

		if (e.preventDefault) {
			e.preventDefault()
		} else {
			e.returnValue = false
		}

		var currentTarget = e.currentTarget || e.srcElement
		var args

		if (m.route.mode === "pathname" && currentTarget.search) {
			args = parseQueryString(currentTarget.search.slice(1))
		} else {
			args = {}
		}

		while (currentTarget && !/a/i.test(currentTarget.nodeName)) {
			currentTarget = currentTarget.parentNode
		}

		// clear pendingRequests because we want an immediate route change
		pendingRequests = 0
		m.route(currentTarget[m.route.mode]
			.slice(modes[m.route.mode].length), args)
	}

	function setScroll() {
		if (m.route.mode !== "hash" && $location.hash) {
			$location.hash = $location.hash
		} else {
			global.scrollTo(0, 0)
		}
	}

	function buildQueryString(object, prefix) {
		var duplicates = {}
		var str = []

		for (var prop in object) if (hasOwn.call(object, prop)) {
			var key = prefix ? prefix + "[" + prop + "]" : prop
			var value = object[prop]

			if (value === null) {
				str.push(encodeURIComponent(key))
			} else if (isObject(value)) {
				str.push(buildQueryString(value, key))
			} else if (isArray(value)) {
				var keys = []
				duplicates[key] = duplicates[key] || {}
				/* eslint-disable no-loop-func */
				forEach(value, function (item) {
					/* eslint-enable no-loop-func */
					if (!duplicates[key][item]) {
						duplicates[key][item] = true
						keys.push(encodeURIComponent(key) + "=" +
							encodeURIComponent(item))
					}
				})
				str.push(keys.join("&"))
			} else if (value !== undefined) {
				str.push(encodeURIComponent(key) + "=" +
					encodeURIComponent(value))
			}
		}
		return str.join("&")
	}

	function parseQueryString(str) {
		if (str === "" || str == null) return {}
		if (str.charAt(0) === "?") str = str.slice(1)

		var pairs = str.split("&")
		var params = {}

		forEach(pairs, function (string) {
			var pair = string.split("=")
			var key = decodeURIComponent(pair[0])
			var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
			if (params[key] != null) {
				if (!isArray(params[key])) params[key] = [params[key]]
				params[key].push(value)
			}
			else params[key] = value
		})

		return params
	}

	m.route.buildQueryString = buildQueryString
	m.route.parseQueryString = parseQueryString

	function reset(root) {
		var cacheKey = getCellCacheKey(root)
		clear(root.childNodes, cellCache[cacheKey])
		cellCache[cacheKey] = undefined
	}

	m.deferred = function () {
		var deferred = new Deferred()
		deferred.promise = propify(deferred.promise)
		return deferred
	}

	function propify(promise, initialValue) {
		var prop = m.prop(initialValue)
		promise.then(prop)
		prop.then = function (resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		}

		prop.catch = prop.then.bind(null, null)
		return prop
	}
	// Promiz.mithril.js | Zolmeister | MIT
	// a modified version of Promiz.js, which does not conform to Promises/A+
	// for two reasons:
	//
	// 1) `then` callbacks are called synchronously (because setTimeout is too
	//    slow, and the setImmediate polyfill is too big
	//
	// 2) throwing subclasses of Error cause the error to be bubbled up instead
	//    of triggering rejection (because the spec does not account for the
	//    important use case of default browser error handling, i.e. message w/
	//    line number)

	var RESOLVING = 1
	var REJECTING = 2
	var RESOLVED = 3
	var REJECTED = 4

	function Deferred(onSuccess, onFailure) {
		var self = this
		var state = 0
		var promiseValue = 0
		var next = []

		self.promise = {}

		self.resolve = function (value) {
			if (!state) {
				promiseValue = value
				state = RESOLVING

				fire()
			}

			return self
		}

		self.reject = function (value) {
			if (!state) {
				promiseValue = value
				state = REJECTING

				fire()
			}

			return self
		}

		self.promise.then = function (onSuccess, onFailure) {
			var deferred = new Deferred(onSuccess, onFailure)

			if (state === RESOLVED) {
				deferred.resolve(promiseValue)
			} else if (state === REJECTED) {
				deferred.reject(promiseValue)
			} else {
				next.push(deferred)
			}

			return deferred.promise
		}

		function finish(type) {
			state = type || REJECTED
			next.map(function (deferred) {
				if (state === RESOLVED) {
					deferred.resolve(promiseValue)
				} else {
					deferred.reject(promiseValue)
				}
			})
		}

		function thennable(then, success, failure, notThennable) {
			if (((promiseValue != null && isObject(promiseValue)) ||
					isFunction(promiseValue)) && isFunction(then)) {
				try {
					// count protects against abuse calls from spec checker
					var count = 0
					then.call(promiseValue, function (value) {
						if (count++) return
						promiseValue = value
						success()
					}, function (value) {
						if (count++) return
						promiseValue = value
						failure()
					})
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					failure()
				}
			} else {
				notThennable()
			}
		}

		function fire() {
			// check if it's a thenable
			var then
			try {
				then = promiseValue && promiseValue.then
			} catch (e) {
				m.deferred.onerror(e)
				promiseValue = e
				state = REJECTING
				return fire()
			}

			if (state === REJECTING) {
				m.deferred.onerror(promiseValue)
			}

			thennable(then, function () {
				state = RESOLVING
				fire()
			}, function () {
				state = REJECTING
				fire()
			}, function () {
				try {
					if (state === RESOLVING && isFunction(onSuccess)) {
						promiseValue = onSuccess(promiseValue)
					} else if (state === REJECTING && isFunction(onFailure)) {
						promiseValue = onFailure(promiseValue)
						state = RESOLVING
					}
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					return finish()
				}

				if (promiseValue === self) {
					promiseValue = TypeError()
					finish()
				} else {
					thennable(then, function () {
						finish(RESOLVED)
					}, finish, function () {
						finish(state === RESOLVING && RESOLVED)
					})
				}
			})
		}
	}

	m.deferred.onerror = function (e) {
		if (type.call(e) === "[object Error]" &&
				!/ Error/.test(e.constructor.toString())) {
			pendingRequests = 0
			throw e
		}
	}

	m.sync = function (args) {
		var deferred = m.deferred()
		var outstanding = args.length
		var results = new Array(outstanding)
		var method = "resolve"

		function synchronizer(pos, resolved) {
			return function (value) {
				results[pos] = value
				if (!resolved) method = "reject"
				if (--outstanding === 0) {
					deferred.promise(results)
					deferred[method](results)
				}
				return value
			}
		}

		if (args.length > 0) {
			forEach(args, function (arg, i) {
				arg.then(synchronizer(i, true), synchronizer(i, false))
			})
		} else {
			deferred.resolve([])
		}

		return deferred.promise
	}

	function identity(value) { return value }

	function handleJsonp(options) {
		var callbackKey = "mithril_callback_" +
			new Date().getTime() + "_" +
			(Math.round(Math.random() * 1e16)).toString(36)

		var script = $document.createElement("script")

		global[callbackKey] = function (resp) {
			script.parentNode.removeChild(script)
			options.onload({
				type: "load",
				target: {
					responseText: resp
				}
			})
			global[callbackKey] = undefined
		}

		script.onerror = function () {
			script.parentNode.removeChild(script)

			options.onerror({
				type: "error",
				target: {
					status: 500,
					responseText: JSON.stringify({
						error: "Error making jsonp request"
					})
				}
			})
			global[callbackKey] = undefined

			return false
		}

		script.onload = function () {
			return false
		}

		script.src = options.url +
			(options.url.indexOf("?") > 0 ? "&" : "?") +
			(options.callbackKey ? options.callbackKey : "callback") +
			"=" + callbackKey +
			"&" + buildQueryString(options.data || {})

		$document.body.appendChild(script)
	}

	function createXhr(options) {
		var xhr = new global.XMLHttpRequest()
		xhr.open(options.method, options.url, true, options.user,
			options.password)

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 300) {
					options.onload({type: "load", target: xhr})
				} else {
					options.onerror({type: "error", target: xhr})
				}
			}
		}

		if (options.serialize === JSON.stringify &&
				options.data &&
				options.method !== "GET") {
			xhr.setRequestHeader("Content-Type",
				"application/json; charset=utf-8")
		}

		if (options.deserialize === JSON.parse) {
			xhr.setRequestHeader("Accept", "application/json, text/*")
		}

		if (isFunction(options.config)) {
			var maybeXhr = options.config(xhr, options)
			if (maybeXhr != null) xhr = maybeXhr
		}

		var data = options.method === "GET" || !options.data ? "" : options.data

		if (data && !isString(data) && data.constructor !== global.FormData) {
			throw new Error("Request data should be either be a string or " +
				"FormData. Check the `serialize` option in `m.request`")
		}

		xhr.send(data)
		return xhr
	}

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			return handleJsonp(options)
		} else {
			return createXhr(options)
		}
	}

	function bindData(options, data, serialize) {
		if (options.method === "GET" && options.dataType !== "jsonp") {
			var prefix = options.url.indexOf("?") < 0 ? "?" : "&"
			var querystring = buildQueryString(data)
			options.url += (querystring ? prefix + querystring : "")
		} else {
			options.data = serialize(data)
		}
	}

	function parameterizeUrl(url, data) {
		if (data) {
			url = url.replace(/:[a-z]\w+/gi, function(token){
				var key = token.slice(1)
				var value = data[key]
				delete data[key]
				return value
			})
		}
		return url
	}

	m.request = function (options) {
		if (options.background !== true) m.startComputation()
		var deferred = new Deferred()
		var isJSONP = options.dataType &&
			options.dataType.toLowerCase() === "jsonp"

		var serialize, deserialize, extract

		if (isJSONP) {
			serialize = options.serialize =
			deserialize = options.deserialize = identity

			extract = function (jsonp) { return jsonp.responseText }
		} else {
			serialize = options.serialize = options.serialize || JSON.stringify

			deserialize = options.deserialize =
				options.deserialize || JSON.parse
			extract = options.extract || function (xhr) {
				if (xhr.responseText.length || deserialize !== JSON.parse) {
					return xhr.responseText
				} else {
					return null
				}
			}
		}

		options.method = (options.method || "GET").toUpperCase()
		options.url = parameterizeUrl(options.url, options.data)
		bindData(options, options.data, serialize)
		options.onload = options.onerror = function (ev) {
			try {
				ev = ev || event
				var response = deserialize(extract(ev.target, options))
				if (ev.type === "load") {
					if (options.unwrapSuccess) {
						response = options.unwrapSuccess(response, ev.target)
					}

					if (isArray(response) && options.type) {
						forEach(response, function (res, i) {
							response[i] = new options.type(res)
						})
					} else if (options.type) {
						response = new options.type(response)
					}

					deferred.resolve(response)
				} else {
					if (options.unwrapError) {
						response = options.unwrapError(response, ev.target)
					}

					deferred.reject(response)
				}
			} catch (e) {
				deferred.reject(e)
			} finally {
				if (options.background !== true) m.endComputation()
			}
		}

		ajax(options)
		deferred.promise = propify(deferred.promise, options.initialValue)
		return deferred.promise
	}

	return m
});
(function(abot) {
abot.successFlash = m.prop("")
abot.isProduction = function() {
	var ms = document.getElementsByTagName("meta")
	for (var i = 0; i < ms.length; i++) {
		if (ms[i].getAttribute("name") === "env-production") {
			return ms[i].getAttribute("content") === "true"
		}
	}
	return false
}
abot.request = function(opts) {
	opts.config = function(xhr) {
		xhr.setRequestHeader("Authorization", "Bearer " + cookie.getItem("iaAuthToken"))
		xhr.setRequestHeader("X-CSRF-Token", cookie.getItem("iaCSRFToken"))
	}
	return m.request(opts)
}
// prettyTime is from http://stackoverflow.com/a/7641822
abot.prettyTime = function(time) {
	var date = new Date((time || "").replace(/-/g, "/").replace(/[TZ]/g, " ")),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400)
    if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31) return
	return day_diff == 0 && (
		diff < 60 && "just now" || diff < 120 && "1 minute ago" ||
		diff < 3600 && Math.floor(diff / 60) + " minutes ago" || diff < 7200 &&
		"1 hour ago" || diff < 86400 && Math.floor(diff / 3600) + " hours ago"
	) || day_diff == 1 && "Yesterday" || day_diff < 7 &&
	day_diff + " days ago" || day_diff < 31 &&
	Math.ceil(day_diff / 7) + " weeks ago"
}
abot.signout = function(ev) {
	ev.preventDefault()
	cookie.removeItem("iaID")
	cookie.removeItem("iaEmail")
	cookie.removeItem("iaIssuedAt")
	cookie.removeItem("iaScopes")
	cookie.removeItem("iaCSRFToken")
	cookie.removeItem("iaAuthToken")
	abot.request({
		url: "/api/users.json",
		method: "DELETE",
	}).then(function() {
		m.route("/login", null, true)
	}, function(err) {
		console.error(err)
	})
}
window.addEventListener("load", function() {
	m.route.mode = "pathname"
	m.route(document.body, "/", {
		"/": abot.Index,
		"/guides": abot.Guides,
		"/plugins": abot.Plugins,
		"/plugins/new": abot.PluginsNew,
		"/login": abot.Login,
		"/signup": abot.Signup,
		"/profile": abot.Profile,
	})
})
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.Footer = {}
abot.Footer.view = function() {
	return m("footer", [
		"Made with ",
		m("span.icon.icon-red", m.trust("&hearts;")),
		" by the Abot Team",
	])
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.Guides = {}
abot.Guides.view = function() {
	return m("div", [
		m.component(abot.Header),
		m(".main", [
			m(".content", [
				m("h1", "Guides"),
				m("p", [
					"Here we'll add guides as they're written. We're also looking for someone to join the core contributor team focused on improving devops and documentation. That contributor will focus on making Abot development as delightful as possible by ensuring we have excellent documentation, easy installation tools, thorough guides, and more."
				]),
				m("p", [
					"Interested in contributing a guide? Visit the ",
					m("a", {
						href: "https://github.com/itsabot/abot/wiki/How-to-Contribute",
					}, "How to Contribute"),
					" guide to learn more.",
				]),
				m("ol", [
					m("li", [
						m("a", {
							href: "https://github.com/itsabot/abot/wiki/Getting-Started",
						}, "Getting Started"),
					]),
					m("li", [
						m("a", {
							href: "https://github.com/itsabot/abot/wiki/Building-a-Plugin",
						}, "Building a Plugin"),
					]),
					m("li", [
						m("a", {
							href: "https://github.com/itsabot/abot/wiki/Adding-SMS-Messaging-to-Abot",
						}, "Adding SMS Messaging"),
					]),
					m("li", [
						m("a", {
							href: "https://github.com/itsabot/abot/wiki/Using-the-Plugin-Manager",
						}, "Using the Plugin Manager"),
					]),
					m("li", [
						m("a", {
							href: "https://github.com/itsabot/abot/wiki/Getting-Started#deploying-your-abot",
						}, "Deploying to Heroku"),
					]),
					m("li", [
						m("a", {
							href: "https://github.com/itsabot/abot/wiki/How-to-Contribute",
						}, "How to Contribute"),
					]),
				])
			])
		]),
		m.component(abot.Footer),
	])
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.Header = {}
abot.Header.view = function(args) {
	args = args || {}
	var los;
	abot.Login.checkAuth(function(loggedIn) {
		if (loggedIn) {
			los = [
				m("a[href=/profile]", { config: m.route }, "Profile"),
				m("a[href=#/]", { onclick: abot.signout }, "Sign out"),
			]
		} else {
			los = [
				m("a[href=/login]", { config: m.route }, "Log in"),
				m("a[href=/signup]", { config: m.route }, "Sign up"),
			]
		}
	})
	return m("header", [
		m(".header-content", [
			m(".links", [
				m("a[href=/guides]", {
					config: m.route
				}, "Guides"),
				m("a[href=/plugins]", {
					config: m.route
				}, "Plugins"),
				m("a[href=https://godoc.org/github.com/itsabot/abot]", {
					class: "hidden-small",
				}, "API"),
				m("a.hidden-small", {
					href: "https://groups.google.com/forum/#!forum/abot-discussion",
				}, "Ask for help"),
				m("a.hidden-small", {
					href: "https://github.com/itsabot/abot/wiki/How-to-Contribute",
				}, "Contribute"),
				los,
			]),
			m(".logo", [
				m("a[href=/]", {
					config: m.route,
				}, "Abot")
			])
		]),
		m("div", { id: "content" })
	])
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.Index = {}
abot.Index.view = function() {
	return m("div", [
		m(".hero-container", [
			m.component(abot.Header),
			m(".main", [
				m(".hero", [
					m("h1", "Build your own digital assistant"),
					m("p", "Digital assistants are huge, complex pieces of software. Abot makes it easy and fun to build your own digital assistant, and we include everything you need to get started."),
					m(".btn-container", [
						m("a[href=https://github.com/itsabot/abot].btn", "Download the latest version"),
						m("div", m(".subtle", "Version 0.2.0-alpha")),
					]),
					m("img[src=/public/images/abot_set.png]"),
				]),
			]),
		]),
		m(".main", [
			m(".content", [
				m(".focusbox", [
					m(".focusbox-center", [
						m("h2", "Automate critical tasks"),
						m("p", "Whether you're automating customer service; inbound sales; or just want your own, personal Jarvis, let Abot do the heavy lifting."),
					]),
				]),
			]),
			m(".content", [
				m(".focusbox", [
					m(".focusbox-third", [
						m("p", [
							m("h3", "Abot is open-source"),
							"That means it's free to use, and you can re-program it to do anything you can imagine. ",
							m("a[href=/plugins]", {
								config: m.route,
							}, "Search for pre-built plugins"),
							" or create your own.",
						]),
					]),
					m(".focusbox-third", [
						m("p", [
							m("h3", "Easy to build"),
							"We make it easy to build the assistant. Abot comes pre-installed with tools to manage and understand human language and guides to help.",
						]),
					]),
					m(".focusbox-third", [
						m("p", [
							m("h3", "Available everywhere"),
							"Abot exposes an HTTP API, so you can easily integrate into email, SMS, Twitter, Slack, or however else you want to communicate.",
						]),
					]),
				]),
			]),
		]),
		m.component(abot.Footer),
	])
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.Login = {}
abot.Login.controller = function() {
	var ctrl = this
	ctrl.login = function(ev) {
		ev.preventDefault()
		ctrl.hideError()
		var email = document.getElementById("email").value
		var pass = document.getElementById("password").value
		return m.request({
			method: "POST",
			data: {
				Email: email,
				Password: pass,
			},
			url: "/api/users/login.json",
		}).then(function(data) {
			var date = new Date()
			var exp = date.setDate(date + 30)
			var secure = true
			if (!abot.isProduction()) {
				secure = false
			}
			cookie.setItem("iaID", data.ID, exp, null, null, secure)
			cookie.setItem("iaEmail", data.Email, exp, null, null, secure)
			cookie.setItem("iaIssuedAt", data.IssuedAt, exp, null, null, secure)
			cookie.setItem("iaAuthToken", data.AuthToken, exp, null, null, secure)
			cookie.setItem("iaCSRFToken", data.CSRFToken, exp, null, null, secure)
			cookie.setItem("iaScopes", data.Scopes, exp, null, null, secure)
			if (m.route.param("r") == null) {
				return m.route("/profile", null, true)
			}
			m.route(decodeURIComponent(m.route.param("r")).substr(1), null, true)
		}, function(err) {
			ctrl.showError(err.Msg)
		})
	}
	abot.Login.checkAuth(function(loggedIn) {
		if (loggedIn) {
			return m.route("/profile", null, true)
		}
	})
	ctrl.hideError = function() {
		ctrl.error("")
		document.getElementById("err").classList.add("hidden")
	}
	ctrl.showError = function(err) {
		ctrl.error(err)
		document.getElementById("err").classList.remove("hidden")
	}
	ctrl.error = m.prop("")
}
abot.Login.view = function(ctrl) {
	return m("div", [
		m.component(abot.Header),
		m(".main", [
			m(".content", [
				m("h1", "Log In"),
				m("div", {
					id: "err",
					class: "alert alert-error hidden"
				}, ctrl.error()),
				m("form", { onsubmit: ctrl.login }, [
					m("div", [
						m("input", {
							type: "email",
							id: "email",
							placeholder: "Email"
						}),
					]),
					m("div", [
						m("input", {
							type: "password",
							id: "password",
							placeholder: "Password"
						}),
					]),
					m("div", [
						m("a", {
							href: "/forgot_password",
							config: m.route
						}, "Forgot password?")
					]),
					m("div", [
						m("input", {
							class: "btn btn-sm",
							id: "btn",
							type: "submit",
							value: "Log In"
						}),
					]),
				]),
				m("div", [
					m("span", "No account? "),
					m("a", {
						href: "/signup",
						config: m.route
					}, "Sign Up"),
				]),
			]),
		]),
		m.component(abot.Footer),
	])
}
abot.Login.checkAuth = function(callback) {
	var id = cookie.getItem("iaID")
	var issuedAt = cookie.getItem("iaIssuedAt")
	var email = cookie.getItem("iaEmail")
	if (id != null && id !== "undefined" && id !== "null" &&
		issuedAt != null && issuedAt !== "undefined" && issuedAt !== "null" &&
		email != null && email !== "undefined" && issuedAt !== "null") {
		return callback(true)
	}
	cookie.setItem("iaID", null)
	cookie.setItem("iaIssuedAt", null)
	cookie.setItem("iaEmail", null)
	cookie.setItem("iaScopes", null)
	cookie.setItem("iaAuthToken", null)
	cookie.setItem("iaCSRFToken", null)
	return callback(false)
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.Plugins = {}
abot.Plugins.controller = function() {
	var ctrl = this
	ctrl.props = {
		results: m.prop([]),
		popular: m.prop([]),
	}
	ctrl.clear = function() {
		document.getElementById("searchbar-input").value = ""
		document.getElementById("plugins-start").classList.remove("hidden")
		document.getElementById("search-results").classList.add("hidden")
		ctrl.props.results(ctrl.props.popular())
	}
	m.request({
		method: "GET",
		url: "/api/plugins/popular.json",
	}).then(function(data) {
		if (data != null) {
			ctrl.props.results(data)
			ctrl.props.popular(data)
		}
	}, function(err) {
		console.error(err)
	})
}
abot.Plugins.view = function(ctrl) {
	return m("div", [
		m.component(abot.Header),
		m.component(abot.Searchbar, ctrl),
		m(".main", [
			m("#plugins-start", [
				m(".content", [
					m("h2", "Popular plugins"),
					m.component(abot.SearchResult, ctrl),
				]),
				m(".content", [
					m("h2", "Getting started"),
					m(".paragraph", m("a[href=/plugins/new]", m("strong", [
						"Add your plugin to itsabot.org ", m.trust("&raquo;")
					]))),
					m("div", "Submit your plugin to be included in search."),

					m(".paragraph", m("a[href=https://github.com/itsabot/abot/wiki/Building-a-Plugin]", m("strong", [
						"Build a plugin ", m.trust("&raquo;")
					]))),
					m("div", "Learn how to build plugins with branching dialog, complex states, and more."),

					m(".paragraph", m("a[href=https://github.com/itsabot/abot/wiki/Using-the-Plugin-Manager]", m("strong", [
						"Integrate a plugin ", m.trust("&raquo;")
					]))),
					m("div", "Learn to use the plugin manager to add plugins to your Abot."),
				]),
			]),
			m("#search-results.hidden", [
				m(".content", [
					m("a[href=#/].btn.clear", {
						onclick: ctrl.clear,
					}, "Clear"),
					m("h2[style=display:inline]", "Search results"),
					m("ol.search-results", [
						m.component(abot.SearchResult, ctrl),
					]),
				]),
			]),
			m.component(abot.Footer),
		])
	])
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.PluginsNew = {}
abot.PluginsNew.controller = function() {
	abot.Login.checkAuth(function(loggedIn) {
		if (!loggedIn) {
			return m.route("/login", null, true)
		}
	})
	var ctrl = this
	ctrl.submit = function(ev) {
		ev.preventDefault()
		var submitBtn = document.getElementById("submit-btn")
		submitBtn.setAttribute("disabled", true)
		var r = document.getElementById("repourl").value
		abot.request({
			method: "POST",
			url: window.location.origin + "/api/plugins.json",
			data: { Path: r },
		}).then(function() {
			document.getElementById("repourl").value = ""
			submitBtn.removeAttribute("disabled")
			// TODO improve this with m.prop
			abot.successFlash("Success! Your plugin will appear here when processed (usually in seconds).")
			m.route("/profile", null, true)
		}, function(err) {
			console.error(err)
			document.getElementById("alert-error").classList.remove("hidden")
			document.getElementById("alert-error-content").innerText = err.Msg
			submitBtn.removeAttribute("disabled")
		})
	}
}
abot.PluginsNew.view = function(ctrl) {
	return m("div", [
		m.component(abot.Header),
		m(".main", [
			m(".content", [
				m("h1", "Add plugin"),
				m("p", "Manually add to or update a plugin in the itsabot.org index, so it's searchable. You can add any plugin available via `go get`."),
				m("form", { onsubmit: ctrl.submit }, [
					m(".content", [
						m("#alert-error.alert.alert-error.hidden", [
							m("strong", "Error! "),
							m("span#alert-error-content", ""),
						]),
					]),
					m(".form-el", [
						m("div", [
							m("label[for=repourl]", "`go get` path"),
						]),
						m("input[type=text]#repourl", {
							name: "repourl",
							placeholder: "github.com/itsabot/plugin_hello",
						}),
						m("div", [
							m("button[type=submit]#submit-btn.btn", "Add plugin")
						]),
					]),
				]),
			]),
		]),
		m.component(abot.Footer),
	])
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.Profile = {}
abot.Profile.controller = function() {
	abot.Login.checkAuth(function(loggedIn) {
		if (!loggedIn) {
			return m.route("/login", null, true)
		}
	})
	var ctrl = this
	ctrl.data = function() {
		return abot.request({
			method: "GET",
			url: "/api/user.json",
		})
	}
	ctrl.generateToken = function(ev) {
		ev.preventDefault()
		abot.request({
			method: "POST",
			url: "/api/users/auth_token.json",
		}).then(function(resp) {
			ctrl.props.tokens().push(resp)
			ctrl.props.errorToken("")
			ctrl.props.successToken("Success! Generated token.")
		}, function(err) {
			ctrl.props.successToken("")
			ctrl.props.errorToken("Error! Failed to generate token. " + err.Msg)
		})
	}
	ctrl.props = {
		results: m.prop([]),
		tokens: m.prop([]),

		// Success and error blocks related to plugins
		success: m.prop(""),
		error: m.prop(""),

		// Success and error blocks related to tokens
		successToken: m.prop(""),
		errorToken: m.prop(""),
	}
	var interval
	ctrl.refresh = function() {
		ctrl.data().then(function(data) {
			if (ctrl.props.success().length > 0) {
				if (interval == null) {
					console.log("scheduling refresh")
					interval = setInterval(ctrl.refresh, 1500)
				} else {
					console.log("clearing interval")
					clearInterval(interval)
				}
			}
			ctrl.props.error("")
			ctrl.props.results(data.Plugins || [])
			ctrl.props.tokens(data.Tokens || [])
		}, function(err) {
			ctrl.props.error(err.Msg)
		})
	}
	ctrl.refresh()
}
abot.Profile.view = function(ctrl) {
	return m("div", [
		m.component(abot.Header),
		m(".main", [
			m(".content", [
				m("h1", "Profile - " + cookie.getItem("iaEmail")),
				function() {
					if (ctrl.props.error().length > 0) {
						return m("#err.alert.alert-error", ctrl.props.error())
					} else if (ctrl.props.success().length > 0) {
						return m("#success.alert.alert-success", ctrl.props.success())
					}
				}(),
				m("h2", "Your plugins"),
				m.component(abot.SearchResult, ctrl),
				m("a[href=/plugins/new].btn.btn-styled", {
					config: m.route,
				}, "+ Add plugin"),
				m("h2", "Auth tokens"),
				function() {
					if (ctrl.props.errorToken().length > 0) {
						return m("#err.alert.alert-error", ctrl.props.errorToken())
					} else if (ctrl.props.successToken().length > 0) {
						return m("#success.alert.alert-success", ctrl.props.successToken())
					}
				}(),
				m("p", "Auth tokens enable you to modify your plugins via external services. Only give your auth tokens to services you trust."),
				m("p", "You should use a unique token to authenticate into each external service."),
				function() {
					if (ctrl.props.tokens().length === 0) {
						return
					}
					return m("table", [
						m("thead", [
							m("tr", [
								m("td", ""),
								m("td", "Token"),
								m("td.hidden-small", "Created"),
							]),
						]),
						m("tbody", [
							ctrl.props.tokens().map(function(token, i) {
								token.Idx = i
								return m(abot.TableItemToken, ctrl, token)
							})
						]),
					])
				}(),
				m("input.btn[type=button]", {
					value: "Generate Auth Token",
					onclick: ctrl.generateToken,
				}),
			]),
		]),
		m.component(abot.Footer),
	])
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.Searchbar = {}
abot.Searchbar.controller = function(pctrl) {
	var ctrl = this
	ctrl.focus = function(el) {
		el.focus()
	}
	ctrl.search = function(ev) {
		ev.preventDefault()
		var input = ev.target.children[0]
		if (input.value.length === 0) {
			document.getElementById("plugins-start").classList.remove("hidden")
			document.getElementById("search-results").classList.add("hidden")
			return
		}
		m.request({
			method: "GET",
			url: "/api/plugins/search/" + encodeURI(input.value),
		}).then(function(res) {
			document.getElementById("search-results").classList.remove("hidden")
			document.getElementById("plugins-start").classList.add("hidden")
			res = res || []
			pctrl.props.results(res)
		}, function(err) {
			console.error(err)
		})
	}
}
abot.Searchbar.view = function(ctrl) {
	return m(".searchbar", [
		m(".main", [
			m("form", { onsubmit: ctrl.search }, [
				m("input[type=text]#searchbar-input", {
					placeholder: "Find plugins",
					config: ctrl.focus,
				}),
				m("button[type=submit]", m(".search", m.trust("&#9906;"))),
			])
		]),
	])
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.SearchResult = {}
abot.SearchResult.controller = function(pctrl) {
	var ctrl = this
	ctrl.deletePlugin = function(id) {
		abot.request({
			method: "DELETE",
			url: "/api/plugins.json",
			data: { PluginID: id },
		}).then(function() {
			// TODO improve this using m.prop
			m.route("/profile", null, true)
		}, function(err) {
			console.error(err)
		})
	}
}
abot.SearchResult.view = function(ctrl, pctrl) {
	return function() {
		if (pctrl.props.results().length === 0) {
			return m("table", [
				m("tr", {
					style: "border-bottom: none;"
				}, m("td", [
					"No results found. If you don't see your plugin, you can ",
					m("a[href=/plugins/new]", "add it here."),
				]))
			])
		}
		return m("table", [
			m("thead", [
				m("tr", [
					m("td", "Name"),
					m("td.hidden-small", "Description"),
					m("td.hidden-small", "Downloads"),
					m("td.hidden-small", "Errors"),
				]),
			]),
			m("tbody", [
				pctrl.props.results().map(function(plugin) {
					return m("tr", [
						m("td", [
							m("div", plugin.Name.String),
							m("small", plugin.Path),
						]),
						m("td.hidden-small", plugin.Description.String),
						m("td.hidden-small.center", plugin.DownloadCount),
						function() {
							var val = []
							if (!plugin.CompileOK) {
								val.push(m("span.badge.badge-error", "go get"))
							}
							if (!plugin.VetOK) {
								val.push(m("span.badge.badge-error", "go vet"))
							}
							if (!plugin.TestOK) {
								val.push(m("span.badge.badge-error", "go test"))
							}
							if (val.length === 0) {
								val.push(m("span.badge.badge-success", "OK!"))
							}
							return m("td.badge-container.hidden-small", val)
						}(),
						m("td.text.hidden-small", function() {
							if (plugin.Error != null) {
								return plugin.Error.String
							}
							return ""
						}),
						m("td", function(plugin) {
							if (!plugin.Name.Valid) {
								return m("button", {
									onclick: ctrl.deletePlugin.bind(undefined, plugin.ID),
								}, "Remove")
							}
						}(plugin)),
					])
				}),
			]),
		])
	}()
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.Signup = {}
abot.Signup.controller = function() {
	var ctrl = this
	abot.Login.checkAuth(function(cb) {
		if (cb) {
			return m.route("/profile", null, true)
		}
	})
	ctrl.props = {
		error: m.prop("")
	}
	ctrl.signup = function(ev) {
		ev.preventDefault()
		var email = document.getElementById("email").value
		var pass = document.getElementById("password").value
		return m.request({
			method: "POST",
			data: {
				Email: email,
				Password: pass,
			},
			url: "/api/users.json"
		}).then(function(data) {
			var date = new Date()
			var exp = date.setDate(date + 30)
			var secure = true
			if (!abot.isProduction()) {
				secure = false
			}
			cookie.setItem("iaID", data.ID, exp, null, null, secure)
			cookie.setItem("iaEmail", data.Email, exp, null, null, secure)
			cookie.setItem("iaIssuedAt", data.IssuedAt, exp, null, null, secure)
			cookie.setItem("iaAuthToken", data.AuthToken, exp, null, null, secure)
			cookie.setItem("iaCSRFToken", data.CSRFToken, exp, null, null, secure)
			cookie.setItem("iaScopes", data.Scopes, exp, null, null, secure)
			m.route("/profile", null, true)
			console.log("routed to profile")
		}, function(err) {
			ctrl.props.error(err.Msg)
		})
	}
}
abot.Signup.view = function(ctrl) {
	var errMsg = null
	if (!!ctrl.props.error()) {
		errMsg = m(".alert.alert-error", ctrl.props.error())
	}
	return m("div", [
		m.component(abot.Header),
		m(".main", [
			m(".content", [
				m("h1", "Sign Up"),
				m("form", { onsubmit: ctrl.signup }, [
					errMsg,
					m("div", [
						m("input", {
							type: "email",
							class: "form-control",
							id: "email",
							placeholder: "Email"
						})
					]),
					m("div", [
						m("input", {
							type: "password",
							class: "form-control",
							id: "password",
							placeholder: "Password"
						})
					]),
					m("div", [
						m("input", {
							class: "btn btn-sm",
							id: "btn",
							type: "submit",
							value: "Sign Up"
						})
					]),
					m("div", [
						m("span", "Have an account? "),
						m("a", {
							href: "/login",
							config: m.route
						}, "Log In")
					]),
				]),
			]),
		]),
	])
}
})(!window.abot ? window.abot={} : window.abot);
(function(abot) {
abot.TableItemToken = {}
abot.TableItemToken.controller = function(pctrl, args) {
	var ctrl = this
	ctrl.deleteToken = function() {
		var c = confirm("Are you sure you want to delete this token?")
		if (!c) {
			ev.preventDefault()
			return
		}
		// Remove the row from the table
		this.parentNode.parentNode.remove()
		abot.request({
			url: "/api/users/auth_token.json",
			method: "DELETE",
			data: { Token: ctrl.props.token().Token },
		}).then(function() {
			pctrl.props.successToken("Success! Deleted token.")
		}, function(err) {
			pctrl.props.errorToken("Error! Failed to delete token. Err: " + err.Msg)
		})
	}
	ctrl.props = { token: m.prop(args) }
}
abot.TableItemToken.view = function(ctrl, _, args) {
	var t = ctrl.props.token()
	return m("tr", { key: t.Token }, [
		m("td", m("a[href=#/].btn-x", { onclick: ctrl.deleteToken }, "X")),
		m("td", t.Token),
		m("td.hidden-small", m("small", abot.prettyTime(t.CreatedAt))),
	])
}
})(!window.abot ? window.abot={} : window.abot);
