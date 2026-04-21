[#-- @ftlvariable name="resultCount" type="java.lang.Number" --]
[#-- @ftlvariable name="institution" type="java.lang.String" --]
[#-- @ftlvariable name="importUrl" type="java.lang.String" --]
[#-- @ftlvariable name="isRunning" type="java.lang.Boolean" --]
[#-- @ftlvariable name="progress" type="java.util.Map<java.lang.String, java.lang.Object>" --]
[#-- @ftlvariable name="inlineStyle" type="java.lang.String" --]
<!doctype html>
<html lang="${.lang}">
<head>
  <title>NVA Import</title>
  <style>${inlineStyle?no_esc}</style>
</head>
<body>
  <h1>NVA Import</h1>
  <p class="subtitle">Import publications from the National Research Archive</p>
  <div class="card">
    <h2>Repository Status</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${resultCount?c}</div>
        <div class="stat-label">Results in repo</div>
      </div>
    </div>
    [#if institution?has_content]
      <p class="config">Institution ID: <strong>${institution}</strong></p>
    [#else]
      <p class="status error">Not configured. Add <code>institution=&lt;id&gt;</code> to <code>no.item.xp.nva.cfg</code></p>
    [/#if]
  </div>
  <div class="card">
    <h2>Manual Import</h2>
    [#if isRunning]
      [#if progress??]
        <p class="status running">Import in progress: ${progress.current?c} / ${progress.total?c} (${progress.pct?c}%)</p>
        [#if progress.info?has_content]
          <p class="status-detail">${progress.info}</p>
        [/#if]
      [#else]
        <p class="status running">Import in progress...</p>
      [/#if]
    [/#if]
    [#if institution?has_content]
      [#if isRunning]
        <span class="btn disabled">Import running...</span>
      [#else]
        <a class="btn" href="${importUrl}">Start Import</a>
      [/#if]
    [#else]
      <p class="status error">Configure institution before importing.</p>
    [/#if]
  </div>
</body>
</html>
