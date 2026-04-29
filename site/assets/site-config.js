(function () {
  window.ENGAGE_GROOVY_CONFIG = window.ENGAGE_GROOVY_CONFIG || {};

  // Set gaMeasurementId (for example "G-XXXXXXXXXX") before production launch.
  window.ENGAGE_GROOVY_CONFIG.analytics = Object.assign(
    {
      gaMeasurementId: ""
    },
    window.ENGAGE_GROOVY_CONFIG.analytics || {}
  );

  // Replace endpoint with your production form router if needed.
  window.ENGAGE_GROOVY_CONFIG.contact = Object.assign(
    {
      endpoint: "https://formsubmit.co/ajax/hello@engagegroovy.com",
      timeoutMs: 12000,
      subject: "New EngageGroovy inquiry"
    },
    window.ENGAGE_GROOVY_CONFIG.contact || {}
  );
})();
