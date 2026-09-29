const SAMPLE_CSV = [
  'Type,Name,Email,Role,SKU,Price,Quantity,MinimumStock,CategoryName,Description',
  'CATEGORY,Electronics,,,,,,,,Gadgets and appliances',
  'PRODUCT,Wireless Mouse,,,MOUSE-001,29.99,50,10,Electronics,Ergonomic wireless mouse',
  'USER,Jane Staff,jane@yourcompany.com,STAFF,,,,,,',
].join('\n');

const SAMPLE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`;

/** File picker with the CSV format hint and a downloadable sample. */
export function CsvUpload({ file, onChange, required = true }) {
  return (
    <div className="csv-upload-box">
      <label className="csv-label">Select CSV file</label>
      <p className="csv-hint">
        Columns: <code>Type,Name,Email,Role,SKU,Price,Quantity,MinimumStock,CategoryName,Description</code>.
        {' '}Team members listed as <code>USER</code> rows receive an email invitation to set their own password.
        {' '}<a className="link" href={SAMPLE_HREF} download="stockwise-sample.csv">Download sample CSV</a>
      </p>
      <input type="file" accept=".csv,text/csv" className="file-input" onChange={(e) => onChange(e.target.files[0] || null)} required={required} />
      {file && (
        <div className="file-preview">
          📄 Selected file: <strong>{file.name}</strong> ({Math.max(1, Math.round(file.size / 1024))} KB)
        </div>
      )}
    </div>
  );
}

/** Summary of a CSV import response. */
export function ImportResult({ result }) {
  const warnings = result.warningsOrSkipped || [];
  return (
    <div className="import-result">
      <div className="alert success-alert">{result.message}</div>
      <div className="import-counts">
        <div><strong>{result.importedCategoriesCount}</strong><span>categories</span></div>
        <div><strong>{result.importedProductsCount}</strong><span>products</span></div>
        <div><strong>{result.importedUsersCount}</strong><span>invitations sent</span></div>
      </div>
      {warnings.length > 0 && (
        <details className="import-warnings" open={warnings.length <= 5}>
          <summary>{warnings.length} row{warnings.length === 1 ? '' : 's'} skipped or adjusted</summary>
          <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
