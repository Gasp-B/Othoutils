'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { type Locale } from '@/i18n/routing';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import styles from './taxonomy-manager.module.css';
import type {
  TaxonomyDeletionInput,
  TaxonomyMutationInput,
  TaxonomyResponse,
} from '@/lib/validation/tests';

const taxonomyQueryKey = (locale: Locale) => ['test-taxonomy', locale] as const;

type Tab = 'domains' | 'tags' | 'pathologies';

// Definition of an item to avoid "any" in the list map
type TaxonomyListItem = {
  id: string;
  label: string;
  slug?: string;
  color?: string | null;
  description?: string | null;
  synonyms?: string[];
};

export default function TaxonomyManager() {
  const t = useTranslations('taxonomy');
  const queryClient = useQueryClient();
  const locale = useLocale() as Locale;

  const [activeTab, setActiveTab] = useState<Tab>('domains');

  // Form States
  const [labelInput, setLabelInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [synonymsInput, setSynonymsInput] = useState('');
  const [colorInput, setColorInput] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  // --- Data Fetching ---
  const { data, isLoading, isError } = useQuery({
    queryKey: taxonomyQueryKey(locale),
    queryFn: async () => {
      const res = await fetch(`/api/tests/taxonomy?locale=${locale}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(t('errors.fetchTaxonomy'));
      return (await res.json()) as TaxonomyResponse;
    },
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: async (payload: TaxonomyMutationInput) => {
      const res = await fetch('/api/tests/taxonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || t('errors.createGeneric'));
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey(locale) });

      const toastKeys = {
        domain: 'toast.domainCreated',
        tag: 'toast.tagCreated',
        pathology: 'toast.pathologyCreated',
      } as const;

      const msg = t(toastKeys[variables.type]);
      showToast(msg);

      setLabelInput('');
      setDescInput('');
      setSynonymsInput('');
      setColorInput('');
      setErrorMessage(null);
    },
    onError: (err) => setErrorMessage(err instanceof Error ? err.message : t('errors.unknown')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: TaxonomyDeletionInput) => {
      const res = await fetch('/api/tests/taxonomy', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(t('errors.deleteGeneric'));
      return res.json();
    },
    onMutate: (vars) => setDeletingId(vars.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey(locale) });
      showToast(t('toast.itemDeleted'));
      setDeletingId(null);
    },
    onError: (err) => {
      setErrorMessage(err instanceof Error ? err.message : t('errors.unknown'));
      setDeletingId(null);
    },
  });

  const handleCreate = () => {
    if (!labelInput.trim()) return;

    const payload: TaxonomyMutationInput = {
      type: activeTab === 'domains' ? 'domain' : activeTab === 'tags' ? 'tag' : 'pathology',
      locale,
      value: labelInput,
    };

    if (activeTab === 'pathologies') {
      payload.description = descInput;
      payload.synonyms = synonymsInput;
    }
    if (activeTab === 'tags') {
      payload.color = colorInput;
    }

    createMutation.mutate(payload);
  };

  // --- Lists ---
  const activeList = useMemo<TaxonomyListItem[]>(() => {
    if (!data) return [];
    // Narrowing the type from the union in TaxonomyResponse
    const list = (data[activeTab] ?? []) as TaxonomyListItem[];
    return [...list].sort((a, b) => a.label.localeCompare(b.label));
  }, [data, activeTab]);

  const alreadyExists = activeList.some(
    (item) => item.label.toLowerCase() === labelInput.trim().toLowerCase(),
  );

  return (
    <div className="content-grid">
      {toastMessage && (
        <div role="status" className={styles.toast}>
          {toastMessage}
        </div>
      )}

      {errorMessage && <div className={`error-text ${styles.fullWidthError}`}>{errorMessage}</div>}

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 mb-2 overflow-x-auto pb-2 border-b border-slate-200 w-full col-span-2">
        <button
          type="button"
          onClick={() => setActiveTab('domains')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'domains'
              ? 'bg-sky-100 text-sky-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('domains.toolbarTitle')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'tags' ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('tags.toolbarTitle')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pathologies')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'pathologies'
              ? 'bg-sky-100 text-sky-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('pathologies.toolbarTitle')}
        </button>
      </div>

      {/* FORMULAIRE CRÉATION */}
      <Card>
        <CardHeader>
          <CardTitle>{t(`${activeTab}.cardTitle`)}</CardTitle>
          <p className="text-sm text-slate-500">{t(`${activeTab}.cardHelper`)}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="label">{t(`${activeTab}.label`)}</Label>
            <Input
              id="label"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder={t(`${activeTab}.placeholder`)}
            />
            {alreadyExists && (
              <p className="text-red-500 text-sm mt-1">{t(`${activeTab}.exists`)}</p>
            )}
          </div>

          {activeTab === 'tags' && (
            <div>
              <Label htmlFor="color">{t('tags.colorLabel')}</Label>
              <Input
                id="color"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="Ex. Rouge, #FF0000"
              />
            </div>
          )}

          {activeTab === 'pathologies' && (
            <>
              <div>
                <Label htmlFor="desc">{t('pathologies.descLabel')}</Label>
                <Textarea
                  id="desc"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder={t('pathologies.descPlaceholder')}
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label htmlFor="synonyms">{t('pathologies.synonymsLabel')}</Label>
                <Input
                  id="synonyms"
                  value={synonymsInput}
                  onChange={(e) => setSynonymsInput(e.target.value)}
                  placeholder="Ex. TDAH, Trouble attentionnel"
                />
                <p className="text-xs text-slate-400 mt-1">{t('pathologies.synonymsHelper')}</p>
              </div>
            </>
          )}

          <Button
            type="button"
            onClick={handleCreate}
            disabled={!labelInput.trim() || alreadyExists || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? t('buttons.savePending') : t('buttons.add')}
          </Button>
        </CardContent>
      </Card>

      {/* LISTE EXISTANTE */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('common.listTitle')}</CardTitle>
            <Badge variant="secondary">{activeList.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          ) : isError ? (
            <p className="text-sm text-red-500">{t('errors.unknown')}</p>
          ) : activeList.length === 0 ? (
            <p className="text-sm text-slate-400 italic">{t('common.empty')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {activeList.map((item) => (
                <li key={item.id} className="py-3 flex justify-between items-start gap-3 group">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.label}</p>
                    {activeTab === 'pathologies' && (
                      <>
                        {item.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        )}
                        {item.synonyms && item.synonyms.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1">
                            Alias: {item.synonyms.join(', ')}
                          </p>
                        )}
                      </>
                    )}
                    {activeTab === 'tags' && item.color && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                        {item.color}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() =>
                      deleteMutation.mutate({
                        type:
                          activeTab === 'domains'
                            ? 'domain'
                            : activeTab === 'tags'
                              ? 'tag'
                              : 'pathology',
                        id: item.id,
                        locale,
                      })
                    }
                    disabled={deleteMutation.isPending && deletingId === item.id}
                  >
                    {deleteMutation.isPending && deletingId === item.id ? '...' : '×'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}