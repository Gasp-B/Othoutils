'use client';

import { useEffect, useMemo, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type {
  TaxonomyDeletionInput,
  TaxonomyMutationInput,
  TaxonomyResponse,
} from '@/lib/validation/tests';

const taxonomyQueryKey = (locale: Locale) => ['test-taxonomy', locale] as const;

type Tab = 'pathologies' | 'domains' | 'tags';

type TaxonomyListItem = {
  id: string;
  label: string;
  slug?: string;
  color?: string | null;
  description?: string | null;
  synonyms?: string[];
};

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
);
const FolderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const HashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <path d="M9 3 7 21" />
    <path d="M17 3 15 21" />
    <path d="M3 9h19" />
    <path d="M2 15h19" />
  </svg>
);
const StethoscopeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <path d="M6 3v6a6 6 0 0 0 12 0V3" />
    <path d="M8 15a6 6 0 0 0 12 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

export default function TaxonomyManager() {
  const t = useTranslations('taxonomy');
  const queryClient = useQueryClient();
  const locale = useLocale() as Locale;

  const [activeTab, setActiveTab] = useState<Tab>('pathologies');
  const [editingItem, setEditingItem] = useState<TaxonomyListItem | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    pathologies: null,
    domains: null,
    tags: null,
  });

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

  const resetForm = useCallback(() => {
    setEditingItem(null);
    setLabelInput('');
    setDescInput('');
    setSynonymsInput('');
    setColorInput('');
    setErrorMessage(null);
  }, []);

  // Reset form when tab changes
  useEffect(() => {
    resetForm();
  }, [activeTab, resetForm]);

  // --- Data Fetching ---
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: taxonomyQueryKey(locale),
    queryFn: async () => {
      const res = await fetch(`/api/tests/taxonomy?locale=${locale}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(t('errors.fetchTaxonomy'));
      return (await res.json()) as TaxonomyResponse;
    },
  });

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (payload: TaxonomyMutationInput & { id?: string }) => {
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch('/api/tests/taxonomy', {
        method: method, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: editingItem?.id }),
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
        domain: editingItem ? 'toast.domainUpdated' : 'toast.domainCreated',
        tag: editingItem ? 'toast.tagUpdated' : 'toast.tagCreated',
        pathology: editingItem ? 'toast.pathologyUpdated' : 'toast.pathologyCreated',
      } as const;

      const msg = t(toastKeys[variables.type]); 
      showToast(msg);
      resetForm();
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
      if (editingItem) resetForm();
    },
    onError: (err) => {
      setErrorMessage(err instanceof Error ? err.message : t('errors.unknown'));
      setDeletingId(null);
    },
  });

  const handleSave = () => {
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

    saveMutation.mutate(payload);
  };

  const handleEdit = (item: TaxonomyListItem) => {
    setEditingItem(item);
    setLabelInput(item.label);
    setDescInput(item.description || '');
    setSynonymsInput(item.synonyms?.join(', ') || '');
    setColorInput(item.color || '');
    setErrorMessage(null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Lists ---
  const activeList = useMemo<TaxonomyListItem[]>(() => {
    if (!data) return [];
    const list = (data[activeTab] ?? []) as TaxonomyListItem[];
    return [...list].sort((a, b) => a.label.localeCompare(b.label));
  }, [data, activeTab]);

  const tabCounts = useMemo(() => {
    if (!data) {
      return {
        pathologies: 0,
        domains: 0,
        tags: 0,
      } satisfies Record<Tab, number>;
    }

    return {
      pathologies: (data.pathologies || []).length,
      domains: (data.domains || []).length,
      tags: (data.tags || []).length,
    } satisfies Record<Tab, number>;
  }, [data]);

  const tabOrder: Tab[] = ['pathologies', 'domains', 'tags'];
  const tabPanelId = 'taxonomy-tabpanel';

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentTab: Tab) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const currentIndex = tabOrder.indexOf(currentTab);

    if (event.key === 'Home') {
      setActiveTab(tabOrder[0]);
      tabRefs.current[tabOrder[0]]?.focus();
      return;
    }

    if (event.key === 'End') {
      setActiveTab(tabOrder[tabOrder.length - 1]);
      tabRefs.current[tabOrder[tabOrder.length - 1]]?.focus();
      return;
    }

    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + offset + tabOrder.length) % tabOrder.length;
    const nextTab = tabOrder[nextIndex];
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const showTabLoading = isLoading || isFetching;

  const tabs = [
    { value: 'pathologies' as const, icon: StethoscopeIcon },
    { value: 'domains' as const, icon: FolderIcon },
    { value: 'tags' as const, icon: HashIcon },
  ];

  const alreadyExists = !editingItem && activeList.some(
    (item) => item.label.toLowerCase() === labelInput.trim().toLowerCase(),
  );

  return (
    <div className="grid gap-8">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label={t('common.listTitle')}
          className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 backdrop-blur"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                ref={(node) => {
                  tabRefs.current[tab.value] = node;
                }}
                role="tab"
                aria-selected={activeTab === tab.value}
                aria-controls={tabPanelId}
                id={`taxonomy-tab-${tab.value}`}
                tabIndex={activeTab === tab.value ? 0 : -1}
                onClick={() => setActiveTab(tab.value)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.value)}
                className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 ${
                  activeTab === tab.value
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                  activeTab === tab.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 shadow-inner'
                }`}>
                  <Icon />
                </span>
                <span className="truncate">{t(`${tab.value}.toolbarTitle`)}</span>
                <Badge
                  variant="secondary"
                  className={`ml-1 h-6 min-w-[2rem] justify-center rounded-full px-2 text-xs font-semibold ${
                    activeTab === tab.value
                      ? 'bg-slate-900/10 text-slate-900'
                      : 'bg-white text-slate-600'
                  }`}
                  aria-live="polite"
                  aria-busy={showTabLoading}
                >
                  {showTabLoading ? (
                    <span className="inline-flex h-3 w-8 animate-pulse rounded-full bg-slate-200" aria-hidden />
                  ) : (
                    tabCounts[tab.value]
                  )}
                  <span className="sr-only">{t('common.listTitle')}</span>
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
              <CardHeader className="p-0 space-y-0">
                <CardTitle className="text-lg text-slate-800">
                  {editingItem ? t('common.editTitle') : t(`${activeTab}.cardTitle`)}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {t(`${activeTab}.cardHelper`)}
                </p>
              </CardHeader>
            </div>
            
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="label" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t(`${activeTab}.label`)}
                </Label>
                <Input
                  id="label"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder={t(`${activeTab}.placeholder`)}
                  className="bg-white"
                />
                {alreadyExists && (
                  <p className="text-red-500 text-xs font-medium mt-1 flex items-center gap-1">
                    ⚠️ {t(`${activeTab}.exists`)}
                  </p>
                )}
              </div>

              {activeTab === 'tags' && (
                <div className="space-y-1.5">
                  <Label htmlFor="color" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t('tags.colorLabel')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      placeholder="Ex. #EF4444"
                      className="flex-1 bg-white"
                    />
                    <div 
                      className="w-10 h-10 rounded-md border border-slate-200 shrink-0" 
                      style={{ backgroundColor: colorInput || '#ffffff' }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'pathologies' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="desc" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {t('pathologies.descLabel')}
                    </Label>
                    <Textarea
                      id="desc"
                      value={descInput}
                      onChange={(e) => setDescInput(e.target.value)}
                      placeholder={t('pathologies.descPlaceholder')}
                      className="min-h-[100px] bg-white resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="synonyms" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {t('pathologies.synonymsLabel')}
                    </Label>
                    <Input
                      id="synonyms"
                      value={synonymsInput}
                      onChange={(e) => setSynonymsInput(e.target.value)}
                      placeholder="Ex. TDAH, Trouble attentionnel"
                      className="bg-white"
                    />
                    <p className="text-[11px] text-slate-400">{t('pathologies.synonymsHelper')}</p>
                  </div>
                </>
              )}

              <div className="pt-2 flex gap-2">
                {editingItem && (
                  <Button 
                    variant="outline" 
                    onClick={resetForm}
                    className="flex-1"
                  >
                    {t('buttons.cancel')}
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={!labelInput.trim() || alreadyExists || saveMutation.isPending}
                  className={`flex-1 ${editingItem ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                >
                  {saveMutation.isPending 
                    ? t('buttons.savePending') 
                    : editingItem 
                      ? t('buttons.update') 
                      : t('buttons.add')
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card
            className="border-slate-200 shadow-sm h-full"
            role="tabpanel"
            aria-labelledby={`taxonomy-tab-${activeTab}`}
            id={tabPanelId}
          >
            <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 rounded-t-xl">
              <div className="flex items-baseline gap-2">
                <CardTitle className="text-lg text-slate-800">{t('common.listTitle')}</CardTitle>
                <Badge variant="secondary" className="px-2.5 py-0.5 text-sm">
                  {activeList.length}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">{t('common.loading')}</div>
              ) : isError ? (
                <div className="p-8 text-center text-red-500">{t('errors.unknown')}</div>
              ) : activeList.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                    <span className="text-xl">∅</span>
                  </div>
                  <p>{t('common.empty')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {activeList.map((item) => (
                    <li 
                      key={item.id} 
                      className={`group flex items-start gap-4 p-4 transition-colors hover:bg-slate-50/80 ${
                        editingItem?.id === item.id ? 'bg-amber-50/50 ring-1 ring-inset ring-amber-200' : ''
                      }`}
                    >
                      {activeTab === 'tags' && (
                        <div className="mt-1.5">
                          <span
                            className="block w-3 h-3 rounded-full ring-1 ring-slate-200 shadow-sm"
                            style={{ backgroundColor: item.color || '#e2e8f0' }}
                            title={item.color || 'Aucune couleur'}
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-semibold text-sm ${editingItem?.id === item.id ? 'text-amber-900' : 'text-slate-800'}`}>
                            {item.label}
                          </p>
                          {editingItem?.id === item.id && (
                            <Badge variant="outline" className="text-[10px] py-0 h-4 bg-amber-100 text-amber-700 border-amber-200">
                              Édition
                            </Badge>
                          )}
                        </div>

                        {activeTab === 'pathologies' && (
                          <div className="space-y-1.5">
                            {item.description && (
                              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            {item.synonyms && item.synonyms.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.synonyms.map((syn, idx) => (
                                  <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                    {syn}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          onClick={() => handleEdit(item)}
                          disabled={deleteMutation.isPending}
                          aria-label={t('buttons.edit')}
                        >
                          <EditIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() =>
                            deleteMutation.mutate({
                              type: activeTab === 'domains' ? 'domain' : activeTab === 'tags' ? 'tag' : 'pathology',
                              id: item.id,
                              locale,
                            })
                          }
                          disabled={deleteMutation.isPending && deletingId === item.id}
                          aria-label={t('buttons.delete')}
                        >
                          {deleteMutation.isPending && deletingId === item.id ? (
                            <span className="animate-spin">⟳</span>
                          ) : (
                            <TrashIcon />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}