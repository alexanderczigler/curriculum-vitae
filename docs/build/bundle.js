
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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

    function append(target, node) {
        target.appendChild(node);
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
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
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const CV = {
      Assignments: [
        {
          meta: {
            customer: 'TV4 Gruppen',
            origin: 'Mogul',
            body: 'I was part of a team repsonsible for development and maintenance of TV4\'s sales support system "L4".',
            start: 2010,
            end: 2013,
          },
          tags: [
            '.NET',
            'SQL Server',
            'CI',
          ],
        },
        {
          meta: {
            customer: 'JobTech',
            origin: 'Iteam',
            body: 'Implementation of CI/CD pipelines, automatic builds, automatic testing etc. for the JobTech MyData project.',
            start: 2019,
            end: 2019,
          },
          tags: [
            'docker',
            'kubernetes',
            'openshift',
            'linux',
            'postgresql',
            'jenkins',
          ],
        },
        {
          meta: {
            customer: 'V3VO - Vertical Evolution',
            origin: 'Iteam',
            body: 'Architecture and development of a REST API from scratch. The API serves as backend to V3VO’s apps/web applications and holds customer data, business logic and JWT-validation. The solution is orchestrated using kubernetes where the API, PostgreSQL and web applications are run and monitored. User authentication is done using Auth0 (JWKS).',
            start: 2019,
            end: 2020,
          },
          tags: [
            'docker',
            'kubernetes',
            'openshift',
            'linux',
            'postgresql',
            'expo',
            'auth0',
            'node',
            'jwt',
          ],
        },
        {
          meta: {
            customer: 'TRR Trygghetsrådet',
            origin: 'Iteam',
            body: 'Helping TRR understand their role in the Swedish job market and how they can maximize their impact and presence among their customers. I work with UX research, planning and participating in design sprints as well as doing interviews with customers to gather qualitative data.',
            start: 2019,
            end: 2020,
          },
          tags: [
            'ux research',
            'design sprint',
            'double diamond',
            'agile coaching',
          ],
        },
        {
          meta: {
            customer: 'Motorbranschens Riksförbund',
            origin: 'Iteam',
            body: 'Design, research and development of a new web-based system for workshops repairing cars and billing insurance companies. The challenges of this project include supporting all legal requirements of GDPR, bookkeeping law and building a system with the end user in focus.',
            start: 2018,
            end: 2020,
          },
          tags: [
            'node',
            'postgresql',
            'ux research',
            'lean ux',
            'aws',
            'eks',
            'kubernetes',
          ],
        },
        {
          meta: {
            customer: 'SEB',
            origin: 'Iteam',
            body: 'Technical Advisor & Agile Coach. Working as part of one of SEB’s development teams to learn and teach alongside with their developers and help them overcome organisational obstacles and adopt better ways of working with system development. Working with a cross team implementing Docker Enterprise with Docker for Windows nodes. SEB was one of the first customers to run docker on Windows Server at their scale.',
            start: 2017,
            end: 2019,
          },
          tags: [
            '.NET',
            'dotnet core',
            'javascript',
            'docker',
            'docker swarm',
            'kubernetes',
            'docker enterprise',
            'devops thinking',
            'devops culture',
            'agile coaching',
          ],
        },
        {
          meta: {
            customer: 'Uppdragshuset',
            origin: 'Iteam',
            body: 'Technical advisor working closely with two of Uppdragshuset’s senior developers in their initiative to adopt Docker and radically change their development flow.',
            start: 2015,
            end: 2016,
          },
          tags: [
            'docker',
            'docker cloud',
          ],
        },
        {
          meta: {
            customer: 'Taxi Stockholm AB',
            origin: 'Iteam',
            body: 'Played a role in the creation and setup of TSAB’s cloud orchestrated Docker environment with Docker cloud and Microsoft Azure. Development of data mining and market automation applications using node.js to process and transfer data from MySQL and Oracle DB to no-sql databases (RethinkDB and ElasticSearch). Development of a RESTful API in node.js, integrations with SOAP API:s, Oracle DB and RPC backends.',
            start: 2015,
            end: 2017,
          },
          tags: [
            '.NET',
            'node',
            'legacy API:s',
            'MySQL',
            'Oracle DB',
            'Azure',
            'docker cloud',
            'RethinDB',
            'ElasticSearch',
          ],
        },
        {
          meta: {
            customer: 'Vimla',
            origin: 'Iteam',
            body: 'Developer and technical advisor for Vimla’s website/customer portal (.NET), REST API (nodejs) and community platform (nodebb). Integrations with SOAP APIs, Lithium and payment providers DIBS and Klarna. Moved the project over from TFS to Git and TeamCity, improving the development workflow and ability to handle branches and isolated features. Setup continuous integration workflow from GitHub to Docker Cloud. Responsible for the setup and maintenance of their linux-based servers running Docker.',
            start: 2014,
            end: 2018,
          },
          tags: [
            '.NET',
            'node',
            'legacy API:s',
            'linux',
            'Oracle DB',
            'docker swarm',
            'Klarna',
            'DIBS',
          ],
        },
      ],
      Positions: [
        {
          meta: {
            employer: 'Iteam Solutions',
            title: 'Code, DevOps and NoEstimates Mentor',
            body: 'At Iteam I started working as a system developer and focusing on .NET. During my time here we have shifted from .NET towards javascript and node. I have also grown a lot in my role; learning about DevOps culture, docker, kubernetes, UX research and mentoring.',
            start: 2013,
            end: null,
          },
          location: {
            city: 'Stockholm',
            country: 'Sweden',
          },
          tags: [
            'development',
            'devops',
            'ux',
            'mentoring',
            'agile',
            'advisory',
          ],
        },
        {
          meta: {
            employer: 'Mogul',
            title: 'System Developer',
            body: 'My time at Mogul consisted of working as a consultant for TV4, maintaining and developing their sales support system. It was a very valuable time for me where I got to polish my skills as a developer and learn a lot about .NET and SQL Server. Towards the end I also got to experience what it is like to take on the role as a tech lead, since I became responsible for enrolling new developers in the team.',
            start: 2010,
            end: 2013,
          },
          location: {
            city: 'Stockholm',
            country: 'Sweden',
          },
          tags: [
            'consulting',
            'development',
            'advisory',
            'tech lead',
          ],
        },
        {
          meta: {
            employer: 'Pdb (formerly Hitone Nordic)',
            title: 'System Developer',
            body: 'During my time at Hitone (that later became Pdb) I worked on various Business Intelligence projects, learning a lot about databases and SQL. This is also where I started learning .NET in depth and towards the end of my time at Pdb I spend most of my time writing code.',
            start: 2008,
            end: 2010,
          },
          location: {
            city: 'Stockholm',
            country: 'Sweden',
          },
          tags: [
            'development',
            'business intelligence',
          ],
        },
      ],
    };

    /* src/Tag.svelte generated by Svelte v3.19.2 */

    const file = "src/Tag.svelte";

    function create_fragment(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*tag*/ ctx[0]);
    			attr_dev(div, "class", "svelte-1ynor19");
    			add_location(div, file, 16, 0, 285);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tag*/ 1) set_data_dev(t, /*tag*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { tag } = $$props;
    	const writable_props = ["tag"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tag> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tag", $$slots, []);

    	$$self.$set = $$props => {
    		if ("tag" in $$props) $$invalidate(0, tag = $$props.tag);
    	};

    	$$self.$capture_state = () => ({ tag });

    	$$self.$inject_state = $$props => {
    		if ("tag" in $$props) $$invalidate(0, tag = $$props.tag);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tag];
    }

    class Tag extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { tag: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tag",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tag*/ ctx[0] === undefined && !("tag" in props)) {
    			console.warn("<Tag> was created without expected prop 'tag'");
    		}
    	}

    	get tag() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Assignment.svelte generated by Svelte v3.19.2 */
    const file$1 = "src/Assignment.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (9:4) {#if assignment.meta.end}
    function create_if_block(ctx) {
    	let t_value = /*assignment*/ ctx[0].meta.end + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*assignment*/ 1 && t_value !== (t_value = /*assignment*/ ctx[0].meta.end + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(9:4) {#if assignment.meta.end}",
    		ctx
    	});

    	return block;
    }

    // (24:6) {#each assignment.tags as tag}
    function create_each_block(ctx) {
    	let current;

    	const tag = new Tag({
    			props: { tag: /*tag*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tag.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tag, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tag_changes = {};
    			if (dirty & /*assignment*/ 1) tag_changes.tag = /*tag*/ ctx[1];
    			tag.$set(tag_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tag.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tag.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tag, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(24:6) {#each assignment.tags as tag}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let span0;
    	let t0_value = /*assignment*/ ctx[0].meta.start + "";
    	let t0;
    	let t1;
    	let t2;
    	let span5;
    	let span2;
    	let span1;
    	let t3_value = /*assignment*/ ctx[0].meta.customer + "";
    	let t3;
    	let t4;
    	let t5_value = /*assignment*/ ctx[0].meta.origin + "";
    	let t5;
    	let t6;
    	let t7;
    	let span3;
    	let t8_value = /*assignment*/ ctx[0].meta.body + "";
    	let t8;
    	let t9;
    	let span4;
    	let current;
    	let if_block = /*assignment*/ ctx[0].meta.end && create_if_block(ctx);
    	let each_value = /*assignment*/ ctx[0].tags;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text(" —\n    ");
    			if (if_block) if_block.c();
    			t2 = space();
    			span5 = element("span");
    			span2 = element("span");
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text(" (");
    			t5 = text(t5_value);
    			t6 = text(" consultant)");
    			t7 = space();
    			span3 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			span4 = element("span");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span0, "class", "chronology svelte-9gmz39");
    			add_location(span0, file$1, 6, 2, 104);
    			attr_dev(span1, "class", "customer svelte-9gmz39");
    			add_location(span1, file$1, 15, 6, 304);
    			attr_dev(span2, "class", "head svelte-9gmz39");
    			add_location(span2, file$1, 14, 4, 278);
    			attr_dev(span3, "class", "body svelte-9gmz39");
    			add_location(span3, file$1, 18, 4, 420);
    			add_location(span4, file$1, 22, 4, 486);
    			attr_dev(span5, "class", "information svelte-9gmz39");
    			add_location(span5, file$1, 13, 2, 247);
    			attr_dev(div, "class", "assignment svelte-9gmz39");
    			add_location(div, file$1, 5, 0, 77);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			if (if_block) if_block.m(span0, null);
    			append_dev(div, t2);
    			append_dev(div, span5);
    			append_dev(span5, span2);
    			append_dev(span2, span1);
    			append_dev(span1, t3);
    			append_dev(span2, t4);
    			append_dev(span2, t5);
    			append_dev(span2, t6);
    			append_dev(span5, t7);
    			append_dev(span5, span3);
    			append_dev(span3, t8);
    			append_dev(span5, t9);
    			append_dev(span5, span4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span4, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*assignment*/ 1) && t0_value !== (t0_value = /*assignment*/ ctx[0].meta.start + "")) set_data_dev(t0, t0_value);

    			if (/*assignment*/ ctx[0].meta.end) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(span0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*assignment*/ 1) && t3_value !== (t3_value = /*assignment*/ ctx[0].meta.customer + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*assignment*/ 1) && t5_value !== (t5_value = /*assignment*/ ctx[0].meta.origin + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*assignment*/ 1) && t8_value !== (t8_value = /*assignment*/ ctx[0].meta.body + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*assignment*/ 1) {
    				each_value = /*assignment*/ ctx[0].tags;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(span4, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
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
    	let { assignment } = $$props;
    	const writable_props = ["assignment"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Assignment> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Assignment", $$slots, []);

    	$$self.$set = $$props => {
    		if ("assignment" in $$props) $$invalidate(0, assignment = $$props.assignment);
    	};

    	$$self.$capture_state = () => ({ assignment, Tag });

    	$$self.$inject_state = $$props => {
    		if ("assignment" in $$props) $$invalidate(0, assignment = $$props.assignment);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [assignment];
    }

    class Assignment extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { assignment: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Assignment",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*assignment*/ ctx[0] === undefined && !("assignment" in props)) {
    			console.warn("<Assignment> was created without expected prop 'assignment'");
    		}
    	}

    	get assignment() {
    		throw new Error("<Assignment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set assignment(value) {
    		throw new Error("<Assignment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Position.svelte generated by Svelte v3.19.2 */
    const file$2 = "src/Position.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (9:4) {#if position.meta.end}
    function create_if_block$1(ctx) {
    	let t_value = /*position*/ ctx[0].meta.end + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*position*/ 1 && t_value !== (t_value = /*position*/ ctx[0].meta.end + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(9:4) {#if position.meta.end}",
    		ctx
    	});

    	return block;
    }

    // (25:6) {#each position.tags as tag}
    function create_each_block$1(ctx) {
    	let current;

    	const tag = new Tag({
    			props: { tag: /*tag*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tag.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tag, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tag_changes = {};
    			if (dirty & /*position*/ 1) tag_changes.tag = /*tag*/ ctx[1];
    			tag.$set(tag_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tag.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tag.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tag, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(25:6) {#each position.tags as tag}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let span0;
    	let t0_value = /*position*/ ctx[0].meta.start + "";
    	let t0;
    	let t1;
    	let t2;
    	let span6;
    	let span3;
    	let span1;
    	let t3_value = /*position*/ ctx[0].meta.title + "";
    	let t3;
    	let t4;
    	let span2;
    	let t5_value = /*position*/ ctx[0].meta.employer + "";
    	let t5;
    	let t6;
    	let span4;
    	let t7_value = /*position*/ ctx[0].meta.body + "";
    	let t7;
    	let t8;
    	let span5;
    	let current;
    	let if_block = /*position*/ ctx[0].meta.end && create_if_block$1(ctx);
    	let each_value = /*position*/ ctx[0].tags;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text(" —\n    ");
    			if (if_block) if_block.c();
    			t2 = space();
    			span6 = element("span");
    			span3 = element("span");
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text(" at\n      ");
    			span2 = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			span4 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			span5 = element("span");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span0, "class", "chronology svelte-1mh3sku");
    			add_location(span0, file$2, 6, 2, 100);
    			attr_dev(span1, "class", "title svelte-1mh3sku");
    			add_location(span1, file$2, 15, 6, 294);
    			attr_dev(span2, "class", "employer svelte-1mh3sku");
    			add_location(span2, file$2, 16, 6, 352);
    			attr_dev(span3, "class", "head svelte-1mh3sku");
    			add_location(span3, file$2, 14, 4, 268);
    			attr_dev(span4, "class", "body svelte-1mh3sku");
    			add_location(span4, file$2, 19, 4, 428);
    			add_location(span5, file$2, 23, 4, 492);
    			attr_dev(span6, "class", "information svelte-1mh3sku");
    			add_location(span6, file$2, 13, 2, 237);
    			attr_dev(div, "class", "position svelte-1mh3sku");
    			add_location(div, file$2, 5, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			if (if_block) if_block.m(span0, null);
    			append_dev(div, t2);
    			append_dev(div, span6);
    			append_dev(span6, span3);
    			append_dev(span3, span1);
    			append_dev(span1, t3);
    			append_dev(span3, t4);
    			append_dev(span3, span2);
    			append_dev(span2, t5);
    			append_dev(span6, t6);
    			append_dev(span6, span4);
    			append_dev(span4, t7);
    			append_dev(span6, t8);
    			append_dev(span6, span5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span5, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*position*/ 1) && t0_value !== (t0_value = /*position*/ ctx[0].meta.start + "")) set_data_dev(t0, t0_value);

    			if (/*position*/ ctx[0].meta.end) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(span0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*position*/ 1) && t3_value !== (t3_value = /*position*/ ctx[0].meta.title + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*position*/ 1) && t5_value !== (t5_value = /*position*/ ctx[0].meta.employer + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*position*/ 1) && t7_value !== (t7_value = /*position*/ ctx[0].meta.body + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*position*/ 1) {
    				each_value = /*position*/ ctx[0].tags;
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
    						each_blocks[i].m(span5, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
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
    	let { position } = $$props;
    	const writable_props = ["position"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Position> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Position", $$slots, []);

    	$$self.$set = $$props => {
    		if ("position" in $$props) $$invalidate(0, position = $$props.position);
    	};

    	$$self.$capture_state = () => ({ position, Tag });

    	$$self.$inject_state = $$props => {
    		if ("position" in $$props) $$invalidate(0, position = $$props.position);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [position];
    }

    class Position extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { position: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Position",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*position*/ ctx[0] === undefined && !("position" in props)) {
    			console.warn("<Position> was created without expected prop 'position'");
    		}
    	}

    	get position() {
    		throw new Error("<Position>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Position>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.2 */
    const file$3 = "src/App.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (31:2) {#each CV.Positions as position}
    function create_each_block_1(ctx) {
    	let current;

    	const position = new Position({
    			props: { position: /*position*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(position.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(position, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(position.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(position.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(position, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(31:2) {#each CV.Positions as position}",
    		ctx
    	});

    	return block;
    }

    // (37:2) {#each CV.Assignments as assignment}
    function create_each_block$2(ctx) {
    	let current;

    	const assignment = new Assignment({
    			props: { assignment: /*assignment*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(assignment.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(assignment, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(assignment.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(assignment.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(assignment, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(37:2) {#each CV.Assignments as assignment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let h30;
    	let t5;
    	let hr0;
    	let t6;
    	let t7;
    	let h31;
    	let t9;
    	let hr1;
    	let t10;
    	let t11;
    	let h32;
    	let t13;
    	let hr2;
    	let t14;
    	let p0;
    	let t15;
    	let br;
    	let t16;
    	let t17;
    	let p1;
    	let current;
    	let each_value_1 = CV.Positions;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = CV.Assignments;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "alexander czigler";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Curriculum Vitae";
    			t3 = space();
    			h30 = element("h3");
    			h30.textContent = "Positions";
    			t5 = space();
    			hr0 = element("hr");
    			t6 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			h31 = element("h3");
    			h31.textContent = "Assignments";
    			t9 = space();
    			hr1 = element("hr");
    			t10 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t11 = space();
    			h32 = element("h3");
    			h32.textContent = "Information";
    			t13 = space();
    			hr2 = element("hr");
    			t14 = space();
    			p0 = element("p");
    			t15 = text("Thank you for reading my CV!");
    			br = element("br");
    			t16 = text("\n\t\tIf you wish to get in touch with me, send me a text message on +46727145060.");
    			t17 = space();
    			p1 = element("p");
    			p1.textContent = "Hint: On most computers you can save my CV as a PDF via your regular printing dialogue.";
    			add_location(h1, file$3, 24, 2, 468);
    			add_location(h2, file$3, 25, 2, 497);
    			add_location(h30, file$3, 28, 1, 526);
    			add_location(hr0, file$3, 29, 1, 546);
    			add_location(h31, file$3, 34, 1, 637);
    			add_location(hr1, file$3, 35, 1, 659);
    			attr_dev(h32, "class", "noprint");
    			add_location(h32, file$3, 40, 1, 760);
    			attr_dev(hr2, "class", "noprint");
    			add_location(hr2, file$3, 41, 1, 798);
    			add_location(br, file$3, 43, 30, 872);
    			attr_dev(p0, "class", "noprint svelte-1ua7kva");
    			add_location(p0, file$3, 42, 1, 822);
    			attr_dev(p1, "class", "svelte-1ua7kva");
    			add_location(p1, file$3, 46, 1, 965);
    			attr_dev(main, "class", "svelte-1ua7kva");
    			add_location(main, file$3, 23, 0, 459);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h2);
    			append_dev(main, t3);
    			append_dev(main, h30);
    			append_dev(main, t5);
    			append_dev(main, hr0);
    			append_dev(main, t6);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(main, null);
    			}

    			append_dev(main, t7);
    			append_dev(main, h31);
    			append_dev(main, t9);
    			append_dev(main, hr1);
    			append_dev(main, t10);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			append_dev(main, t11);
    			append_dev(main, h32);
    			append_dev(main, t13);
    			append_dev(main, hr2);
    			append_dev(main, t14);
    			append_dev(main, p0);
    			append_dev(p0, t15);
    			append_dev(p0, br);
    			append_dev(p0, t16);
    			append_dev(main, t17);
    			append_dev(main, p1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*CV*/ 0) {
    				each_value_1 = CV.Positions;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(main, t7);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*CV*/ 0) {
    				each_value = CV.Assignments;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, t11);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
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
    	const sortDelegate = (a, b) => {
    		if (a.meta.start > b.meta.start) {
    			return -1;
    		}

    		if (a.meta.start < b.meta.start) {
    			return 1;
    		}

    		return 0;
    	};

    	// Order assignments and positions by start year.
    	CV.Assignments.sort((x, y) => sortDelegate(x, y));

    	CV.Positions.sort((x, y) => sortDelegate(x, y));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ CV, Assignment, Position, sortDelegate });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
