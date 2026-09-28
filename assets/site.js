/*
  Tenant Flow · script único do site

  Configuração:
  - GA_MEASUREMENT_ID: cole o ID do Google Analytics 4 (ex.: G-ABC123XYZ).
    Enquanto ele não for preenchido, nenhum script de análise é carregado.
  - WEB3FORMS_KEY: chave de acesso do Web3Forms (web3forms.com). Com ela
    preenchida, os pedidos do formulário chegam por ali. É uma chave pública,
    feita para ficar no código do site.
  - FORMSUBMIT_ENDPOINT: segundo caminho de envio, usado se o primeiro falhar.
  - Se nenhum serviço responder, o visitante recebe um botão que abre o
    e-mail dele com o pedido já escrito. Nenhum pedido se perde em silêncio.

  Movimento: tudo que anima respeita a opção "reduzir movimento" do sistema
  e fica parado quando a parte da página não está visível.
*/
(() => {
  'use strict';

  const GA_MEASUREMENT_ID = '';
  const WEB3FORMS_KEY = '';
  /* Todo pedido de diagnóstico chega para os três endereços abaixo (o primeiro
     recebe o e-mail, os outros entram em cópia). */
  const LEAD_RECIPIENTS = ['suporte@tenantflow.com.br', 'tenantflow@outlook.com', 'diego.asmar@gmail.com'];
  const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${LEAD_RECIPIENTS[0]}`;
  const LEAD_CC = LEAD_RECIPIENTS.slice(1).join(',');
  const CONTACT_EMAIL = LEAD_RECIPIENTS.join(',');

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Google Analytics: só carrega com um ID válido configurado. */
  function initAnalytics() {
    if (!/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }

  function track(eventName, params = {}) {
    if (typeof window.gtag === 'function') window.gtag('event', eventName, params);
  }

  /* Borda do cabeçalho aparece depois que a página rola. */
  function initStickyHeader() {
    const header = document.querySelector('.site-header');
    if (!header || !('IntersectionObserver' in window)) return;

    const sentinel = document.createElement('div');
    sentinel.className = 'visually-hidden';
    sentinel.setAttribute('aria-hidden', 'true');
    document.body.prepend(sentinel);

    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-stuck', !entry.isIntersecting);
    }).observe(sentinel);
  }

  /* Menu do celular. */
  function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.menu-toggle__label').textContent = open ? 'Fechar' : 'Menu';
      menu.hidden = !open;
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia('(min-width: 64rem)').addEventListener('change', (mq) => {
      if (mq.matches) setOpen(false);
    });
  }

  /* Formulário de diagnóstico. */
  function initLeadForm() {
    const form = document.getElementById('lead-form');
    if (!form) return;

    const status = form.querySelector('.form__status');
    const button = form.querySelector('button[type="submit"]');
    const buttonLabel = button.textContent;

    const messages = {
      valueMissing: 'Preencha este campo.',
      typeMismatch: 'Informe um e-mail válido, como nome@empresa.com.'
    };

    preselectSubject(form);

    const errorFor = (field) => document.getElementById(`${field.id}-error`);

    function validate(field) {
      const error = errorFor(field);
      if (!error) return true;

      const { validity } = field;
      let message = '';
      if (validity.valueMissing) message = messages.valueMissing;
      else if (validity.typeMismatch) message = messages.typeMismatch;

      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      error.textContent = message;
      return !message;
    }

    const setStatus = (text, isError) => {
      status.textContent = text;
      status.classList.toggle('form__status--error', Boolean(isError));
    };

    form.addEventListener('blur', (event) => {
      if (event.target.matches('input, select, textarea') && event.target.value) validate(event.target);
    }, true);

    form.addEventListener('input', (event) => {
      if (event.target.getAttribute('aria-invalid') === 'true') validate(event.target);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const invalid = [...form.querySelectorAll('[required]')].filter((field) => !validate(field));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }

      setStatus('', false);
      clearFallback();
      button.disabled = true;
      button.textContent = 'Enviando…';

      const lead = readLead(form);
      try {
        await sendLead(lead);
        form.reset();
        setStatus('Pedido recebido. Respondemos em até 1 dia útil para marcar a conversa.', false);
        track('generate_lead', { form: 'diagnostico' });
      } catch {
        setStatus('Não conseguimos enviar pelo site agora. Seus dados não se perderam: use o botão abaixo para mandar o mesmo pedido pelo seu e-mail.', true);
        showFallback(lead);
        track('lead_fallback', { form: 'diagnostico' });
      } finally {
        button.disabled = false;
        button.textContent = buttonLabel;
      }
    });

    function clearFallback() {
      form.querySelector('.form__fallback')?.remove();
    }

    function showFallback(lead) {
      const link = document.createElement('a');
      link.className = 'button button--outline button--block form__fallback';
      link.href = mailtoFor(lead);
      link.textContent = 'Enviar o pedido pelo meu e-mail';
      status.after(link);
    }
  }

  /* Dados do formulário, já com rótulos legíveis para quem recebe. */
  function readLead(form) {
    const data = new FormData(form);
    const value = (name) => String(data.get(name) || '').trim();
    return {
      trap: value('_honey'),
      fields: {
        Nome: value('nome'),
        Empresa: value('empresa'),
        'E-mail': value('email'),
        Telefone: value('telefone') || 'não informado',
        Assunto: value('assunto'),
        Mensagem: value('mensagem') || 'sem mensagem'
      }
    };
  }

  const withTimeout = (url, options, ms = 12000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
  };

  async function viaWeb3Forms(lead) {
    const response = await withTimeout('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Novo pedido de diagnóstico: ${lead.fields.Empresa}`,
        from_name: 'Site Tenant Flow',
        replyto: lead.fields['E-mail'],
        cc: LEAD_CC,
        ...lead.fields
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || `HTTP ${response.status}`);
  }

  async function viaFormSubmit(lead) {
    const response = await withTimeout(FORMSUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `Novo pedido de diagnóstico: ${lead.fields.Empresa}`,
        _template: 'table',
        _captcha: 'false',
        _replyto: lead.fields['E-mail'],
        _cc: LEAD_CC,
        ...lead.fields
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || String(result.success) === 'false') throw new Error(result.message || `HTTP ${response.status}`);
  }

  /* Tenta os serviços em ordem; só falha se todos falharem. */
  async function sendLead(lead) {
    if (lead.trap) return;
    const senders = WEB3FORMS_KEY ? [viaWeb3Forms, viaFormSubmit] : [viaFormSubmit];
    let lastError;
    for (const send of senders) {
      try {
        await send(lead);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  function mailtoFor(lead) {
    const body = Object.entries(lead.fields).map(([label, text]) => `${label}: ${text}`).join('\n');
    const subject = `Pedido de diagnóstico: ${lead.fields.Empresa}`;
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  /* Links como /?assunto=migracao#contato já abrem o formulário no assunto certo. */
  function preselectSubject(form) {
    const subject = new URLSearchParams(window.location.search).get('assunto');
    const select = form.querySelector('select[name="assunto"]');
    if (!subject || !select) return;

    const option = select.querySelector(`option[data-key="${CSS.escape(subject)}"]`);
    if (option) select.value = option.value;
  }

  /* Blocos entram suavemente conforme a página rola. Só marca o que ainda
     está abaixo da dobra, para nada piscar no carregamento. */
  function initReveal() {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    const groups = [
      '.section-head', '.audience__inner > *', '.service', '.stack > div',
      '.steps-row > li', '.dx__copy', '.dx .report', '.promise', '.reach > *',
      '.plan', '.post', '.faq > details', '.contact__steps > li', '.contact__direct',
      '.contact__card', '.checklist > li', '.steps > li', '.features > li',
      '.related', '.cta-band .container > *', '.table-wrap'
    ];

    const fold = window.innerHeight * 0.92;
    const targets = [];

    groups.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.classList.contains('rv') || el.getBoundingClientRect().top < fold) return;
        const siblings = [...el.parentElement.children].filter((c) => c.matches(selector));
        const index = Math.min(siblings.indexOf(el), 5);
        el.style.setProperty('--rv-delay', `${index * 0.08}s`);
        el.classList.add('rv');
        targets.push(el);
      });
    });

    if (!targets.length) return;
    document.documentElement.classList.add('motion');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    targets.forEach((el) => observer.observe(el));
  }

  function countUp(el) {
    const end = Number(el.dataset.count);
    const start = performance.now();
    const duration = 1100;
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------
     Cena do hero: Outlook e Teams em uso.

     O HTML já traz um estado inicial completo. Aqui três roteiros rodam
     em paralelo: e-mails chegando no Outlook (com notificação e clique),
     a conversa no Teams (digitando, enviando, reações) e o cartão de
     migração contando as caixas. Tudo pausa quando a cena sai da tela
     ou a aba fica em segundo plano.
     ------------------------------------------------------------------ */

  const PEOPLE = {
    ana: { name: 'Ana Ribeiro', initials: 'AR', tone: 'berry' },
    carlos: { name: 'Carlos Lima', initials: 'CL', tone: 'blue' },
    bianca: { name: 'Bianca Souza', initials: 'BS', tone: 'green' },
    rafael: { name: 'Rafael Nogueira', initials: 'RN', tone: 'red' }
  };

  const CHAT = [
    { who: 'bianca', text: 'Os arquivos do financeiro já estão no SharePoint 📁' },
    { who: 'me', text: 'Perfeito, já achei a pasta. Obrigado!' },
    { react: '❤️ 1' },
    { who: 'rafael', text: 'Alguém sabe se o DMARC ficou ativo?' },
    { who: 'carlos', text: 'Ficou sim, o relatório chegou hoje cedo.' },
    { react: '👍 3' },
    { who: 'me', text: 'E os e-mails pararam de cair no spam 🙌' },
    { who: 'ana', text: 'Reunião de quinta confirmada, às 10h.' },
    { who: 'bianca', text: 'Entro pelo Teams, estou atendendo de Lisboa.' },
    { who: 'me', text: 'Combinado, o link já está no convite.' },
    { react: '👍 2' },
    { who: 'carlos', text: 'Configurei o Outlook no celular novo, levou 2 minutos.' },
    { who: 'ana', text: 'Aqui também, nem precisei chamar ninguém 😄' }
  ];

  const MAILS = [
    {
      from: 'Contabilidade', initials: 'CT', tone: 'amber',
      subject: 'Balancete de agosto pronto',
      preview: 'Segue o balancete consolidado para revisão.',
      body: ['Bom dia! O balancete de agosto está fechado e conferido.', 'A planilha vai anexa e há uma cópia na pasta do SharePoint.'],
      file: ['xlsx', 'balancete-agosto.xlsx']
    },
    {
      from: 'Tenant Flow Suporte', initials: 'TF', tone: 'teal',
      subject: 'DMARC ativo no seu domínio',
      preview: 'Os e-mails de vocês agora chegam na caixa de entrada.',
      body: ['O DMARC foi ativado hoje às 7h e o DKIM já assina todas as mensagens.', 'Na prática, o e-mail de vocês deixa de cair no spam dos clientes.'],
      file: ['pdf', 'relatorio-dmarc.pdf']
    },
    {
      from: 'Jurídico', initials: 'JR', tone: 'berry',
      subject: 'Contrato revisado para assinatura',
      preview: 'Ajustei a cláusula 7 e deixei o arquivo na pasta.',
      body: ['Ajustei a cláusula 7, como combinamos na reunião.', 'A versão final vai anexa, pronta para assinatura.'],
      file: ['docx', 'contrato-final.docx']
    },
    {
      from: 'Financeiro', initials: 'FN', tone: 'green',
      subject: 'Conciliação de setembro fechada',
      preview: 'Todas as contas conferidas, sem pendências.',
      body: ['Fechamos a conciliação de setembro sem pendências.', 'Os extratos estão na pasta Financeiro, no SharePoint.'],
      file: ['xlsx', 'conciliacao-setembro.xlsx']
    },
    {
      from: 'Tenant Flow Suporte', initials: 'TF', tone: 'teal',
      subject: 'Licenças revisadas: 5 a menos',
      preview: 'Cancelamos licenças de quem já saiu da empresa.',
      body: ['Revisamos as 23 licenças contra o uso real de cada pessoa.', 'Cinco estavam paradas e foram canceladas. A economia aparece na próxima fatura.'],
      file: ['pdf', 'revisao-licencas.pdf']
    },
    {
      from: 'Diretoria', initials: 'DR', tone: 'blue',
      subject: 'Reunião de quinta às 10h',
      preview: 'Pauta: fechamento do trimestre e novos clientes.',
      body: ['Confirmada a reunião de quinta, às 10h, pelo Teams.', 'Pauta: fechamento do trimestre e novos clientes em Portugal.'],
      file: null
    }
  ];

  function initHeroScene() {
    const scene = document.querySelector('.scene');
    if (!scene) return;

    const canvas = scene.querySelector('.scene__canvas');
    const WIDTH = 600;

    /* Escala a tela desenhada em 600px para a largura da coluna. */
    const fit = () => scene.style.setProperty('--scene-scale', (scene.clientWidth / WIDTH).toFixed(4));
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(scene);
    else window.addEventListener('resize', fit);

    if (prefersReducedMotion()) return;

    /* Pausa: fora da tela ou aba escondida. */
    let onScreen = true;
    const waiting = [];
    const isActive = () => onScreen && !document.hidden;
    const refresh = () => {
      scene.classList.toggle('is-paused', !isActive());
      if (isActive()) waiting.splice(0).forEach((resume) => resume());
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        refresh();
      }).observe(scene);
    }
    document.addEventListener('visibilitychange', refresh);

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      .then(() => (isActive() ? undefined : new Promise((resume) => waiting.push(resume))));
    const jitter = (min, max) => min + Math.random() * (max - min);
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    /* Relógio da cena: avança alguns minutos a cada evento. */
    let minutes = 9 * 60 + 17;
    const clock = () => {
      minutes += 1 + Math.floor(Math.random() * 3);
      const h = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
      return `${h}:${String(minutes % 60).padStart(2, '0')}`;
    };

    initParallax(scene, canvas);

    /* Converte a posição de um elemento para coordenadas da tela de 600px. */
    const pointOf = (el, fx = 0.3, fy = 0.5) => {
      const c = canvas.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const s = c.width / WIDTH;
      return [(r.left - c.left + r.width * fx) / s, (r.top - c.top + r.height * fy) / s];
    };

    const cursor = canvas.querySelector('.cursor');
    const moveCursor = ([x, y]) => {
      cursor.style.setProperty('--cx', `${x.toFixed(1)}px`);
      cursor.style.setProperty('--cy', `${y.toFixed(1)}px`);
    };
    const click = async () => {
      cursor.classList.add('is-click');
      await wait(160);
      cursor.classList.remove('is-click');
    };

    /* Notificação do Windows. */
    const toast = canvas.querySelector('.toast');
    async function notify(mail) {
      toast.querySelector('.toast__from').textContent = mail.from;
      toast.querySelector('.toast__subject').textContent = mail.subject;
      const av = toast.querySelector('.toast__av');
      av.className = `av av--${mail.tone} toast__av`;
      av.textContent = mail.initials;
      toast.classList.add('is-on');
      await wait(3600);
      toast.classList.remove('is-on');
    }

    /* ---- Outlook ---- */
    const list = canvas.querySelector('.ol-mails');
    const count = canvas.querySelector('.ol-count');
    const read = canvas.querySelector('.ol-read');

    const updateCount = () => {
      const unread = list.querySelectorAll('.ol-mail.is-unread').length;
      count.textContent = unread ? String(unread) : '';
    };

    function mailElement(mail, time) {
      const el = document.createElement('div');
      el.className = 'ol-mail is-unread is-new';
      el.innerHTML =
        '<div class="ol-mail__top"><b></b><time></time></div>' +
        '<p class="ol-mail__subject"></p><p class="ol-mail__preview"></p>';
      el.querySelector('b').textContent = mail.from;
      el.querySelector('time').textContent = time;
      el.querySelector('.ol-mail__subject').textContent = mail.subject;
      el.querySelector('.ol-mail__preview').textContent = mail.preview;
      return el;
    }

    async function openMail(el, mail, time) {
      list.querySelectorAll('.is-selected').forEach((m) => m.classList.remove('is-selected'));
      el.classList.add('is-selected');
      el.classList.remove('is-unread');
      updateCount();

      read.classList.add('is-swapping');
      await wait(300);
      read.querySelector('.ol-read__subject').textContent = mail.subject;
      const av = read.querySelector('.ol-read__from .av');
      av.className = `av av--${mail.tone}`;
      av.textContent = mail.initials;
      read.querySelector('.ol-read__from b').textContent = mail.from;
      read.querySelector('.ol-read__from time').textContent = time;
      const body = read.querySelector('.ol-read__body');
      body.replaceChildren(...mail.body.map((text) => {
        const p = document.createElement('p');
        p.textContent = text;
        return p;
      }));
      const attach = read.querySelector('.ol-attach');
      attach.hidden = !mail.file;
      if (mail.file) {
        attach.querySelector('.ol-attach__tile').className = `ol-attach__tile ol-attach__tile--${mail.file[0]}`;
        attach.lastChild.textContent = mail.file[1];
      }
      read.classList.remove('is-swapping');
    }

    async function outlookLoop() {
      let i = 0;
      updateCount();
      await wait(1800);
      for (;;) {
        const mail = MAILS[i % MAILS.length];
        const time = clock();
        i += 1;

        const el = mailElement(mail, time);
        list.prepend(el);
        await nextFrame();
        el.classList.remove('is-new');
        [...list.children].slice(6).forEach((old) => old.remove());
        updateCount();
        notify(mail);

        await wait(1500);
        moveCursor(pointOf(el, 0.45, 0.55));
        cursor.classList.add('is-on');
        await wait(1050);
        await click();
        await openMail(el, mail, time);

        await wait(900);
        moveCursor(pointOf(read.querySelector('.ol-read__body'), 0.55, 0.9));
        await wait(1600);
        cursor.classList.remove('is-on');
        await wait(jitter(3200, 4600));
      }
    }

    /* ---- Teams ---- */
    const feed = canvas.querySelector('.tm-feed');
    const typing = canvas.querySelector('.tm-typing');
    const typingWho = typing.querySelector('.tm-typing__who');
    const compose = canvas.querySelector('.tm-compose');
    const composeText = compose.querySelector('.tm-compose__text');
    const send = compose.querySelector('.tm-send');
    const placeholder = composeText.innerHTML;

    function messageElement(step, time) {
      const mine = step.who === 'me';
      const person = PEOPLE[step.who];
      const el = document.createElement('div');
      el.className = mine ? 'tm-msg tm-msg--me' : 'tm-msg';
      el.innerHTML =
        '<div class="tm-msg__in"><div class="tm-msg__row">' +
        (mine ? '' : `<span class="av av--${person.tone}">${person.initials}<i class="pres pres--on"></i></span>`) +
        '<div class="tm-bubble"><p class="tm-bubble__meta">' + (mine ? '' : '<b></b>') +
        '<time></time></p><p class="tm-bubble__text"></p></div></div></div>';
      if (!mine) el.querySelector('b').textContent = person.name;
      el.querySelector('time').textContent = time;
      el.querySelector('.tm-bubble__text').textContent = step.text;
      return el;
    }

    async function postMessage(el) {
      feed.append(el);
      await nextFrame();
      el.classList.add('is-in');
      const messages = [...feed.querySelectorAll('.tm-msg')];
      const extra = messages.slice(0, Math.max(0, messages.length - 5));
      extra.forEach((old) => {
        old.classList.remove('is-in');
        setTimeout(() => old.remove(), 600);
      });
    }

    async function typeInComposer(text) {
      compose.classList.add('is-focus');
      composeText.textContent = '';
      const typed = document.createElement('span');
      const caret = document.createElement('i');
      caret.className = 'tm-compose__caret';
      composeText.append(typed, caret);
      for (const char of text) {
        typed.textContent += char;
        send.classList.add('is-ready');
        await wait(char === ' ' ? jitter(40, 90) : jitter(28, 70));
      }
      await wait(380);
      composeText.innerHTML = placeholder;
      send.classList.remove('is-ready');
      compose.classList.remove('is-focus');
    }

    async function teamsLoop() {
      let i = 0;
      await wait(2600);
      for (;;) {
        const step = CHAT[i % CHAT.length];
        i += 1;

        if (step.react) {
          const bubbles = feed.querySelectorAll('.tm-msg.is-in .tm-bubble');
          const target = bubbles[bubbles.length - 1];
          if (target) {
            target.querySelector('.tm-react')?.remove();
            const pill = document.createElement('span');
            pill.className = 'tm-react';
            pill.textContent = step.react;
            target.append(pill);
          }
          await wait(jitter(1200, 1800));
          continue;
        }

        if (step.who === 'me') {
          await typeInComposer(step.text);
          await postMessage(messageElement(step, clock()));
        } else {
          typingWho.textContent = `${PEOPLE[step.who].name.split(' ')[0]} está digitando`;
          typing.classList.add('is-on');
          await wait(jitter(1500, 2300));
          typing.classList.remove('is-on');
          await postMessage(messageElement(step, clock()));
        }
        await wait(jitter(1700, 2600));
      }
    }

    /* ---- Cartão de migração ---- */
    const job = canvas.querySelector('.job');
    const jobState = job.querySelector('.job__state');
    const jobCount = job.querySelector('.job__n');

    async function jobLoop() {
      const total = 23;
      await wait(1400);
      for (;;) {
        job.classList.remove('is-done');
        jobState.textContent = 'Migrando caixas de e-mail';
        for (let n = 0; n <= total; n += 1) {
          jobCount.textContent = String(n);
          job.style.setProperty('--p', `${(n / total) * 100}%`);
          await wait(n === 0 ? 700 : jitter(220, 560));
        }
        job.classList.add('is-done');
        jobState.textContent = 'Migração concluída';
        await wait(6000);
      }
    }

    outlookLoop();
    teamsLoop();
    jobLoop();
  }

  /* As janelas acompanham o mouse de leve (só com mouse de precisão). */
  function initParallax(scene, canvas) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const area = scene.closest('.hero') || scene;
    let frame = 0;
    let mx = 0;
    let my = 0;

    const apply = () => {
      frame = 0;
      canvas.style.setProperty('--mx', mx.toFixed(3));
      canvas.style.setProperty('--my', my.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const clamp = (v) => Math.max(-1, Math.min(1, v));

    area.addEventListener('pointermove', (event) => {
      const r = scene.getBoundingClientRect();
      mx = clamp((event.clientX - (r.left + r.width / 2)) / r.width);
      my = clamp((event.clientY - (r.top + r.height / 2)) / r.height);
      schedule();
    });
    area.addEventListener('pointerleave', () => {
      mx = 0;
      my = 0;
      schedule();
    });
  }

  initAnalytics();
  initStickyHeader();
  initMobileMenu();
  initLeadForm();
  initReveal();
  initHeroScene();
})();
