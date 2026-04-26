(function () {
  function getRuntimeConfig() {
    const defaults = {
      analytics: {
        gaMeasurementId: ""
      },
      contact: {
        endpoint: "https://formsubmit.co/ajax/hello@engagegroovy.com",
        timeoutMs: 12000,
        subject: "New EngageGroovy inquiry"
      }
    };

    const config = window.ENGAGE_GROOVY_CONFIG || {};
    return {
      analytics: Object.assign({}, defaults.analytics, config.analytics || {}),
      contact: Object.assign({}, defaults.contact, config.contact || {})
    };
  }

  function setupGoogleAnalytics(measurementId) {
    if (!measurementId) return;

    window.dataLayer = window.dataLayer || [];

    if (typeof window.gtag !== "function") {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());

      if (!document.querySelector("script[data-ga-loader='true']")) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
        script.setAttribute("data-ga-loader", "true");
        document.head.appendChild(script);
      }
    }

    window.gtag("config", measurementId, { send_page_view: true });
  }

  function loadEventLog() {
    try {
      const existing = localStorage.getItem("engageGroovyEvents");
      return existing ? JSON.parse(existing) : [];
    } catch (err) {
      return [];
    }
  }

  function saveEventLog(events) {
    try {
      localStorage.setItem("engageGroovyEvents", JSON.stringify(events));
    } catch (err) {
      /* no-op for prototype environments with blocked storage */
    }
  }

  function trackEvent(eventName, payload) {
    const event = {
      event: eventName,
      payload: payload || {},
      timestamp: new Date().toISOString()
    };

    window.prototypeAnalytics = window.prototypeAnalytics || [];
    window.prototypeAnalytics.push(event);

    const log = loadEventLog();
    log.push(event);
    saveEventLog(log);

    const pageName = document.body.getAttribute("data-page") || "unknown_page";
    const analyticsPayload = Object.assign({}, event.payload, {
      page: pageName,
      page_title: document.title,
      page_path: window.location.pathname || "/",
      page_location: window.location.href
    });

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, analyticsPayload));

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, analyticsPayload);
    }

    console.log("[prototype-track]", event);
  }

  function resolveFormProvider(endpoint) {
    if (!endpoint) return "none";
    if (endpoint.indexOf("formsubmit.co") !== -1) return "formsubmit";
    if (endpoint.indexOf("formspree.io") !== -1) return "formspree";
    return "custom_endpoint";
  }

  function setupMobileNav() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function setupCtaTracking() {
    const ctas = document.querySelectorAll("[data-track='cta']");
    ctas.forEach(function (el) {
      el.addEventListener("click", function () {
        trackEvent("cta_click", {
          label: el.getAttribute("data-cta-label") || "unknown_cta",
          page: document.body.getAttribute("data-page") || "unknown_page",
          href: el.getAttribute("href") || ""
        });
      });
    });
  }

  function setupContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    const runtimeConfig = getRuntimeConfig();
    const endpoint = form.getAttribute("data-form-endpoint") || runtimeConfig.contact.endpoint || "";
    const success = document.getElementById("form-success");
    const error = document.getElementById("form-error");
    let started = false;
    let isSubmitting = false;
    const source = new URLSearchParams(window.location.search).get("cta") || "direct";

    form.addEventListener("focusin", function () {
      if (started) return;
      started = true;
      trackEvent("form_start", {
        page: "contact",
        source: source
      });
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (error) error.hidden = true;
      if (isSubmitting) return;

      const formData = new FormData(form);
      const requiredFields = ["name", "email", "company", "challenge", "timeline", "budget"];
      const missing = requiredFields.filter(function (field) {
        return !String(formData.get(field) || "").trim();
      });

      if (missing.length > 0) {
        if (error) error.hidden = false;
        trackEvent("form_submit_error", {
          missingFields: missing,
          reason: "validation"
        });
        return;
      }

      if (!endpoint) {
        if (error) error.hidden = false;
        trackEvent("form_submit_error", {
          reason: "missing_endpoint"
        });
        return;
      }

      const payload = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        company: String(formData.get("company") || "").trim(),
        challenge: String(formData.get("challenge") || "").trim(),
        timeline: String(formData.get("timeline") || "").trim(),
        budget: String(formData.get("budget") || "").trim(),
        source: source,
        page: "contact",
        submitted_at: new Date().toISOString(),
        _subject: runtimeConfig.contact.subject || "New EngageGroovy inquiry",
        _template: "table",
        _captcha: "false"
      };

      isSubmitting = true;
      let timeoutId = null;

      try {
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        if (controller && runtimeConfig.contact.timeoutMs > 0) {
          timeoutId = window.setTimeout(function () {
            controller.abort();
          }, runtimeConfig.contact.timeoutMs);
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload),
          signal: controller ? controller.signal : undefined
        });

        if (!response.ok) {
          throw new Error("Form endpoint returned status " + response.status);
        }

        const responseText = await response.text();
        if (responseText) {
          let parsed = null;
          try {
            parsed = JSON.parse(responseText);
          } catch (parseError) {
            parsed = null;
          }
          if (parsed && parsed.success === false) {
            throw new Error(parsed.message || "Form endpoint reported an unsuccessful submission.");
          }
        }

        trackEvent("form_submit", {
          page: "contact",
          source: source,
          budget: formData.get("budget"),
          provider: resolveFormProvider(endpoint)
        });

        form.hidden = true;
        if (success) success.hidden = false;
      } catch (submitError) {
        if (error) error.hidden = false;
        trackEvent("form_submit_error", {
          reason: "submission_failed",
          message: submitError && submitError.message ? submitError.message : "unknown"
        });
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
        isSubmitting = false;
      }

    });
  }

  function setupServiceAccordions() {
    const modules = document.querySelectorAll(".service-module");
    if (!modules.length) return;

    const mobileQuery = window.matchMedia("(max-width: 767px)");

    function setModuleState(module, isOpen) {
      const trigger = module.querySelector(".accordion-trigger");
      const icon = module.querySelector(".accordion-icon");
      if (!trigger) return;

      module.classList.toggle("is-open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));
      if (icon) icon.textContent = isOpen ? "-" : "+";
    }

    function applyAccordionMode() {
      const isMobile = mobileQuery.matches;
      modules.forEach(function (module, index) {
        setModuleState(module, !isMobile || index === 0);
      });
    }

    modules.forEach(function (module) {
      const trigger = module.querySelector(".accordion-trigger");
      if (!trigger) return;

      trigger.addEventListener("click", function () {
        if (!mobileQuery.matches) return;
        const willOpen = !module.classList.contains("is-open");
        modules.forEach(function (target) {
          setModuleState(target, false);
        });
        setModuleState(module, willOpen);
      });
    });

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener("change", applyAccordionMode);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(applyAccordionMode);
    }
    applyAccordionMode();
  }

  function setupMobileStickyCta() {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const page = document.body.getAttribute("data-page") || "";
    const threshold = Math.max(180, Math.round(window.innerHeight * 0.35));

    let stickyContainer = null;
    if (page === "services") {
      stickyContainer = document.querySelector(".services-mobile-cta");
    } else {
      const ctaMap = {
        home: {
          href: "contact.html?cta=home-mobile-sticky#inquiry",
          text: "Book a Strategy Call",
          label: "home_mobile_sticky_book_call"
        },
        work: {
          href: "contact.html?cta=work-mobile-sticky#inquiry",
          text: "Discuss Your Growth Goal",
          label: "work_mobile_sticky_discuss_goal"
        },
        about: {
          href: "contact.html?cta=about-mobile-sticky#inquiry",
          text: "Tell Us Your Challenge",
          label: "about_mobile_sticky_tell_challenge"
        },
        contact: {
          href: "#inquiry",
          text: "Jump To Inquiry Form",
          label: "contact_mobile_sticky_jump_inquiry"
        }
      };

      const ctaConfig = ctaMap[page];
      if (!ctaConfig) return;

      stickyContainer = document.createElement("div");
      stickyContainer.className = "mobile-sticky-cta";
      stickyContainer.innerHTML = [
        '<a class="btn btn-primary" href="' + ctaConfig.href + '" data-track="cta" data-cta-label="' + ctaConfig.label + '">',
        ctaConfig.text,
        "</a>"
      ].join("");

      const link = stickyContainer.querySelector("a");
      if (link) {
        link.addEventListener("click", function () {
          trackEvent("cta_click", {
            label: ctaConfig.label,
            page: page,
            href: ctaConfig.href
          });
        });
      }
      document.body.appendChild(stickyContainer);
    }

    if (!stickyContainer) return;

    function updateStickyState() {
      const shouldShow = mobileQuery.matches && window.scrollY > threshold;
      stickyContainer.classList.toggle("visible", shouldShow);
      document.body.classList.toggle("has-mobile-sticky-cta", shouldShow);
    }

    updateStickyState();
    window.addEventListener("scroll", updateStickyState, { passive: true });
    window.addEventListener("resize", updateStickyState);
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener("change", updateStickyState);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(updateStickyState);
    }
  }

  const runtimeConfig = getRuntimeConfig();
  setupGoogleAnalytics(runtimeConfig.analytics.gaMeasurementId);
  setupMobileNav();
  setupCtaTracking();
  setupContactForm();
  setupServiceAccordions();
  setupMobileStickyCta();
})();

