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
      },
      risk: {
        endpoint: "",
        timeoutMs: 12000
      }
    };

    const config = window.ENGAGE_GROOVY_CONFIG || {};
    return {
      analytics: Object.assign({}, defaults.analytics, config.analytics || {}),
      contact: Object.assign({}, defaults.contact, config.contact || {}),
      risk: Object.assign({}, defaults.risk, config.risk || {})
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

  function createUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (char) {
      const value = Math.random() * 16 | 0;
      const next = char === "x" ? value : (value & 0x3 | 0x8);
      return next.toString(16);
    });
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function normalizeRiskLead(input) {
    return {
      name: clean(input.name),
      email: clean(input.email).toLowerCase(),
      company: clean(input.company),
      website: clean(input.website),
      ai_usage: clean(input.ai_usage),
      review_before_use: clean(input.review_before_use),
      output_process_impact: clean(input.output_process_impact),
      process_structure: clean(input.process_structure),
      manual_handoffs: clean(input.manual_handoffs),
      tooling_dependency: clean(input.tooling_dependency),
      notes: clean(input.notes),
      source: clean(input.source) || "risk-map"
    };
  }

  function buildRiskMapFlow(input) {
    const profileOrder = ["uncontrolled_ai_usage", "false_automation", "ai_in_wrong_place"];
    const signalWeights = {
      ai_usage: {
        none_or_exploring: { uncontrolled_ai_usage: 0, false_automation: 0, ai_in_wrong_place: 4 },
        individual_tools: { uncontrolled_ai_usage: 18, false_automation: 4, ai_in_wrong_place: 8 },
        team_workflows: { uncontrolled_ai_usage: 14, false_automation: 12, ai_in_wrong_place: 10 },
        customer_or_revenue_work: { uncontrolled_ai_usage: 18, false_automation: 16, ai_in_wrong_place: 18 }
      },
      review_before_use: {
        always_reviewed: { uncontrolled_ai_usage: 0, false_automation: 2, ai_in_wrong_place: 2 },
        spot_checked: { uncontrolled_ai_usage: 14, false_automation: 8, ai_in_wrong_place: 6 },
        rarely_reviewed: { uncontrolled_ai_usage: 24, false_automation: 12, ai_in_wrong_place: 8 },
        no_owner: { uncontrolled_ai_usage: 28, false_automation: 10, ai_in_wrong_place: 10 }
      },
      output_process_impact: {
        internal_reference: { uncontrolled_ai_usage: 4, false_automation: 2, ai_in_wrong_place: 6 },
        shapes_work: { uncontrolled_ai_usage: 8, false_automation: 8, ai_in_wrong_place: 12 },
        changes_customer_or_sales_output: { uncontrolled_ai_usage: 12, false_automation: 12, ai_in_wrong_place: 22 },
        triggers_decisions_or_actions: { uncontrolled_ai_usage: 14, false_automation: 18, ai_in_wrong_place: 24 }
      },
      process_structure: {
        documented_owner_and_steps: { uncontrolled_ai_usage: 0, false_automation: 0, ai_in_wrong_place: 2 },
        known_but_informal: { uncontrolled_ai_usage: 8, false_automation: 6, ai_in_wrong_place: 8 },
        varies_by_person: { uncontrolled_ai_usage: 12, false_automation: 14, ai_in_wrong_place: 12 },
        unclear_or_missing: { uncontrolled_ai_usage: 16, false_automation: 22, ai_in_wrong_place: 16 }
      },
      manual_handoffs: {
        few_and_clear: { uncontrolled_ai_usage: 2, false_automation: 0, ai_in_wrong_place: 2 },
        several_manual_steps: { uncontrolled_ai_usage: 6, false_automation: 10, ai_in_wrong_place: 8 },
        frequent_copy_paste: { uncontrolled_ai_usage: 8, false_automation: 20, ai_in_wrong_place: 10 },
        hidden_rework_or_duplicate_entry: { uncontrolled_ai_usage: 10, false_automation: 24, ai_in_wrong_place: 12 }
      },
      tooling_dependency: {
        low_dependency: { uncontrolled_ai_usage: 2, false_automation: 2, ai_in_wrong_place: 2 },
        one_ai_tool: { uncontrolled_ai_usage: 8, false_automation: 4, ai_in_wrong_place: 6 },
        multiple_unconnected_tools: { uncontrolled_ai_usage: 14, false_automation: 18, ai_in_wrong_place: 12 },
        ai_embedded_in_core_system: { uncontrolled_ai_usage: 16, false_automation: 16, ai_in_wrong_place: 22 }
      }
    };

    const recommendations = {
      uncontrolled_ai_usage: {
        priority: "high",
        recommended_pipeline: "ai_usage_control_review",
        control: "Name the owner, review point, and allowed AI use before outputs reach customers or revenue workflows."
      },
      false_automation: {
        priority: "medium",
        recommended_pipeline: "automation_reality_check",
        control: "Separate true automation from manual handoffs, copy-paste work, and hidden rework before scaling the workflow."
      },
      ai_in_wrong_place: {
        priority: "high",
        recommended_pipeline: "ai_placement_control_sprint",
        control: "Move AI away from high-impact decision points until the process, review gate, and failure handling are explicit."
      }
    };

    const occurredAt = new Date().toISOString();
    const lead = normalizeRiskLead(input);
    const leadPayload = Object.assign({ id: createUuid(), captured_at: occurredAt }, lead);
    const scores = {
      uncontrolled_ai_usage: 0,
      false_automation: 0,
      ai_in_wrong_place: 0
    };

    function addSignal(signalName, signalValue) {
      const weights = signalWeights[signalName] && signalWeights[signalName][signalValue];
      if (!weights) return null;
      profileOrder.forEach(function (profile) {
        scores[profile] += weights[profile] || 0;
      });
      return { name: signalName, value: signalValue, weights: weights };
    }

    const signals = [
      addSignal("ai_usage", lead.ai_usage),
      addSignal("review_before_use", lead.review_before_use),
      addSignal("output_process_impact", lead.output_process_impact),
      addSignal("process_structure", lead.process_structure),
      addSignal("manual_handoffs", lead.manual_handoffs),
      addSignal("tooling_dependency", lead.tooling_dependency)
    ].filter(Boolean);

    const profile = profileOrder.slice().sort(function (a, b) {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      return profileOrder.indexOf(a) - profileOrder.indexOf(b);
    })[0];
    const recommendation = recommendations[profile];
    const controlGaps = [];
    if (["rarely_reviewed", "no_owner"].indexOf(lead.review_before_use) !== -1) controlGaps.push("review_before_use");
    if (["varies_by_person", "unclear_or_missing"].indexOf(lead.process_structure) !== -1) controlGaps.push("process_structure");
    if (["frequent_copy_paste", "hidden_rework_or_duplicate_entry"].indexOf(lead.manual_handoffs) !== -1) controlGaps.push("manual_handoffs");
    if (["multiple_unconnected_tools", "ai_embedded_in_core_system"].indexOf(lead.tooling_dependency) !== -1) controlGaps.push("tooling_dependency");
    const score = Math.min(100, scores[profile]);

    const riskProfile = {
      lead_email: lead.email,
      company: lead.company,
      risk_profile: profile,
      risk_score: score,
      signals: signals,
      signal_scores: scores,
      control_gaps: controlGaps,
      recommended_pipeline: recommendation.recommended_pipeline,
      priority: recommendation.priority,
      next_action: "ceo_review",
      control_required: recommendation.control
    };

    const pipeline = {
      lead_email: lead.email,
      company: lead.company,
      risk_profile: profile,
      risk_score: score,
      signals: signals,
      control_gaps: controlGaps,
      priority: recommendation.priority,
      recommended_pipeline: recommendation.recommended_pipeline,
      next_action: "ceo_review",
      control: recommendation.control
    };

    const issueId = createUuid();
    const issue = {
      id: issueId,
      title: "CEO review: " + (lead.company || lead.email) + " AI risk map",
      description: [
        "Risk profile: " + profile,
        "Risk score: " + score,
        "Recommended pipeline: " + pipeline.recommended_pipeline,
        "Control gaps: " + (controlGaps.length ? controlGaps.join(", ") : "none flagged"),
        "Next action: " + pipeline.next_action,
        lead.notes ? "Visitor notes: " + lead.notes : ""
      ].filter(Boolean).join("\n"),
      domain: "engagegroovy",
      event_type: "paperclip.issue.prepared",
      schema: "issue.v1",
      routing_path: "lead.captured -> risk.profile.generated -> pipeline.recommended -> CEO",
      priority: pipeline.priority,
      status: "pending",
      assignee: "CEO",
      created_at: occurredAt,
      updated_at: occurredAt,
      attachments: [],
      comments: [{
        id: "risk-" + issueId,
        author: "engagegroovy-risk-map",
        text: "Prepared from the AI risk-map wizard for CEO review.",
        created_at: occurredAt
      }],
      lead: lead,
      risk_profile: riskProfile,
      pipeline: pipeline
    };

    function eventEnvelope(eventType, payload) {
      return {
        event_type: eventType,
        schema: eventType + ".v1",
        domain: "engagegroovy",
        occurred_at: occurredAt,
        payload: payload
      };
    }

    return {
      lead: leadPayload,
      risk_profile: riskProfile,
      pipeline: pipeline,
      paperclip_issue: issue,
      events: [
        eventEnvelope("lead.captured", leadPayload),
        eventEnvelope("risk.profile.generated", riskProfile),
        eventEnvelope("pipeline.recommended", pipeline),
        eventEnvelope("paperclip.issue.prepared", issue)
      ]
    };
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

  function setupRiskWizard() {
    const form = document.getElementById("risk-map-form");
    if (!form) return;

    const runtimeConfig = getRuntimeConfig();
    const endpoint = form.getAttribute("data-risk-endpoint") || runtimeConfig.risk.endpoint || "";
    const success = document.getElementById("risk-map-success");
    const error = document.getElementById("risk-map-error");
    const issueOutput = document.getElementById("paperclip-issue-output");
    const scoreValue = document.getElementById("risk-score-value");
    const scoreBand = document.getElementById("risk-score-band");
    const pipelineValue = document.getElementById("pipeline-value");
    let started = false;
    let isSubmitting = false;

    form.addEventListener("focusin", function () {
      if (started) return;
      started = true;
      trackEvent("risk_map_start", {
        page: "risk-map"
      });
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (isSubmitting) return;
      if (error) error.hidden = true;

      const formData = new FormData(form);
      const requiredFields = ["name", "email", "company", "ai_usage", "review_before_use", "output_process_impact", "process_structure", "manual_handoffs", "tooling_dependency"];
      const missing = requiredFields.filter(function (field) {
        return !String(formData.get(field) || "").trim();
      });

      if (missing.length > 0) {
        if (error) error.hidden = false;
        trackEvent("risk_map_submit_error", {
          reason: "validation",
          missingFields: missing
        });
        return;
      }

      const payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company"),
        website: formData.get("website"),
        ai_usage: formData.get("ai_usage"),
        review_before_use: formData.get("review_before_use"),
        output_process_impact: formData.get("output_process_impact"),
        process_structure: formData.get("process_structure"),
        manual_handoffs: formData.get("manual_handoffs"),
        tooling_dependency: formData.get("tooling_dependency"),
        notes: formData.get("notes"),
        source: "risk-map"
      };

      const flow = buildRiskMapFlow(payload);
      flow.events.forEach(function (flowEvent) {
        trackEvent(flowEvent.event_type, flowEvent.payload);
      });

      try {
        localStorage.setItem("engageGroovyLatestRiskMap", JSON.stringify(flow));
      } catch (storageError) {
        /* no-op for blocked storage */
      }

      if (scoreValue) scoreValue.textContent = String(flow.risk_profile.risk_score);
      if (scoreBand) scoreBand.textContent = flow.risk_profile.risk_profile.replace(/_/g, " ");
      if (pipelineValue) pipelineValue.textContent = flow.pipeline.recommended_pipeline.replace(/_/g, " ");
      if (issueOutput) issueOutput.textContent = JSON.stringify(flow.paperclip_issue, null, 2);

      isSubmitting = true;
      try {
        if (endpoint) {
          const controller = typeof AbortController === "function" ? new AbortController() : null;
          let timeoutId = null;
          if (controller && runtimeConfig.risk.timeoutMs > 0) {
            timeoutId = window.setTimeout(function () {
              controller.abort();
            }, runtimeConfig.risk.timeoutMs);
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

          if (timeoutId) window.clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error("Risk endpoint returned status " + response.status);
          }
        }

        trackEvent("risk_map_issue_prepared", {
          priority: flow.paperclip_issue.priority,
          risk_score: flow.risk_profile.risk_score,
          risk_profile: flow.risk_profile.risk_profile,
          pipeline: flow.pipeline.recommended_pipeline
        });

        form.hidden = true;
        if (success) success.hidden = false;
      } catch (submitError) {
        if (error) error.hidden = false;
        trackEvent("risk_map_submit_error", {
          reason: "submission_failed",
          message: submitError && submitError.message ? submitError.message : "unknown"
        });
      } finally {
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
  setupRiskWizard();
  setupServiceAccordions();
  setupMobileStickyCta();
})();
