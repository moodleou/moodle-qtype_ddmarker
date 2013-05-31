YUI.add('moodle-qtype_ddmarker-dd', function(Y) {
    var DDMARKERDDNAME = 'ddmarker_dd';
    var DDMARKER_DD = function() {
        DDMARKER_DD.superclass.constructor.apply(this, arguments);
    };
    /**
     * This is the base class for the question rendering and question editing form code.
     */
    Y.extend(DDMARKER_DD, Y.Base, {
        doc : null,
        polltimer : null,
        afterimageloaddone : false,
        graphics : null,
        poll_for_image_load : function (e, waitforimageconstrain, pause, doafterwords) {
            if (this.afterimageloaddone) {
                return;
            }
            var bgdone = this.doc.bg_img().get('complete');
            if (waitforimageconstrain) {
                bgdone = bgdone && this.doc.bg_img().hasClass('constrained');
            }
            if (bgdone) {
                if (this.polltimer !== null) {
                    this.polltimer.cancel();
                    this.polltimer = null;
                }
                this.doc.bg_img().detach('load', this.poll_for_image_load);
                if (pause !== 0) {
                    Y.later(pause, this, doafterwords);
                } else {
                    doafterwords.call(this);
                }
                this.afterimageloaddone = true;
            } else if (this.polltimer === null) {
                var pollarguments = [null, waitforimageconstrain, pause, doafterwords];
                this.polltimer =
                            Y.later(1000, this, this.poll_for_image_load, pollarguments, true);
            }
        },

        /**
         * Object to encapsulate operations on dd area.
         */
        doc_structure : function () {
            var topnode = Y.one(this.get('topnode'));
            var dragitemsarea = topnode.one('div.dragitems');
            var dropbgarea = topnode.one('div.droparea');
            return {
                top_node : function() {
                    return topnode;
                },
                bg_img : function() {
                    return topnode.one('.dropbackground');
                },
                load_bg_img : function (url) {
                    dropbgarea.setContent('<img class="dropbackground" src="'+ url +'"/>');
                    this.bg_img().on('load', this.on_image_load, this, 'bg_image');
                },
                drag_items : function() {
                    return dragitemsarea.all('.dragitem');
                },
                drag_items_for_choice : function(choiceno) {
                    return dragitemsarea.all('span.dragitem.choice' + choiceno);
                },
                drag_item_for_choice : function(choiceno, itemno) {
                    return dragitemsarea.one('span.dragitem.choice'+ choiceno +
                                            '.item' + itemno);
                },
                drag_item_being_dragged : function(choiceno) {
                    return dragitemsarea.one('span.dragitem.beingdragged.choice' + choiceno);
                },
                drag_item_home : function (choiceno) {
                    return dragitemsarea.one('span.draghome.choice' + choiceno);
                },
                drag_item_homes : function() {
                    return dragitemsarea.all('span.draghome');
                },
                get_classname_numeric_suffix : function(node, prefix) {
                    var classes = node.getAttribute('class');
                    if (classes !== '') {
                        var classesarr = classes.split(' ');
                        for (var index = 0; index < classesarr.length; index++) {
                            var patt1 = new RegExp('^' + prefix + '([0-9])+$');
                            if (patt1.test(classesarr[index])) {
                                var patt2 = new RegExp('([0-9])+$');
                                var match = patt2.exec(classesarr[index]);
                                return +match[0];
                            }
                        }
                    }
                    return null;
                },
                inputs_for_choices : function () {
                    return topnode.all('input.choices');
                },
                input_for_choice : function (choiceno) {
                    return topnode.one('input.choice'+choiceno);
                },
                marker_texts : function () {
                    return topnode.one('div.markertexts');
                }
            };
        },

        colours : ['#FFFFFF', '#B0C4DE', '#DCDCDC', '#D8BFD8',
                   '#87CEFA','#DAA520', '#FFD700', '#F0E68C'],
        nextcolourindex : 0,
        restart_colours : function () {
            this.nextcolourindex = 0;
        },
        get_next_colour : function () {
            var colour = this.colours[this.nextcolourindex];
            this.nextcolourindex++;
            if (this.nextcolourindex === this.colours.length) {
                this.nextcolourindex = 0;
            }
            return colour;
        },
        convert_to_window_xy : function (bgimgxy) {
            return [+bgimgxy[0] + this.doc.bg_img().getX() + 1,
                    +bgimgxy[1] + this.doc.bg_img().getY() + 1];
        },
        shapes : [],
        draw_drop_zone : function (dropzoneno, markertext, shape, coords, colour, link) {
            var existingmarkertext;
            if (link) {
                existingmarkertext = this.doc.marker_texts().one('span.markertext'+dropzoneno+' a');
            } else {
                existingmarkertext = this.doc.marker_texts().one('span.markertext'+dropzoneno);
            }

            if (existingmarkertext) {
                if (markertext !== '') {
                    existingmarkertext.setContent(markertext);
                } else {
                    existingmarkertext.remove(true);
                }
            } else if (markertext !== '') {
                var classnames = 'markertext markertext' + dropzoneno;
                if (link) {
                    this.doc.marker_texts().append('<span class="'+classnames+'"><a href="#">' +
                                                                        markertext+'</a></span>');
                } else {
                    this.doc.marker_texts().append('<span class="'+classnames+'">' +
                                                                        markertext+'</span>');
                }
            }
            var drawfunc = 'draw_shape_'+shape;
            if (this[drawfunc] instanceof Function){
               var xyfortext = this[drawfunc](dropzoneno, coords, colour);
               if (xyfortext !== null) {
                   var markerspan = Y.one('div.ddarea div.markertexts span.markertext'+dropzoneno);
                   if (markerspan !== null) {
                       markerspan.setStyle('opacity', '0.6');
                       xyfortext[0] -= Math.round(markerspan.get('offsetWidth') / 2);
                       xyfortext[1] -= Math.round(markerspan.get('offsetHeight') / 2);
                       markerspan.setXY(this.convert_to_window_xy(xyfortext));
                       var markerspananchor = markerspan.one('a');
                       if (markerspananchor !== null) {
                           markerspananchor.once('click', function (e, dropzoneno) {
                               var fill = this.shapes[dropzoneno].get('fill');
                               fill.opacity = 1;
                               this.shapes[dropzoneno].set('fill', fill);
                               },
                               this,
                               dropzoneno
                           );
                           markerspananchor.set('tabIndex', 0);
                       }
                   }
               }
            }
        },
        draw_shape_circle : function (dropzoneno, coords, colour) {
            var coordsparts = coords.match(/(\d+),(\d+);(\d+)/);
            if (coordsparts && coordsparts.length === 4) {
                var xy = [+coordsparts[1] - coordsparts[3], +coordsparts[2] - coordsparts[3]];
                if (this.coords_in_img(xy)) {
                    var widthheight = [+coordsparts[3]*2, +coordsparts[3]*2];
                    var shape = this.graphics.addShape({
                            type: 'circle',
                            width: widthheight[0],
                            height: widthheight[1],
                            fill: {
                                color: colour,
                                opacity : "0.5"
                            },
                            stroke: {
                                weight:1,
                                color: "black"
                            }
                    });
                    shape.setXY(this.convert_to_window_xy(xy));
                    this.shapes[dropzoneno] = shape;
                    return [+coordsparts[1], +coordsparts[2]];
                }
            }
            return null;
        },
        draw_shape_rectangle : function (dropzoneno, coords, colour) {
            var coordsparts = coords.match(/(\d+),(\d+);(\d+),(\d+)/);
            if (coordsparts && coordsparts.length === 5) {
                var xy = [+coordsparts[1], +coordsparts[2]];
                var widthheight = [+coordsparts[3], +coordsparts[4]];
                if (this.coords_in_img([xy[0]+widthheight[0], xy[1]+widthheight[1]])) {
                    var shape = this.graphics.addShape({
                            type: 'rect',
                            width: widthheight[0],
                            height: widthheight[1],
                            fill: {
                                color: colour,
                                opacity : "0.5"
                            },
                            stroke: {
                                weight:1,
                                color: "black"
                            }
                    });
                    shape.setXY(this.convert_to_window_xy(xy));
                    this.shapes[dropzoneno] = shape;
                    return [+xy[0]+widthheight[0]/2, +xy[1]+widthheight[1]/2];
                }
            }
            return null;

        },
        draw_shape_polygon : function (dropzoneno, coords, colour) {
            var coordsparts = coords.split(';');
            var xy = [];
            for (var i in coordsparts) {
                var parts = coordsparts[i].match(/^(\d+),(\d+)$/);
                if (parts !== null && this.coords_in_img([parts[1], parts[2]])) {
                    xy[xy.length] = [parts[1], parts[2]];
                }
            }
            if (xy.length > 2) {
                var polygon = this.graphics.addShape({
                    type: "path",
                    stroke: {
                        weight: 1,
                        color: "black"
                    },
                    fill: {
                        color: colour,
                        opacity : "0.5"
                    }
                });
                var maxxy = [0,0];
                var minxy = [this.doc.bg_img().get('width'), this.doc.bg_img().get('height')];
                for (i = 0; i < xy.length; i++) {
                    //calculate min and max points to find center to show marker on
                    minxy[0] = Math.min(xy[i][0], minxy[0]);
                    minxy[1] = Math.min(xy[i][1], minxy[1]);
                    maxxy[0] = Math.max(xy[i][0], maxxy[0]);
                    maxxy[1] = Math.max(xy[i][1], maxxy[1]);
                    if (i === 0) {
                        polygon.moveTo(xy[i][0], xy[i][1]);
                    } else {
                        polygon.lineTo(xy[i][0], xy[i][1]);
                    }
                }
                if (+xy[0][0] !== +xy[xy.length-1][0] || +xy[0][1] !== +xy[xy.length-1][1]) {
                    polygon.lineTo(xy[0][0], xy[0][1]); //close polygon if not already closed
                }
                polygon.end();
                polygon.setXY(this.doc.bg_img().getXY());
                this.shapes[dropzoneno] = polygon;
                return [Math.round((minxy[0] + maxxy[0])/2), Math.round((minxy[1] + maxxy[1])/2)];
            }
            return null;
        },
        coords_in_img : function (coords) {
            return (coords[0] <= this.doc.bg_img().get('width') &&
                            coords[1] <= this.doc.bg_img().get('height'));
        }
    }, {
        NAME : DDMARKERDDNAME,
        ATTRS : {
            drops : {value : null},
            readonly : {value : false},
            topnode : {value : null}
        }
    });
    M.qtype_ddmarker = M.qtype_ddmarker || {};
    M.qtype_ddmarker.dd_base_class = DDMARKER_DD;

    var DDMARKERQUESTIONNAME = 'ddmarker_question';
    var DDMARKER_QUESTION = function() {
        DDMARKER_QUESTION.superclass.constructor.apply(this, arguments);
    };
    /**
     * This is the code for question rendering.
     */
    Y.extend(DDMARKER_QUESTION, M.qtype_ddmarker.dd_base_class, {
        initializer : function() {
            this.doc = this.doc_structure(this);
            this.poll_for_image_load(null, false, 0, this.after_image_load);
            this.doc.bg_img().after('load', this.poll_for_image_load, this,
                                                    false, 0, this.after_image_load);
        },
        after_image_load : function () {
            this.redraw_drags_and_drops();
            Y.later(2000, this, this.redraw_drags_and_drops, [], true);
        },
        clone_new_drag_item : function (draghome, itemno) {
            var drag = draghome.cloneNode(true);
            drag.removeClass('draghome');
            drag.addClass('dragitem');
            drag.addClass('item'+ itemno);
            drag.one('span.markertext').setStyle('opacity', 0.6);
            draghome.insert(drag, 'after');
            if (!this.get('readonly')) {
                this.draggable(drag);
            }
            return drag;
        },
        draggable : function (drag) {
            var dd = new Y.DD.Drag({
                node: drag,
                dragMode: 'intersect'
            }).plug(Y.Plugin.DDConstrained, {constrain2node: this.doc.top_node()});
            dd.after('drag:start', function(e){
                var dragnode = e.target.get('node');
                dragnode.addClass('beingdragged');
                var choiceno = this.get_choiceno_for_node(dragnode);
                var itemno = this.get_itemno_for_node(dragnode);
                if (itemno !== null) {
                    dragnode.removeClass('item'+dragnode);
                }
                this.save_all_xy_for_choice(choiceno, null);
                this.redraw_drags_and_drops();
            }, this);
            dd.after('drag:end', function(e) {
                var dragnode = e.target.get('node');
                dragnode.removeClass('beingdragged');
                var choiceno = this.get_choiceno_for_node(dragnode);
                this.save_all_xy_for_choice(choiceno, dragnode);
                this.redraw_drags_and_drops();
            }, this);
            //--- keyboard accessibility
            drag.set('tabIndex', 0);
            drag.on('dragchange', this.drop_zone_key_press, this);
        },
        save_all_xy_for_choice: function (choiceno, dropped) {
            var coords = [];
            var bgimgxy;
            for (var i=0; i <= this.doc.drag_items_for_choice(choiceno).size(); i++) {
                var dragitem = this.doc.drag_item_for_choice(choiceno, i);
                if (dragitem) {
                    dragitem.removeClass('item'+i);
                    if (!dragitem.hasClass('beingdragged')) {
                        bgimgxy = this.convert_to_bg_img_xy(dragitem.getXY());
                        if (this.xy_in_bgimg(bgimgxy)) {
                            dragitem.removeClass('item'+i);
                            dragitem.addClass('item'+coords.length);
                            coords[coords.length] = bgimgxy;
                        }
                    }
                }
            }
            if (dropped !== null){
                bgimgxy = this.convert_to_bg_img_xy(dropped.getXY());
                dropped.addClass('item'+coords.length);
                if (this.xy_in_bgimg(bgimgxy)) {
                    coords[coords.length] = bgimgxy;
                }
            }
            this.set_form_value(choiceno, coords.join(';'));
        },
        reset_drag_xy : function (choiceno) {
            this.set_form_value(choiceno, '');
        },
        set_form_value : function (choiceno, value) {
            this.doc.input_for_choice(choiceno).set('value', value);
        },
        //make sure xy value is not out of bounds of bg image
        xy_in_bgimg : function (bgimgxy) {
            if ((bgimgxy[0] < 0) ||
                    (bgimgxy[1] < 0) ||
                    (bgimgxy[0] > this.doc.bg_img().get('width')) ||
                    (bgimgxy[1] > this.doc.bg_img().get('height'))){
                return false;
            } else {
                return true;
            }
        },
        constrain_to_bgimg : function (windowxy) {
            var bgimgxy = this.convert_to_bg_img_xy(windowxy);
            bgimgxy[0] = Math.max(0, bgimgxy[0]);
            bgimgxy[1] = Math.max(0, bgimgxy[1]);
            bgimgxy[0] = Math.min(this.doc.bg_img().get('width'), bgimgxy[0]);
            bgimgxy[1] = Math.min(this.doc.bg_img().get('height'), bgimgxy[1]);
            return this.convert_to_window_xy(bgimgxy);
        },
        convert_to_bg_img_xy : function (windowxy) {
            return [Math.round(+windowxy[0] - this.doc.bg_img().getX()-1),
                    Math.round(+windowxy[1] - this.doc.bg_img().getY()-1)];
        },
        redraw_drags_and_drops : function() {
            this.doc.drag_items().each(function(item) {
                //if (!item.hasClass('beingdragged')){
                    item.addClass('unneeded');
                //}
            }, this);
            this.doc.inputs_for_choices().each(function (input) {
                var choiceno = this.get_choiceno_for_node(input);
                var coords = this.get_coords(input);
                var dragitemhome = this.doc.drag_item_home(choiceno);
                for (var i=0; i < coords.length; i++) {
                    var dragitem;
                    dragitem = this.doc.drag_item_for_choice(choiceno, i);
                    if (!dragitem || dragitem.hasClass('beingdragged')) {
                        dragitem = this.clone_new_drag_item(dragitemhome, i);
                    } else {
                        dragitem.removeClass('unneeded');
                    }
                    dragitem.setXY(coords[i]);
                }
            }, this);
            this.doc.drag_items().each(function(item) {
                if (item.hasClass('unneeded') && !item.hasClass('beingdragged')) {
                    item.remove(true);
                }
            }, this);
            if (this.graphics !== null) {
                this.graphics.clear();
            } else {
                this.graphics = new Y.Graphic(
                    {render:this.doc.top_node().one("div.ddarea div.dropzones")}
                );
            }
            if (this.get('dropzones').length !== 0) {
                this.restart_colours();
                for (var dropzoneno in this.get('dropzones')) {
                    var colourfordropzone = this.get_next_colour();
                    var d = this.get('dropzones')[dropzoneno];
                    this.draw_drop_zone(dropzoneno, d.markertext,
                                        d.shape, d.coords, colourfordropzone, true);
                }
            }
        },
        /**
         * Determine what drag items need to be shown and
         * return coords of all drag items except any that are currently being dragged
         * based on contents of hidden inputs and whether drags are 'infinite' or how many drags should be shown.
         */
        get_coords : function (input) {
            var choiceno = this.get_choiceno_for_node(input);
            var fv = input.get('value');
            var infinite = input.hasClass('infinite');
            var noofdrags = this.get_noofdrags_for_node(input);
            var dragging = (null !== this.doc.drag_item_being_dragged(choiceno));
            var coords = [];
            if (fv !== '') {
                var coordsstrings = fv.split(';');
                for (var i=0; i<coordsstrings.length; i++) {
                    coords[coords.length] = this.convert_to_window_xy(coordsstrings[i].split(','));
                }
            }
            var displayeddrags = coords.length + (dragging ? 1 : 0);
            if (infinite || (displayeddrags < noofdrags)) {
                coords[coords.length] = this.drag_home_xy(choiceno);
            }
            return coords;
        },
        drag_home_xy : function (choiceno) {
            var dragitemhome = this.doc.drag_item_home(choiceno);
            return [dragitemhome.getX(), dragitemhome.get('parentNode').getY()];
        },
        get_choiceno_for_node : function(node) {
            return +this.doc.get_classname_numeric_suffix(node, 'choice');
        },
        get_itemno_for_node : function(node) {
            return +this.doc.get_classname_numeric_suffix(node, 'item');
        },
        get_noofdrags_for_node : function(node) {
            return +this.doc.get_classname_numeric_suffix(node, 'noofdrags');
        },

        //----------- keyboard accessibility stuff below line ---------------------
        drop_zone_key_press : function (e) {
            var dragitem = e.target;
            var xy = dragitem.getXY();
            switch (e.direction) {
                case 'left' :
                    xy[0] -= 1;
                    break;
                case 'right' :
                    xy[0] += 1;
                    break;
                case 'down' :
                    xy[1] += 1;
                    break;
                case 'up' :
                    xy[1] -= 1;
                    break;
                case 'remove' :
                    xy = null;
                    break;
            }
            var choiceno = this.get_choiceno_for_node(dragitem);
            if (xy !== null) {
                xy = this.constrain_to_bgimg(xy);
            } else {
                xy = this.drag_home_xy(choiceno);
            }
            e.preventDefault();
            dragitem.setXY(xy);
            this.save_all_xy_for_choice(choiceno, null);
        }
    }, {NAME : DDMARKERQUESTIONNAME, ATTRS : {dropzones:{value:[]}}});

    Y.Event.define('dragchange', {
        // Webkit and IE repeat keydown when you hold down arrow keys.
        // Opera links keypress to page scroll; others keydown.
        // Firefox prevents page scroll via preventDefault() on either
        // keydown or keypress.
        _event: (Y.UA.webkit || Y.UA.ie) ? 'keydown' : 'keypress',

        _keys: {
            '32': 'remove',     // Space
            '37': 'left', // Left arrow
            '38': 'up', // Up arrow
            '39': 'right',     // Right arrow
            '40': 'down',     // Down arrow
            '65': 'left', // a
            '87': 'up', // w
            '68': 'right',     // d
            '83': 'down',     // s
            '27': 'remove'    // Escape
        },

        _keyHandler: function (e, notifier) {
            if (this._keys[e.keyCode]) {
                e.direction = this._keys[e.keyCode];
                notifier.fire(e);
            }
        },

        on: function (node, sub, notifier) {
            sub._detacher = node.on(this._event, this._keyHandler,
                                    this, notifier);
        }
    });
    M.qtype_ddmarker.init_question = function(config) {
        return new DDMARKER_QUESTION(config);
    };
}, '@VERSION@', {
      requires:['node', 'event-resize', 'dd', 'dd-drop', 'dd-constrain', 'graphics']
});
