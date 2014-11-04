;(function (root, document, $, undefined) {
	'use strict';
	
	var library,
		default_theme_settings,
		current_time,
		last_time;
	
	library = {
		'version': '0.1.0',
		'is_mobile': navigator.userAgent.match(/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i),
		'fullscreen': {
			'vendor': undefined,
			'supported': false,
			'enabled': undefined,
			'element': undefined,
			'request': undefined,
			'exit': undefined
		},
		'animation': {
			'vendor': undefined,
			'request': undefined,
			'cancel': undefined,
			'start_time': (root.Date.now || new root.Date().getTime)(),
			'now': function () { return (root.Date.now || new root.Date().getTime)() - library.animation.start_time; }
		},
		'util': {
			'polyfill': undefined,
			'fragmentStringToHTMLDocument': undefined,
			'startsWith': undefined,
			'endsWith': undefined,
			'indexOfMatch': undefined,
			'getAbsolutePath': undefined,
			'epochToClock': undefined
		},
		'$$': {
			'body': $('body'),
			'document': $(document)
		},
		'tick': undefined,
		'tick_id': undefined,
		'zoetropes': []
	};
	
	default_theme_settings = {
		'volume_steps': 4,
		'timeline_start': 'left',
		'timeline_dimension': 'width',
		'volume_start': 'bottom',
		'volume_dimension': 'height',
		'window_flag_cursor': 1000,
		'fullscreen_flag_cursor': 2500,
		'zoetrope_template':
			'<div class="zoetrope">' +
				'<div class="container">' +
					'<div class="poster">' +
						'<div class="play-button"></div>' +
						'<div class="throbber"></div>' +
					'</div>' +
					'<media></media>' +
					'<div class="controls">' +
						'<div class="playback-toggle"></div>' +
						'<div class="time"></div>' +
						'<div class="timeline">' +
							'<div class="played"></div>' +
							'<div class="buffered"></div>' +
						'</div>' +
						'<div class="quality-toggle"></div>' +
						'<div class="mute-toggle"></div<' +
						'<div class="volume">' +
							'<div class="level"></div>' +
						'</div>' +
						'<div class="fullscreen-toggle"></div>' +
					'</div>' +
				'</div>' +
			'</div>'
	};
	
	library.util.polyfill = function () {
		var fullscreen_vendors,
			vendor,
			animation_vendors;
		
		// *sigh*
		fullscreen_vendors = {
			'w3c': {
				'enabled': 'fullscreenEnabled',
				'element': 'fullscreenElement',
				'request': 'requestFullscreen',
				'exit': 'exitFullscreen',
				'change': 'fullscreenchange',
				'error': 'fullscreenerror'
			},
			'webkit': {
				'enabled': 'webkitFullscreenEnabled',
				'element': 'webkitFullscreenElement',
				'request': 'webkitRequestFullscreen',
				'exit': 'webkitCancelFullScreen',
				'change': 'webkitfullscreenchange',
				'error': 'webkitfullscreenerror'
			},
			'moz': {
				'enabled': 'mozFullScreen',
				'element': 'mozFullScreenElement',
				'request': 'mozRequestFullScreen',
				'exit': 'mozCancelFullScreen',
				'change': 'mozfullscreenchange',
				'error': 'mozfullscreenerror'
			},
			'ms': {
				'enabled': 'msFullscreenEnabled',
				'element': 'msFullscreenElement',
				'request': 'msRequestFullscreen',
				'exit': 'msExitFullscreen',
				'change': 'MSFullscreenChange',
				'error': 'MSFullscreenError'
			}
		};
		
		for (vendor in fullscreen_vendors) {
			if (fullscreen_vendors[vendor].enabled in document) {
				library.fullscreen.vendor = vendor;
				library.fullscreen.supported = true;
				
				break;
			}
		}
		
		// Yeah, it's kinda the norm to monkeypatch, but...ugh.
		if (library.fullscreen.supported) {
			library.fullscreen.request = function (element) { return element[fullscreen_vendors[library.fullscreen.vendor].request].apply(element); };
			library.fullscreen.exit = document[fullscreen_vendors[library.fullscreen.vendor].exit].bind(document);
			
			library.$$.document.on(fullscreen_vendors[library.fullscreen.vendor].change, function (event) {
				library.fullscreen.enabled = document[fullscreen_vendors[library.fullscreen.vendor].enabled];
				library.fullscreen.element = document[fullscreen_vendors[library.fullscreen.vendor].element];
				
				event.type = 'zoetropefullscreenchange';
				$(event.target).trigger($.Event('zoetropefullscreenchange', event));
			});
			
			library.$$.document.on(fullscreen_vendors[library.fullscreen.vendor].error, function (event) {
				event.type = 'zoetropefullscreenerror';
				$(event.target).trigger($.Event('zoetropefullscreenerror', event));
			});
			
			library.fullscreen.enabled = document[fullscreen_vendors[library.fullscreen.vendor].enabled];
			library.fullscreen.element = document[fullscreen_vendors[library.fullscreen.vendor].element];
		}
		
		// Polyfill adapted from Erik Möller, et al:
		// https://gist.github.com/paulirish/1579671
		// (Additionally, Jesus Christ, guys: it's a wonder the web works
		// *at all*.)
		animation_vendors = {
			'w3c': {
				'request': 'requestAnimationFrame',
				'cancel': 'cancelAnimationFrame'
			},
			'webkit': {
				'request': 'webkitRequestAnimationFrame',
				'cancel': 'webkitCancelAnimationFrame'
			},
			'moz': {
				'request': 'mozRequestAnimationFrame',
				'cancel': 'mozCancelRequestAnimationFrame'
			}
		};
		
		for (vendor in animation_vendors) {
			if (animation_vendors[vendor].request in root) {
				library.animation.vendor = vendor;
				
				break;
			}
		}
		
		if (library.animation.vendor) {
			// requestAnimationFrame supported.
			if (root.performance && root.performance.now) {
				// performance.now() supported.
				library.animation.request = root[animation_vendors[library.animation.vendor].request].bind(root);
				library.animation.cancel = root[animation_vendors[library.animation.vendor].cancel].bind(root);
				library.animation.start_time = root.performance.timing.navigationStart;
				library.animation.now = root.performance.now.bind(root.performance);
			}
			
			else {
				// performance.now() unsupported.
				library.animation.request = function (callback, element) {
					return root[animation_vendors[library.animation.vendor].request].apply(root, [function (timestamp) {
						callback(timestamp - library.animation.start_time);
					}, element]);
				};
			}
		}
		
		else {
			// requestAnimationFrame unsupported.
			last_time = library.animation.start_time;
			current_time = undefined;
			
			library.animation.request = function (callback) {
				var time_to_call;
				
				current_time = library.animation.now();
				
				time_to_call = Math.max(0, (1000 / 60) - (current_time - last_time));
				return root.setTimeout(function () { callback(last_time = current_time + time_to_call); }, time_to_call);
			};
			
			library.animation.cancel = function(id) { clearTimeout(id); };
		}
		
		try {
			if ((new DOMParser()).parseFromString('', 'text/html')) {
				// Proper DOMParser.
				library.util.fragmentStringToHTMLDocument = function (string) {
					return new DOMParser().parseFromString(string, 'text/html');
				};
			}
			
			else {
				// We've got a DOMParser, it just doesn't support html.
				library.util.fragmentStringToHTMLDocument = function (string) {
					var fragment;
					
					fragment = document.implementation.createHTMLDocument('');
					fragment.body.innerHTML = string;
					
					return fragment;
				};
			}
		}
		
		catch (error) {
			// No DOMParser. Whelp.
			library.util.fragmentStringToHTMLDocument = function (string) {
				var fragment;
				
				// Not really a document, but it'll do.
				fragment = document.createElement('div');
				fragment.innerHTML = string;
				
				return fragment;
			};
		}
	};
	
	library.util.startsWith = function (str, prefix) {
		return str.indexOf(prefix, 0, prefix.length) === 0;
	};
	
	library.util.endsWith = function (str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	};
	
	library.util.indexOfMatch = function (array, test, context) {
		var result;
		
		context = context || this;
		result = -1;
		
		array.some(function(element, i, array) {
			if (test.call(context, element, i, array)) {
				result = i;
				
				return true;
			}
			
			else {
				return false;
			}
		}, context);
		
		return result;
	};
	
	// Adapted from http://api.jquerymobile.com/jQuery.mobile.path.makeUrlAbsolute/
	library.util.getAbsolutePath = function (relative_path, absolute_path) {
		var absolute_stack,
			relative_stack,
			i,
			p;
		
		if (relative_path) {
			if (library.util.startsWith(relative_path, 'data:') || (relative_path.indexOf('://') !== -1)) {
				return relative_path;
			}
			
			else if (library.util.startsWith(relative_path, '//')) {
				return absolute_path.split('//')[0] + relative_path;
			}
		}
		
		relative_path = relative_path || '';
		absolute_path = absolute_path? absolute_path.replace( /^\/|(\/[^\/]*|[^\/]+)$/g, '') : '';
		
		absolute_stack = absolute_path? absolute_path.split('/') : [];
		relative_stack = relative_path.split('/');
		
		for (i = 0; i < relative_stack.length; i++) {
			p = relative_stack[i];
			
			switch (p) {
				case '.':
					break;
				
				case '..':
					if (absolute_stack.length) { absolute_stack.pop(); }
					break;
				
				default:
					absolute_stack.push(p);
					break;
			}
		}
		
		return absolute_stack.join('/');
	};
	
	library.util.epochToClock = function (epoch) {
		var hours,
			minutes,
			seconds;
		
		hours = parseInt(epoch / 3600) % 24;
		minutes = parseInt(epoch / 60) % 60;
		seconds = parseInt(epoch % 60);
		
		return (hours? ((hours < 10? '0' : '') + hours + ':') : '') + ((minutes < 10? '0' : '') + minutes) + ':' + ((seconds < 10? '0' : '') + seconds);
	};
	
	// Batch all our DOM writes.
	library.tick = function (timestamp) {
		var zoetrope;
		
		library.tick_id = library.animation.request(library.tick);
		
		for (zoetrope in library.zoetropes) {
			if (library.zoetropes[zoetrope].state.dom_needs_update) {
				library.zoetropes[zoetrope].state.dom_needs_update = false;
				library.zoetropes[zoetrope].updateDOM(timestamp);
			}
		}
	};
	
	library.Zoetrope = function (media_element) {
		this.init(media_element);
	};
	
	library.Zoetrope.prototype = {
		constructor: library.Zoetrope,
		
		init: function (media_element, force_native) {
			var json_theme_settings;
			
			this.$$ = {}; // Cache jQuery objects.
			this.is_native = force_native || library.is_mobile;
			
			// Don't try to re-initialize an existing zoetrope.
			if (media_element && !media_element.getAttribute('data-zoetrope-id')) {
				if (!this.is_native) {
					// Get theme settings. This is *such* a hack, but it puts a
					// huge smile on my face.
					json_theme_settings = root.getComputedStyle(document.querySelector('.zoetrope')).content;
					json_theme_settings = json_theme_settings.slice(1, -1).replace(/(?:\\a)|(?:\\9)/g, '').replace(/\\\\/g, '\\');
					this.theme_settings = $.extend(true, default_theme_settings, JSON.parse(json_theme_settings));
					
					this.$$.wrapper = $(library.util.fragmentStringToHTMLDocument(this.theme_settings.zoetrope_template, 'text/html').querySelector('div.zoetrope'));
					this.$$.wrapper.addClass('using-1');
					this.$$.container = this.$$.wrapper.children('.container');
					
					this.$$.media_1 = $(media_element.cloneNode(true));
					this.$$.poster = this.$$.container.find('.poster');
					
					if (this.$$.poster.length && this.$$.media_1.attr('poster')) {
						this.$$.poster.css('background-image', 'url("' + this.$$.media_1.attr('poster') + '")');
						this.$$.media_1.removeAttr('poster');
					}
					
					if (this.$$.media_1.prop('controls')) { this.$$.media_1.prop('controls', false); }
					else { this.$$.container.find('.controls').remove(); }
					
					this.base_class = this.$$.media_1.attr('class');
					this.$$.wrapper.attr('id', this.$$.media_1.attr('id'));
					this.$$.media_1.removeAttr('id').removeAttr('class');
					
					// Depending on when we initialize, the browser may already
					// have determined dimensions for the media element, in
					// which case we want to prevent everything from jumping
					// around while the browser recalculates dimensions for the
					// new elements we're inserting.
					if (media_element.readyState) {
						this.$$.media_1.css({'height': $(media_element).height(), 'width': $(media_element).width()});
						
						// Once we've got metadata, the browser can calculate
						// the media's dimensions itself; we no longer need to
						// fix them.
						this.$$.media_1.one('loadedmetadata', $.proxy(function () {
							this.$$.media_1.removeAttr('style');
							this.$$.media_2.removeAttr('style');
						}, this));
					}
					
					// We swap between two media elements when switching
					// sources, to allow for a clean switch. We don't want this
					// standby element to load anything until we need it to.
					this.$$.media_2 = $(this.$$.media_1[0].cloneNode(true));
					this.$$.media_2.prop('autoplay', false);
					this.$$.media_2[0].src = '';
					this.$$.media_2[0].load();
					this.$$.media_2.attr('preload', 'auto');
					
					this.$$.container.find('media').replaceWith(this.$$.media_1);
					this.$$.media_2.insertAfter(this.$$.media_1);
					
					// Cache jQuery objects. We use find to allow for any sort of
					// markup. If an element doesn't exist, that's fine, we'll just
					// have a bunch of writes that don't go anywhere.
					this.$$.current = this.$$.media_1;
					this.$$.standby = this.$$.media_2;
					this.$$.play_button = this.$$.container.find('.play-button');
					this.$$.controls = this.$$.container.find('.controls');
					this.$$.playback_toggle = this.$$.container.find('.playback-toggle');
					this.$$.time = this.$$.container.find('.time');
					this.$$.timeline = this.$$.container.find('.timeline');
					this.$$.played = this.$$.container.find('.played');
					this.$$.buffered = this.$$.container.find('.buffered');
					this.$$.quality_toggle = this.$$.container.find('.quality-toggle');
					this.$$.mute_toggle = this.$$.container.find('.mute-toggle');
					this.$$.volume = this.$$.container.find('.volume');
					this.$$.level = this.$$.container.find('.level');
					this.$$.fullscreen_toggle = this.$$.container.find('.fullscreen-toggle');
					
					// Tag with zoetrope ID.
					this.id = library.zoetropes.length;
					this.$$.media_1.removeClass('zoetrope').attr('data-zoetrope-id', library.zoetropes.length);
					this.$$.media_2.removeClass('zoetrope').attr('data-zoetrope-id', library.zoetropes.length);
					this.$$.wrapper.attr('data-zoetrope-id', library.zoetropes.length);
					
					// Set some more internal variables (id and base_class are set
					// elswhere above.).
					this.current = this.$$.current[0];
					this.standby = this.$$.standby[0];
					this.sources = this.getSources();
					this.state = {
						'general': 'stopped',
						'mousemove': undefined,
						'scrubbed_while_playing': false,
						'switching': false,
						'switching_from': undefined,
						'switching_to': undefined,
						'dom_needs_update': true,
						'last_data': ''
					};
					this.current.current_buffer = [0, 0]; // start, end
					this.standby.current_buffer = [0, 0];
					
					// Bind static handlers to media players.
					this.$$.wrapper.on('selectstart', function (event) { event.preventDefault(); return false; });
					this.$$.container.on('mousemove', $.proxy(function() {
						this.state.last_mousemove = library.animation.now();
						this.state.dom_needs_update = true;
					}, this));
					this.$$.current.on('progress', $.proxy(this.getBuffer, this));
					this.$$.standby.on('progress', $.proxy(this.getBuffer, this));
					
					// Bind dynamic handlers.
					this.updateMediaHandlers();
					
					// Bind handlers to zoetrope elements.
					
					if (this.$$.current.attr('infer')) {
						// We begin loading as soon as the user's intent to play is
						// inferred, as opposed to when its explicitely stated by
						// the browser. Think instantclick, but for HTML5 media.
						// This doesn't work in Chrome or iOS 6 Mobile Webkit,
						// which are both extremely conservative in the amount
						// they'll load regardless of preload/autoplay settings.
						this.$$.play_button.on(this.$$.current.attr('infer') === 'hover'? 'mouseover touchstart' : 'mousedown touchstart', $.proxy(this.load, this));
						this.$$.playback_toggle.on(this.$$.current.attr('infer') === 'hover'? 'mouseover touchstart' : 'mousedown touchstart', $.proxy(this.load, this));
					}
					
					this.$$.play_button.on('click', $.proxy(this.play, this));
					this.$$.playback_toggle.on('click', $.proxy(this.togglePlayback, this));
					this.$$.timeline.on('click mousedown', $.proxy(this.scrubTimeline, this));
					this.$$.quality_toggle.on('click', $.proxy(this.toggleQuality, this));
					this.$$.mute_toggle.on('click', $.proxy(this.toggleMute, this));
					this.$$.volume.on('click mousedown', $.proxy(this.scrubVolume, this));
					this.$$.fullscreen_toggle.on('click', $.proxy(this.toggleFullscreen, this));
					library.$$.document.on('zoetropefullscreenchange', $.proxy(this._DOMNeedsUpdate, this));
					
					$(media_element).replaceWith(this.$$.wrapper);
				}
				
				else {
					// Don't build a full zoetrope, instead use the native
					// player, but store a bit of metadata to allow for the
					// same API between zoetropes and native palyers and change
					// the quality if needed on mobile.
					this.current = media_element;
					this.$$.current = this.$$.media_1 = $(media_element);
					this.sources = this.getSources();
					this.state = { 'dom_needs_update': false };
					
					// In case the browser has already started loading the
					// media, we'll try to change the source as quickly as
					// possible if needed.
					this.current.src = this.sources.mobile || this.current.src;
					
					this.id = library.zoetropes.length;
					this.$$.media_1.addClass('mobile').attr('data-zoetrope-id', library.zoetropes.length);
					
					if (this.$$.current.attr('infer')) {
						this.$$.current.on(this.$$.current.attr('infer') === 'hover'? 'mouseover touchstart' : 'mousedown touchstart', $.proxy(this.load, this));
					}
				}
				
				// Add zoetrope to internal list.
				library.zoetropes.push(this);
			}
		},
		
		getSources: function () {
			var file_extension,
				sources;
			
			// The browser will automatically the first media in the list it's
			// capable of decoding. We assume that all quality variants will
			// be of the same media type and extension.
			file_extension = '.' + this.current.currentSrc.split('.').pop();
			sources = {
				'qualities_and_paths': [],
				'qualities': [],
				'paths': [],
				'paths_to_qualities': {},
				'qualities_to_paths': {},
				'mobile': undefined
			};
			
			this.$$.current.children('source').each(function () {
				var path,
					quality,
					absolute_path;
				
				path = this.getAttribute('src');
				
				if (this.current.canPlayType(this.type) !== '' || library.util.endsWith(path, file_extension)) {
					quality = this.getAttribute('data-quality') || 'sd';
					absolute_path = library.util.getAbsolutePath(path, document.location.href);
					
					sources.qualities_and_paths.push({
						'quality': quality,
						'path': absolute_path
					});
					
					sources.qualities.push(quality);
					sources.paths.push(absolute_path);
					sources.paths_to_qualities[absolute_path] = quality;
					sources.qualities_to_paths[quality] = absolute_path;
					
					if (!sources.mobile && this.getAttribute('mobile') === '') {
						sources.mobile = absolute_path;
					}
				}
			});
			
			return sources;
		},
		
		updateDOM: function (timestamp) {
			var using,
				duration,
				cursor,
				current_time,
				buffered_offset,
				buffered_size,
				quality,
				level_size,
				fullscreen,
				new_data,
				time,
				remaining,
				played_size,
				volume;
			
			using = ((this.$$.current === this.$$.media_1)? '1' : '2');
			
			// Store the duration in the very unlikely event that it changes
			// over the course of this function.
			duration = this.current.duration || 0;
			
			// Set the current time based on when we'll actually be painting.
			current_time = this.state.general === 'playing'? Math.min((this.current.currentTime || 0) + ((timestamp - library.animation.now()) / 1000), duration) : this.current.currentTime;
			
			if (!this.state.switching) {
				buffered_offset = (this.current.current_buffer[0] / duration) * 100;
				buffered_size = ((this.current.current_buffer[1] - this.current.current_buffer[0]) / duration) * 100;
			}
			
			else {
				buffered_offset = (this.standby.current_buffer[0] / duration) * 100;
				buffered_size = ((this.standby.current_buffer[1] - this.standby.current_buffer[0]) / duration) * 100;
			}
			
			quality = this.current.currentSrc? this.sources.paths_to_qualities[this.current.currentSrc] : this.sources.qualities[0];
			level_size = this.current.muted? 0 : this.current.volume * 100;
			fullscreen = library.fullscreen.supported? this.$$.container.is(library.fullscreen.element) : 'unsupported';
			
			cursor = (this.state.last_mousemove + (fullscreen === true? this.theme_settings.fullscreen_flag_cursor : this.theme_settings.window_flag_cursor)) >= timestamp;
			
			new_data = [this.state.general, cursor, this.state.switching, using, duration, current_time, buffered_offset, buffered_size, quality, level_size, this.current.muted, fullscreen].join();
			
			if (new_data !== this.state.last_data) {
				this.state.last_data = new_data;
				
				time = library.util.epochToClock(current_time);
				remaining = duration? library.util.epochToClock(duration - current_time) : '00:00';
				
				played_size = (current_time / duration) * 100;
				
				volume = this.current.muted? 0 : Math.ceil(this.current.volume * (this.theme_settings.volume_steps - 1));
				
				this.$$.wrapper.attr({
					'data-using': using,
					'data-state': this.state.general,
					'data-cursor': cursor,
					'data-quality': quality,
					'data-switching': this.state.switching,
					'data-intended': this.state.switching || quality,
					'data-volume': volume,
					'data-fullscreen': fullscreen,
					'data-time': time,
					'data-remaining': remaining,
					'class': [
						this.base_class,
						'using-' + using,
						'state-' + this.state.general,
						'cursor-' + cursor,
						'quality-' + quality,
						'switching-' + this.state.switching,
						'intended-' + this.state.switching || quality,
						'volume-' + volume,
						'fullscreen-' + fullscreen,
						'time-' + time,
						'remaining-' + remaining
					].join(' ')
				});
				
				this.$$.played.css(this.theme_settings.timeline_dimension, played_size + '%');
				this.$$.buffered.css(
					this.theme_settings.timeline_start, buffered_offset + '%'
				).css(
					this.theme_settings.timeline_dimension, buffered_size + '%'
				);
				
				this.$$.quality_toggle.attr({
					'data-quality': quality,
					'data-switching': this.state.switching,
					'data-intended': this.state.switching || quality
				});
				
				this.$$.current.prop('muted', this.current.muted);
				this.$$.mute_toggle.attr('data-volume', volume);
				this.$$.level.css(this.theme_settings.volume_dimension, level_size + '%');
				
				this.$$.fullscreen_toggle.attr('data-fullscreen', fullscreen);
				
				this.$$.time.attr({
					'data-time': time,
					'data-remaining': remaining
				});
			
			}
			
			this.state.dom_needs_update = cursor;
		},
		
		_DOMNeedsUpdate: function () {
			this.state.dom_needs_update = true;
		},
		
		updateMediaHandlers: function () {
			this.$$.current.one('loadstart', $.proxy(function () {
				this.sources = this.getSources();
				this.state.dom_needs_update = true;
			}, this));
			
			this.$$.current.on('play', $.proxy(this.play, this));
			this.$$.current.on('pause', $.proxy(this.pause, this));
			this.$$.current.on('volumechange', $.proxy(this._DOMNeedsUpdate, this));
			this.$$.current.on('ended', $.proxy(this.ended, this));
			this.$$.current.on('timeupdate', $.proxy(this._DOMNeedsUpdate, this));
			
			this.$$.standby.off('play', $.proxy(this.play, this));
			this.$$.standby.off('pause', $.proxy(this.pause, this));
			this.$$.standby.off('volumechange', $.proxy(this._DOMNeedsUpdate, this));
			this.$$.standby.off('ended', $.proxy(this.ended, this));
			this.$$.standby.off('timeupdate', $.proxy(this._DOMNeedsUpdate, this));
		},
		
		togglePlayback: function (event) {
			if (!event || this.$$.playback_toggle.is(event.target)) {
				if (this.state.general === 'playing') { this.current.pause(); }
				else { this.current.play(); }
			}
		},
		
		scrubTimeline: function (event) {
			var timeline_offset,
				timeline_height,
				timeline_width,
				timeline_position,
				timeline_ratio;
			
			if (event && (this.$$.timeline.is(event.target) || event.type !== 'mousedown')) {
				if (event.type === 'mousedown') {
					this.state.scrubbed_while_playing = (this.state.general === 'playing');
					this.current.pause();
					
					library.$$.body.on('mousemove mouseup mouseleave', $.proxy(this.scrubTimeline, this));
				}
				
				timeline_offset = this.$$.timeline.offset();
				timeline_height = this.$$.timeline.height();
				timeline_width = this.$$.timeline.width();
				
				if (this.theme_settings.timeline_dimension === 'width') {
					timeline_position = Math.min(Math.max(0, event.pageX - timeline_offset.left), timeline_width);
					timeline_position = this.theme_settings.timeline_start === 'left'? timeline_position : (timeline_width - timeline_position);
					timeline_ratio = timeline_position / timeline_width;
				}
				
				else {
					timeline_position = Math.min(Math.max(0, event.pageY - timeline_offset.top), timeline_height);
					timeline_position = this.theme_settings.timeline_start === 'top'? timeline_position : (timeline_height - timeline_position);
					timeline_ratio = timeline_position / timeline_height;
				}
				
				this.current.currentTime = timeline_ratio * this.current.duration;
				
				this.state.dom_needs_update = true;
				
				if (event.type === 'mouseup' || event.type === 'mouseleave') {
					if (this.scrubbed_while_playing) { this.current.play(); }
					
					library.$$.body.off('mousemove mouseup mouseleave', $.proxy(this.scrubTimeline, this));
				}
			}
		},
		
		toggleQuality: function () {
			var new_quality_index;
			
			new_quality_index = (this.state.switching? this.sources.qualities.indexOf(this.state.switching) : this.sources.paths.indexOf(this.current.currentSrc)) + 1;
			this.changeQuality(this.sources.qualities[new_quality_index % this.sources.qualities.length]);
		},
		
		changeQuality: function (quality) {
			if (this.state.switching && (quality === this.sources.paths_to_qualities[this.current.currentSrc])) {
				this.state.switching = false;
				this.state.switching_from = undefined;
				this.state.switching_to = undefined;
				
				this.standby.src = '';
				this.standby.load();
				
				this.state.dom_needs_update = true;
			}
			
			if (quality !== this.sources.paths_to_qualities[this.current.currentSrc]) {
				this.state.switching = quality;
				this.state.switching_from = this.current;
				this.state.switching_to = this.standby;
				
				this.standby.current_buffer = [0, 0];
				this.standby.src = this.sources.qualities_to_paths[quality];
				this.standby.load();
				
				this.state.dom_needs_update = true;
				library.animation.request(this._syncMedia.bind(this));
				this.$$.standby.trigger('progress');
			}
		},
		
		_syncMedia: function (timestamp) {
			if (this.state.switching) {
				if (this.state.switching_to.readyState < 3) {
					library.animation.request(this._syncMedia.bind(this));
					
					if (this.state.switching_to.readyState > 0) {
						this.state.switching_to.currentTime =
							this.state.switching_from.currentTime +
							(this.state.general === 'playing'? (Math.max(0, timestamp - library.animation.now()) / 1000) : 0);
					}
				}
				
				else {
					this._finishChangingQuality();
				}
			}
		},
		
		_finishChangingQuality: function () {
			this.state.switching = false;
			this.state.switching_from = undefined;
			this.state.switching_to = undefined;
			
			this.$$.wrapper.css({'height': this.$$.wrapper.height(), 'width': this.$$.wrapper.width()});
			
			this.standby.muted = true;
			if (this.state.general === 'playing') { this.standby.play(); }
			
			this.$$.standby.one('timeupdate', $.proxy(function () {
				var temp;
				
				// Swap cache references.
				temp = this.$$.current;
				this.$$.current = this.$$.standby;
				this.$$.standby = temp;
				
				// Swap player references.
				temp = this.current;
				this.current = this.standby;
				this.standby = temp;
				
				this.updateMediaHandlers();
				
				this.current.volume = this.standby.volume;
				
				// Try as hard as we can to swap mute states instantaneously
				// (hence the single expression).
				this.current.muted = this.standby.muted? true : !(this.standby.muted = !this.standby.muted);
				this.$$.current.prop('muted', this.current.muted);
				
				this.state.dom_needs_update = true;
				
				this.$$.current.one('timeupdate', $.proxy(function () {
					setTimeout($.proxy(function () {
						this.standby.src = '';
						this.standby.load();
					}, this), 1000);
					
					this.$$.wrapper.css({'height': 'auto', 'width': 'auto'});
				}, this));
			}, this));
			
			// This isn't the cleanest solution, but it sure beats spinning off
			// another two one time use functions.
			if (this.state.general !== 'playing') {
				this.$$.standby.one('timeupdate', $.proxy(function () {
					this.$$.current.trigger('timeupdate');
				}, this));
				
				this.$$.standby.trigger('timeupdate');
			}
		},
		
		toggleMute: function (event) {
			if (!event || this.$$.mute_toggle.is(event.target)) {
				if (this.current.muted && !this.current.volume) {
					this.current.volume = 1;
				}
				
				this.current.muted = !this.current.muted;
				
				this.state.dom_needs_update = true;
			}
		},
		
		scrubVolume: function (event) {
			var volume_offset,
				volume_height,
				volume_width,
				volume_position,
				volume_ratio;
			
			if (event && (this.$$.volume.is(event.target) || event.type !== 'mousedown')) {
				if (event.type === 'mousedown') {
					library.$$.body.on('mousemove mouseup mouseleave', $.proxy(this.scrubVolume, this));
				}
				
				volume_offset = this.$$.volume.offset();
				volume_height = this.$$.volume.height();
				volume_width = this.$$.volume.width();
				
				if (this.theme_settings.volume_dimension === 'width') {
					volume_position = Math.min(Math.max(0, event.pageX - volume_offset.left), volume_width);
					volume_position = this.theme_settings.volume_start === 'left'? volume_position : (volume_width - volume_position);
					volume_ratio = volume_position / volume_width;
				}
				
				else {
					volume_position = Math.min(Math.max(0, event.pageY - volume_offset.top), volume_height);
					volume_position = this.theme_settings.volume_start === 'top'? volume_position : (volume_height - volume_position);
					volume_ratio = volume_position / volume_height;
				}
				
				this.current.volume = volume_ratio;
				this.current.muted = !this.current.volume;
				
				this.state.dom_needs_update = true;
				
				if (event.type === 'mouseup' || event.type === 'mouseleave') {
					library.$$.body.off('mousemove mouseup mouseleave', $.proxy(this.scrubVolume, this));
				}
			}
		},
		
		toggleFullscreen: function () {
			if (library.fullscreen.enabled) {
				if (!library.fullscreen.element) {
					library.fullscreen.request(document.querySelector('.zoetrope[data-zoetrope-id="' + this.id + '"] .container'));
				}
				
				else if (this.$$.container.is(library.fullscreen.element)) {
					library.fullscreen.exit();
				}
				
				this.state.dom_needs_update = true;
			}
		},
		
		load: function () {
			if (this.$$.current.attr('preload') !== 'auto') {
				this.$$.current.attr('preload', 'auto');
			}
		},
		
		play: function (event, internal) {
			if (!internal && (!event || event.type !== 'play')) {
				this.current.play();
			}
			
			else {
				if (this.current.readyState === 4) {
					this.state.general = 'playing';
				}
				
				else if (this.state.general === 'stopped') {
					this.state.general = 'loading';
					this.$$.current.attr('preload', 'auto');
					
					if (this.current.currentTime === this.current.duration) {
						this.current.currentTime = 0;
					}
				}
				
				// Progress events are never triggered if the media has already
				// been completely downloaded (due to preload settings
				// or cacheing), so we need to trigger one ourselves so that we
				// always get at least one.
				this.$$.current.trigger('progress');
				
				this.state.dom_needs_update = true;
			}
		},
		
		pause: function (event, internal) {
			if (!internal && (!event || event.type !== 'pause')) {
				this.current.pause();
			}
			
			else if (this.state.general === 'playing') {
				this.state.general = 'paused';
				this.state.dom_needs_update = true;
			}
		},
		
		ended: function () {
			this.state.general = 'stopped';
			this.state.dom_needs_update = true;
		},
		
		getBuffer: function (event) {
			var is_current,
				media,
				i,
				start,
				end;
			
			// Get the correct media element to update.
			is_current = this.current === event.target;
			media = is_current? this.current : this.standby;
			
			media.current_buffer = [0, 0];
			
			// Sum up the total seconds buffered, the total seconds yet to play
			// that have been buffered, and store all the buffer ranges.
			for (i = 0; i < media.buffered.length; i++) {
				start = media.buffered.start(i);
				end = media.buffered.end(i);
				
				if ((this.current.currentTime >= start) && (this.current.currentTime <= end)) {
					media.current_buffer = [start, end];
					
					break;
				}
			}
			
			if (this.state.general === 'loading' && this.current.readyState === 4) {
				this.state.general = 'playing';
			}
			
			this.state.dom_needs_update = true;
		}
	};
	
	library.getZoetrope = function (element) {
		return library.videos[$(element).attr(('data-zoetrope-id')) || $(element).parents('.zoetrope').attr('data-zoetrope-id')];
	};
	
	library.setupZoetrope = function (i, video_element) {
		return new library.Zoetrope(video_element || i);
	};
	
	library.init = function () {
		// On mobile devices we use the native HTML5 player. Using zoetrope in
		// these contexts (or any non-native player, really) will very
		// frequently lead to browser crashes due to the increased memory
		// requirements. As such there's no need to run polyfills, nor register
		// an animation handler.
		if (!library.is_mobile) {
			library.util.polyfill();
			
			if (!library.tick_id) {
				library.tick_id = library.animation.request(library.tick);
			}
		}
		
		$('video.zoetrope, audio.zoetrope').each(library.setupZoetrope);
	};
	
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = library;
		}
		
		exports.zoetrope = library;
	}
	
	else if (typeof define === 'function' && define.amd) {
		define([], function() {
			return library;
		});
	}
	
	else {
		library._original_zoetrope = root.zoetrope;
		
		library.noConflict = function () {
			root.zoetrope = library._original_zoetrope;
			library._original_zoetrope = undefined;
			library.noConflict = undefined;
			
			return library;
		};
		
		root.zoetrope = library;
	}
})(this, document, jQuery);
