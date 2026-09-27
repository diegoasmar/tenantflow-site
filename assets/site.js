/*
  Tenant Flow · script único do site

  Configuração:
  - GA_MEASUREMENT_ID: cole o ID do Google Analytics 4 (ex.: G-ABC123XYZ).
    Enquanto ele não for preenchido, nenhum script de análise é carregado.
  - FORM_ENDPOINT: destino do formulário de contato (FormSubmit).
    No primeiro envio o FormSubmit manda um e-mail de ativação para
    contato@tenantflow.com.br; é preciso clicar no link dele uma vez.
*/
(function () {
  'use strict';

  var GA_MEASUREMENT_ID = '';
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/contato@tenantflow.com.br';

  /* Google Analytics: só carrega com um ID válido configurado. */
  function initAnalytics() {
    if (!/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) return;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }

  function track(eventName, params) {
    if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
  }

  /* Borda do cabeçalho aparece depois que a página rola. */
  function initStickyHeader() {
    var header = document.querySelector('.site-header');
    if (!header || !('IntersectionObserver' in window)) return;

    var sentinel = document.createElement('div');
    sentinel.className = 'visually-hidden';
    sentinel.setAttribute('aria-hidden', 'true');
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* Menu do celular. */
  function initMobileMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var menu = document.getElementById(toggle ? toggle.getAttribute('aria-controls') : '');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.menu-toggle__label').textContent = open ? 'Fechar' : 'Menu';
      menu.hidden = !open;
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia('(min-width: 64rem)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* Formulário de diagnóstico. */
  function initLeadForm() {
    var form = document.getElementById('lead-form');
    if (!form) return;

    var status = form.querySelector('.form__status');
    var button = form.querySelector('button[type="submit"]');
    var buttonLabel = button.textContent;

    var messages = {
      valueMissing: 'Preencha este campo.',
      typeMismatch: 'Informe um e-mail válido, como nome@empresa.com.'
    };

    preselectSubject(form);

    function errorFor(field) {
      return document.getElementById(field.id + '-error');
    }

    function validate(field) {
      var error = errorFor(field);
      if (!error) return true;

      var validity = field.validity;
      var message = '';
      if (validity.valueMissing) message = messages.valueMissing;
      else if (validity.typeMismatch) message = messages.typeMismatch;

      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      error.textContent = message;
      return !message;
    }

    form.addEventListener('blur', function (event) {
      if (event.target.matches('input, select, textarea') && event.target.value) validate(event.target);
    }, true);

    form.addEventListener('input', function (event) {
      if (event.target.getAttribute('aria-invalid') === 'true') validate(event.target);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var fields = Array.prototype.slice.call(form.querySelectorAll('[required]'));
      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!validate(field) && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      setStatus('', false);
      button.disabled = true;
      button.textContent = 'Enviando…';

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          form.reset();
          setStatus('Pedido recebido. Respondemos em até 1 dia útil para marcar a conversa.', false);
          track('generate_lead', { form: 'diagnostico' });
        })
        .catch(function () {
          setStatus('Não foi possível enviar agora. Tente de novo em instantes ou escreva para contato@tenantflow.com.br.', true);
        })
        .then(function () {
          button.disabled = false;
          button.textContent = buttonLabel;
        });
    });

    function setStatus(text, isError) {
      status.textContent = text;
      status.classList.toggle('form__status--error', Boolean(isError));
    }
  }

  /* Links como /?assunto=migracao#contato já abrem o formulário no assunto certo. */
  function preselectSubject(form) {
    var subject = new URLSearchParams(window.location.search).get('assunto');
    var select = form.querySelector('select[name="assunto"]');
    if (!subject || !select) return;

    var option = select.querySelector('option[data-key="' + subject + '"]');
    if (option) select.value = option.value;
  }

  initAnalytics();
  initStickyHeader();
  initMobileMenu();
  initLeadForm();
})();
