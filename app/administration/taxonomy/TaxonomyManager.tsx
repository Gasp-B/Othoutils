'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import styles from './taxonomy-manager.module.css';
import type { TaxonomyDeletionInput, TaxonomyMutationInput, TaxonomyResponse } from '@/lib/validation/tests';

const taxonomyQueryKey = ['test-taxonomy'] as const;

const REQUEST_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('timeout');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchTaxonomy() {
  const response = await fetchWithTimeout('/api/tests/taxonomy', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('fetchTaxonomy');
  }

  return (await response.json()) as TaxonomyResponse;
}

async function createTaxonomyItem(payload: TaxonomyMutationInput) {
  const response = await fetchWithTimeout('/api/tests/taxonomy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? 'createItem');
  }

  return response.json();
}

async function deleteTaxonomyItem(payload: TaxonomyDeletionInput) {
  const response = await fetchWithTimeout('/api/tests/taxonomy', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? 'deleteItem');
  }

  return response.json();
}

function TaxonomyManager() {
  const queryClient = useQueryClient();
  const t = useTranslations('TaxonomyAdmin.manager');
  const feedback = useTranslations('TaxonomyAdmin.feedback');
  const { data, isLoading, isError, error } = useQuery({ queryKey: taxonomyQueryKey, queryFn: fetchTaxonomy });
  const [domainInput, setDomainInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTranslationKeyByMessage: Record<string, string> = {
    timeout: 'errors.timeout',
    fetchTaxonomy: 'errors.fetch',
    'Impossible de récupérer les domaines et tags': 'errors.fetch',
    'Unable to load domains and tags': 'errors.fetch',
    createItem: 'errors.create',
    'Impossible de créer cet élément': 'errors.create',
    'Unable to create this item': 'errors.create',
    deleteItem: 'errors.delete',
    'Impossible de supprimer cet élément': 'errors.delete',
    'Unable to delete this item': 'errors.delete',
  };

  const translateError = (message?: string | null) => {
    if (!message) return feedback('errors.generic');

    const normalized = message.trim();
    const key = errorTranslationKeyByMessage[normalized];

    if (key) {
      return feedback(key);
    }

    return feedback('errors.genericWithReason', { reason: normalized });
  };

  const normalizedDomainInput = domainInput.trim();
  const normalizedTagInput = tagInput.trim();

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  const createMutation = useMutation({
    mutationFn: createTaxonomyItem,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey });
      showToast(
        variables.type === 'domain'
          ? feedback('toasts.domainCreated')
          : feedback('toasts.tagCreated'),
      );
      setErrorMessage(null);
      if (variables.type === 'domain') {
        setDomainInput('');
      }
      if (variables.type === 'tag') {
        setTagInput('');
      }
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : null;
      setErrorMessage(translateError(message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaxonomyItem,
    onMutate: (variables) => {
      setDeletingId(variables.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey });
      showToast(feedback('toasts.deleted'));
      setErrorMessage(null);
      setDeletingId(null);
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : null;
      setErrorMessage(translateError(message));
      setDeletingId(null);
    },
  });

  const sortedDomains = useMemo(
    () => [...(data?.domains ?? [])].sort((a, b) => a.label.localeCompare(b.label)),
    [data?.domains],
  );
  const sortedTags = useMemo(() => [...(data?.tags ?? [])].sort((a, b) => a.label.localeCompare(b.label)), [data?.tags]);

  const domainExists = useMemo(
    () => sortedDomains.some((domain) => domain.label.trim().toLowerCase() === normalizedDomainInput.toLowerCase()),
    [normalizedDomainInput, sortedDomains],
  );

  const tagExists = useMemo(
    () => sortedTags.some((tag) => tag.label.trim().toLowerCase() === normalizedTagInput.toLowerCase()),
    [normalizedTagInput, sortedTags],
  );

  return (
    <div className="content-grid">
      {toastMessage && (
        <div role="status" aria-live="polite" className={styles.toast}>
          {toastMessage}
        </div>
      )}

      {errorMessage && (
        <p className={`error-text ${styles.fullWidthError}`} role="alert">
          {errorMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('domains.title')}</CardTitle>
          <p className={`helper-text ${styles.helperTight}`}>{t('domains.helper')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="notion-toolbar">
              <div>
                <p className={styles.toolbarTitle}>{t('domains.toolbarTitle')}</p>
                <p className={`helper-text ${styles.helperTight}`}>
                  {t('domains.count', { count: sortedDomains.length })}
                </p>
              </div>
            </div>
            <Separator />
            {isLoading && <p className="helper-text">{t('domains.loading')}</p>}
            {isError && <p className="error-text">{translateError(error instanceof Error ? error.message : null)}</p>}
            {!isLoading && !isError && (
              <div className="space-y-2">
                {sortedDomains.length === 0 && <p className="helper-text">{t('domains.empty')}</p>}
                {sortedDomains.map((domain) => (
                  <div key={domain.id} className={`notion-toolbar__group ${styles.toolbarGroupJustify}`}>
                    <span>{domain.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t('domains.actions.deleteAria', { label: domain.label })}
                      onClick={() => deleteMutation.mutate({ type: 'domain', id: domain.id })}
                      disabled={deleteMutation.isPending && deletingId === domain.id}
                    >
                      {deleteMutation.isPending && deletingId === domain.id
                        ? t('domains.actions.deleting')
                        : t('domains.actions.delete')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <Label htmlFor="new-domain">{t('domains.inputLabel')}</Label>
          <Input
            id="new-domain"
            placeholder={t('domains.inputPlaceholder')}
            value={domainInput}
            onChange={(event) => setDomainInput(event.target.value)}
            disabled={createMutation.isPending}
          />
          {domainExists && (
            <p className={`error-text ${styles.helperTight}`}>{t('domains.exists')}</p>
          )}
          <div className="notion-toolbar__group">
            <Button
              type="button"
              onClick={() => createMutation.mutate({ type: 'domain', value: normalizedDomainInput })}
              disabled={!normalizedDomainInput || createMutation.isPending || domainExists}
            >
              {createMutation.isPending ? t('domains.actions.pending') : t('domains.actions.add')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDomainInput('')}>
              {t('actions.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('tags.title')}</CardTitle>
          <p className={`helper-text ${styles.helperTight}`}>{t('tags.helper')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="notion-toolbar">
              <div>
                <p className={styles.toolbarTitle}>{t('tags.toolbarTitle')}</p>
                <p className={`helper-text ${styles.helperTight}`}>
                  {t('tags.count', { count: sortedTags.length })}
                </p>
              </div>
            </div>
            <Separator />
            {isLoading && <p className="helper-text">{t('tags.loading')}</p>}
            {isError && <p className="error-text">{translateError(error instanceof Error ? error.message : null)}</p>}
            {!isLoading && !isError && (
              <div className="space-y-2">
                {sortedTags.length === 0 && <p className="helper-text">{t('tags.empty')}</p>}
                {sortedTags.map((tag) => (
                  <div key={tag.id} className={`notion-toolbar__group ${styles.toolbarGroupJustify}`}>
                    <span>{tag.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t('tags.actions.deleteAria', { label: tag.label })}
                      onClick={() => deleteMutation.mutate({ type: 'tag', id: tag.id })}
                      disabled={deleteMutation.isPending && deletingId === tag.id}
                    >
                      {deleteMutation.isPending && deletingId === tag.id
                        ? t('tags.actions.deleting')
                        : t('tags.actions.delete')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <Label htmlFor="new-tag">{t('tags.inputLabel')}</Label>
          <Input
            id="new-tag"
            placeholder={t('tags.inputPlaceholder')}
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            disabled={createMutation.isPending}
          />
          {tagExists && (
            <p className={`error-text ${styles.helperTight}`}>{t('tags.exists')}</p>
          )}
          <div className="notion-toolbar__group">
            <Button
              type="button"
              onClick={() => createMutation.mutate({ type: 'tag', value: normalizedTagInput })}
              disabled={!normalizedTagInput || createMutation.isPending || tagExists}
            >
              {createMutation.isPending ? t('tags.actions.pending') : t('tags.actions.add')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setTagInput('')}>
              {t('actions.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default TaxonomyManager;
