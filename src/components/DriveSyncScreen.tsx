import React, { useCallback, useEffect, useState } from "react";

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  webViewLink?: string;
  processed?: boolean;
}

interface SyncHistoryItem {
  fileId?: string;
  fileName?: string;
  status?: string;
  syncedAt?: string;
  message?: string;
  processed?: number;
  skipped?: number;
  failed?: number;
}

interface DriveStatus {
  connected?: boolean;
  authorized?: boolean;
  folderConfigured?: boolean;
  totalFiles?: number;
  processedFiles?: number;
  pendingFiles?: number;
  lastSync?: string | null;
  nextSync?: string | null;
  syncFrequencyHours?: number;
  scheduler?: string;
}

const DEFAULT_STATUS: DriveStatus = {
  connected: false,
  authorized: false,
  folderConfigured: false,
  totalFiles: 0,
  processedFiles: 0,
  pendingFiles: 0,
  lastSync: null,
  nextSync: null,
  syncFrequencyHours: 6,
  scheduler: "every 6 hours",
};

export default function DriveSyncScreen() {
  const [status, setStatus] = useState<DriveStatus>(DEFAULT_STATUS);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  /*
   * Format dates safely
   */
  const formatDate = (value?: string | null): string => {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  /*
   * Safe API request with timeout
   */
  const fetchWithTimeout = useCallback(
    async (url: string, timeout = 8000): Promise<Response> => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeout);

      try {
        return await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
      } finally {
        window.clearTimeout(timer);
      }
    },
    []
  );

  /*
   * Safely read JSON to prevent UI crashes
   */
  const readJson = useCallback(async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  }, []);

  /*
   * Load Google Drive information
   */
  const loadDriveData = useCallback(async () => {
    setLoading(true);
    setError("");
    let hasError = false;

    // 1. STATUS
    try {
      const response = await fetchWithTimeout("/api/drive/status");
      if (!response.ok) hasError = true;
      else {
        const data = await readJson(response);
        if (data && typeof data === "object") {
          setStatus({
            connected: Boolean(data.connected),
            authorized: Boolean(data.authorized),
            folderConfigured: Boolean(data.folderConfigured),
            totalFiles: Number(data.totalFiles ?? 0),
            processedFiles: Number(data.processedFiles ?? 0),
            pendingFiles: Number(data.pendingFiles ?? 0),
            lastSync: data.lastSync ?? null,
            nextSync: data.nextSync ?? null,
            syncFrequencyHours: Number(data.syncFrequencyHours ?? 6),
            scheduler: data.scheduler ?? "every 6 hours",
          });
        }
      }
    } catch (err) {
      hasError = true;
      console.error("Drive status error:", err);
    }

    // 2. DRIVE FILES
    try {
      const response = await fetchWithTimeout("/api/drive/files");
      if (!response.ok) hasError = true;
      else {
        const data = await readJson(response);
        if (Array.isArray(data)) setFiles(data);
        else if (data && Array.isArray(data.files)) setFiles(data.files);
        else setFiles([]);
      }
    } catch (err) {
      hasError = true;
      console.error("Drive files error:", err);
    }

    // 3. SYNC HISTORY
    try {
      const response = await fetchWithTimeout("/api/drive/history");
      if (!response.ok) hasError = true;
      else {
        const data = await readJson(response);
        if (Array.isArray(data)) setHistory(data);
        else if (data && Array.isArray(data.history)) setHistory(data.history);
        else setHistory([]);
      }
    } catch (err) {
      hasError = true;
      console.error("Drive history error:", err);
    }

    setLastChecked(new Date());
    if (hasError) {
      setError("Some Google Drive information could not be loaded. The page is still available.");
    }
    setLoading(false);
  }, [fetchWithTimeout, readJson]);

  useEffect(() => {
    void loadDriveData();
  }, [loadDriveData]);

  const connectGoogleDrive = () => {
    window.location.href = "/api/drive/auth";
  };
  return (
    <div className="w-full space-y-6 p-4">

      {/* TEST HEADING - DELETE THIS LATER */}
      <h1 className="text-4xl font-bold text-red-600 mb-10">
        DRIVE SYNC SCREEN IS LOADING!
      </h1>

      {/* PAGE STATUS */}
      <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-5">
        <p className="text-sm font-semibold text-[#003b5a]"></p>
  
        <p className="mt-1 text-sm text-[#66717a]">
          The Google Drive synchronization interface is active below.
        </p>
      </div>

      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e8f4fa] flex items-center justify-center">
              {/* Ensure you have the Material Symbols font linked in index.html */}
              <span className="material-symbols-outlined text-[32px] text-[#003b5a]">
                cloud_sync
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#003b5a]">Google Drive Sync</h1>
              <p className="mt-1 text-sm text-[#66717a]">
                Automatically sync resumes from Google Drive into HR AI Assist.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                status.connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status.connected ? "bg-green-600" : "bg-red-600"
                  }`}
                />
                {status.connected ? "Connected" : "Disconnected"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* CONNECTION */}
      {!status.connected && (
        <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h2 className="text-lg font-bold text-[#003b5a]">Connect Google Drive</h2>
              <p className="mt-2 text-sm text-[#66717a] max-w-2xl">
                Connect your Google Drive account so HR AI Assist can automatically check for new
                PDF and DOCX resumes every 6 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={connectGoogleDrive}
              className="shrink-0 px-5 py-3 rounded-xl bg-[#003b5a] text-white font-semibold hover:bg-[#002d45] transition flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">login</span>
              Connect Google Drive
            </button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-600">error</span>
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* AUTOMATIC SYNC */}
      <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#003b5a]">Automatic Sync</h2>
            <p className="text-sm text-[#66717a] mt-1">The backend controls the schedule.</p>
          </div>
          <span className="material-symbols-outlined text-[30px] text-[#003b5a]">schedule</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#f7f9fb] border border-[#e1e5e8] p-5">
            <p className="text-xs uppercase tracking-wide text-[#72787f] font-semibold">Frequency</p>
            <p className="mt-2 text-xl font-bold text-[#003b5a]">Every 6 Hours</p>
          </div>
          <div className="rounded-xl bg-[#f7f9fb] border border-[#e1e5e8] p-5">
            <p className="text-xs uppercase tracking-wide text-[#72787f] font-semibold">Last Sync</p>
            <p className="mt-2 text-sm font-bold text-[#003b5a]">{formatDate(status.lastSync)}</p>
          </div>
          <div className="rounded-xl bg-[#f7f9fb] border border-[#e1e5e8] p-5">
            <p className="text-xs uppercase tracking-wide text-[#72787f] font-semibold">Next Sync</p>
            <p className="mt-2 text-sm font-bold text-[#003b5a]">{formatDate(status.nextSync)}</p>
          </div>
        </div>
        <div className="mt-5 p-4 rounded-xl bg-[#fff9db] border border-[#f2df80]">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-[#8a7100]">info</span>
            <p className="text-sm text-[#665700]">
              Resume synchronization runs automatically every 6 hours from the backend. No event
              trigger or frequent frontend polling is used.
            </p>
          </div>
        </div>
      </div>

      {/* STATISTICS */}
      <div>
        <h2 className="text-lg font-bold text-[#003b5a] mb-4">Sync Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#66717a]">Total Files</span>
              <span className="material-symbols-outlined text-[#003b5a]">folder</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-[#003b5a]">{status.totalFiles || 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#66717a]">Processed</span>
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-green-700">{status.processedFiles || 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#66717a]">Pending</span>
              <span className="material-symbols-outlined text-orange-500">pending</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-orange-600">{status.pendingFiles || 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#66717a]">Drive Status</span>
              <span className="material-symbols-outlined text-[#003b5a]">cloud_done</span>
            </div>
            <p className={`mt-3 text-xl font-bold ${status.connected ? "text-green-700" : "text-red-600"}`}>
              {status.connected ? "Connected" : "Not Connected"}
            </p>
          </div>
        </div>
      </div>

      {/* RESUME FILES */}
      <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm">
        <div className="p-6 border-b border-[#e1e5e8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#003b5a]">Google Drive Resumes</h2>
              <p className="text-sm text-[#66717a] mt-1">PDF and DOCX resumes detected from Google Drive.</p>
            </div>
            <span className="text-sm font-semibold text-[#66717a]">{files.length} files</span>
          </div>
        </div>
        {files.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#a5adb4]">folder_open</span>
            <h3 className="mt-3 text-lg font-semibold text-[#41474e]">No resume files found</h3>
            <p className="mt-2 text-sm text-[#72787f]">
              {status.connected
                ? "No PDF or DOCX resumes are currently available in the configured Google Drive."
                : "Connect Google Drive to display resume files here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e1e5e8]">
            {files.map((file) => (
              <div key={file.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#eef4f8] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#003b5a]">description</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#003b5a]">{file.name}</p>
                    <p className="text-xs text-[#72787f] mt-1">Modified: {formatDate(file.modifiedTime)}</p>
                  </div>
                </div>
                <div>
                  {file.processed ? (
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Processed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
                      <span className="material-symbols-outlined text-[18px]">pending</span>
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SYNC HISTORY */}
      <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm">
        <div className="p-6 border-b border-[#e1e5e8]">
          <h2 className="text-lg font-bold text-[#003b5a]">Sync History</h2>
          <p className="text-sm text-[#66717a] mt-1">Recent automatic Google Drive synchronization activity.</p>
        </div>
        {history.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#a5adb4]">history</span>
            <h3 className="mt-3 text-lg font-semibold text-[#41474e]">No sync history available</h3>
            <p className="mt-2 text-sm text-[#72787f]">Sync history will appear here after the automatic 6-hour sync runs.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e1e5e8]">
            {history.map((item, index) => (
              <div
                key={item.fileId || `${item.syncedAt || "sync"}-${index}`}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-[#003b5a]">{item.fileName || "Google Drive Sync"}</p>
                  <p className="text-xs text-[#72787f] mt-1">{formatDate(item.syncedAt)}</p>
                  {item.message && <p className="text-sm text-[#66717a] mt-2">{item.message}</p>}
                </div>
                <span
                  className={`px-3 py-2 rounded-full text-xs font-semibold ${
                    item.status?.toLowerCase() === "failed" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {item.status || "completed"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#72787f]">
        <span>{loading ? "Checking Google Drive..." : "Google Drive information loaded"}</span>
        <span>
          Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : "Not checked"}
        </span>
      </div>
    </div>
  );
}