/* ============================================================================
   intrnls.com — contact form: validation, states, and NO SENDING.

   ┌──────────────────────────────────────────────────────────────────────────┐
   │  THE SEAM.  This form is inert on purpose. There is no endpoint, no mail  │
   │  service and no third party — nothing here talks to the network.          │
   │                                                                          │
   │  To wire it up, replace SEND with a real function returning a Promise:    │
   │                                                                          │
   │      var SEND = function (data) {                                        │
   │        return fetch('/api/contact', {                                    │
   │          method: 'POST',                                                 │
   │          headers: { 'Content-Type': 'application/json' },                │
   │          body: JSON.stringify(data)                                      │
   │        }).then(function (r) {                                            │
   │          if (!r.ok) throw new Error('http ' + r.status);                 │
   │          return r;                                                       │
   │        });                                                               │
   │      };                                                                  │
   │                                                                          │
   │  …then delete the "not connected" notice at the top of the form in        │
   │  contact.html. Do not make SEND resolve without an acknowledgement from   │
   │  the server: a success message for something that was never sent is the   │
   │  exact failure this project has a rule about (CLAUDE.md, rule 2).         │
   └──────────────────────────────────────────────────────────────────────────┘

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

  var SEND = null;                 /* ← the seam. null = nothing is wired. */

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
    /* "Nothing was sent" and "Sent." must never be on screen together. The
       skeleton notice is deleted for real when the form is wired; this keeps the
       ?state=success preview from showing a contradiction in the meantime. */
    var skeletonNote = document.querySelector('[data-skeleton-notice]');
    if (skeletonNote) skeletonNote.hidden = true;
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
      organisation: el('c-org') ? el('c-org').value.trim() : '',
      kind: el('c-kind') ? el('c-kind').value : '',
      message: el('c-message').value.trim()
    };

    var attempt = SEND
      ? SEND(data)
      : Promise.reject({ unwired: true });

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
        if (reason && reason.unwired) {
          showFailure(
            'This form is not connected yet.',
            'Nothing was sent and nothing was stored. Use the contact details on this ' +
            'page instead — and if you are the person building this site, the seam is ' +
            'the SEND constant at the top of js/contact-form.js.'
          );
        } else {
          showFailure(
            'That did not send.',
            'Something went wrong at our end, not yours — your message is still in the ' +
            'form. Try again, or email us directly.'
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
  } else if (preview === 'unwired') {
    showFailure(
      'This form is not connected yet.',
      'Nothing was sent and nothing was stored. Use the contact details on this page ' +
      'instead — and if you are the person building this site, the seam is the SEND ' +
      'constant at the top of js/contact-form.js.'
    );
  }
})();
