window.addEventListener('load', function () {
  window.ui = SwaggerUIBundle({
    url: '/api/docs/openapi.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    persistAuthorization: false,
    supportedSubmitMethods: [],
    validatorUrl: null,
    presets: [SwaggerUIBundle.presets.apis],
    layout: 'BaseLayout'
  });
});
