'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import styles from './taxonomy-manager.module.css';
import type {
  TaxonomyDeletionInput,
  TaxonomyMutationInput,
  TaxonomyResponse,
} from '@/lib/validation/tests';

const taxonomyQueryKey = ['test-taxonomy'] as const;
const REQUEST_TIMEOUT_MS = 10_000;

function TaxonomyManager() {
  const t = useTranslations('taxonomy');
  const queryClient = useQueryClient();

  const [domainInput, setDomainInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    timeoutMessage: string,
  ) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(timeoutMessage);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fetchTaxonomy = async (): Promise<TaxonomyResponse> => {
    const response = await fetchWithTimeout(
      '/api/tests/taxonomy',
      { cache: 'no-store' },
      t('errors.timeout'),
    );

    if (!response.ok) {
      throw new Error(t('errors.fetchTaxonomy'));
    }

    return (await response.json()) as TaxonomyResponse;
  };

  const createTaxonomyItem = async (payload: TaxonomyMutationInput) => {
    const response = await fetchWithTimeout(
      '/api/tests/taxonomy',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      t('errors.timeout'),
    );

    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(json.error ?? t('errors.createGeneric'));
    }

    return response.json();
  };

  const deleteTaxonomyItem = async (payload: TaxonomyDeletionInput) => {
    const response = await fetchWithTimeout(
      '/api/tests/taxonomy',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      t('errors.timeout'),
    );

    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(json.error ?? t('errors.deleteGeneric'));
    }

    return response.json();
  };

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: taxonomyQueryKey,
    queryFn: fetchTaxonomy,
  });

  const createMutation = useMutation({
    mutationFn: createTaxonomyItem,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey });
      showToast(
        variables.type === 'domain'
          ? t('toast.domainCreated')
          : t('toast.tagCreated'),
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
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : t('errors.finalizeCreation');
      setErrorMessage(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaxonomyItem,
    onMutate: (variables) => {
      setDeletingId(variables.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taxonomyQueryKey });
      showToast(t('toast.itemDeleted'));
      setErrorMessage(null);
      setDeletingId(null);
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : t('errors.deleteGeneric');
      setErrorMessage(message);
      setDeletingId(null);
    },
  });

  const sortedDomains = useMemo(
    () => [...(data?.domains ?? [])].sort((a, b) => a.label.localeCompare(b.label)),
    [data?.domains],
  );

  const sortedTags = useMemo(
    () => [...(data?.tags ?? [])].sort((a, b) => a.label.localeCompare(b.label)),
    [data?.tags],
  );

  const domainExists = useMemo(
    () =>
      sortedDomains.some(
        (domain) =>
          domain.label.trim().toLowerCase() === normalizedDomainInput.toLowerCase(),
      ),
    [normalizedDomainInput, sortedDomains],
  );

  const tagExists = useMemo(
    () =>
      sortedTags.some(
        (tag) => tag.label.trim().toLowerCase() === normalizedTagInput.toLowerCase(),
      ),
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
          <CardTitle>{t('domains.cardTitle')}</CardTitle>
          <p className={`helper-text ${styles.helperTight}`}>
            {t('domains.cardHelper')}
          </p>
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
            {isLoading && (
              <p className="helper-text">{t('domains.loading')}</p>
            )}
            {isError && (
              <p className="error-text">
                {error instanceof Error ? error.message : t('errors.unknown')}
              </p>
            )}
            {!isLoading && !isError && (
              <div className="space-y-2">
                {sortedDomains.length === 0 && (
                  <p className="helper-text">{t('domains.empty')}</p>
                )}
                {sortedDomains.map((domain) => (
                  <div
                    key={domain.id}
                    className={`notion-toolbar__group ${styles.toolbarGroupJustify}`}
                  >
                    <span>{domain.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t('domains.actions.deleteAria', {
                        label: domain.label,
                      })}
                      onClick={() =>
                        deleteMutation.mutate({ type: 'domain', id: domain.id })
                      }
                      disabled={
                        deleteMutation.isPending && deletingId === domain.id
                      }
                    >
                      {deleteMutation.isPending && deletingId === domain.id
                        ? t('buttons.deletePending')
                        : t('buttons.delete')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <Label htmlFor="new-domain">{t('domains.label')}</Label>
          <Input
            id="new-domain"
            placeholder={t('domains.placeholder')}
            value={domainInput}
            onChange={(event) => setDomainInput(event.target.value)}
            disabled={createMutation.isPending}
          />
          {domainExists && (
            <p className={`error-text ${styles.helperTight}`}>
              {t('domains.exists')}
            </p>
          )}
          <div className="notion-toolbar__group">
            <Button
              type="button"
              onClick={() =>
                createMutation.mutate({
                  type: 'domain',
                  value: normalizedDomainInput,
                })
              }
              disabled={
                !normalizedDomainInput || createMutation.isPending || domainExists
              }
            >
              {createMutation.isPending
                ? t('buttons.savePending')
                : t('buttons.addDomain')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDomainInput('')}
            >
              {t('buttons.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('tags.cardTitle')}</CardTitle>
          <p className={`helper-text ${styles.helperTight}`}>
            {t('tags.cardHelper')}
          </p>
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
            {isLoading && (
              <p className="helper-text">{t('tags.loading')}</p>
            )}
            {isError && (
              <p className="error-text">
                {error instanceof Error ? error.message : t('errors.unknown')}
              </p>
            )}
            {!isLoading && !isError && (
              <div className="space-y-2">
                {sortedTags.length === 0 && (
                  <p className="helper-text">{t('tags.empty')}</p>
                )}
                {sortedTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`notion-toolbar__group ${styles.toolbarGroupJustify}`}
                  >
                    <span>{tag.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t('tags.actions.deleteAria', {
                        label: tag.label,
                      })}
                      onClick={() =>
                        deleteMutation.mutate({ type: 'tag', id: tag.id })
                      }
                      disabled={deleteMutation.isPending && deletingId === tag.id}
                    >
                      {deleteMutation.isPending && deletingId === tag.id
                        ? t('buttons.deletePending')
                        : t('buttons.delete')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <Label htmlFor="new-tag">{t('tags.label')}</Label>
          <Input
            id="new-tag"
            placeholder={t('tags.placeholder')}
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            disabled={createMutation.isPending}
          />
          {tagExists && (
            <p className={`error-text ${styles.helperTight}`}>
              {t('tags.exists')}
            </p>
          )}
          <div className="notion-toolbar__group">
            <Button
              type="button"
              onClick={() =>
                createMutation.mutate({
                  type: 'tag',
                  value: normalizedTagInput,
                })
              }
              disabled={
                !normalizedTagInput || createMutation.isPending || tagExists
              }
            >
              {createMutation.isPending
                ? t('buttons.savePending')
                : t('buttons.addTag')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTagInput('')}
            >
              {t('buttons.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TaxonomyManager;
