type AdminWidgetResponse = XP.Response<`<widget>${string}</widget>`>;

export function get(): AdminWidgetResponse {
  const importUrl = "/_/service/no.item.xp.nva/import-all";

  const markup = app.config.institution
    ? `<a href="${importUrl}" target="_blank">Start importing all NVA data for institution with id=${app.config.institution}</a>`
    : `Please configure "no.item.xp.nva.cfg" with "institution=&lt;your-institution-number&gt;"`;

  return {
    body: `<widget>${markup}</widget>`,
    contentType: "text/html",
  };
}
