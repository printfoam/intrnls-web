/* ============================================================================
   intrnls.com — contact form: validation, states, and sending.

   SENDING IS WIRED. The send path is the SEND function below. It never
   reports success without an explicit acknowledgement from the server, and
   never posts without a completed bot check. Do not "simplify" either
   property, and do not add a catch that resolves.

   ACCESSIBILITY CONTRACT, in one place so it cannot rot:
   - Every error is a WORD, next to a GLYPH, in a colour that passes AA on this
     ground. Never colour alone.
   - Each error is wired to its field with aria-describedby, and the field is
     marked aria-invalid="true" — so it is announced on focus, not just seen.
   - The summary is role="alert" + tabindex="-1": it announces itself and takes
     focus, and each item is a link straight to the field that failed.
   - "Sending" is a polite live region; success takes focus. Neither is a colour.
   - Nothing steals focus except in direct response to the user pressing Send.
   ============================================================================ */
(function () {
  'use strict';

  /* ============================================================================
     intrnls.com contact form -- the send path.

     PUBLIC-SAFE BY CONSTRUCTION. This file is copied VERBATIM into the public
     site repo, so it contains no internal identifiers, no infrastructure detail
     beyond the endpoint the browser must call, no review finding references and
     no risk commentary. If you are about to add a comment explaining WHY a
     decision was taken, it belongs in the private repo, not here.

     Two properties this code exists to guarantee. Do not "simplify" either one:

     1. It NEVER reports success for a message the server did not acknowledge.
        A 2xx alone is not enough -- the response must be JSON and must say so
        explicitly. Do not add a catch that resolves, and do not retry: a retry
        risks sending twice after the visitor was told it failed.

     2. It NEVER posts without a completed bot check, and the check is loaded
        only when someone starts using the form. Opening the page contacts no
        third party at all.

     A failure here must always be an honest failure. The visitor keeps their
     text and is told to email us instead.
     ============================================================================ */
  var SEND = (function () {
    'use strict';

    var SITEKEY  = '0x4AAAAAAEqLt1nfGbK43WFW';
    var ENDPOINT = 'https://intrnls-contact-g0hge6fqamhybmbc.centralus-01.azurewebsites.net/api/contact';

    var SCRIPT_TIMEOUT_MS = 10000;   /* budget for the bot-check script to load  */
    var CHALLENGE_MS      = 12000;   /* budget for a non-interactive challenge   */
    var INTERACTIVE_MS    = 120000;  /* budget once a PERSON has to click something */
    var MAX_RECOVERIES    = 2;

    /* 'idle' -> 'loading' -> 'rendered' -> 'ready', or -> 'failed' */
    var state = 'idle';
    var widgetId = null;
    var loadTimer = null;
    var readyWaiters = [];
    var recoveries = 0;
    var awaitingPerson = false;
    var scriptEl = null;

    function settleWaiters(ok, why) {
      var list = readyWaiters;
      readyWaiters = [];
      for (var i = 0; i < list.length; i++) {
        if (ok) { list[i].resolve(); } else { list[i].reject(new Error(why)); }
      }
    }

    function markFailed(why) {
      state = 'failed';
      clearTimeout(loadTimer);
      settleWaiters(false, why);
    }

    function status(msg) {
      var el = document.getElementById('form-status-msg');
      if (el) el.textContent = msg;
    }

    /* The bot check is invisible until the provider decides a person must act.
       When that happens the visitor is looking at "Sending your message...", with
       a checkbox that appeared somewhere below and no reason to think anything is
       expected of them. Say so, take them to it, and stop the clock -- a person
       needs longer to notice and read than an automatic check needs to run. */
    function personNeeded() {
      awaitingPerson = true;
      status('One more step: confirm you are human to finish sending.');
      var box = document.getElementById('c-turnstile');
      if (box) {
        box.setAttribute('tabindex', '-1');
        try { box.focus(); } catch (e) {}
        if (box.scrollIntoView) box.scrollIntoView({ block: 'center' });
      }
    }

    function personDone() {
      awaitingPerson = false;
      status('Sending your message...');
    }

    /* The provider's onload= takes the NAME of a global, so this has to be one. */
    window.__intrnlsTurnstileReady = function () {
      clearTimeout(loadTimer);
      if (state === 'failed') return;
      if (!window.turnstile || !window.turnstile.render) {
        markFailed('turnstile-unavailable');
        return;
      }
      var box = document.getElementById('c-turnstile');
      if (!box) { markFailed('turnstile-no-container'); return; }
      try {
        /* Set BEFORE render(). If render ever invokes callback synchronously --
           a pre-cleared challenge does this -- then assigning after would
           overwrite the 'ready' the callback just set, and a waiter released by
           it would read widgetId while it was still null. */
        state = 'rendered';
        widgetId = window.turnstile.render(box, {
          sitekey: SITEKEY,
          appearance: 'interaction-only',
          execution: 'render',
          'refresh-expired': 'auto',
          callback: function () {
            personDone();
            if (state !== 'failed') state = 'ready';
            settleWaiters(true);
          },
          'before-interactive-callback': personNeeded,
          'after-interactive-callback': personDone,
          'error-callback': function (c) { markFailed('turnstile-' + (c || 'error')); },
          'timeout-callback': function () { markFailed('turnstile-timeout'); },
          'expired-callback': function () { if (state === 'ready') state = 'rendered'; }
        });
      } catch (e) {
        markFailed('turnstile-render-threw');
      }
    };

    function loadTurnstile() {
      if (state !== 'idle') return;
      state = 'loading';
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js' +
              '?render=explicit&onload=__intrnlsTurnstileReady';
      s.async = true;
      s.defer = true;
      /* Blockers and filtered DNS: some fire onerror, some null-route in silence.
         The timer catches the silent case. Either way the visitor gets an honest
         failure, never a hang and never a false success. */
      s.onerror = function () { markFailed('turnstile-blocked'); };
      loadTimer = setTimeout(function () {
        if (state === 'loading') markFailed('turnstile-load-timeout');
      }, SCRIPT_TIMEOUT_MS);
      scriptEl = s;
      document.head.appendChild(s);
    }

    /* A FAILURE MUST NOT BE PERMANENT.
       Previously any one transient error -- a stalled script on hotel wifi, a
       blip mid-challenge -- set state to 'failed' forever. Every later press then
       rejected instantly, so the form told the visitor "try again" while being
       incapable of ever succeeding, and nothing suggested reloading. Recovery is
       bounded, and it grants nothing: there is still no token and still no post
       until a real check completes. */
    function tryRecover() {
      if (recoveries >= MAX_RECOVERIES) return false;
      recoveries++;
      clearTimeout(loadTimer);
      if (scriptEl && scriptEl.parentNode) scriptEl.parentNode.removeChild(scriptEl);
      scriptEl = null;
      widgetId = null;
      awaitingPerson = false;
      state = 'idle';
      loadTurnstile();
      return true;
    }

    /* Trigger on first interaction with a REAL field. The trap field is excluded
       on purpose: password managers populate hidden fields, and an autofill event
       must not be what causes a request to the provider. Focusing Send is also a
       trigger, the cheapest head start for someone who tabs straight there. */
    (function bindTriggers() {
      var form = document.getElementById('contact-form');
      if (!form) return;
      var fields = form.querySelectorAll('input, textarea, select');
      for (var i = 0; i < fields.length; i++) {
        if (fields[i].id === 'c-website') continue;
        fields[i].addEventListener('focus', loadTurnstile, true);
        fields[i].addEventListener('input', loadTurnstile, true);
      }
      var btn = document.getElementById('c-submit');
      if (btn) btn.addEventListener('focus', loadTurnstile, true);
    }());

    /* Restoring from the back/forward cache freezes timers, so an existing token
       is stale and auto-refresh has not run. Reset on restore rather than making
       the visitor's first press fail for no reason. */
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      if (window.turnstile && widgetId !== null) {
        try { window.turnstile.reset(widgetId); state = 'rendered'; } catch (err) {}
      }
      if (state === 'failed') { recoveries = 0; }
    });

    /* Resolves only when a token exists. Never resolves without one. */
    function awaitToken() {
      return new Promise(function (resolve, reject) {
        if (state === 'failed' && !tryRecover()) {
          reject(new Error('turnstile-failed'));
          return;
        }
        loadTurnstile();                                   /* no-op unless idle */

        var token = (window.turnstile && widgetId !== null)
          ? window.turnstile.getResponse(widgetId) : '';
        if (token) { resolve(); return; }

        var waiter = { resolve: resolve, reject: reject };
        readyWaiters.push(waiter);

        /* The two budgets are SEQUENTIAL, not concurrent. The script load clock
           and the challenge clock used to start together, so a script that took
           nine seconds left the challenge three -- routinely fatal on a slow
           connection, for the very visitor who tabbed straight to Send. And once
           a person is being asked to click, the deadline moves out again: no
           human deadline should be twelve seconds. */
        var deadline = function () {
          var budget = (state === 'loading' ? SCRIPT_TIMEOUT_MS : 0) +
                       (awaitingPerson ? INTERACTIVE_MS : CHALLENGE_MS);
          return budget;
        };
        var started = Date.now();
        var tick = setInterval(function () {
          if (readyWaiters.indexOf(waiter) === -1) { clearInterval(tick); return; }
          if (Date.now() - started < deadline()) return;
          clearInterval(tick);
          var ix = readyWaiters.indexOf(waiter);
          if (ix !== -1) {
            readyWaiters.splice(ix, 1);
            reject(new Error('turnstile-wait-timeout'));
          }
        }, 250);
      });
    }

    function burnToken() {
      if (window.turnstile && widgetId !== null) {
        try { window.turnstile.reset(widgetId); } catch (e) {}
        if (state !== 'failed') state = 'rendered';
      }
    }

    function post(token, data) {
      var hp = document.getElementById('c-website');
      var payload = {
        name: data.name,
        email: data.email,
        organization: data.organization,
        kind: data.kind,
        message: data.message,
        /* Read straight from the DOM so wiring the trap needs no change to the
           validation code. A filled trap is an honest failure, never a silent
           success for a message that was not sent. */
        website: (hp && hp.value) || '',
        /* This key must match the server exactly. Any unexpected key is refused. */
        turnstile: token
      };

      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        /* A token is SINGLE USE. Burn it whatever happened, or a retry replays it,
           the provider rejects the duplicate, and the form is stuck failing with
           no way for the visitor to recover. */
        burnToken();
        var ct = r.headers.get('content-type') || '';
        if (!r.ok) throw new Error('http ' + r.status);
        if (ct.indexOf('application/json') === -1) throw new Error('not json');
        return r.json();
      }, function (networkError) {
        burnToken();
        throw networkError;
      }).then(function (j) {
        /* The acknowledgement, and the only path to success. */
        if (!j || j.ok !== true) throw new Error('not acknowledged');
        return j;
      });
    }

    return function (data) {
      return awaitToken().then(function () {
        var token = window.turnstile.getResponse(widgetId);
        if (token && !window.turnstile.isExpired(widgetId)) return post(token, data);

        /* Expired or missing on first look is the widget's own lifecycle, not the
           visitor's mistake. Reset and wait once more before giving up. */
        burnToken();
        return awaitToken().then(function () {
          var again = window.turnstile.getResponse(widgetId);
          if (!again || window.turnstile.isExpired(widgetId)) {
            throw new Error('turnstile-expired');
          }
          return post(again, data);
        });
      });
    };
  }());

  var form = document.getElementById('contact-form');
  if (!form) return;

  var alertBox   = document.getElementById('form-alert');
  var alertTitle = document.getElementById('form-alert-title');
  var alertList  = document.getElementById('form-alert-list');
  var status     = document.getElementById('form-status');
  var statusMsg  = document.getElementById('form-status-msg');
  var success    = document.getElementById('form-success');
  var submitBtn  = document.getElementById('c-submit');

  /* Field rules. The message says what to DO, not what went wrong: "Add your
     name" beats "This field is invalid" for everyone and especially for someone
     hearing it read out with no view of the field. */
  var FIELDS = [
    {
      id: 'c-name',
      label: 'Your name',
      test: function (v) { return v.trim().length > 0; },
      message: 'Add your name so we know who we are talking to.'
    },
    {
      id: 'c-email',
      label: 'Email',
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      message: 'Add an email address we can reply to, like you@company.com.'
    },
    {
      id: 'c-message',
      label: 'What are you making?',
      test: function (v) { return v.trim().length >= 10; },
      message: 'Tell us a little about what you are making — a sentence is enough.'
    },
    /* THE LIMITS BELOW MIRROR THE SERVER EXACTLY. Where they drift, the visitor
       gets a generic "something went wrong at our end" for input the server was
       always going to refuse, is told to try again, and the retry cannot work.
       If a server limit changes, change it here in the same commit. */
    {
      id: 'c-name',
      label: 'Your name',
      test: function (v) { return v.trim().length <= 100; },
      message: 'That name is longer than we can accept. Please shorten it.'
    },
    {
      id: 'c-org',
      label: 'Company or project',
      test: function (v) { return v.trim().length <= 200; },
      message: 'That is longer than we can accept. Please shorten it.'
    },
    {
      id: 'c-message',
      label: 'What are you making?',
      test: function (v) {
        var t = v.trim();
        return t.length <= 5000 && t.split('\n').length <= 200;
      },
      message: 'That message is longer than the form accepts. Trim it to a few ' +
               'paragraphs, or email it to us directly.'
    }
  ];

  function el(id) { return document.getElementById(id); }

  function setFieldError(field, on) {
    var input = el(field.id);
    var err = el('err-' + field.id);
    if (!input || !err) return;
    input.setAttribute('aria-invalid', on ? 'true' : 'false');
    err.querySelector('.msg').textContent = on ? field.message : '';
    err.hidden = !on;
  }

  function validate(only) {
    var failed = [];
    FIELDS.forEach(function (field) {
      if (only && only !== field.id) return;
      var input = el(field.id);
      if (!input) return;
      var ok = field.test(input.value);
      setFieldError(field, !ok);
      if (!ok) failed.push(field);
    });
    return failed;
  }

  function showSummary(failed) {
    alertTitle.textContent = failed.length === 1
      ? 'There is 1 thing to fix before this can be sent.'
      : 'There are ' + failed.length + ' things to fix before this can be sent.';
    alertList.textContent = '';
    failed.forEach(function (field) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + field.id;
      a.textContent = field.label + ' — ' + field.message;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var input = el(field.id);
        if (input) input.focus();
      });
      li.appendChild(a);
      alertList.appendChild(li);
    });
    alertBox.hidden = false;
    alertBox.focus();
  }

  function clearSummary() {
    alertBox.hidden = true;
    alertList.textContent = '';
  }

  function setStatus(state, message) {
    if (!state) { status.hidden = true; statusMsg.textContent = ''; return; }
    status.setAttribute('data-state', state);
    statusMsg.textContent = message;
    status.hidden = false;
  }

  function setBusy(on) {
    form.setAttribute('aria-busy', on ? 'true' : 'false');
    /* aria-disabled, not disabled: a disabled button drops out of the tab order
       and can take focus with it mid-submit. The click handler below is what
       actually refuses the second press. */
    submitBtn.setAttribute('aria-disabled', on ? 'true' : 'false');
  }

  function showFailure(title, detail) {
    alertTitle.textContent = title;
    alertList.textContent = '';
    var li = document.createElement('li');
    li.textContent = detail;
    alertList.appendChild(li);
    alertBox.hidden = false;
    alertBox.focus();
  }

  function showSuccess() {
    clearSummary();
    setStatus(null);
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  /* --- live correction: clear a field's error as soon as it is fixed, but never
     raise a NEW error while someone is still typing. Errors appear on submit and
     on blur; they disappear the moment the field is right. -------------------- */
  FIELDS.forEach(function (field) {
    var input = el(field.id);
    if (!input) return;
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true' && field.test(input.value)) {
        setFieldError(field, false);
      }
    });
    input.addEventListener('blur', function () {
      if (input.value.trim() !== '') validate(field.id);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();                       /* nothing navigates, nothing posts */
    if (submitBtn.getAttribute('aria-disabled') === 'true') return;

    clearSummary();
    var failed = validate();
    if (failed.length) {
      setStatus(null);
      showSummary(failed);
      return;
    }

    setBusy(true);
    setStatus('busy', 'Sending your message…');

    var data = {
      name: el('c-name').value.trim(),
      email: el('c-email').value.trim(),
      organization: el('c-org') ? el('c-org').value.trim() : '',
      kind: el('c-kind') ? el('c-kind').value : '',
      message: el('c-message').value.trim()
    };

    var attempt = SEND(data);

    /* The 700ms is not a fake delay for a fake send — it is the minimum time the
       "Sending" state stays legible, so it cannot flash past unread.
       The outcome is folded into a RESOLVED value first, deliberately: a bare
       Promise.all rejects the instant the attempt fails and skips the floor
       entirely, so a failure flashed past at 0ms while a success sat for 700ms.
       Measured, not assumed — it is what the browser actually did. */
    var settled = attempt.then(
      function () { return { ok: true }; },
      function (e) { return { ok: false, reason: e }; }
    );
    var floor = new Promise(function (r) { setTimeout(r, 700); });

    Promise.all([settled, floor]).then(function (res) {
      var outcome = res[0];
      if (outcome.ok) {
        setBusy(false);
        showSuccess();
      } else {
        var reason = outcome.reason;
        setBusy(false);
        setStatus(null);
        /* Say something TRUE. The blanket "our end, not yours, try again" was
           wrong for a refusal the server was always going to make, and the
           retry it advises is guaranteed to fail. The HTTP status is already
           in the browser, so using it leaks nothing, and it still never says
           WHICH rule fired. */
        var m = /^http (\d+)$/.exec((reason && reason.message) || '');
        var code = m ? Number(m[1]) : 0;
        if (code === 400 || code === 413) {
          showFailure(
            'That did not send.',
            'Your message is longer than the form accepts, or one of the fields ' +
            'is not something we can handle. Shorten it and try again, or email ' +
            'us directly.'
          );
        } else if (code === 429) {
          showFailure(
            'That did not send.',
            'There have been too many attempts from this connection recently. ' +
            'Please email us directly and we will pick it up.'
          );
        } else if (code === 403) {
          showFailure(
            'That did not send.',
            'The bot check did not complete. Reload the page and try once more, ' +
            'or email us directly.'
          );
        } else {
          showFailure(
            'That did not send.',
            'Something went wrong at our end, not yours — your message is still ' +
            'in the form. If you do not hear from us within a day, email us ' +
            'directly rather than resending.'
          );
        }
      }
    });
  });

  /* --------------------------------------------------------------------------
     STATE PREVIEW — a review tool, not a feature. ?state=… paints one state so
     the art director and the reviewer can look at all six without submitting
     anything. It never sends and never fakes a send; ?state=success paints what
     a WIRED form would show, which is why it is a URL and not a code path.
     Documented in web/README.md §12.
     -------------------------------------------------------------------------- */
  /* LOCAL ONLY. On a live form this block is a hazard, not a review tool:
     ?state=success paints a literal "Sent." for a message that was never sent,
     which is the one thing this project has a rule about, and reachable by a
     shared link or a stale bookmark. ?state=submitting sets aria-disabled on
     the button, and the submit handler honours it, so the form silently
     swallows every press with no error at all. */
  var isLocal = location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1' ||
                location.protocol === 'file:';
  if (!isLocal) return;

  var preview = new URLSearchParams(window.location.search).get('state');
  if (!preview) return;

  if (preview === 'invalid') {
    showSummary(validate());
  } else if (preview === 'submitting') {
    setBusy(true);
    setStatus('busy', 'Sending your message…');
  } else if (preview === 'success') {
    showSuccess();
  } else if (preview === 'server-error') {
    showFailure(
      'That did not send.',
      'Something went wrong at our end, not yours — your message is still in the form. ' +
      'Try again, or email us directly.'
    );
  }
})();
