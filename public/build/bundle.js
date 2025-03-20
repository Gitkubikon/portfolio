
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Navbar.svelte generated by Svelte v3.46.4 */

    const file$7 = "src/components/Navbar.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (55:20) {#each nav_items as item}
    function create_each_block$3(ctx) {
    	let li;
    	let a;
    	let t0_value = /*item*/ ctx[7][0] + "";
    	let t0;
    	let a_class_value;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "class", a_class_value = "nav-link text-" + /*text_color*/ ctx[4]);
    			attr_dev(a, "href", a_href_value = /*item*/ ctx[7][1]);
    			add_location(a, file$7, 56, 28, 1667);
    			attr_dev(li, "class", "nav-item");
    			add_location(li, file$7, 55, 24, 1617);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*nav_items*/ 4 && t0_value !== (t0_value = /*item*/ ctx[7][0] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*text_color*/ 16 && a_class_value !== (a_class_value = "nav-link text-" + /*text_color*/ ctx[4])) {
    				attr_dev(a, "class", a_class_value);
    			}

    			if (dirty & /*nav_items*/ 4 && a_href_value !== (a_href_value = /*item*/ ctx[7][1])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(55:20) {#each nav_items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div2;
    	let nav;
    	let div1;
    	let a0;
    	let strong;
    	let t0;
    	let t1;
    	let button;
    	let i0;
    	let t2;
    	let div0;
    	let ul;
    	let t3;
    	let li;
    	let a1;
    	let i1;
    	let a1_class_value;
    	let nav_class_value;
    	let each_value = /*nav_items*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			nav = element("nav");
    			div1 = element("div");
    			a0 = element("a");
    			strong = element("strong");
    			t0 = text(/*brand*/ ctx[1]);
    			t1 = space();
    			button = element("button");
    			i0 = element("i");
    			t2 = space();
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			li = element("li");
    			a1 = element("a");
    			i1 = element("i");
    			add_location(strong, file$7, 31, 16, 737);
    			attr_dev(a0, "class", "navbar-brand text-primary");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$7, 30, 12, 674);
    			attr_dev(i0, "class", "fas fa-bars");
    			add_location(i0, file$7, 45, 16, 1209);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-mdb-toggle", "collapse");
    			attr_dev(button, "data-mdb-target", "#navbarSupportedContent");
    			attr_dev(button, "aria-controls", "navbarSupportedContent");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$7, 36, 12, 861);
    			attr_dev(i1, "class", "fab fa-github");
    			add_location(i1, file$7, 66, 28, 2056);
    			attr_dev(a1, "class", a1_class_value = "nav-link text-" + /*text_color*/ ctx[4]);
    			attr_dev(a1, "href", /*github*/ ctx[3]);
    			add_location(a1, file$7, 65, 24, 1975);
    			add_location(li, file$7, 64, 20, 1946);
    			attr_dev(ul, "class", "navbar-nav ms-auto mb-2 mb-lg-0");
    			add_location(ul, file$7, 52, 16, 1467);
    			attr_dev(div0, "class", "collapse navbar-collapse");
    			attr_dev(div0, "id", "navbarSupportedContent");
    			add_location(div0, file$7, 50, 12, 1346);
    			attr_dev(div1, "class", "container-fluid");
    			add_location(div1, file$7, 28, 8, 598);
    			attr_dev(nav, "class", nav_class_value = "navbar navbar-expand-lg navbar-" + /*bg_color*/ ctx[5] + " bg-" + /*bg_color*/ ctx[5] + " shadow-0 fixed-top px-3 py-3");
    			attr_dev(nav, "id", /*Id*/ ctx[0]);
    			add_location(nav, file$7, 24, 4, 465);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$7, 22, 0, 417);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, nav);
    			append_dev(nav, div1);
    			append_dev(div1, a0);
    			append_dev(a0, strong);
    			append_dev(strong, t0);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    			append_dev(button, i0);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t3);
    			append_dev(ul, li);
    			append_dev(li, a1);
    			append_dev(a1, i1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*brand*/ 2) set_data_dev(t0, /*brand*/ ctx[1]);

    			if (dirty & /*text_color, nav_items*/ 20) {
    				each_value = /*nav_items*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t3);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*text_color*/ 16 && a1_class_value !== (a1_class_value = "nav-link text-" + /*text_color*/ ctx[4])) {
    				attr_dev(a1, "class", a1_class_value);
    			}

    			if (dirty & /*github*/ 8) {
    				attr_dev(a1, "href", /*github*/ ctx[3]);
    			}

    			if (dirty & /*bg_color*/ 32 && nav_class_value !== (nav_class_value = "navbar navbar-expand-lg navbar-" + /*bg_color*/ ctx[5] + " bg-" + /*bg_color*/ ctx[5] + " shadow-0 fixed-top px-3 py-3")) {
    				attr_dev(nav, "class", nav_class_value);
    			}

    			if (dirty & /*Id*/ 1) {
    				attr_dev(nav, "id", /*Id*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	let { Id } = $$props;
    	let { brand } = $$props;
    	let { nav_items } = $$props;
    	let { github } = $$props;
    	let { state } = $$props;
    	let text_color = "dark";
    	let bg_color = "light";

    	if (state == "dark") {
    		text_color = "light";
    		bg_color = "dark";
    	}

    	const writable_props = ['Id', 'brand', 'nav_items', 'github', 'state'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('brand' in $$props) $$invalidate(1, brand = $$props.brand);
    		if ('nav_items' in $$props) $$invalidate(2, nav_items = $$props.nav_items);
    		if ('github' in $$props) $$invalidate(3, github = $$props.github);
    		if ('state' in $$props) $$invalidate(6, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		Id,
    		brand,
    		nav_items,
    		github,
    		state,
    		text_color,
    		bg_color
    	});

    	$$self.$inject_state = $$props => {
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('brand' in $$props) $$invalidate(1, brand = $$props.brand);
    		if ('nav_items' in $$props) $$invalidate(2, nav_items = $$props.nav_items);
    		if ('github' in $$props) $$invalidate(3, github = $$props.github);
    		if ('state' in $$props) $$invalidate(6, state = $$props.state);
    		if ('text_color' in $$props) $$invalidate(4, text_color = $$props.text_color);
    		if ('bg_color' in $$props) $$invalidate(5, bg_color = $$props.bg_color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Id, brand, nav_items, github, text_color, bg_color, state];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			Id: 0,
    			brand: 1,
    			nav_items: 2,
    			github: 3,
    			state: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Id*/ ctx[0] === undefined && !('Id' in props)) {
    			console.warn("<Navbar> was created without expected prop 'Id'");
    		}

    		if (/*brand*/ ctx[1] === undefined && !('brand' in props)) {
    			console.warn("<Navbar> was created without expected prop 'brand'");
    		}

    		if (/*nav_items*/ ctx[2] === undefined && !('nav_items' in props)) {
    			console.warn("<Navbar> was created without expected prop 'nav_items'");
    		}

    		if (/*github*/ ctx[3] === undefined && !('github' in props)) {
    			console.warn("<Navbar> was created without expected prop 'github'");
    		}

    		if (/*state*/ ctx[6] === undefined && !('state' in props)) {
    			console.warn("<Navbar> was created without expected prop 'state'");
    		}
    	}

    	get Id() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Id(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get brand() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set brand(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nav_items() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nav_items(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get github() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set github(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.46.4 */

    const file$6 = "src/components/Footer.svelte";

    function create_fragment$6(ctx) {
    	let footer;
    	let div;
    	let t0;
    	let t1_value = new Date().getFullYear() + "";
    	let t1;
    	let t2;
    	let a;
    	let t3;
    	let a_class_value;
    	let footer_class_value;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			t0 = text("© ");
    			t1 = text(t1_value);
    			t2 = text(" Copyright:\n        ");
    			a = element("a");
    			t3 = text(/*brand*/ ctx[1]);
    			attr_dev(a, "class", a_class_value = "text-" + /*text_color*/ ctx[2]);
    			attr_dev(a, "href", "/");
    			add_location(a, file$6, 22, 8, 501);
    			attr_dev(div, "class", "text-center p-3");
    			add_location(div, file$6, 20, 4, 410);
    			attr_dev(footer, "class", footer_class_value = "bg-" + /*bg_color*/ ctx[3] + " text-center text-" + /*text_color*/ ctx[2]);
    			attr_dev(footer, "id", /*Id*/ ctx[0]);
    			add_location(footer, file$6, 18, 0, 314);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, a);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*brand*/ 2) set_data_dev(t3, /*brand*/ ctx[1]);

    			if (dirty & /*text_color*/ 4 && a_class_value !== (a_class_value = "text-" + /*text_color*/ ctx[2])) {
    				attr_dev(a, "class", a_class_value);
    			}

    			if (dirty & /*bg_color, text_color*/ 12 && footer_class_value !== (footer_class_value = "bg-" + /*bg_color*/ ctx[3] + " text-center text-" + /*text_color*/ ctx[2])) {
    				attr_dev(footer, "class", footer_class_value);
    			}

    			if (dirty & /*Id*/ 1) {
    				attr_dev(footer, "id", /*Id*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	let { Id } = $$props;
    	let { brand } = $$props;
    	let { state } = $$props;
    	let text_color = "dark";
    	let bg_color = "light";

    	if (state == "dark") {
    		text_color = "light";
    		bg_color = "dark";
    	}

    	const writable_props = ['Id', 'brand', 'state'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('brand' in $$props) $$invalidate(1, brand = $$props.brand);
    		if ('state' in $$props) $$invalidate(4, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({ Id, brand, state, text_color, bg_color });

    	$$self.$inject_state = $$props => {
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('brand' in $$props) $$invalidate(1, brand = $$props.brand);
    		if ('state' in $$props) $$invalidate(4, state = $$props.state);
    		if ('text_color' in $$props) $$invalidate(2, text_color = $$props.text_color);
    		if ('bg_color' in $$props) $$invalidate(3, bg_color = $$props.bg_color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Id, brand, text_color, bg_color, state];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { Id: 0, brand: 1, state: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Id*/ ctx[0] === undefined && !('Id' in props)) {
    			console.warn("<Footer> was created without expected prop 'Id'");
    		}

    		if (/*brand*/ ctx[1] === undefined && !('brand' in props)) {
    			console.warn("<Footer> was created without expected prop 'brand'");
    		}

    		if (/*state*/ ctx[4] === undefined && !('state' in props)) {
    			console.warn("<Footer> was created without expected prop 'state'");
    		}
    	}

    	get Id() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Id(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get brand() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set brand(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* node_modules/saos/src/Saos.svelte generated by Svelte v3.46.4 */
    const file$5 = "node_modules/saos/src/Saos.svelte";

    // (75:2) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "style", div_style_value = "animation: " + /*animation_out*/ ctx[1] + "; " + /*css_animation*/ ctx[3]);
    			add_location(div, file$5, 75, 4, 2229);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*animation_out, css_animation*/ 10 && div_style_value !== (div_style_value = "animation: " + /*animation_out*/ ctx[1] + "; " + /*css_animation*/ ctx[3])) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(75:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (71:2) {#if observing}
    function create_if_block$4(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "style", div_style_value = "animation: " + /*animation*/ ctx[0] + "; " + /*css_animation*/ ctx[3]);
    			add_location(div, file$5, 71, 4, 2135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*animation, css_animation*/ 9 && div_style_value !== (div_style_value = "animation: " + /*animation*/ ctx[0] + "; " + /*css_animation*/ ctx[3])) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(71:2) {#if observing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*observing*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "id", /*countainer*/ ctx[5]);
    			attr_dev(div, "style", /*css_observer*/ ctx[2]);
    			add_location(div, file$5, 69, 0, 2070);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (!current || dirty & /*css_observer*/ 4) {
    				attr_dev(div, "style", /*css_observer*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Saos', slots, ['default']);
    	let { animation = "none" } = $$props;
    	let { animation_out = "none; opacity: 0" } = $$props;
    	let { once = false } = $$props;
    	let { top = 0 } = $$props;
    	let { bottom = 0 } = $$props;
    	let { css_observer = "" } = $$props;
    	let { css_animation = "" } = $$props;

    	// cute litle reactive dispatch to get if is observing :3
    	const dispatch = createEventDispatcher();

    	// be aware... he's looking...
    	let observing = true;

    	// for some reason the 'bind:this={box}' on div stops working after npm run build... so... workaround time >:|
    	const countainer = `__saos-${Math.random()}__`;

    	/// current in experimental support, no support for IE (only Edge)
    	/// see more in: https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
    	function intersection_verify(box) {
    		// bottom left top right
    		const rootMargin = `${-bottom}px 0px ${-top}px 0px`;

    		const observer = new IntersectionObserver(entries => {
    				$$invalidate(4, observing = entries[0].isIntersecting);

    				if (observing && once) {
    					observer.unobserve(box);
    				}
    			},
    		{ rootMargin });

    		observer.observe(box);
    		return () => observer.unobserve(box);
    	}

    	/// Fallback in case the browser not have the IntersectionObserver
    	function bounding_verify(box) {
    		const c = box.getBoundingClientRect();
    		$$invalidate(4, observing = c.top + top < window.innerHeight && c.bottom - bottom > 0);

    		if (observing && once) {
    			window.removeEventListener("scroll", verify);
    		}

    		window.addEventListener("scroll", bounding_verify);
    		return () => window.removeEventListener("scroll", bounding_verify);
    	}

    	onMount(() => {
    		// for some reason the 'bind:this={box}' on div stops working after npm run build... so... workaround time >:|
    		const box = document.getElementById(countainer);

    		if (IntersectionObserver) {
    			return intersection_verify(box);
    		} else {
    			return bounding_verify(box);
    		}
    	});

    	const writable_props = [
    		'animation',
    		'animation_out',
    		'once',
    		'top',
    		'bottom',
    		'css_observer',
    		'css_animation'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Saos> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('animation' in $$props) $$invalidate(0, animation = $$props.animation);
    		if ('animation_out' in $$props) $$invalidate(1, animation_out = $$props.animation_out);
    		if ('once' in $$props) $$invalidate(6, once = $$props.once);
    		if ('top' in $$props) $$invalidate(7, top = $$props.top);
    		if ('bottom' in $$props) $$invalidate(8, bottom = $$props.bottom);
    		if ('css_observer' in $$props) $$invalidate(2, css_observer = $$props.css_observer);
    		if ('css_animation' in $$props) $$invalidate(3, css_animation = $$props.css_animation);
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		animation,
    		animation_out,
    		once,
    		top,
    		bottom,
    		css_observer,
    		css_animation,
    		dispatch,
    		observing,
    		countainer,
    		intersection_verify,
    		bounding_verify
    	});

    	$$self.$inject_state = $$props => {
    		if ('animation' in $$props) $$invalidate(0, animation = $$props.animation);
    		if ('animation_out' in $$props) $$invalidate(1, animation_out = $$props.animation_out);
    		if ('once' in $$props) $$invalidate(6, once = $$props.once);
    		if ('top' in $$props) $$invalidate(7, top = $$props.top);
    		if ('bottom' in $$props) $$invalidate(8, bottom = $$props.bottom);
    		if ('css_observer' in $$props) $$invalidate(2, css_observer = $$props.css_observer);
    		if ('css_animation' in $$props) $$invalidate(3, css_animation = $$props.css_animation);
    		if ('observing' in $$props) $$invalidate(4, observing = $$props.observing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*observing*/ 16) {
    			dispatch('update', { observing });
    		}
    	};

    	return [
    		animation,
    		animation_out,
    		css_observer,
    		css_animation,
    		observing,
    		countainer,
    		once,
    		top,
    		bottom,
    		$$scope,
    		slots
    	];
    }

    class Saos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			animation: 0,
    			animation_out: 1,
    			once: 6,
    			top: 7,
    			bottom: 8,
    			css_observer: 2,
    			css_animation: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Saos",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get animation() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animation_out() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation_out(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get once() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set once(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css_observer() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css_observer(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css_animation() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css_animation(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Header.svelte generated by Svelte v3.46.4 */
    const file$4 = "src/components/Header.svelte";

    // (249:12) {#if ready}
    function create_if_block$3(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let span0;
    	let span0_intro;
    	let t1;
    	let span1;
    	let span1_intro;
    	let t2;
    	let span2;
    	let span2_class_value;
    	let span2_intro;
    	let if_block = /*placeholder1*/ ctx[6] && /*placeholder2*/ ctx[7] && /*placeholder3*/ ctx[8] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			span0 = element("span");
    			t1 = space();
    			span1 = element("span");
    			t2 = space();
    			span2 = element("span");
    			attr_dev(span0, "class", "fw-bold d-block display-3 text-primary");
    			add_location(span0, file$4, 268, 24, 9883);
    			attr_dev(span1, "class", "fw-bold d-block display-1 rolling-text-2");
    			add_location(span1, file$4, 275, 24, 10176);
    			attr_dev(span2, "class", span2_class_value = "fw-bold " + /*text_color*/ ctx[2] + " display-5" + " svelte-193zxd5");
    			set_style(span2, "opacity", "0.7");
    			add_location(span2, file$4, 282, 24, 10471);
    			attr_dev(div0, "class", "animated-content svelte-193zxd5");
    			add_location(div0, file$4, 266, 20, 9742);
    			attr_dev(div1, "class", "col-md-6 mb-3 text-uppercase header-container svelte-193zxd5");
    			add_location(div1, file$4, 249, 16, 8766);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			span0.innerHTML = /*rollingText1*/ ctx[3];
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			span1.innerHTML = /*rollingText2*/ ctx[4];
    			append_dev(div0, t2);
    			append_dev(div0, span2);
    			span2.innerHTML = /*rollingText3*/ ctx[5];
    		},
    		p: function update(ctx, dirty) {
    			if (/*placeholder1*/ ctx[6] && /*placeholder2*/ ctx[7] && /*placeholder3*/ ctx[8]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div1, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*rollingText1*/ 8) span0.innerHTML = /*rollingText1*/ ctx[3];			if (dirty & /*rollingText2*/ 16) span1.innerHTML = /*rollingText2*/ ctx[4];			if (dirty & /*rollingText3*/ 32) span2.innerHTML = /*rollingText3*/ ctx[5];
    			if (dirty & /*text_color*/ 4 && span2_class_value !== (span2_class_value = "fw-bold " + /*text_color*/ ctx[2] + " display-5" + " svelte-193zxd5")) {
    				attr_dev(span2, "class", span2_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (!span0_intro) {
    				add_render_callback(() => {
    					span0_intro = create_in_transition(span0, fade, { duration: 300 });
    					span0_intro.start();
    				});
    			}

    			if (!span1_intro) {
    				add_render_callback(() => {
    					span1_intro = create_in_transition(span1, fade, { duration: 300 });
    					span1_intro.start();
    				});
    			}

    			if (!span2_intro) {
    				add_render_callback(() => {
    					span2_intro = create_in_transition(span2, fade, { duration: 300 });
    					span2_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(249:12) {#if ready}",
    		ctx
    	});

    	return block;
    }

    // (252:20) {#if placeholder1 && placeholder2 && placeholder3}
    function create_if_block_1$1(ctx) {
    	let div;
    	let span0;
    	let t0;
    	let span1;
    	let t1;
    	let span2;
    	let span2_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			span2 = element("span");
    			attr_dev(span0, "class", "fw-bold d-block display-3 text-primary");
    			add_location(span0, file$4, 253, 28, 9056);
    			attr_dev(span1, "class", "fw-bold d-block display-1 rolling-text-2");
    			add_location(span1, file$4, 256, 28, 9227);
    			attr_dev(span2, "class", span2_class_value = "fw-bold " + /*text_color*/ ctx[2] + " display-5" + " svelte-193zxd5");
    			set_style(span2, "opacity", "0.7");
    			add_location(span2, file$4, 259, 28, 9400);
    			attr_dev(div, "class", "layout-placeholders svelte-193zxd5");
    			add_location(div, file$4, 252, 24, 8994);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			span0.innerHTML = /*placeholder1*/ ctx[6];
    			append_dev(div, t0);
    			append_dev(div, span1);
    			span1.innerHTML = /*placeholder2*/ ctx[7];
    			append_dev(div, t1);
    			append_dev(div, span2);
    			span2.innerHTML = /*placeholder3*/ ctx[8];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder1*/ 64) span0.innerHTML = /*placeholder1*/ ctx[6];			if (dirty & /*placeholder2*/ 128) span1.innerHTML = /*placeholder2*/ ctx[7];			if (dirty & /*placeholder3*/ 256) span2.innerHTML = /*placeholder3*/ ctx[8];
    			if (dirty & /*text_color*/ 4 && span2_class_value !== (span2_class_value = "fw-bold " + /*text_color*/ ctx[2] + " display-5" + " svelte-193zxd5")) {
    				attr_dev(span2, "class", span2_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(252:20) {#if placeholder1 && placeholder2 && placeholder3}",
    		ctx
    	});

    	return block;
    }

    // (248:8) <Saos animation={""}>
    function create_default_slot$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*ready*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*ready*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*ready*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(248:8) <Saos animation={\\\"\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div1;
    	let saos;
    	let t;
    	let div0;
    	let div2_class_value;
    	let current;

    	saos = new Saos({
    			props: {
    				animation: "",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			create_component(saos.$$.fragment);
    			t = space();
    			div0 = element("div");
    			attr_dev(div0, "class", "col-md-6 mb-3");
    			add_location(div0, file$4, 296, 8, 10910);
    			attr_dev(div1, "class", "row container");
    			add_location(div1, file$4, 245, 4, 8638);
    			attr_dev(div2, "class", div2_class_value = "text-" + /*text_color*/ ctx[2] + " d-flex justify-content-center align-items-center min-vh-100" + " svelte-193zxd5");
    			attr_dev(div2, "id", /*Id*/ ctx[0]);
    			set_style(div2, "padding-top", "58px");
    			set_style(div2, "background-color", "transparent", 1);
    			add_location(div2, file$4, 240, 0, 8453);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			mount_component(saos, div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const saos_changes = {};

    			if (dirty & /*$$scope, text_color, rollingText3, rollingText2, rollingText1, placeholder3, placeholder2, placeholder1, ready*/ 8389118) {
    				saos_changes.$$scope = { dirty, ctx };
    			}

    			saos.$set(saos_changes);

    			if (!current || dirty & /*text_color*/ 4 && div2_class_value !== (div2_class_value = "text-" + /*text_color*/ ctx[2] + " d-flex justify-content-center align-items-center min-vh-100" + " svelte-193zxd5")) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (!current || dirty & /*Id*/ 1) {
    				attr_dev(div2, "id", /*Id*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(saos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(saos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(saos);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>?/~";

    function preprocessText(text) {
    	return text.replace(/{(.*?)}/g, '<span class="text-shadows" data-text="$1">$1</span>');
    }

    function createRollingInterval(text, setter, delay = 0) {
    	const plainText = text.replace(/<[^>]+>/g, ""); // Remove HTML tags for rolling logic
    	const tags = extractTagsWithPositions(text);

    	// Track which characters are locked (finalized)
    	const lockedChars = new Array(plainText.length).fill(false);

    	// Characters that appear to be "settling" (almost locked)
    	const settlingChars = new Array(plainText.length).fill(0);

    	return setTimeout(
    		() => {
    			const startTime = Date.now();

    			// Faster total duration for snappier animation
    			const totalDuration = 1200;

    			// Smaller delay between characters for more synchronized appearance
    			const characterDelay = 40;

    			const interval = setInterval(
    				() => {
    					const elapsedTime = Date.now() - startTime;

    					if (elapsedTime >= totalDuration + plainText.length * characterDelay * 0.5) {
    						// Animation complete - set final text
    						setter(text);

    						clearInterval(interval);
    						return;
    					}

    					// Build the current text with a mix of random and final characters
    					let resultText = "";

    					let plainIndex = 0;

    					for (let i = 0; i < plainText.length; i++) {
    						// Calculate when this character should start settling
    						// Use a wave function for more natural progression
    						const charStartTime = i * characterDelay * (1 - i / plainText.length * 0.3);

    						const charProgress = elapsedTime - charStartTime;

    						// Character hasn't started animating yet
    						if (charProgress < 0) {
    							resultText += getRandomChar();
    							continue;
    						}

    						// Character is in process of settling
    						if (!lockedChars[i]) {
    							// More aggressive settling curve for smoother locking
    							const settlingProbability = Math.min(1, (charProgress / 250) ** 1.5);

    							if (Math.random() < settlingProbability) {
    								settlingChars[i] += 1 + Math.floor(charProgress / 100);

    								// Progressive locking threshold based on character position
    								const lockThreshold = 2 + Math.floor(i / plainText.length * 2);

    								if (settlingChars[i] > lockThreshold) {
    									lockedChars[i] = true;
    								}
    							}

    							// Either show the final character or a random one
    							resultText += lockedChars[i] ? plainText[i] : getRandomChar();
    						} else {
    							// This character is locked, show the final version
    							resultText += plainText[i];
    						}

    						plainIndex++;

    						// Insert tags at the correct positions
    						const taggedText = insertTagsAtPosition(tags, plainIndex, resultText);

    						if (taggedText !== resultText) {
    							resultText = taggedText;
    						}
    					}

    					setter(resultText);
    				},
    				20
    			); // Even faster refresh rate for ultra-smooth animation

    			return interval;
    		},
    		delay
    	);
    }

    function getRandomChar() {
    	return randomChars[Math.floor(Math.random() * randomChars.length)];
    }

    function extractTagsWithPositions(text) {
    	const tagRegex = /<[^>]+>/g;
    	text.replace(/<[^>]+>/g, "");
    	const tags = [];
    	let match;
    	let plainIndex = 0;
    	let lastIndex = 0;

    	while ((match = tagRegex.exec(text)) !== null) {
    		// Count plaintext characters before this tag
    		const textBeforeTag = text.substring(lastIndex, match.index);

    		const plainChars = textBeforeTag.replace(/<[^>]+>/g, "").length;
    		plainIndex += plainChars;
    		tags.push({ tag: match[0], position: plainIndex });
    		lastIndex = match.index + match[0].length;
    	}

    	return tags;
    }

    function insertTagsAtPosition(tags, position, text) {
    	let result = text;

    	// Insert tags that should appear at this position
    	for (const tagInfo of tags) {
    		if (tagInfo.position === position) {
    			result += tagInfo.tag;
    		}
    	}

    	return result;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	let ready = false;
    	onMount(() => $$invalidate(1, ready = true));
    	let { Id } = $$props;
    	let { header_title_1 } = $$props;
    	let { header_title_2 } = $$props;
    	let { header_title_3 } = $$props;
    	let { state } = $$props;
    	let text_color = "dark";
    	let bg_color = "light";

    	if (state == "dark") {
    		text_color = "light";
    		bg_color = "dark";
    	}

    	// Rolling text animation logic
    	let rollingText1 = "";

    	let rollingText2 = "";
    	let rollingText3 = "";
    	let interval1, interval2, interval3, carouselInterval;

    	// Add placeholder texts for layout stability
    	let placeholder1 = "";

    	let placeholder2 = "";
    	let placeholder3 = "";

    	// Set placeholders immediately when component is mounted
    	onMount(() => {
    		// Create invisible placeholders with exact same content
    		$$invalidate(6, placeholder1 = preprocessText(header_title_1));

    		$$invalidate(7, placeholder2 = preprocessText(header_title_2));

    		$$invalidate(8, placeholder3 = Array.isArray(header_title_3)
    		? preprocessText(header_title_3[0])
    		: preprocessText(header_title_3));

    		// Start animation after a short delay to ensure placeholders are rendered
    		setTimeout(startRollingTextAnimation, 100);

    		return () => {
    			clearInterval(interval1);
    			clearInterval(interval2);
    			clearInterval(interval3);
    			clearInterval(carouselInterval);
    		};
    	});

    	function startRollingTextAnimation() {
    		// Start all animations simultaneously
    		interval1 = createRollingInterval(preprocessText(header_title_1), setRollingText1, 0);

    		interval2 = createRollingInterval(preprocessText(header_title_2), setRollingText2, 0);

    		if (Array.isArray(header_title_3)) {
    			// Just a slight delay for dramatic effect
    			startCarousel(header_title_3, setRollingText3, 200);
    		} else {
    			interval3 = createRollingInterval(preprocessText(header_title_3), setRollingText3, 200);
    		}
    	}

    	function startCarousel(textArray, setter, delay = 0) {
    		let index = 0;

    		const updateText = () => {
    			const text = preprocessText(textArray[index]);
    			createRollingInterval(text, setter);
    			index = (index + 1) % textArray.length;
    		};

    		carouselInterval = setInterval(updateText, delay + 3000); // Change every 3 seconds + animation delay
    		updateText();
    	}

    	function setRollingText1(value) {
    		$$invalidate(3, rollingText1 = value);
    	}

    	function setRollingText2(value) {
    		$$invalidate(4, rollingText2 = value);
    	}

    	function setRollingText3(value) {
    		$$invalidate(5, rollingText3 = value);
    	}

    	const writable_props = ['Id', 'header_title_1', 'header_title_2', 'header_title_3', 'state'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('header_title_1' in $$props) $$invalidate(9, header_title_1 = $$props.header_title_1);
    		if ('header_title_2' in $$props) $$invalidate(10, header_title_2 = $$props.header_title_2);
    		if ('header_title_3' in $$props) $$invalidate(11, header_title_3 = $$props.header_title_3);
    		if ('state' in $$props) $$invalidate(12, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		slide,
    		onMount,
    		Saos,
    		ready,
    		Id,
    		header_title_1,
    		header_title_2,
    		header_title_3,
    		state,
    		text_color,
    		bg_color,
    		rollingText1,
    		rollingText2,
    		rollingText3,
    		interval1,
    		interval2,
    		interval3,
    		carouselInterval,
    		randomChars,
    		preprocessText,
    		placeholder1,
    		placeholder2,
    		placeholder3,
    		startRollingTextAnimation,
    		createRollingInterval,
    		getRandomChar,
    		extractTagsWithPositions,
    		insertTagsAtPosition,
    		startCarousel,
    		setRollingText1,
    		setRollingText2,
    		setRollingText3
    	});

    	$$self.$inject_state = $$props => {
    		if ('ready' in $$props) $$invalidate(1, ready = $$props.ready);
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('header_title_1' in $$props) $$invalidate(9, header_title_1 = $$props.header_title_1);
    		if ('header_title_2' in $$props) $$invalidate(10, header_title_2 = $$props.header_title_2);
    		if ('header_title_3' in $$props) $$invalidate(11, header_title_3 = $$props.header_title_3);
    		if ('state' in $$props) $$invalidate(12, state = $$props.state);
    		if ('text_color' in $$props) $$invalidate(2, text_color = $$props.text_color);
    		if ('bg_color' in $$props) bg_color = $$props.bg_color;
    		if ('rollingText1' in $$props) $$invalidate(3, rollingText1 = $$props.rollingText1);
    		if ('rollingText2' in $$props) $$invalidate(4, rollingText2 = $$props.rollingText2);
    		if ('rollingText3' in $$props) $$invalidate(5, rollingText3 = $$props.rollingText3);
    		if ('interval1' in $$props) interval1 = $$props.interval1;
    		if ('interval2' in $$props) interval2 = $$props.interval2;
    		if ('interval3' in $$props) interval3 = $$props.interval3;
    		if ('carouselInterval' in $$props) carouselInterval = $$props.carouselInterval;
    		if ('placeholder1' in $$props) $$invalidate(6, placeholder1 = $$props.placeholder1);
    		if ('placeholder2' in $$props) $$invalidate(7, placeholder2 = $$props.placeholder2);
    		if ('placeholder3' in $$props) $$invalidate(8, placeholder3 = $$props.placeholder3);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		Id,
    		ready,
    		text_color,
    		rollingText1,
    		rollingText2,
    		rollingText3,
    		placeholder1,
    		placeholder2,
    		placeholder3,
    		header_title_1,
    		header_title_2,
    		header_title_3,
    		state
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			Id: 0,
    			header_title_1: 9,
    			header_title_2: 10,
    			header_title_3: 11,
    			state: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Id*/ ctx[0] === undefined && !('Id' in props)) {
    			console.warn("<Header> was created without expected prop 'Id'");
    		}

    		if (/*header_title_1*/ ctx[9] === undefined && !('header_title_1' in props)) {
    			console.warn("<Header> was created without expected prop 'header_title_1'");
    		}

    		if (/*header_title_2*/ ctx[10] === undefined && !('header_title_2' in props)) {
    			console.warn("<Header> was created without expected prop 'header_title_2'");
    		}

    		if (/*header_title_3*/ ctx[11] === undefined && !('header_title_3' in props)) {
    			console.warn("<Header> was created without expected prop 'header_title_3'");
    		}

    		if (/*state*/ ctx[12] === undefined && !('state' in props)) {
    			console.warn("<Header> was created without expected prop 'state'");
    		}
    	}

    	get Id() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Id(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header_title_1() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header_title_1(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header_title_2() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header_title_2(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header_title_3() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header_title_3(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/About.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/components/About.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i][0];
    	child_ctx[12] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (44:8) {#if ready}
    function create_if_block$2(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*showAbout*/ ctx[8]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container text-center");
    			add_location(div, file$3, 44, 12, 991);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(44:8) {#if ready}",
    		ctx
    	});

    	return block;
    }

    // (72:16) {:else}
    function create_else_block(ctx) {
    	let div2;
    	let div1;
    	let h1;
    	let t0;
    	let t1;
    	let button;
    	let t2_value = (/*showAbout*/ ctx[8] ? "View Skills" : "View About Me") + "";
    	let t2;
    	let t3;
    	let hr;
    	let t4;
    	let div0;
    	let div0_intro;
    	let div1_intro;
    	let mounted;
    	let dispose;
    	let each_value = Object.entries(/*skills*/ ctx[2]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			t0 = text(/*skills_title*/ ctx[1]);
    			t1 = space();
    			button = element("button");
    			t2 = text(t2_value);
    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button, "class", "custom-button mb-4 svelte-1wv6jxt");
    			add_location(button, file$3, 78, 32, 2557);
    			attr_dev(h1, "class", "fw-bold text-primary mb-5");
    			add_location(h1, file$3, 76, 28, 2439);
    			attr_dev(hr, "class", "mb-5");
    			add_location(hr, file$3, 84, 28, 2856);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file$3, 87, 28, 2955);
    			attr_dev(div1, "class", "col-12");
    			add_location(div1, file$3, 74, 24, 2310);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$3, 73, 20, 2268);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, button);
    			append_dev(button, t2);
    			append_dev(div1, t3);
    			append_dev(div1, hr);
    			append_dev(div1, t4);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleSection*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*skills_title*/ 2) set_data_dev(t0, /*skills_title*/ ctx[1]);
    			if (dirty & /*showAbout*/ 256 && t2_value !== (t2_value = (/*showAbout*/ ctx[8] ? "View Skills" : "View About Me") + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*Object, skills, bg_color*/ 132) {
    				each_value = Object.entries(/*skills*/ ctx[2]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (!div0_intro) {
    				add_render_callback(() => {
    					div0_intro = create_in_transition(div0, fade, { delay: 1000, duration: 1000 });
    					div0_intro.start();
    				});
    			}

    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fade, { duration: 1000 });
    					div1_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(72:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (46:16) {#if showAbout}
    function create_if_block_1(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let button;
    	let t2_value = (/*showAbout*/ ctx[8] ? "View Skills" : "View About Me") + "";
    	let t2;
    	let t3;
    	let hr;
    	let t4;
    	let p;
    	let t5;
    	let p_intro;
    	let div0_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(/*bio_title*/ ctx[3]);
    			t1 = space();
    			button = element("button");
    			t2 = text(t2_value);
    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			p = element("p");
    			t5 = text(/*bio*/ ctx[4]);
    			attr_dev(button, "class", "custom-button mb-4 svelte-1wv6jxt");
    			add_location(button, file$3, 52, 32, 1413);
    			attr_dev(h1, "class", "fw-bold text-primary mb-5");
    			add_location(h1, file$3, 50, 28, 1298);
    			attr_dev(hr, "class", "mb-5");
    			add_location(hr, file$3, 58, 28, 1712);
    			attr_dev(p, "class", "");
    			add_location(p, file$3, 61, 28, 1811);
    			attr_dev(div0, "class", "col-12 mb-3");
    			add_location(div0, file$3, 48, 24, 1164);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$3, 47, 20, 1122);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, button);
    			append_dev(button, t2);
    			append_dev(div0, t3);
    			append_dev(div0, hr);
    			append_dev(div0, t4);
    			append_dev(div0, p);
    			append_dev(p, t5);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleSection*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bio_title*/ 8) set_data_dev(t0, /*bio_title*/ ctx[3]);
    			if (dirty & /*showAbout*/ 256 && t2_value !== (t2_value = (/*showAbout*/ ctx[8] ? "View Skills" : "View About Me") + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*bio*/ 16) set_data_dev(t5, /*bio*/ ctx[4]);
    		},
    		i: function intro(local) {
    			if (!p_intro) {
    				add_render_callback(() => {
    					p_intro = create_in_transition(p, fade, { delay: 500, duration: 1000 });
    					p_intro.start();
    				});
    			}

    			if (!div0_intro) {
    				add_render_callback(() => {
    					div0_intro = create_in_transition(div0, fade, { duration: 1000 });
    					div0_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(46:16) {#if showAbout}",
    		ctx
    	});

    	return block;
    }

    // (97:40) {#each skillsArray as skill}
    function create_each_block_1(ctx) {
    	let p;
    	let i;
    	let i_class_value;
    	let t0;
    	let t1_value = /*skill*/ ctx[15][0] + "";
    	let t1;
    	let t2;
    	let div1;
    	let div0;
    	let div0_aria_valuenow_value;
    	let div1_class_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			i = element("i");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(i, "class", i_class_value = "" + (null_to_empty(/*skill*/ ctx[15][1]) + " svelte-1wv6jxt"));
    			add_location(i, file$3, 98, 48, 3628);
    			attr_dev(p, "class", "fw-bold");
    			add_location(p, file$3, 97, 44, 3560);
    			attr_dev(div0, "class", "progress-bar bg-primary animate svelte-1wv6jxt");
    			attr_dev(div0, "role", "progressbar");
    			set_style(div0, "--size", /*skill*/ ctx[15][2] + "%");
    			attr_dev(div0, "aria-valuenow", div0_aria_valuenow_value = /*skill*/ ctx[15][2]);
    			attr_dev(div0, "aria-valuemin", "0");
    			attr_dev(div0, "aria-valuemax", "100");
    			add_location(div0, file$3, 104, 48, 4029);
    			attr_dev(div1, "class", div1_class_value = "progress progress-bar-striped progress-bar-animated bg-" + /*bg_color*/ ctx[7] + " mb-3" + " svelte-1wv6jxt");
    			add_location(div1, file$3, 101, 44, 3803);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, i);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*skills*/ 4 && i_class_value !== (i_class_value = "" + (null_to_empty(/*skill*/ ctx[15][1]) + " svelte-1wv6jxt"))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*skills*/ 4 && t1_value !== (t1_value = /*skill*/ ctx[15][0] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*skills*/ 4) {
    				set_style(div0, "--size", /*skill*/ ctx[15][2] + "%");
    			}

    			if (dirty & /*skills*/ 4 && div0_aria_valuenow_value !== (div0_aria_valuenow_value = /*skill*/ ctx[15][2])) {
    				attr_dev(div0, "aria-valuenow", div0_aria_valuenow_value);
    			}

    			if (dirty & /*bg_color*/ 128 && div1_class_value !== (div1_class_value = "progress progress-bar-striped progress-bar-animated bg-" + /*bg_color*/ ctx[7] + " mb-3" + " svelte-1wv6jxt")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(97:40) {#each skillsArray as skill}",
    		ctx
    	});

    	return block;
    }

    // (92:32) {#each Object.entries(skills) as [category, skillsArray]}
    function create_each_block$2(ctx) {
    	let div;
    	let h3;
    	let t0_value = /*category*/ ctx[11] + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_value_1 = /*skillsArray*/ ctx[12];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(h3, "class", "text-secondary svelte-1wv6jxt");
    			add_location(h3, file$3, 93, 40, 3318);
    			attr_dev(div, "class", "col-12 col-md-6 col-lg-4 mb-4 svelte-1wv6jxt");
    			add_location(div, file$3, 92, 36, 3234);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*skills*/ 4 && t0_value !== (t0_value = /*category*/ ctx[11] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*bg_color, Object, skills*/ 132) {
    				each_value_1 = /*skillsArray*/ ctx[12];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(92:32) {#each Object.entries(skills) as [category, skillsArray]}",
    		ctx
    	});

    	return block;
    }

    // (43:4) <Saos animation={""}>
    function create_default_slot$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*ready*/ ctx[5] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*ready*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*ready*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(43:4) <Saos animation={\\\"\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let saos;
    	let div_class_value;
    	let current;

    	saos = new Saos({
    			props: {
    				animation: "",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(saos.$$.fragment);
    			attr_dev(div, "class", div_class_value = "bg-" + /*bg_color*/ ctx[7] + " text-" + /*text_color*/ ctx[6] + " d-flex justify-content-center align-items-center min-vh-100" + " svelte-1wv6jxt");
    			attr_dev(div, "id", /*Id*/ ctx[0]);
    			set_style(div, "padding-top", "58px");
    			set_style(div, "background-color", "transparent", 1);
    			add_location(div, file$3, 37, 0, 738);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(saos, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const saos_changes = {};

    			if (dirty & /*$$scope, bio, showAbout, bio_title, skills, bg_color, skills_title, ready*/ 262590) {
    				saos_changes.$$scope = { dirty, ctx };
    			}

    			saos.$set(saos_changes);

    			if (!current || dirty & /*bg_color, text_color*/ 192 && div_class_value !== (div_class_value = "bg-" + /*bg_color*/ ctx[7] + " text-" + /*text_color*/ ctx[6] + " d-flex justify-content-center align-items-center min-vh-100" + " svelte-1wv6jxt")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*Id*/ 1) {
    				attr_dev(div, "id", /*Id*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(saos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(saos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(saos);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	let ready = false;
    	onMount(() => $$invalidate(5, ready = true));
    	let { Id } = $$props;
    	let { skills_title } = $$props;
    	let { skills } = $$props;
    	let { bio_title } = $$props;
    	let { bio } = $$props;
    	let { state } = $$props;
    	let text_color = "dark";
    	let bg_color = "light";

    	if (state == "dark") {
    		text_color = "light";
    		bg_color = "dark";
    	}

    	let showAbout = true;

    	function toggleSection() {
    		$$invalidate(8, showAbout = !showAbout);
    	}

    	const writable_props = ['Id', 'skills_title', 'skills', 'bio_title', 'bio', 'state'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('skills_title' in $$props) $$invalidate(1, skills_title = $$props.skills_title);
    		if ('skills' in $$props) $$invalidate(2, skills = $$props.skills);
    		if ('bio_title' in $$props) $$invalidate(3, bio_title = $$props.bio_title);
    		if ('bio' in $$props) $$invalidate(4, bio = $$props.bio);
    		if ('state' in $$props) $$invalidate(10, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		slide,
    		fade,
    		onMount,
    		Saos,
    		ready,
    		Id,
    		skills_title,
    		skills,
    		bio_title,
    		bio,
    		state,
    		text_color,
    		bg_color,
    		showAbout,
    		toggleSection
    	});

    	$$self.$inject_state = $$props => {
    		if ('ready' in $$props) $$invalidate(5, ready = $$props.ready);
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('skills_title' in $$props) $$invalidate(1, skills_title = $$props.skills_title);
    		if ('skills' in $$props) $$invalidate(2, skills = $$props.skills);
    		if ('bio_title' in $$props) $$invalidate(3, bio_title = $$props.bio_title);
    		if ('bio' in $$props) $$invalidate(4, bio = $$props.bio);
    		if ('state' in $$props) $$invalidate(10, state = $$props.state);
    		if ('text_color' in $$props) $$invalidate(6, text_color = $$props.text_color);
    		if ('bg_color' in $$props) $$invalidate(7, bg_color = $$props.bg_color);
    		if ('showAbout' in $$props) $$invalidate(8, showAbout = $$props.showAbout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		Id,
    		skills_title,
    		skills,
    		bio_title,
    		bio,
    		ready,
    		text_color,
    		bg_color,
    		showAbout,
    		toggleSection,
    		state
    	];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			Id: 0,
    			skills_title: 1,
    			skills: 2,
    			bio_title: 3,
    			bio: 4,
    			state: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Id*/ ctx[0] === undefined && !('Id' in props)) {
    			console.warn("<About> was created without expected prop 'Id'");
    		}

    		if (/*skills_title*/ ctx[1] === undefined && !('skills_title' in props)) {
    			console.warn("<About> was created without expected prop 'skills_title'");
    		}

    		if (/*skills*/ ctx[2] === undefined && !('skills' in props)) {
    			console.warn("<About> was created without expected prop 'skills'");
    		}

    		if (/*bio_title*/ ctx[3] === undefined && !('bio_title' in props)) {
    			console.warn("<About> was created without expected prop 'bio_title'");
    		}

    		if (/*bio*/ ctx[4] === undefined && !('bio' in props)) {
    			console.warn("<About> was created without expected prop 'bio'");
    		}

    		if (/*state*/ ctx[10] === undefined && !('state' in props)) {
    			console.warn("<About> was created without expected prop 'state'");
    		}
    	}

    	get Id() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Id(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skills_title() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skills_title(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skills() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skills(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bio_title() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bio_title(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bio() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bio(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<About>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<About>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Projects.svelte generated by Svelte v3.46.4 */
    const file$2 = "src/components/Projects.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (34:8) {#if ready}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t0;
    	let div0_intro;
    	let t1;
    	let hr;
    	let t2;
    	let each_value = /*projects*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(/*projects_title*/ ctx[1]);
    			t1 = space();
    			hr = element("hr");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "fw-bold text-primary");
    			add_location(h1, file$2, 40, 20, 1051);
    			attr_dev(div0, "class", "col-md-12 text-center mb-5");
    			add_location(div0, file$2, 36, 16, 903);
    			attr_dev(hr, "class", "mb-5");
    			add_location(hr, file$2, 43, 16, 1184);
    			attr_dev(div1, "class", "row container justify-content-center");
    			add_location(div1, file$2, 34, 12, 797);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, hr);
    			append_dev(div1, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*projects_title*/ 2) set_data_dev(t0, /*projects_title*/ ctx[1]);

    			if (dirty & /*text_color, projects, bg_color*/ 52) {
    				each_value = /*projects*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (!div0_intro) {
    				add_render_callback(() => {
    					div0_intro = create_in_transition(div0, slide, { duration: 1000 });
    					div0_intro.start();
    				});
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(34:8) {#if ready}",
    		ctx
    	});

    	return block;
    }

    // (46:16) {#each projects as project}
    function create_each_block$1(ctx) {
    	let div2;
    	let a;
    	let div1;
    	let div0;
    	let h5;
    	let t0_value = /*project*/ ctx[7][0] + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = /*project*/ ctx[7][1] + "";
    	let t2;
    	let div1_class_value;
    	let a_class_value;
    	let a_href_value;
    	let t3;
    	let div2_intro;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			a = element("a");
    			div1 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(h5, "class", "card-title text-primary fw-bold");
    			add_location(h5, file$2, 58, 36, 1865);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file$2, 62, 36, 2106);
    			attr_dev(div0, "class", "card-body");
    			add_location(div0, file$2, 56, 32, 1747);
    			attr_dev(div1, "class", div1_class_value = "card bg-" + /*bg_color*/ ctx[5] + " hover-shadow");
    			add_location(div1, file$2, 55, 28, 1669);
    			attr_dev(a, "class", a_class_value = "text-" + /*text_color*/ ctx[4]);
    			attr_dev(a, "href", a_href_value = /*project*/ ctx[7][2]);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$2, 50, 24, 1468);
    			attr_dev(div2, "class", "col-md-6 mb-3");
    			add_location(div2, file$2, 46, 20, 1306);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, a);
    			append_dev(a, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h5);
    			append_dev(h5, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    			append_dev(div2, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*projects*/ 4 && t0_value !== (t0_value = /*project*/ ctx[7][0] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*projects*/ 4 && t2_value !== (t2_value = /*project*/ ctx[7][1] + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*bg_color*/ 32 && div1_class_value !== (div1_class_value = "card bg-" + /*bg_color*/ ctx[5] + " hover-shadow")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*text_color*/ 16 && a_class_value !== (a_class_value = "text-" + /*text_color*/ ctx[4])) {
    				attr_dev(a, "class", a_class_value);
    			}

    			if (dirty & /*projects*/ 4 && a_href_value !== (a_href_value = /*project*/ ctx[7][2])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: function intro(local) {
    			if (!div2_intro) {
    				add_render_callback(() => {
    					div2_intro = create_in_transition(div2, fade, { delay: 500, duration: 1500 });
    					div2_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(46:16) {#each projects as project}",
    		ctx
    	});

    	return block;
    }

    // (33:4) <Saos animation={""}>
    function create_default_slot$1(ctx) {
    	let if_block_anchor;
    	let if_block = /*ready*/ ctx[3] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*ready*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*ready*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(33:4) <Saos animation={\\\"\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let saos;
    	let div_class_value;
    	let current;

    	saos = new Saos({
    			props: {
    				animation: "",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(saos.$$.fragment);
    			attr_dev(div, "class", div_class_value = "text-" + /*text_color*/ ctx[4] + " d-flex justify-content-center align-items-center min-vh-100");
    			attr_dev(div, "id", /*Id*/ ctx[0]);
    			set_style(div, "padding-top", "58px");
    			set_style(div, "background-color", "transparent", 1);
    			add_location(div, file$2, 27, 0, 558);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(saos, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const saos_changes = {};

    			if (dirty & /*$$scope, projects, text_color, bg_color, projects_title, ready*/ 1086) {
    				saos_changes.$$scope = { dirty, ctx };
    			}

    			saos.$set(saos_changes);

    			if (!current || dirty & /*text_color*/ 16 && div_class_value !== (div_class_value = "text-" + /*text_color*/ ctx[4] + " d-flex justify-content-center align-items-center min-vh-100")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*Id*/ 1) {
    				attr_dev(div, "id", /*Id*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(saos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(saos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(saos);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Projects', slots, []);
    	let ready = false;
    	onMount(() => $$invalidate(3, ready = true));
    	let { Id } = $$props;
    	let { projects_title } = $$props;
    	let { projects } = $$props;
    	let { state } = $$props;
    	let text_color = "dark";
    	let bg_color = "light";

    	if (state == "dark") {
    		text_color = "light";
    		bg_color = "dark";
    	}

    	const writable_props = ['Id', 'projects_title', 'projects', 'state'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('projects_title' in $$props) $$invalidate(1, projects_title = $$props.projects_title);
    		if ('projects' in $$props) $$invalidate(2, projects = $$props.projects);
    		if ('state' in $$props) $$invalidate(6, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		slide,
    		fade,
    		onMount,
    		Saos,
    		ready,
    		Id,
    		projects_title,
    		projects,
    		state,
    		text_color,
    		bg_color
    	});

    	$$self.$inject_state = $$props => {
    		if ('ready' in $$props) $$invalidate(3, ready = $$props.ready);
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('projects_title' in $$props) $$invalidate(1, projects_title = $$props.projects_title);
    		if ('projects' in $$props) $$invalidate(2, projects = $$props.projects);
    		if ('state' in $$props) $$invalidate(6, state = $$props.state);
    		if ('text_color' in $$props) $$invalidate(4, text_color = $$props.text_color);
    		if ('bg_color' in $$props) $$invalidate(5, bg_color = $$props.bg_color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Id, projects_title, projects, ready, text_color, bg_color, state];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			Id: 0,
    			projects_title: 1,
    			projects: 2,
    			state: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Id*/ ctx[0] === undefined && !('Id' in props)) {
    			console.warn("<Projects> was created without expected prop 'Id'");
    		}

    		if (/*projects_title*/ ctx[1] === undefined && !('projects_title' in props)) {
    			console.warn("<Projects> was created without expected prop 'projects_title'");
    		}

    		if (/*projects*/ ctx[2] === undefined && !('projects' in props)) {
    			console.warn("<Projects> was created without expected prop 'projects'");
    		}

    		if (/*state*/ ctx[6] === undefined && !('state' in props)) {
    			console.warn("<Projects> was created without expected prop 'state'");
    		}
    	}

    	get Id() {
    		throw new Error("<Projects>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Id(value) {
    		throw new Error("<Projects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get projects_title() {
    		throw new Error("<Projects>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projects_title(value) {
    		throw new Error("<Projects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get projects() {
    		throw new Error("<Projects>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projects(value) {
    		throw new Error("<Projects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Projects>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Projects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Contact.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/components/Contact.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (34:4) {#if ready}
    function create_if_block(ctx) {
    	let div3;
    	let div0;
    	let h10;
    	let t0;
    	let div0_intro;
    	let t1;
    	let hr;
    	let t2;
    	let div1;
    	let h11;
    	let div1_intro;
    	let t3;
    	let div2;
    	let each_value = /*social*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			t0 = text(/*contact_title*/ ctx[1]);
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			div1 = element("div");
    			h11 = element("h1");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div2 = element("div");
    			attr_dev(h10, "class", "fw-bold text-primary");
    			add_location(h10, file$1, 37, 10, 882);
    			attr_dev(div0, "class", "text-center mb-3");
    			add_location(div0, file$1, 36, 8, 811);
    			add_location(hr, file$1, 43, 8, 1015);
    			attr_dev(h11, "class", "text-primary text-center");
    			add_location(h11, file$1, 47, 10, 1118);
    			add_location(div1, file$1, 46, 8, 1061);
    			attr_dev(div2, "class", "col-md-12");
    			add_location(div2, file$1, 64, 8, 1613);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$1, 34, 6, 748);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, h10);
    			append_dev(h10, t0);
    			append_dev(div3, t1);
    			append_dev(div3, hr);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, h11);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(h11, null);
    			}

    			append_dev(div3, t3);
    			append_dev(div3, div2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*contact_title*/ 2) set_data_dev(t0, /*contact_title*/ ctx[1]);

    			if (dirty & /*social*/ 4) {
    				each_value = /*social*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(h11, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (!div0_intro) {
    				add_render_callback(() => {
    					div0_intro = create_in_transition(div0, slide, { duration: 1000 });
    					div0_intro.start();
    				});
    			}

    			if (!div1_intro) {
    				add_render_callback(() => {
    					div1_intro = create_in_transition(div1, fade, { delay: 500, duration: 1000 });
    					div1_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:4) {#if ready}",
    		ctx
    	});

    	return block;
    }

    // (50:12) {#each social as item}
    function create_each_block(ctx) {
    	let a;
    	let i;
    	let i_class_value;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			i = element("i");
    			t = space();
    			attr_dev(i, "class", i_class_value = "h3 " + /*item*/ ctx[7][1] + " svelte-sgl1i7");
    			add_location(i, file$1, 55, 16, 1390);
    			attr_dev(a, "class", "btn shadow-sm mx-1 social-icon svelte-sgl1i7");
    			attr_dev(a, "href", a_href_value = /*item*/ ctx[7][2]);
    			attr_dev(a, "role", "button");
    			add_location(a, file$1, 50, 14, 1239);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, i);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*social*/ 4 && i_class_value !== (i_class_value = "h3 " + /*item*/ ctx[7][1] + " svelte-sgl1i7")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*social*/ 4 && a_href_value !== (a_href_value = /*item*/ ctx[7][2])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(50:12) {#each social as item}",
    		ctx
    	});

    	return block;
    }

    // (33:2) <Saos animation={""}>
    function create_default_slot(ctx) {
    	let if_block_anchor;
    	let if_block = /*ready*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*ready*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*ready*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(33:2) <Saos animation={\\\"\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let saos;
    	let div_class_value;
    	let current;

    	saos = new Saos({
    			props: {
    				animation: "",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(saos.$$.fragment);
    			attr_dev(div, "class", div_class_value = "bg-" + /*bg_color*/ ctx[5] + " text-" + /*text_color*/ ctx[4] + " d-flex justify-content-center align-items-center min-vh-100" + " svelte-sgl1i7");
    			attr_dev(div, "id", /*Id*/ ctx[0]);
    			set_style(div, "padding-top", "58px");
    			set_style(div, "background-color", "transparent", 1);
    			add_location(div, file$1, 27, 0, 513);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(saos, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const saos_changes = {};

    			if (dirty & /*$$scope, social, contact_title, ready*/ 1038) {
    				saos_changes.$$scope = { dirty, ctx };
    			}

    			saos.$set(saos_changes);

    			if (!current || dirty & /*bg_color, text_color*/ 48 && div_class_value !== (div_class_value = "bg-" + /*bg_color*/ ctx[5] + " text-" + /*text_color*/ ctx[4] + " d-flex justify-content-center align-items-center min-vh-100" + " svelte-sgl1i7")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*Id*/ 1) {
    				attr_dev(div, "id", /*Id*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(saos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(saos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(saos);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Contact', slots, []);
    	let ready = false;
    	onMount(() => $$invalidate(3, ready = true));
    	let { Id } = $$props;
    	let { contact_title } = $$props;
    	let { social } = $$props;
    	let { state } = $$props;
    	let text_color = "dark";
    	let bg_color = "light";

    	if (state == "dark") {
    		text_color = "light";
    		bg_color = "dark";
    	}

    	const writable_props = ['Id', 'contact_title', 'social', 'state'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('contact_title' in $$props) $$invalidate(1, contact_title = $$props.contact_title);
    		if ('social' in $$props) $$invalidate(2, social = $$props.social);
    		if ('state' in $$props) $$invalidate(6, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		slide,
    		onMount,
    		Saos,
    		ready,
    		Id,
    		contact_title,
    		social,
    		state,
    		text_color,
    		bg_color
    	});

    	$$self.$inject_state = $$props => {
    		if ('ready' in $$props) $$invalidate(3, ready = $$props.ready);
    		if ('Id' in $$props) $$invalidate(0, Id = $$props.Id);
    		if ('contact_title' in $$props) $$invalidate(1, contact_title = $$props.contact_title);
    		if ('social' in $$props) $$invalidate(2, social = $$props.social);
    		if ('state' in $$props) $$invalidate(6, state = $$props.state);
    		if ('text_color' in $$props) $$invalidate(4, text_color = $$props.text_color);
    		if ('bg_color' in $$props) $$invalidate(5, bg_color = $$props.bg_color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Id, contact_title, social, ready, text_color, bg_color, state];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			Id: 0,
    			contact_title: 1,
    			social: 2,
    			state: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Id*/ ctx[0] === undefined && !('Id' in props)) {
    			console.warn("<Contact> was created without expected prop 'Id'");
    		}

    		if (/*contact_title*/ ctx[1] === undefined && !('contact_title' in props)) {
    			console.warn("<Contact> was created without expected prop 'contact_title'");
    		}

    		if (/*social*/ ctx[2] === undefined && !('social' in props)) {
    			console.warn("<Contact> was created without expected prop 'social'");
    		}

    		if (/*state*/ ctx[6] === undefined && !('state' in props)) {
    			console.warn("<Contact> was created without expected prop 'state'");
    		}
    	}

    	get Id() {
    		throw new Error("<Contact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Id(value) {
    		throw new Error("<Contact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get contact_title() {
    		throw new Error("<Contact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set contact_title(value) {
    		throw new Error("<Contact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get social() {
    		throw new Error("<Contact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set social(value) {
    		throw new Error("<Contact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Contact>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Contact>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let navbar;
    	let t0;
    	let header;
    	let t1;
    	let about;
    	let t2;
    	let projects_1;
    	let t3;
    	let contact;
    	let t4;
    	let footer;
    	let main_class_value;
    	let current;

    	navbar = new Navbar({
    			props: {
    				Id: "navbar",
    				brand: /*brand*/ ctx[2],
    				nav_items: /*nav_items*/ ctx[3],
    				github: /*github*/ ctx[4],
    				state: /*state*/ ctx[16]
    			},
    			$$inline: true
    		});

    	header = new Header({
    			props: {
    				Id: "#",
    				header_title_1: /*header_title_1*/ ctx[5],
    				header_title_2: /*header_title_2*/ ctx[6],
    				header_title_3: /*header_title_3*/ ctx[7],
    				state: /*state*/ ctx[16]
    			},
    			$$inline: true
    		});

    	about = new About({
    			props: {
    				Id: "about",
    				bio_title: /*bio_title*/ ctx[8],
    				bio: /*bio*/ ctx[11],
    				skills_title: /*skills_title*/ ctx[9],
    				skills: /*skills*/ ctx[10],
    				state: /*state*/ ctx[16]
    			},
    			$$inline: true
    		});

    	projects_1 = new Projects({
    			props: {
    				Id: "projects",
    				projects_title: /*projects_title*/ ctx[12],
    				projects: /*projects*/ ctx[13],
    				state: /*state*/ ctx[16]
    			},
    			$$inline: true
    		});

    	contact = new Contact({
    			props: {
    				Id: "contact",
    				contact_title: /*contact_title*/ ctx[14],
    				social: /*social*/ ctx[15],
    				state: /*state*/ ctx[16]
    			},
    			$$inline: true
    		});

    	footer = new Footer({
    			props: {
    				Id: "footer",
    				brand: /*brand*/ ctx[2],
    				state: /*state*/ ctx[16]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(about.$$.fragment);
    			t2 = space();
    			create_component(projects_1.$$.fragment);
    			t3 = space();
    			create_component(contact.$$.fragment);
    			t4 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(div, "class", "bg-pattern");
    			add_location(div, file, 142, 1, 5078);
    			attr_dev(main, "class", main_class_value = "bg-" + /*bg_color*/ ctx[1] + " text-" + /*text_color*/ ctx[0] + " min-vh-100");
    			add_location(main, file, 141, 0, 5019);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			mount_component(navbar, div, null);
    			append_dev(div, t0);
    			mount_component(header, div, null);
    			append_dev(div, t1);
    			mount_component(about, div, null);
    			append_dev(div, t2);
    			mount_component(projects_1, div, null);
    			append_dev(div, t3);
    			mount_component(contact, div, null);
    			append_dev(div, t4);
    			mount_component(footer, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*bg_color, text_color*/ 3 && main_class_value !== (main_class_value = "bg-" + /*bg_color*/ ctx[1] + " text-" + /*text_color*/ ctx[0] + " min-vh-100")) {
    				attr_dev(main, "class", main_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(projects_1.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(projects_1.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(header);
    			destroy_component(about);
    			destroy_component(projects_1);
    			destroy_component(contact);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let brand = "sputnix.me";

    	let nav_items = [
    		["Home", "#"],
    		["About", "#about"],
    		["Projects", "#projects"],
    		["Contact", "#contact"]
    	];

    	let github = "https://github.com/Gitkubikon";
    	let header_title_1 = "Hello,";
    	let header_title_2 = "I'm {Nikita}";

    	let header_title_3 = [
    		"UI Designer.",
    		"Web Developer.",
    		"Freelancer.",
    		"Genius",
    		"Billionaire *",
    		"Playboy",
    		"Philanthropist",
    		"Team Lead"
    	];

    	let bio_title = "About Me";
    	let skills_title = "My Skills";

    	let skills = {
    		Languages: [
    			["Python", "fab fa-python", 60],
    			["Shell Script", "fab fa-linux", 75],
    			["HTML/CSS", "fab fa-html5", 90],
    			["JavaScript", "fab fa-js-square", 85],
    			["TypeScript", "fab fa-js", 90]
    		],
    		Tools: [
    			["Adobe Photoshop", "fas fa-image", 85],
    			["Adobe Illustrator", "fas fa-pencil-alt", 80],
    			["Figma", "fas fa-object-group", 75],
    			["InDesign", "fas fa-file-alt", 70],
    			["Blender", "fas fa-blender", 30]
    		],
    		LanguagesSpoken: [
    			["German (Native)", "fas fa-language", 100],
    			["Russian (Native)", "fas fa-language", 100],
    			["English (C1)", "fas fa-language", 90],
    			["Japanese (Basic)", "fas fa-language", 30]
    		],
    		AI: [["Midjourney", "fas fa-robot", 70], ["ChatGPT", "fas fa-comments", 75]],
    		Frameworks: [["Svelte", "fas fa-code", 95], ["Flutter", "fab fa-dev", 50]]
    	};

    	let bio = `
	  I am Nikita Friesen, a dedicated and passionate software engineer currently pursuing a Bachelor of Science in User Experience Design at the Technical University Ingolstadt. 
	  My journey in technology has been both diverse and fulfilling, encompassing various roles and responsibilities. I have honed my skills in user research, design thinking, and prototyping through rigorous academic training and practical experience.
	  
	  I've had the opportunity to work with leading companies such as SodaStream and HIVE Systems, where I contributed to the development of advanced systems and interfaces. My experience ranges from sales and merchandising to software engineering and digital art freelancing. 
	  
	  Beyond my technical expertise, I have a strong foundation in graphic design, with advanced skills in Adobe Photoshop, Illustrator, Figma, and InDesign. My multilingual abilities in German, Russian, English, and Japanese allow me to communicate and collaborate effectively in diverse environments.
	  
	  I aim to leverage my skills and experience to create impactful solutions and contribute to the advancement of technology.`;

    	let projects_title = "Project Showcase";

    	let projects = [
    		[
    			"HIVE Dashboard",
    			"Led the development of the HIVE Dashboard’s frontend, a sophisticated management interface for drone fleet operations. Implemented features for monitoring drone status, performance, and location, enhancing operational efficiency.",
    			"#"
    		],
    		[
    			"Twitch Channel Designs",
    			"Created compelling logo and illustration designs for Twitch channels, increasing viewer engagement and channel identity. These designs significantly contributed to the channels' visual appeal and brand identity.",
    			"#"
    		],
    		[
    			"Gabrieli-Gymnasium Brand Identity",
    			"Designed logos and school clothing for Gabrieli-Gymnasium, significantly enhancing the school’s brand identity. This project was a perfect blend of creativity and practicality, resulting in a more cohesive and recognizable brand.",
    			"https://www.gabrieli-gymnasium.de/menschen/schuelervertretung/schulkleidung/"
    		],
    		[
    			"Software Development at IDL",
    			"Gained deep insights into company operations and contributed to programming minor bugs and features. Participated in regular team meetings, enhancing collaboration and problem-solving skills.",
    			"#"
    		]
    	];

    	let contact_title = "Contact Me";

    	let social = [
    		["LinkedIn", "fab fa-linkedin", "https://www.linkedin.com/in/nikita-friesen"],
    		["Email", "fas fa-envelope", "mailto:nikitafriesen74@gmail.com"],
    		//   ["Twitter", "fab fa-twitter", "#"],
    		//   ["YouTube", "fab fa-youtube", "#"],
    		["Github", "fab fa-github", github]
    	];

    	let state = "dark"; // Change this to "light" to use light theme.
    	let text_color = "dark";
    	let bg_color = "light";

    	if (state === "dark") {
    		text_color = "light";
    		bg_color = "dark";
    	}

    	onMount(() => {
    		const sections = document.querySelectorAll("section");

    		const observer = new IntersectionObserver(entries => {
    				entries.forEach(entry => {
    					if (entry.isIntersecting) {
    						entry.target.classList.add("visible");
    					} else {
    						entry.target.classList.remove("visible");
    					}
    				});
    			});

    		sections.forEach(section => {
    			observer.observe(section);
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Navbar,
    		Footer,
    		Header,
    		About,
    		Projects,
    		Contact,
    		onMount,
    		brand,
    		nav_items,
    		github,
    		header_title_1,
    		header_title_2,
    		header_title_3,
    		bio_title,
    		skills_title,
    		skills,
    		bio,
    		projects_title,
    		projects,
    		contact_title,
    		social,
    		state,
    		text_color,
    		bg_color
    	});

    	$$self.$inject_state = $$props => {
    		if ('brand' in $$props) $$invalidate(2, brand = $$props.brand);
    		if ('nav_items' in $$props) $$invalidate(3, nav_items = $$props.nav_items);
    		if ('github' in $$props) $$invalidate(4, github = $$props.github);
    		if ('header_title_1' in $$props) $$invalidate(5, header_title_1 = $$props.header_title_1);
    		if ('header_title_2' in $$props) $$invalidate(6, header_title_2 = $$props.header_title_2);
    		if ('header_title_3' in $$props) $$invalidate(7, header_title_3 = $$props.header_title_3);
    		if ('bio_title' in $$props) $$invalidate(8, bio_title = $$props.bio_title);
    		if ('skills_title' in $$props) $$invalidate(9, skills_title = $$props.skills_title);
    		if ('skills' in $$props) $$invalidate(10, skills = $$props.skills);
    		if ('bio' in $$props) $$invalidate(11, bio = $$props.bio);
    		if ('projects_title' in $$props) $$invalidate(12, projects_title = $$props.projects_title);
    		if ('projects' in $$props) $$invalidate(13, projects = $$props.projects);
    		if ('contact_title' in $$props) $$invalidate(14, contact_title = $$props.contact_title);
    		if ('social' in $$props) $$invalidate(15, social = $$props.social);
    		if ('state' in $$props) $$invalidate(16, state = $$props.state);
    		if ('text_color' in $$props) $$invalidate(0, text_color = $$props.text_color);
    		if ('bg_color' in $$props) $$invalidate(1, bg_color = $$props.bg_color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		text_color,
    		bg_color,
    		brand,
    		nav_items,
    		github,
    		header_title_1,
    		header_title_2,
    		header_title_3,
    		bio_title,
    		skills_title,
    		skills,
    		bio,
    		projects_title,
    		projects,
    		contact_title,
    		social,
    		state
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
