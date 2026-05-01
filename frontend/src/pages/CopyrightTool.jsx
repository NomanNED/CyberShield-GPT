/**
 * CopyrightTool.jsx
 * Generates a SHA-256 digital fingerprint for an uploaded image.
 */
import { useState } from 'react';
import { apiUrl } from '../lib/api';
import ResultCard from '../components/ResultCard';

export default function CopyrightTool() {
  const [file,    setFile]    = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(f));
  };

  const hashImage = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const form = new FormData();
      form.append('image', file);
      const res  = await fetch(apiUrl('/image-hash'), { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  };

  return (
    <div className="page">
      <h2>Digital Fingerprint Utility</h2>
      <p className="page-desc">
        Upload an image to generate its unique SHA-256 digital fingerprint.
        Use this hash to prove original ownership.
      </p>

      <label className="file-label">
        <input type="file" accept="image/*" onChange={handleFile} />
        {file ? file.name : 'Choose an image…'}
      </label>

      {preview && (
        <img src={preview} alt="Preview" className="image-preview" />
      )}

      <button onClick={hashImage} disabled={loading || !file}>
        {loading ? 'Generating…' : 'Generate Fingerprint'}
      </button>

      {error && <div className="error-box">{error}</div>}

      {result && (
        <ResultCard verdict="safe" label="Digital Fingerprint Created">
          <div className="hash-grid">
            <span>Filename:</span>    <span>{result.filename}</span>
            <span>Algorithm:</span>   <span>{result.algorithm}</span>
            <span>File Size:</span>   <span>{(result.size_bytes / 1024).toFixed(2)} KB</span>
            <span>Created At:</span>  <span>{new Date(result.created_at).toLocaleString()}</span>
          </div>
          <div className="hash-value">
            <strong>SHA-256 Hash:</strong>
            <code>{result.hash}</code>
            <button className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(result.hash)}>
              Copy Hash
            </button>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
