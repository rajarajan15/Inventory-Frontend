import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Alert } from '../../../shared/components/ui/Alert';
import { Modal } from '../../../shared/components/ui/Modal';
import { CsvUpload, ImportResult } from './CsvUpload';

export function CsvImportModal({ isOpen, onClose, onSuccess }) {
  const { api } = useAuth();
  const [csvFile, setCsvFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  function close() {
    if (result && onSuccess) onSuccess();
    setCsvFile(null);
    setResult(null);
    setError('');
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!csvFile) return;
    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      setResult(await api.importCsv(formData));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal eyebrow="BULK DATA IMPORT" title="Import CSV data" onClose={close}
      subtitle="Upload your existing categories, products, stock levels and team members. Everything is added to your organization only.">
      {result ? (
        <>
          <ImportResult result={result} />
          <div className="form-actions"><button className="button" onClick={close}>Done</button></div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <Alert text={error} />
          <CsvUpload file={csvFile} onChange={setCsvFile} />
          <div className="form-actions">
            <button type="button" className="button ghost" onClick={close} disabled={busy}>Cancel</button>
            <button type="submit" className="button" disabled={busy || !csvFile}>{busy ? 'Importing…' : 'Import CSV'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
