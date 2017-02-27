/**
 * @file
 * Javascript behaviors for custom webform #states.
 */

(function ($, Drupal) {

  'use strict';

  // Make absolutely sure the below event handlers are triggered after
  // the state.js event handlers by attaching them after DOM load.
  $(function () {
    var $document = $(document);
    $document.on('state:visible', function (e) {
      if (!e.trigger) {
        return TRUE;
      }

      if (!e.value) {
        // @see https://www.sitepoint.com/jquery-function-clear-form-data/
        $(':input', e.target).andSelf().each(function () {
          var $input = $(this);
          backupValueAndRequired(this);
          clearValueAndRequired(this);
          triggerEventHandlers(this);
        });
      }
      else {
        $(':input', e.target).andSelf().each(function () {
          restoreValueAndRequired(this);
          triggerEventHandlers(this);
        });
      }
    });

    $document.on('state:disabled', function (e) {
      if (e.trigger) {
        $(e.target).trigger('webform:disabled')
          .find('select, input, textarea').trigger('webform:disabled');
      }
    });
  });

  /**
   * Trigger an input's event handlers.
   *
   * @param input
   *   An input.
   */
  function triggerEventHandlers(input) {
    var $input = $(input);
    var type = input.type;
    var tag = input.tagName.toLowerCase(); // Normalize case.
    if (type == 'checkbox' || type == 'radio') {
      $input
        .trigger('change')
        .trigger('blur');
    }
    else if (tag == 'select') {
      $input
        .trigger('change')
        .trigger('blur');
    }
    else if (type != 'submit' && type != 'button') {
      $input
        .trigger('input')
        .trigger('change')
        .trigger('keydown')
        .trigger('keyup')
        .trigger('blur');
    }
  }

  /**
   * Backup an input's current value and required attribute
   *
   * @param input
   *   An input.
   */
  function backupValueAndRequired(input) {
    var $input = $(input);
    var type = input.type;
    var tag = input.tagName.toLowerCase(); // Normalize case.

    // Backup required.
    if ($input.prop('required')) {
      $input.data('webform-require', true);
    }

    // Backup value.
    if (type == 'checkbox' || type == 'radio') {
      $input.data('webform-value', $input.prop('checked'));
    }
    else if (tag == 'select') {
      var values = [];
      $input.find('option:selected').each(function (i, option) {
        values[i] = option.value;
      });
      $input.data('webform-value', values);
    }
    else if (type != 'submit' && type != 'button') {
      $input.data('webform-value', input.value);
    }

  }

  /**
   * Restore an input's value and required attribute.
   *
   * @param input
   *   An input.
   */
  function restoreValueAndRequired(input) {
    var $input = $(input);

    // Restore value.
    var value = $input.data('webform-value');
    if (typeof value !== 'undefined') {
      var type = input.type;
      var tag = input.tagName.toLowerCase(); // Normalize case.

      if (type == 'checkbox' || type == 'radio') {
        $input.prop('checked', value)
      }
      else if (tag == 'select') {
        $.each(value, function (i, option_value) {
          $input.find("option[value='" + option_value + "']").prop("selected", true);
        });
      }
      else if (type != 'submit' && type != 'button') {
        input.value = value;
      }
    }

    // Restore required.
    if ($input.data('webform-required')) {
      $input.prop('required', TRUE);
    }
  }

  /**
   * Clear an input's value and required attributes.
   *
   * @param input
   *   An input.
   */
  function clearValueAndRequired(input) {
    var $input = $(input);

    // Clear value.
    var type = input.type;
    var tag = input.tagName.toLowerCase(); // Normalize case.
    if (type == 'checkbox' || type == 'radio') {
      $input.prop('checked', false);
    }
    else if (tag == 'select') {
      if ($input.find('option[value=""]').length) {
        $input.val('');
      }
      else {
        input.selectedIndex = -1;
      }
    }
    else if (type != 'submit' && type != 'button') {
      input.value = (type == 'color') ? '#000000' : '';
    }

    // Clear required.
    $input.prop('required', false);
  }

})(jQuery, Drupal);
;
/**
 * @file
 * Javascript behaviors for webforms.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Autofocus first input.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the webform autofocusing.
   */
  Drupal.behaviors.webformAutofocus = {
    attach: function (context) {
      $(context).find('.webform-submission-form.js-webform-autofocus :input:visible:enabled:first').focus();
    }
  };

  /**
   * Prevent webform autosubmit on wizard pages.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for disabling webform autosubmit.
   */
  Drupal.behaviors.webformDisableAutoSubmit = {
    attach: function (context) {
      // @see http://stackoverflow.com/questions/11235622/jquery-disable-form-submit-on-enter
      $(context).find('.webform-submission-form.js-webform-disable-autosubmit input').once('webform-disable-autosubmit').on('keyup keypress', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
          e.preventDefault();
          return false;
        }
      });
    }
  };

  /**
   * Skip client-side validation when submit button is pressed.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the skipping client-side validation.
   */
  Drupal.behaviors.webformSubmitNoValidate = {
    attach: function (context) {
      $(context).find(':button.js-webform-novalidate').once('webform-novalidate').on('click', function () {
        $(this.form).attr('novalidate', 'novalidate');
      });
    }
  };

  /**
   * Disable validate when save draft submit button is clicked.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the webform draft submit button.
   */
  Drupal.behaviors.webformDraft = {
    attach: function (context) {
      $(context).find('#edit-draft').once('webform-draft').on('click', function () {
        $(this.form).attr('novalidate', 'novalidate');
      });
    }
  };

  /**
   * Filters the webform element list by a text input search string.
   *
   * The text input will have the selector `input.webform-form-filter-text`.
   *
   * The target element to do searching in will be in the selector
   * `input.webform-form-filter-text[data-element]`
   *
   * The text source where the text should be found will have the selector
   * `.webform-form-filter-text-source`
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the webform element filtering.
   */
  Drupal.behaviors.webformFilterByText = {
    attach: function (context, settings) {
      var $input = $('input.webform-form-filter-text').once('webform-form-filter-text');
      var $table = $($input.attr('data-element'));
      var $filter_rows;

      /**
       * Filters the webform element list.
       *
       * @param {jQuery.Event} e
       *   The jQuery event for the keyup event that triggered the filter.
       */
      function filterElementList(e) {
        var query = $(e.target).val().toLowerCase();

        /**
         * Shows or hides the webform element entry based on the query.
         *
         * @param {number} index
         *   The index in the loop, as provided by `jQuery.each`
         * @param {HTMLElement} label
         *   The label of the webform.
         */
        function toggleEntry(index, label) {
          var $label = $(label);
          var $row = $label.parent().parent();
          var textMatch = $label.text().toLowerCase().indexOf(query) !== -1;
          $row.toggle(textMatch);
        }

        // Filter if the length of the query is at least 2 characters.
        if (query.length >= 2) {
          $filter_rows.each(toggleEntry);
        }
        else {
          $filter_rows.each(function (index) {
            $(this).parent().parent().show();
          });
        }
      }

      if ($table.length) {
        $filter_rows = $table.find('div.webform-form-filter-text-source');
        $input.on('keyup', filterElementList);
      }
    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * Javascript behaviors for details element.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Attach handler to toggle details open/close state.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformDetailsToggle = {
    attach: function (context) {
      $('.js-webform-details-toggle', context).once('webform-details-toggle').each(function () {
        var $form = $(this);
        var $details = $form.find('details');

        // Toggle is only useful when there are two or more details elements.
        if ($details.length < 2) {
          return;
        }

        // Add toggle state link to first details element.
        $details.first().before($('<button type="button" class="link webform-details-toggle-state"></button>')
          .attr('title', Drupal.t('Toggle details widget state.'))
          .on('click', function (e) {
            var open;
            if (isFormDetailsOpen($form)) {
              $form.find('details').removeAttr('open');
              open = 0;
            }
            else {
              $form.find('details').attr('open', 'open');
              open = 1;
            }
            setDetailsToggleLabel($form);

            // Set the saved states for all the details elements.
            // @see webform.element.details.save.js
            if (Drupal.webformDetailsSaveGetName) {
              $form.find('details').each(function () {
                var name = Drupal.webformDetailsSaveGetName($(this));
                if (name) {
                  localStorage.setItem(name, open);
                }
              });
            }
          })
          .wrap('<div class="webform-details-toggle-state-wrapper"></div>')
          .parent()
        );

        setDetailsToggleLabel($form);
      });
    }
  };

  /**
   * Determine if a webform's details are all opened.
   *
   * @param $form
   *   A webform.
   *
   * @returns {boolean}
   *   TRUE if a webform's details are all opened.
   */
  function isFormDetailsOpen($form) {
    return ($form.find('details[open]').length == $form.find('details').length)
  }

  /**
   * Set a webform's details toggle state widget label.
   *
   * @param $form
   *   A webform.
   */
  function setDetailsToggleLabel($form) {
    var label = (isFormDetailsOpen($form)) ? Drupal.t('Collapse all') : Drupal.t('Expand all');
    $form.find('.webform-details-toggle-state').html(label);
  }

})(jQuery, Drupal);
;
/**
 * @file
 * Javascript behaviors for details element.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Attach handler to save details open/close state.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformDetailsSave = {
    attach: function (context) {
      if (!window.localStorage) {
        return;
      }

      // Summary click event handler.
      $('details > summary', context).once('webform-details-summary-save').click(function () {
        var $details = $(this).parent();

        var name = Drupal.webformDetailsSaveGetName($details);
        if (!name) {
          return;
        }

        var open = ($details.attr('open') != 'open') ? 1 : 0;
        localStorage.setItem(name, open);
      });

      // Initialize details open state via local storage.
      $('details', context).once('webform-details-save').each(function () {
        var $details = $(this);

        var name = Drupal.webformDetailsSaveGetName($details);
        if (!name) {
          return;
        }

        var open = localStorage.getItem(name);
        if (open === null) {
          return;
        }

        if (open == 1) {
          $details.attr('open', 'open');
        }
        else {
          $details.removeAttr('open');
        }
      });
    }

  };

  /**
   * Get the name used to store the state of details element.
   *
   * @param $details
   *   A details element.
   *
   * @returns string
   *   The name used to store the state of details element.
   */
  Drupal.webformDetailsSaveGetName = function ($details) {
    if (!window.localStorage) {
      return '';
    }

    // Any details element not included a webform must have define its own id.
    var webformId = $details.attr('data-webform-element-id');
    if (webformId) {
      return 'Drupal.webform.' + webformId.replace('--', '.');
    }

    var detailsId = $details.attr('id');
    if (!detailsId) {
      return '';
    }

    var $form = $details.parents('form');
    if (!$form.length || !$form.attr('id')) {
      return '';
    }

    var formId = $form.attr('id');
    if (!formId) {
      return '';
    }

    // ISSUE: When Drupal renders a webform  in a modal dialog it appends a unique
    // identifier to webform ids and details ids. (ie my-form--FeSFISegTUI)
    // WORKAROUND: Remove the unique id that delimited using double dashes.
    formId = formId.replace(/--.+?$/, '').replace(/-/g, '_');
    detailsId = detailsId.replace(/--.+?$/, '').replace(/-/g, '_');
    return 'Drupal.webform.' + formId + '.' + detailsId;
  }

})(jQuery, Drupal);
;
/*!
 * jQuery UI Tooltip 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/tooltip/
 */(function(e){typeof define=="function"&&define.amd?define(["jquery","./core","./widget","./position"],e):e(jQuery)})(function(e){return e.widget("ui.tooltip",{version:"1.11.4",options:{content:function(){var t=e(this).attr("title")||"";return e("<a>").text(t).html()},hide:!0,items:"[title]:not([disabled])",position:{my:"left top+15",at:"left bottom",collision:"flipfit flip"},show:!0,tooltipClass:null,track:!1,close:null,open:null},_addDescribedBy:function(t,n){var r=(t.attr("aria-describedby")||"").split(/\s+/);r.push(n),t.data("ui-tooltip-id",n).attr("aria-describedby",e.trim(r.join(" ")))},_removeDescribedBy:function(t){var n=t.data("ui-tooltip-id"),r=(t.attr("aria-describedby")||"").split(/\s+/),i=e.inArray(n,r);i!==-1&&r.splice(i,1),t.removeData("ui-tooltip-id"),r=e.trim(r.join(" ")),r?t.attr("aria-describedby",r):t.removeAttr("aria-describedby")},_create:function(){this._on({mouseover:"open",focusin:"open"}),this.tooltips={},this.parents={},this.options.disabled&&this._disable(),this.liveRegion=e("<div>").attr({role:"log","aria-live":"assertive","aria-relevant":"additions"}).addClass("ui-helper-hidden-accessible").appendTo(this.document[0].body)},_setOption:function(t,n){var r=this;if(t==="disabled"){this[n?"_disable":"_enable"](),this.options[t]=n;return}this._super(t,n),t==="content"&&e.each(this.tooltips,function(e,t){r._updateContent(t.element)})},_disable:function(){var t=this;e.each(this.tooltips,function(n,r){var i=e.Event("blur");i.target=i.currentTarget=r.element[0],t.close(i,!0)}),this.element.find(this.options.items).addBack().each(function(){var t=e(this);t.is("[title]")&&t.data("ui-tooltip-title",t.attr("title")).removeAttr("title")})},_enable:function(){this.element.find(this.options.items).addBack().each(function(){var t=e(this);t.data("ui-tooltip-title")&&t.attr("title",t.data("ui-tooltip-title"))})},open:function(t){var n=this,r=e(t?t.target:this.element).closest(this.options.items);if(!r.length||r.data("ui-tooltip-id"))return;r.attr("title")&&r.data("ui-tooltip-title",r.attr("title")),r.data("ui-tooltip-open",!0),t&&t.type==="mouseover"&&r.parents().each(function(){var t=e(this),r;t.data("ui-tooltip-open")&&(r=e.Event("blur"),r.target=r.currentTarget=this,n.close(r,!0)),t.attr("title")&&(t.uniqueId(),n.parents[this.id]={element:this,title:t.attr("title")},t.attr("title",""))}),this._registerCloseHandlers(t,r),this._updateContent(r,t)},_updateContent:function(e,t){var n,r=this.options.content,i=this,s=t?t.type:null;if(typeof r=="string")return this._open(t,e,r);n=r.call(e[0],function(n){i._delay(function(){if(!e.data("ui-tooltip-open"))return;t&&(t.type=s),this._open(t,e,n)})}),n&&this._open(t,e,n)},_open:function(t,n,r){function f(e){a.of=e;if(s.is(":hidden"))return;s.position(a)}var i,s,o,u,a=e.extend({},this.options.position);if(!r)return;i=this._find(n);if(i){i.tooltip.find(".ui-tooltip-content").html(r);return}n.is("[title]")&&(t&&t.type==="mouseover"?n.attr("title",""):n.removeAttr("title")),i=this._tooltip(n),s=i.tooltip,this._addDescribedBy(n,s.attr("id")),s.find(".ui-tooltip-content").html(r),this.liveRegion.children().hide(),r.clone?(u=r.clone(),u.removeAttr("id").find("[id]").removeAttr("id")):u=r,e("<div>").html(u).appendTo(this.liveRegion),this.options.track&&t&&/^mouse/.test(t.type)?(this._on(this.document,{mousemove:f}),f(t)):s.position(e.extend({of:n},this.options.position)),s.hide(),this._show(s,this.options.show),this.options.show&&this.options.show.delay&&(o=this.delayedShow=setInterval(function(){s.is(":visible")&&(f(a.of),clearInterval(o))},e.fx.interval)),this._trigger("open",t,{tooltip:s})},_registerCloseHandlers:function(t,n){var r={keyup:function(t){if(t.keyCode===e.ui.keyCode.ESCAPE){var r=e.Event(t);r.currentTarget=n[0],this.close(r,!0)}}};n[0]!==this.element[0]&&(r.remove=function(){this._removeTooltip(this._find(n).tooltip)});if(!t||t.type==="mouseover")r.mouseleave="close";if(!t||t.type==="focusin")r.focusout="close";this._on(!0,n,r)},close:function(t){var n,r=this,i=e(t?t.currentTarget:this.element),s=this._find(i);if(!s){i.removeData("ui-tooltip-open");return}n=s.tooltip;if(s.closing)return;clearInterval(this.delayedShow),i.data("ui-tooltip-title")&&!i.attr("title")&&i.attr("title",i.data("ui-tooltip-title")),this._removeDescribedBy(i),s.hiding=!0,n.stop(!0),this._hide(n,this.options.hide,function(){r._removeTooltip(e(this))}),i.removeData("ui-tooltip-open"),this._off(i,"mouseleave focusout keyup"),i[0]!==this.element[0]&&this._off(i,"remove"),this._off(this.document,"mousemove"),t&&t.type==="mouseleave"&&e.each(this.parents,function(t,n){e(n.element).attr("title",n.title),delete r.parents[t]}),s.closing=!0,this._trigger("close",t,{tooltip:n}),s.hiding||(s.closing=!1)},_tooltip:function(t){var n=e("<div>").attr("role","tooltip").addClass("ui-tooltip ui-widget ui-corner-all ui-widget-content "+(this.options.tooltipClass||"")),r=n.uniqueId().attr("id");return e("<div>").addClass("ui-tooltip-content").appendTo(n),n.appendTo(this.document[0].body),this.tooltips[r]={element:t,tooltip:n}},_find:function(e){var t=e.data("ui-tooltip-id");return t?this.tooltips[t]:null},_removeTooltip:function(e){e.remove(),delete this.tooltips[e.attr("id")]},_destroy:function(){var t=this;e.each(this.tooltips,function(n,r){var i=e.Event("blur"),s=r.element;i.target=i.currentTarget=s[0],t.close(i,!0),e("#"+n).remove(),s.data("ui-tooltip-title")&&(s.attr("title")||s.attr("title",s.data("ui-tooltip-title")),s.removeData("ui-tooltip-title"))}),this.liveRegion.remove()}})});;
/**
 * @file
 * Javascript behaviors for jQuery UI tooltip integration.
 *
 * Please Note:
 * jQuery UI's tooltip implementation is not very responsive or adaptive.
 *
 * @see https://www.drupal.org/node/2207383
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Initialize jQuery UI tooltip element support.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTooltipElement = {
    attach: function (context) {
      $(context).find('.js-webform-tooltip-element').once('webform-tooltip-element').each(function () {
        var $element = $(this);
        var $description = $element.children('.description.visually-hidden');
        $element.tooltip({
          items: ':input',
          content: $description.html()
        });
      });
    }
  };

  /**
   * Initialize jQuery UI tooltip link support.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTooltipLink = {
    attach: function (context) {
      $(context).find('a.js-webform-tooltip-link').once('webform-tooltip-link').each(function () {
        $(this).tooltip();
      });
    }
  };

})(jQuery, Drupal);
;
