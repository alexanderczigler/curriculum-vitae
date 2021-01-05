
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
            customer: 'Sound-Ideas',
            origin: 'Iteam',
            body: [
              'During the years I worked with Sound-Ideas my role included maintaining and expanding the functionality of the StockMusic.com website, SQL Server database, Windows Servers and PayPal integration.',
              'The website is an increasingly important sales channel for the royalty-free music and audio effects that Sound-Ideas produce and sell.',
            ],
            start: 2013,
            end: 2018,
          },
          tags: [
            '.NET',
            'SQL Server',
            'Windows Server',
            'audio conversion',
            'ffmpeg',
            'ecommerce',
            'PayPal',
          ],
        },
        {
          meta: {
            customer: 'TRR Trygghetsrådet/Startkraft',
            origin: 'Iteam',
            body: [
              'At TRR I worked on a web based system built for helping recruiters match available jobs with job seeking clients in their database.',
              'We wrote an angular frontend and using a .NET solution for integrating with their other systems. Because of limitations in the legacy systems we also setup an ElasticSearch that we backfilled with data for faster search, this solution in combination with a d3 graph proved to be a solution used by the client for years after the rest of the system was replaced.',
            ],
            start: 2013,
            end: 2015,
          },
          tags: ['.NET', 'ElasticSearch', 'AngularJS', 'd3.js'],
        },
        {
          meta: {
            customer: 'Urban Girls Movement',
            origin: 'Iteam',
            body: [
              'Urban Girls Movement ran a project where they let girls remodel their neighbourhood, Fittja Centrum, to make it feel nicer and safer.',
              'I helped export their Minecraft model of the neighbourhood so that it could be embedded on the web (via Sketchfab) and for 3D printing. The exports were used for their exhibit in 2019.',
            ],
            start: 2019,
            end: 2019,
          },
          tags: ['Minecraft', 'Sketchfab', '3D printing'],
        },
        {
          meta: {
            customer: 'Refugee Tech',
            origin: 'Volunteer',
            body: [
              'Starting at a hackathon that Refugee Tech held me and a few coworkers created “Competency”. The idea of the project is to map the competencies of refugees on their way to or already living in Sweden. The data is meant to be used to show meda, politicians and the Swedish population that refugees have a lot of competence and talent that Sweden should utilize. In conjunction with a job search engine it can also be used to match individuals with available jobs and employers looking for talent. Thanks to the efforts of me and the team, Competency later evolved into JobSkills - jobskills.se',
            ],
            start: 2016,
            end: 2017,
          },
          tags: ['.NET', 'ElasticSearch', 'AngularJS'],
        },
        {
          meta: {
            customer: '(Various)',
            origin: 'Freelance',
            body: [
              'During these years I worked on various small projects, some free and some paid. I learned the basics of writing html and designing for the web and I learned a lot about networking and setting up different types of servers under linux, freebsd and Windows.',
              'In most of the paid projects I designed simple websites and delivered the necessary html and css to the customer so they could fill it with content and deploy it. For some projects I also wrote some php code and integrated with MySQL.',
            ],
            start: 2003,
            end: 2010,
          },
          tags: [
            'freebsd',
            'linux',
            'windows server',
            'apache',
            'nginx',
            'ircd',
            'jabberd',
            'ftpd',
            'web design',
            'php',
            'mysql',
          ],
        },
        {
          meta: {
            customer: 'Getinge',
            origin: 'Pdb',
            body: [
              'At Getinge I worked on a system for managing after market prices on their spare parts. I helped develop and maintain this system and in addition to that I also worked with DataSet Vision to visualise data and trends from data in their Lawson M3.',
              'The solutions I worked on helps them make better decisions, such as knowing which spare parts they can sell for a profit and which ones are readily available from competitors.',
            ],
            start: 2008,
            end: 2010,
          },
          tags: ['.NET', 'Lawson M3', 'DataSet Vision'],
        },
        {
          meta: {
            customer: 'Atlas Copco',
            origin: 'Pdb',
            body: [
              'At Atlas Copco I development various small BI applications using DataSet Vision, SQL Server and some lighter .NET code.',
              'The solutions I worked on helps Atlas Copco make better decisions by visualising trends in their own data.',
            ],
            start: 2008,
            end: 2010,
          },
          tags: ['DataSet Vision', 'SQL Server', 'Lawson M3'],
        },
        {
          meta: {
            customer: 'Panasonic Europe',
            origin: 'Pdb',
            body: [
              "I was part of a team responsible for maintenance of Pansonic's European B2B webshops. The code we worked on was built with .NET and the system integrated with SAP that owned all the product and price data.",
              "The B2B webshops were used by several large-scale retailers around Europe and a large chunk of Panasonic's yearly profits run through them.",
            ],
            start: 2009,
            end: 2010,
          },
          tags: ['.NET', 'ecommerce', 'SAP'],
        },
        {
          meta: {
            customer: 'Panasonic Nordic',
            origin: 'Pdb',
            body: [
              'At Panasonic Nordic I was part of a team that built a tool used for sales budgeting and forecasting. The system helps Panasonic Nordic analyse sales and make predictions in order to optimise warehousing and distribution of their products.',
            ],
            start: 2009,
            end: 2010,
          },
          tags: ['.NET', 'SQL Server'],
        },
        {
          meta: {
            customer: 'Dovado',
            origin: 'Pdb',
            body: [
              'When 3G was a new thing, Dovado were very early offering a network router that supported USB modems. This router enabled customers to connect several computers and devices to a Wi-Fi that in turn shared a single 3G internet connection.',
              'During my time at Dovado I helped them study how different 3G USB dongles behaved when connected to their router. I wrote and optimised the scripts that would detect specific dongles and make them switch to modem mode and connect to the internet.',
              'This project was super fun and I learned a lot about linux, embedded linux and shell scripting.',
            ],
            start: 2008,
            end: 2008,
          },
          tags: ['linux', 'embedded', 'shell', 'ash', 'busybox', 'usb', '3g'],
        },
        {
          meta: {
            customer: 'TV4 Gruppen',
            origin: 'Mogul',
            body: [
              'I was part of a team repsonsible for development and maintenance of TV4\'s sales support system "L4".',
              'This system is used by the entire sales force of TV4, with users all over Sweden. It handles the sales, budgeting and forecasting of advertisement sales for all of their channels.',
            ],
            start: 2010,
            end: 2013,
          },
          tags: ['.NET', 'SQL Server', 'CI'],
        },
        {
          meta: {
            customer: 'JobTech',
            origin: 'Iteam',
            body: [
              'Implementation of CI/CD pipelines, automatic builds, automatic testing etc. for the JobTech MyData project.',
            ],
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
            body: [
              'Architecture and development of a REST API from scratch. The API serves as backend to V3VO’s apps/web applications and holds customer data, business logic and JWT-validation. The solution is orchestrated using kubernetes where the API, PostgreSQL and web applications are run and monitored. User authentication is done using Auth0 (JWKS).',
            ],
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
            body: [
              'As a UX Researcher at TRR Trygghetsrådet I have been helping them to understand their role in the Swedish job market and how to maximize their impact. I was a part of a team that worked on developing a new customer portal and my role was to gain understanding and important insights from their customers.',
              'My work included acting as a bridge between the core organisation and the developers in our team. I planned and conducted interviews with HR personnel in various small and large organisations around Sweden. After the interviews I aggregated the findings and presented them to my team and stakeholders.',
              'I also assisted in facilitating workshops such as design sprints and user story mapping.',
            ],
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
            body: [
              'Design, research and development of a new web-based system for workshops repairing cars and billing insurance companies. The challenges of this project include supporting all legal requirements of GDPR, bookkeeping law and building a system with the end user in focus.',
            ],
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
            body: [
              'Technical Advisor & Agile Coach. Working as part of one of SEB’s development teams to learn and teach alongside with their developers and help them overcome organisational obstacles and adopt better ways of working with system development. Working with a cross team implementing Docker Enterprise with Docker for Windows nodes. SEB was one of the first customers to run docker on Windows Server at their scale.',
            ],
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
            body: [
              'Technical advisor working closely with two of Uppdragshuset’s senior developers in their initiative to adopt Docker and radically change their development flow.',
            ],
            start: 2015,
            end: 2016,
          },
          tags: ['docker', 'docker cloud'],
        },
        {
          meta: {
            customer: 'Taxi Stockholm AB',
            origin: 'Iteam',
            body: [
              'Played a role in the creation and setup of TSAB’s cloud orchestrated Docker environment with Docker cloud and Microsoft Azure. Development of data mining and market automation applications using node.js to process and transfer data from MySQL and Oracle DB to no-sql databases (RethinkDB and ElasticSearch). Development of a RESTful API in node.js, integrations with SOAP API:s, Oracle DB and RPC backends.',
            ],
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
            body: [
              'Developer and technical advisor for Vimla’s website/customer portal (.NET), REST API (nodejs) and community platform (nodebb). Integrations with SOAP APIs, Lithium and payment providers DIBS and Klarna. Moved the project over from TFS to Git and TeamCity, improving the development workflow and ability to handle branches and isolated features. Setup continuous integration workflow from GitHub to Docker Cloud. Responsible for the setup and maintenance of their linux-based servers running Docker.',
            ],
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
      Links: [
        {
          url: 'https://github.com/alexanderczigler',
          title: 'GitHub Profile',
          type: 'presence',
        },
        {
          url: 'https://iteam.se/medarbetare/acr',
          title: 'Iteam Solutions',
          type: 'presence',
        },
        {
          url:
            'https://www.goodreads.com/review/list/53571813-alexander?shelf=read',
          title: 'Goodreads',
          type: 'presence',
        },
        {
          url:
            'http://www.ahousestockholm.com/ai-billgren-talk-with-christian-landgren/',
          title: 'AI-Billgren',
          type: 'mention',
        },
        {
          url: 'https://egendata.se/om-oss/',
          title: 'Egendata',
          type: 'mention',
        },
      ],
      Positions: [
        {
          meta: {
            employer: 'Iteam Solutions',
            title: 'Code, DevOps and NoEstimates Mentor',
            body: [
              'At Iteam I started working as a system developer and focusing on .NET. During my time here we have shifted from .NET towards javascript and node. I have also grown a lot in my role; learning about DevOps culture, docker, kubernetes, UX research and mentoring.',
            ],
            start: 2013,
            end: null,
          },
          location: {
            city: 'Stockholm',
            country: 'Sweden',
          },
          tags: ['development', 'devops', 'ux', 'mentoring', 'agile', 'advisory'],
        },
        {
          meta: {
            employer: 'Mogul',
            title: 'System Developer',
            body: [
              'My time at Mogul consisted of working as a consultant for TV4, maintaining and developing their sales support system. It was a very valuable time for me where I got to polish my skills as a developer and learn a lot about .NET and SQL Server. Towards the end I also got to experience what it is like to take on the role as a tech lead, since I became responsible for enrolling new developers in the team.',
            ],
            start: 2010,
            end: 2013,
          },
          location: {
            city: 'Stockholm',
            country: 'Sweden',
          },
          tags: ['consulting', 'development', 'advisory', 'tech lead'],
        },
        {
          meta: {
            employer: 'Pdb (formerly Hitone Nordic)',
            title: 'System Developer',
            body: [
              'During my time at Hitone (that later became Pdb) I worked on various Business Intelligence projects, learning a lot about databases and SQL. This is also where I started learning .NET in depth and towards the end of my time at Pdb I spend most of my time writing code.',
            ],
            start: 2008,
            end: 2010,
          },
          location: {
            city: 'Stockholm',
            country: 'Sweden',
          },
          tags: ['development', 'business intelligence'],
        },

        {
          meta: {
            employer: 'Freelance',
            title: 'Developer/Tech',
            body: [
              'From the time I was in high school and until around 2010 I did various gigs ranging from web design to server setup and hosting. This is a time when I learned a lot about linux/unix and networking. Some of the gigs I did consisted of web design and lighter php development.',
            ],
            start: 2003,
            end: 2010,
          },
          location: {
            city: 'Stockholm',
            country: 'Sweden',
          },
          tags: ['linux', 'freebsd', 'networking', 'web design'],
        },
      ],
    };

    /* src/components/Tag.svelte generated by Svelte v3.19.2 */

    const file = "src/components/Tag.svelte";

    function create_fragment(ctx) {
    	let div;
    	let i;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t0 = space();
    			t1 = text(/*tag*/ ctx[0]);
    			attr_dev(i, "class", "fa fa-tag svelte-1y1ws7y");
    			add_location(i, file, 23, 2, 360);
    			attr_dev(div, "class", "svelte-1y1ws7y");
    			add_location(div, file, 22, 0, 352);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tag*/ 1) set_data_dev(t1, /*tag*/ ctx[0]);
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

    /* src/components/Assignment.svelte generated by Svelte v3.19.2 */
    const file$1 = "src/components/Assignment.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (60:4) {#if assignment.meta.end}
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
    		source: "(60:4) {#if assignment.meta.end}",
    		ctx
    	});

    	return block;
    }

    // (69:4) {#each assignment.meta.body as text}
    function create_each_block_1(ctx) {
    	let span;
    	let t_value = /*text*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "body svelte-k63rhc");
    			add_location(span, file$1, 69, 6, 1201);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*assignment*/ 1 && t_value !== (t_value = /*text*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(69:4) {#each assignment.meta.body as text}",
    		ctx
    	});

    	return block;
    }

    // (74:6) {#each assignment.tags as tag}
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
    		source: "(74:6) {#each assignment.tags as tag}",
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
    	let span4;
    	let span2;
    	let span1;
    	let t3_value = /*assignment*/ ctx[0].meta.customer + "";
    	let t3;
    	let t4;
    	let t5_value = /*assignment*/ ctx[0].meta.origin + "";
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let span3;
    	let current;
    	let if_block = /*assignment*/ ctx[0].meta.end && create_if_block(ctx);
    	let each_value_1 = /*assignment*/ ctx[0].meta.body;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

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
    			span4 = element("span");
    			span2 = element("span");
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text("\n      (");
    			t5 = text(t5_value);
    			t6 = text(" consultant)");
    			t7 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t8 = space();
    			span3 = element("span");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span0, "class", "time svelte-k63rhc");
    			add_location(span0, file$1, 57, 2, 858);
    			attr_dev(span1, "class", "customer svelte-k63rhc");
    			add_location(span1, file$1, 64, 6, 1040);
    			attr_dev(span2, "class", "head svelte-k63rhc");
    			add_location(span2, file$1, 63, 4, 1014);
    			attr_dev(span3, "class", "web");
    			add_location(span3, file$1, 72, 4, 1251);
    			attr_dev(span4, "class", "information svelte-k63rhc");
    			add_location(span4, file$1, 62, 2, 983);
    			attr_dev(div, "class", "assignment svelte-k63rhc");
    			add_location(div, file$1, 56, 0, 831);
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
    			append_dev(div, span4);
    			append_dev(span4, span2);
    			append_dev(span2, span1);
    			append_dev(span1, t3);
    			append_dev(span2, t4);
    			append_dev(span2, t5);
    			append_dev(span2, t6);
    			append_dev(span4, t7);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(span4, null);
    			}

    			append_dev(span4, t8);
    			append_dev(span4, span3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span3, null);
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

    			if (dirty & /*assignment*/ 1) {
    				each_value_1 = /*assignment*/ ctx[0].meta.body;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(span4, t8);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

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
    						each_blocks[i].m(span3, null);
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
    			destroy_each(each_blocks_1, detaching);
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

    /* src/components/Position.svelte generated by Svelte v3.19.2 */
    const file$2 = "src/components/Position.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (61:4) {#if position.meta.end}
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
    		source: "(61:4) {#if position.meta.end}",
    		ctx
    	});

    	return block;
    }

    // (71:4) {#each position.meta.body as text}
    function create_each_block_1$1(ctx) {
    	let span;
    	let t_value = /*text*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "body svelte-1imxrf3");
    			add_location(span, file$2, 71, 6, 1219);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*position*/ 1 && t_value !== (t_value = /*text*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(71:4) {#each position.meta.body as text}",
    		ctx
    	});

    	return block;
    }

    // (76:6) {#each position.tags as tag}
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
    		source: "(76:6) {#each position.tags as tag}",
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
    	let span5;
    	let span3;
    	let span1;
    	let t3_value = /*position*/ ctx[0].meta.title + "";
    	let t3;
    	let t4;
    	let span2;
    	let t5_value = /*position*/ ctx[0].meta.employer + "";
    	let t5;
    	let t6;
    	let t7;
    	let span4;
    	let current;
    	let if_block = /*position*/ ctx[0].meta.end && create_if_block$1(ctx);
    	let each_value_1 = /*position*/ ctx[0].meta.body;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

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
    			span5 = element("span");
    			span3 = element("span");
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text("\n      at\n      ");
    			span2 = element("span");
    			t5 = text(t5_value);
    			t6 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			span4 = element("span");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span0, "class", "time svelte-1imxrf3");
    			add_location(span0, file$2, 58, 2, 866);
    			attr_dev(span1, "class", "title svelte-1imxrf3");
    			add_location(span1, file$2, 65, 6, 1042);
    			attr_dev(span2, "class", "employer svelte-1imxrf3");
    			add_location(span2, file$2, 67, 6, 1106);
    			attr_dev(span3, "class", "head svelte-1imxrf3");
    			add_location(span3, file$2, 64, 4, 1016);
    			attr_dev(span4, "class", "web");
    			add_location(span4, file$2, 74, 4, 1269);
    			attr_dev(span5, "class", "information svelte-1imxrf3");
    			add_location(span5, file$2, 63, 2, 985);
    			attr_dev(div, "class", "position svelte-1imxrf3");
    			add_location(div, file$2, 57, 0, 841);
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
    			append_dev(span5, span3);
    			append_dev(span3, span1);
    			append_dev(span1, t3);
    			append_dev(span3, t4);
    			append_dev(span3, span2);
    			append_dev(span2, t5);
    			append_dev(span5, t6);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(span5, null);
    			}

    			append_dev(span5, t7);
    			append_dev(span5, span4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span4, null);
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

    			if (dirty & /*position*/ 1) {
    				each_value_1 = /*position*/ ctx[0].meta.body;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(span5, t7);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

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
    			destroy_each(each_blocks_1, detaching);
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

    /* src/CV.svelte generated by Svelte v3.19.2 */
    const file$3 = "src/CV.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (70:2) {#each CV.Positions as position}
    function create_each_block_1$2(ctx) {
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
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(70:2) {#each CV.Positions as position}",
    		ctx
    	});

    	return block;
    }

    // (75:2) {#each CV.Assignments as assignment}
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
    		source: "(75:2) {#each CV.Assignments as assignment}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let h30;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let ol;
    	let li0;
    	let t9;
    	let li1;
    	let t11;
    	let p3;
    	let t12;
    	let a0;
    	let i0;
    	let t13;
    	let t14;
    	let a1;
    	let i1;
    	let t15;
    	let t16;
    	let h40;
    	let t18;
    	let t19;
    	let h41;
    	let t21;
    	let t22;
    	let h31;
    	let t24;
    	let p4;
    	let t26;
    	let p5;
    	let current;
    	let each_value_1 = CV.Positions;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
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
    			div = element("div");
    			h30 = element("h3");
    			h30.textContent = "Curriculum Vitae";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "My career is characterized by diversity and learning. I have had the\n    opportunity to work on several different projects taking on different roles\n    in many of them. Each one has taught me something valuable and I have met a\n    lot of intelligent and inspiring people along the way.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Some of my current goals in life include learning more about mentoring,\n    group psychology and interview technique. From my experience, in order for\n    an IT project to succeed, team members need to have empathy and experience\n    connectedness with each other as well as the end users of their product.\n    This is the reason why I love to keep writing code while also being\n    passionate about learning about the key to creating successful teams,\n    sharing knowledge and understanding users.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "To sum up, I have two firm beliefs about software development:";
    			t7 = space();
    			ol = element("ol");
    			li0 = element("li");
    			li0.textContent = "The best code is written by developers who empathize with the end user.";
    			t9 = space();
    			li1 = element("li");
    			li1.textContent = "Complex problems are best solved by developers who master cooperation and\n      the sharing of knowledge.";
    			t11 = space();
    			p3 = element("p");
    			t12 = text("You can find some of my work on\n    ");
    			a0 = element("a");
    			i0 = element("i");
    			t13 = text("\n      GitHub");
    			t14 = text("\n    and\n    ");
    			a1 = element("a");
    			i1 = element("i");
    			t15 = text("\n      Docker Hub");
    			t16 = space();
    			h40 = element("h4");
    			h40.textContent = "Positions";
    			t18 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t19 = space();
    			h41 = element("h4");
    			h41.textContent = "Projects";
    			t21 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t22 = space();
    			h31 = element("h3");
    			h31.textContent = "Other information";
    			t24 = space();
    			p4 = element("p");
    			p4.textContent = "I am a Swedish citizen and my native tounge is Swedish. I may be available\n    for consultancy assignments. If you wish to get in touch with me, I prefer\n    if you send me a text message on +46727145060.";
    			t26 = space();
    			p5 = element("p");
    			p5.textContent = "Hint: I have added a print css so that you can save my CV as a neat PDF (or\n    print it) via your regular printing dialogue.";
    			add_location(h30, file$3, 26, 2, 562);
    			add_location(p0, file$3, 27, 2, 590);
    			add_location(p1, file$3, 33, 2, 895);
    			add_location(p2, file$3, 43, 2, 1413);
    			add_location(li0, file$3, 46, 4, 1495);
    			add_location(li1, file$3, 49, 4, 1592);
    			add_location(ol, file$3, 44, 2, 1485);
    			attr_dev(i0, "class", "fa fa-github");
    			add_location(i0, file$3, 58, 6, 1855);
    			attr_dev(a0, "href", "https://github.com/alexanderczigler");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$3, 57, 4, 1786);
    			attr_dev(i1, "class", "fab fa-docker");
    			add_location(i1, file$3, 63, 6, 1983);
    			attr_dev(a1, "href", "https://hub.docker.com/u/aczigler");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$3, 62, 4, 1916);
    			attr_dev(p3, "class", "web");
    			add_location(p3, file$3, 55, 2, 1730);
    			add_location(h40, file$3, 68, 2, 2047);
    			add_location(h41, file$3, 73, 2, 2142);
    			add_location(h31, file$3, 78, 2, 2244);
    			add_location(p4, file$3, 79, 2, 2273);
    			attr_dev(p5, "class", "web");
    			add_location(p5, file$3, 84, 2, 2495);
    			attr_dev(div, "class", "section body");
    			add_location(div, file$3, 25, 0, 533);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h30);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(div, t5);
    			append_dev(div, p2);
    			append_dev(div, t7);
    			append_dev(div, ol);
    			append_dev(ol, li0);
    			append_dev(ol, t9);
    			append_dev(ol, li1);
    			append_dev(div, t11);
    			append_dev(div, p3);
    			append_dev(p3, t12);
    			append_dev(p3, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t13);
    			append_dev(p3, t14);
    			append_dev(p3, a1);
    			append_dev(a1, i1);
    			append_dev(a1, t15);
    			append_dev(div, t16);
    			append_dev(div, h40);
    			append_dev(div, t18);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div, null);
    			}

    			append_dev(div, t19);
    			append_dev(div, h41);
    			append_dev(div, t21);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t22);
    			append_dev(div, h31);
    			append_dev(div, t24);
    			append_dev(div, p4);
    			append_dev(div, t26);
    			append_dev(div, p5);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*CV*/ 0) {
    				each_value_1 = CV.Positions;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div, t19);
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
    						each_blocks[i].m(div, t22);
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
    			if (detaching) detach_dev(div);
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
    		let aa = a.meta.start + (a.meta.end - a.meta.start) / 10;
    		let bb = b.meta.start + (b.meta.end - b.meta.start) / 10;

    		if (aa > bb) {
    			return -1;
    		}

    		if (aa < bb) {
    			return 1;
    		}

    		return 0;
    	};

    	// Order assignments and positions by start year.
    	CV.Assignments.sort((x, y) => sortDelegate(x, y));

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CV> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CV", $$slots, []);
    	$$self.$capture_state = () => ({ CV, Assignment, Position, sortDelegate });
    	return [];
    }

    class CV_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CV_1",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Header.svelte generated by Svelte v3.19.2 */

    const file$4 = "src/Header.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let span1;
    	let h1;
    	let t2;
    	let h2;
    	let t3;
    	let span0;
    	let t5;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			span1 = element("span");
    			h1 = element("h1");
    			h1.textContent = "Alexander M. Czigler";
    			t2 = space();
    			h2 = element("h2");
    			t3 = text("Working with Code, Culture and UX at\n      ");
    			span0 = element("span");
    			span0.textContent = "at";
    			t5 = text("\n      Iteam Solutions");
    			if (img.src !== (img_src_value = "avatar-512.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Alexander");
    			attr_dev(img, "class", "svelte-zwjni6");
    			add_location(img, file$4, 65, 2, 904);
    			attr_dev(h1, "class", "svelte-zwjni6");
    			add_location(h1, file$4, 67, 4, 962);
    			attr_dev(span0, "class", "weak svelte-zwjni6");
    			add_location(span0, file$4, 70, 6, 1050);
    			attr_dev(h2, "class", "svelte-zwjni6");
    			add_location(h2, file$4, 68, 4, 996);
    			attr_dev(span1, "class", "svelte-zwjni6");
    			add_location(span1, file$4, 66, 2, 951);
    			attr_dev(div, "class", "section svelte-zwjni6");
    			add_location(div, file$4, 64, 0, 880);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(span1, h1);
    			append_dev(span1, t2);
    			append_dev(span1, h2);
    			append_dev(h2, t3);
    			append_dev(h2, span0);
    			append_dev(h2, t5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$4($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Footer.svelte generated by Svelte v3.19.2 */

    const file$5 = "src/Footer.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let hr;
    	let t0;
    	let p0;
    	let t1;
    	let a0;
    	let i0;
    	let t2;
    	let a1;
    	let i1;
    	let t3;
    	let a2;
    	let i2;
    	let t4;
    	let a3;
    	let i3;
    	let t5;
    	let a4;
    	let i4;
    	let t6;
    	let p1;
    	let a5;
    	let i5;
    	let t7;

    	const block = {
    		c: function create() {
    			div = element("div");
    			hr = element("hr");
    			t0 = space();
    			p0 = element("p");
    			t1 = text("Alexander Matthias Czigler 2021 |\n    ");
    			a0 = element("a");
    			i0 = element("i");
    			t2 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t3 = space();
    			a2 = element("a");
    			i2 = element("i");
    			t4 = space();
    			a3 = element("a");
    			i3 = element("i");
    			t5 = space();
    			a4 = element("a");
    			i4 = element("i");
    			t6 = space();
    			p1 = element("p");
    			a5 = element("a");
    			i5 = element("i");
    			t7 = text("\n      Source Code");
    			attr_dev(hr, "class", "svelte-1euadoy");
    			add_location(hr, file$5, 9, 2, 132);
    			attr_dev(i0, "class", "fa fa-github");
    			add_location(i0, file$5, 13, 6, 256);
    			attr_dev(a0, "href", "https://github.com/alexanderczigler");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$5, 12, 4, 187);
    			attr_dev(i1, "class", "fa fa-book");
    			add_location(i1, file$5, 18, 6, 404);
    			attr_dev(a1, "href", "https://www.goodreads.com/user/show/53571813-alexander-czigler");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$5, 15, 4, 296);
    			attr_dev(i2, "class", "fab fa-docker");
    			add_location(i2, file$5, 21, 6, 509);
    			attr_dev(a2, "href", "https://hub.docker.com/u/aczigler");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$5, 20, 4, 442);
    			attr_dev(i3, "class", "fa fa-medium");
    			add_location(i3, file$5, 24, 6, 620);
    			attr_dev(a3, "href", "https://medium.com/@alexanderczigler");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$5, 23, 4, 550);
    			attr_dev(i4, "class", "fa fa-stopwatch");
    			add_location(i4, file$5, 27, 6, 734);
    			attr_dev(a4, "href", "https://www.strava.com/athletes/60476104");
    			attr_dev(a4, "target", "_blank");
    			add_location(a4, file$5, 26, 4, 660);
    			add_location(p0, file$5, 10, 2, 141);
    			attr_dev(i5, "class", "fa fa-github");
    			add_location(i5, file$5, 34, 6, 888);
    			attr_dev(a5, "href", "https://github.com/alexanderczigler/curriculum-vitae");
    			attr_dev(a5, "target", "_blank");
    			add_location(a5, file$5, 31, 4, 790);
    			add_location(p1, file$5, 30, 2, 782);
    			attr_dev(div, "class", "section body web");
    			add_location(div, file$5, 8, 0, 99);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, hr);
    			append_dev(div, t0);
    			append_dev(div, p0);
    			append_dev(p0, t1);
    			append_dev(p0, a0);
    			append_dev(a0, i0);
    			append_dev(p0, t2);
    			append_dev(p0, a1);
    			append_dev(a1, i1);
    			append_dev(p0, t3);
    			append_dev(p0, a2);
    			append_dev(a2, i2);
    			append_dev(p0, t4);
    			append_dev(p0, a3);
    			append_dev(a3, i3);
    			append_dev(p0, t5);
    			append_dev(p0, a4);
    			append_dev(a4, i4);
    			append_dev(div, t6);
    			append_dev(div, p1);
    			append_dev(p1, a5);
    			append_dev(a5, i5);
    			append_dev(a5, t7);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$5($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Introduction.svelte generated by Svelte v3.19.2 */

    const file$6 = "src/Introduction.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let p0;
    	let t3;
    	let h4;
    	let t5;
    	let p1;
    	let t7;
    	let p2;
    	let t8;
    	let a0;
    	let i0;
    	let t9;
    	let t10;
    	let a1;
    	let i1;
    	let t11;
    	let t12;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Hello!";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "My name is Alexander and I live in Stockholm, Sweden. I work as an IT\n    consultant mainly focusing on agile development and agile\n    coaching/mentoring.";
    			t3 = space();
    			h4 = element("h4");
    			h4.textContent = "About me";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "Whenever I am not sitting in front of a computer I love spending time\n    outdoors, either exploring the city or hiking along one of the many\n    beautiful trails outside of Stockholm. I also love exercising\n    (poledance/running/yoga) and reading books.";
    			t7 = space();
    			p2 = element("p");
    			t8 = text("You can find me on\n    ");
    			a0 = element("a");
    			i0 = element("i");
    			t9 = text("\n      Goodreads");
    			t10 = text("\n    and\n    ");
    			a1 = element("a");
    			i1 = element("i");
    			t11 = text("\n      Strava");
    			t12 = text("\n    .");
    			add_location(h3, file$6, 1, 2, 29);
    			add_location(p0, file$6, 2, 2, 47);
    			add_location(h4, file$6, 8, 2, 221);
    			add_location(p1, file$6, 9, 2, 241);
    			attr_dev(i0, "class", "fa fa-book");
    			add_location(i0, file$6, 20, 6, 665);
    			attr_dev(a0, "href", "https://www.goodreads.com/user/show/53571813-alexander-czigler");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$6, 17, 4, 557);
    			attr_dev(i1, "class", "fa fa-stopwatch");
    			add_location(i1, file$6, 25, 6, 801);
    			attr_dev(a1, "href", "https://www.strava.com/athletes/60476104");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$6, 24, 4, 727);
    			attr_dev(p2, "class", "web");
    			add_location(p2, file$6, 15, 2, 514);
    			attr_dev(div, "class", "section body");
    			add_location(div, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(div, t3);
    			append_dev(div, h4);
    			append_dev(div, t5);
    			append_dev(div, p1);
    			append_dev(div, t7);
    			append_dev(div, p2);
    			append_dev(p2, t8);
    			append_dev(p2, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t9);
    			append_dev(p2, t10);
    			append_dev(p2, a1);
    			append_dev(a1, i1);
    			append_dev(a1, t11);
    			append_dev(p2, t12);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$6($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Introduction> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Introduction", $$slots, []);
    	return [];
    }

    class Introduction extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Introduction",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.2 */
    const file$7 = "src/App.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	const header = new Header({ $$inline: true });
    	const introduction = new Introduction({ $$inline: true });
    	const cv = new CV_1({ $$inline: true });
    	const footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(introduction.$$.fragment);
    			t1 = space();
    			create_component(cv.$$.fragment);
    			t2 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(main, "class", "svelte-pjklqb");
    			add_location(main, file$7, 23, 0, 467);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t0);
    			mount_component(introduction, main, null);
    			append_dev(main, t1);
    			mount_component(cv, main, null);
    			append_dev(main, t2);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(introduction.$$.fragment, local);
    			transition_in(cv.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(introduction.$$.fragment, local);
    			transition_out(cv.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(introduction);
    			destroy_component(cv);
    			destroy_component(footer);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ CV: CV_1, Header, Footer, Introduction });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
