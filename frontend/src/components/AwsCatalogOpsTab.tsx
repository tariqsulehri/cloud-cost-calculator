import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import {
  getApiErrorMessage,
  getAwsCatalogSyncStatus,
  getAzureCatalogSyncStatus,
  getGcpCatalogSyncStatus,
  syncAwsPublicPrices,
  syncAzurePublicPrices,
  syncGcpPublicPrices
} from '../lib/api';
import type { AwsCatalogSyncStatus, AzureCatalogSyncStatus, CatalogSyncRunSummary, GcpCatalogSyncStatus } from '../types/estimate';
import { Button } from './ui/button';

export function AwsCatalogOpsTab() {
  const [awsStatus, setAwsStatus] = useState<AwsCatalogSyncStatus | null>(null);
  const [azureStatus, setAzureStatus] = useState<AzureCatalogSyncStatus | null>(null);
  const [gcpStatus, setGcpStatus] = useState<GcpCatalogSyncStatus | null>(null);
  const [loading, setLoading] = useState<'load' | 'aws-sync' | 'azure-sync' | 'gcp-sync' | null>('load');
  const [error, setError] = useState<string | null>(null);
  const awsTotalMeters = useMemo(() => awsStatus?.services.reduce((sum, service) => sum + service.meterCount, 0) ?? 0, [awsStatus]);
  const azureTotalMeters = useMemo(() => azureStatus?.services.reduce((sum, service) => sum + service.meterCount, 0) ?? 0, [azureStatus]);
  const gcpTotalMeters = useMemo(() => gcpStatus?.services.reduce((sum, service) => sum + service.meterCount, 0) ?? 0, [gcpStatus]);

  async function loadStatus() {
    setLoading((current) => current ?? 'load');
    setError(null);
    try {
      const [aws, azure, gcp] = await Promise.all([getAwsCatalogSyncStatus(), getAzureCatalogSyncStatus(), getGcpCatalogSyncStatus()]);
      setAwsStatus(aws);
      setAzureStatus(azure);
      setGcpStatus(gcp);
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
    } finally {
      setLoading(null);
    }
  }

  async function handleAwsSync() {
    setLoading('aws-sync');
    setError(null);
    try {
      await syncAwsPublicPrices();
      setAwsStatus(await getAwsCatalogSyncStatus());
    } catch (syncError) {
      setError(getApiErrorMessage(syncError));
    } finally {
      setLoading(null);
    }
  }

  async function handleAzureSync() {
    setLoading('azure-sync');
    setError(null);
    try {
      await syncAzurePublicPrices();
      setAzureStatus(await getAzureCatalogSyncStatus());
    } catch (syncError) {
      setError(getApiErrorMessage(syncError));
    } finally {
      setLoading(null);
    }
  }

  async function handleGcpSync() {
    setLoading('gcp-sync');
    setError(null);
    try {
      await syncGcpPublicPrices();
      setGcpStatus(await getGcpCatalogSyncStatus());
    } catch (syncError) {
      setError(getApiErrorMessage(syncError));
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-extrabold text-navy">Cloud Public Price Catalog</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Local Postgres catalog for generic AWS, Azure, and GCP budget estimates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => void loadStatus()} disabled={Boolean(loading)}>
            <RefreshCw className={`h-4 w-4 ${loading === 'load' ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </Button>
          <Button type="button" onClick={() => void handleAwsSync()} disabled={Boolean(loading)}>
            <Database className={`h-4 w-4 ${loading === 'aws-sync' ? 'animate-pulse' : ''}`} aria-hidden="true" />
            Sync AWS prices
          </Button>
          <Button type="button" onClick={() => void handleAzureSync()} disabled={Boolean(loading)}>
            <Database className={`h-4 w-4 ${loading === 'azure-sync' ? 'animate-pulse' : ''}`} aria-hidden="true" />
            Sync Azure prices
          </Button>
          <Button type="button" onClick={() => void handleGcpSync()} disabled={Boolean(loading)}>
            <Database className={`h-4 w-4 ${loading === 'gcp-sync' ? 'animate-pulse' : ''}`} aria-hidden="true" />
            Sync GCP prices
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-danger/25 bg-red-50 px-3 py-2 text-xs text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="AWS meters" value={awsTotalMeters.toLocaleString()} />
        <Metric label="Azure meters" value={azureTotalMeters.toLocaleString()} />
        <Metric label="GCP meters" value={gcpTotalMeters.toLocaleString()} />
        <Metric label="Catalog mode" value="Public list price" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <h3 className="text-sm font-extrabold text-navy">AWS Offers</h3>
        </div>
        <div className="grid grid-cols-[minmax(150px,1.2fr)_90px_110px_minmax(150px,1fr)] gap-3 border-b border-line bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
          <span>Offer</span>
          <span>Region</span>
          <span>Meters</span>
          <span>Latest sync</span>
        </div>
        <div className="divide-y divide-line">
          {(awsStatus?.services ?? []).map((service) => (
            <div key={service.offerCode} className="grid grid-cols-[minmax(150px,1.2fr)_90px_110px_minmax(150px,1fr)] gap-3 px-4 py-3 text-xs">
              <div className="min-w-0">
                <div className="truncate font-bold text-graphite">{service.offerCode}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted">{service.latestRun?.source ?? 'No sync recorded'}</div>
              </div>
              <span className="text-graphite">{service.regionCode}</span>
              <span className="font-semibold text-graphite">{service.meterCount.toLocaleString()}</span>
              <SyncState latestRun={service.latestRun} />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <h3 className="text-sm font-extrabold text-navy">Azure Retail Services</h3>
        </div>
        <div className="grid grid-cols-[minmax(170px,1.2fr)_90px_110px_minmax(150px,1fr)] gap-3 border-b border-line bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
          <span>Service</span>
          <span>Region</span>
          <span>Meters</span>
          <span>Latest sync</span>
        </div>
        <div className="divide-y divide-line">
          {(azureStatus?.services ?? []).map((service) => (
            <div key={service.serviceName} className="grid grid-cols-[minmax(170px,1.2fr)_90px_110px_minmax(150px,1fr)] gap-3 px-4 py-3 text-xs">
              <div className="min-w-0">
                <div className="truncate font-bold text-graphite">{service.serviceName}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted">{service.latestRun?.source ?? 'No sync recorded'}</div>
              </div>
              <span className="text-graphite">{service.armRegionName}</span>
              <span className="font-semibold text-graphite">{service.meterCount.toLocaleString()}</span>
              <SyncState latestRun={service.latestRun} />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <h3 className="text-sm font-extrabold text-navy">GCP Cloud Billing Services</h3>
        </div>
        <div className="grid grid-cols-[minmax(170px,1.2fr)_90px_110px_minmax(150px,1fr)] gap-3 border-b border-line bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
          <span>Service</span>
          <span>Region</span>
          <span>Meters</span>
          <span>Latest sync</span>
        </div>
        <div className="divide-y divide-line">
          {(gcpStatus?.services ?? []).map((service) => (
            <div key={service.serviceName} className="grid grid-cols-[minmax(170px,1.2fr)_90px_110px_minmax(150px,1fr)] gap-3 px-4 py-3 text-xs">
              <div className="min-w-0">
                <div className="truncate font-bold text-graphite">{service.serviceName}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted">{service.latestRun?.source ?? 'No sync recorded'}</div>
              </div>
              <span className="text-graphite">{service.regionCode}</span>
              <span className="font-semibold text-graphite">{service.meterCount.toLocaleString()}</span>
              <SyncState latestRun={service.latestRun} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 text-xl font-extrabold text-navy">{value}</div>
    </div>
  );
}

function SyncState({ latestRun }: { latestRun: CatalogSyncRunSummary | null }) {
  if (!latestRun) {
    return <span className="text-muted">Not synced</span>;
  }

  const ok = latestRun.status === 'completed' || latestRun.status === 'partial';
  return (
    <div className="min-w-0">
      <div className={`flex items-center gap-1.5 font-semibold ${ok ? 'text-emerald-700' : 'text-danger'}`}>
        <CheckCircle2 className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
        <span className="truncate">{latestRun.status}</span>
      </div>
      <div className="mt-0.5 truncate text-[11px] text-muted">{formatDate(latestRun.completedAt ?? latestRun.startedAt)}</div>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}
