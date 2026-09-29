import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Alert } from '../../../shared/components/ui/Alert';
import { Modal } from '../../../shared/components/ui/Modal';
import { CsvUpload, ImportResult } from './CsvUpload';

/**
 * First-login setup for an organization admin:
 *  - start fresh (new organization, create data in the app), or
 *  - bring existing data by uploading a CSV.
 */
export function OrganizationSetupModal({ isOpen, onClose, onSuccess }) {
  const { api, orgStatus } = useAuth();
  const [mode, setMode] = useState('NEW'); // 'NEW' | 'EXISTING'
  const [csvFile, setCsvFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  function finish() {
    setResult(null);
    setCsvFile(null);
    onSuccess?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'NEW') {
        await api.setupOrg({ hasExistingData: false });
        finish();
      } else {
        await api.setupOrg({ hasExistingData: true });
        const formData = new FormData();
        formData.append('file', csvFile);
        setResult(await api.importCsv(formData));
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal eyebrow="WELCOME TO STOCKWISE" title={`Set up ${orgStatus?.name || 'your organization'}`} onClose={result ? finish : onClose}
      subtitle="How would you like to start? You can always import more data later from the dashboard.">
      {result ? (
        <>
          <ImportResult result={result} />
          <div className="form-actions"><button className="button" onClick={finish}>Go to dashboard</button></div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <Alert text={error} />
          <div className="segmented">
            <button type="button" className={mode === 'NEW' ? 'selected' : ''} onClick={() => setMode('NEW')}>
              + Start fresh
            </button>
            <button type="button" className={mode === 'EXISTING' ? 'selected' : ''} onClick={() => setMode('EXISTING')}>
              ⇪ Bring existing data
            </button>
          </div>

          {mode === 'NEW' ? (
            <p className="muted">
              Your organization starts empty. Create categories and products, and invite your team from the Team members page.
            </p>
          ) : (
            <CsvUpload file={csvFile} onChange={setCsvFile} />
          )}

          <div className="form-actions">
            {onClose && <button type="button" className="button ghost" onClick={onClose} disabled={busy}>Later</button>}
            <button type="submit" className="button" disabled={busy || (mode === 'EXISTING' && !csvFile)}>
              {busy ? 'Saving…' : mode === 'NEW' ? 'Start with an empty workspace' : 'Import and finish setup'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
